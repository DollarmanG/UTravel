const { constructWebhookEvent } = require("../services/stripe.service");
const { createOrder } = require("../services/duffel.service");
const {
  getBookingBySessionId,
  markBookingPaymentReceived,
  confirmBooking,
  markBookingConfirmationFailed,
  markBookingExpired,
} = require("../services/booking.service");

function mapTitle(passenger) {
  if (passenger?.title) return passenger.title;
  return passenger?.gender === "f" ? "ms" : "mr";
}

/*
  Viktigt:
  Duffel passenger ID ska hämtas från booking.offerSnapshot.passengers[index].id.
  Vi ska INTE använda passenger.id från databasen, eftersom det kan vara Prisma-ID.
*/
function getOfferPassengers(booking) {
  return Array.isArray(booking?.offerSnapshot?.passengers)
    ? booking.offerSnapshot.passengers
    : [];
}

function getDuffelPassengerByIndex(booking, index) {
  const offerPassengers = getOfferPassengers(booking);
  const duffelPassenger = offerPassengers[index];

  if (!duffelPassenger?.id) {
    throw new Error(`Duffel passenger id saknas för passagerare ${index + 1}.`);
  }

  return duffelPassenger;
}

function normalizePassengerType(passenger, duffelPassenger) {
  const fromDuffel = String(duffelPassenger?.type || "").toLowerCase();
  const fromDb = String(passenger?.type || "").toLowerCase();

  if (
    fromDuffel === "infant_without_seat" ||
    fromDb === "infant_without_seat" ||
    fromDb === "infant"
  ) {
    return "infant_without_seat";
  }

  return "adult";
}

function mapPassengerForDuffel(passenger, booking, index) {
  if (!passenger?.givenName) {
    throw new Error(`given_name saknas för passagerare ${index + 1}.`);
  }

  if (!passenger?.familyName) {
    throw new Error(`family_name saknas för passagerare ${index + 1}.`);
  }

  if (!passenger?.bornOn) {
    throw new Error(`born_on saknas för passagerare ${index + 1}.`);
  }

  if (!booking?.customerEmail) {
    throw new Error("customer_email saknas i booking.");
  }

  if (!booking?.phoneNumber) {
    throw new Error("phone_number saknas i booking.");
  }

  const duffelPassenger = getDuffelPassengerByIndex(booking, index);
  const type = normalizePassengerType(passenger, duffelPassenger);

  return {
    id: duffelPassenger.id,
    type,
    title: mapTitle(passenger),
    given_name: passenger.givenName,
    family_name: passenger.familyName,
    born_on: passenger.bornOn,
    gender: passenger.gender || "m",
    email: booking.customerEmail,
    phone_number: booking.phoneNumber,
  };
}

function attachInfantsToAdults(passengers) {
  const adults = passengers.filter((passenger) => passenger.type === "adult");
  const infants = passengers.filter(
    (passenger) => passenger.type === "infant_without_seat"
  );

  if (infants.length === 0) {
    return passengers;
  }

  if (infants.length > adults.length) {
    throw new Error(
      "Antalet barn 0–2 år utan egen stol får inte vara fler än antalet vuxna."
    );
  }

  return passengers.map((passenger) => {
    if (passenger.type !== "adult") {
      return passenger;
    }

    const adultIndex = adults.findIndex((adult) => adult.id === passenger.id);
    const infant = infants[adultIndex];

    if (!infant) {
      return passenger;
    }

    return {
      ...passenger,
      infant_passenger_id: infant.id,
    };
  });
}

function buildDuffelOrderPayload(booking) {
  if (!booking) throw new Error("Booking saknas.");
  if (!booking.offerId) throw new Error("offer_id saknas i booking.");

  if (!Array.isArray(booking.passengers) || booking.passengers.length === 0) {
    throw new Error("passengers saknas i booking.");
  }

  if (!booking.customerEmail) {
    throw new Error("customer_email saknas i booking.");
  }

  if (!booking.phoneNumber) {
    throw new Error("phone_number saknas i booking.");
  }

  const originalAmount = Number(booking.originalAmount || 0);
  const originalCurrency = String(booking.originalCurrency || "").toUpperCase();

  if (!originalAmount || !originalCurrency) {
    throw new Error("original_amount eller original_currency saknas i booking.");
  }

  const offerPassengers = getOfferPassengers(booking);

  if (offerPassengers.length < booking.passengers.length) {
    throw new Error(
      `Duffel offer saknar passenger ids. Offer har ${offerPassengers.length}, booking har ${booking.passengers.length}.`
    );
  }

  const mappedPassengers = booking.passengers.map((passenger, index) =>
    mapPassengerForDuffel(passenger, booking, index)
  );

  const passengers = attachInfantsToAdults(mappedPassengers);

  console.log(
    "Duffel order passengers:",
    passengers.map((passenger) => ({
      id: passenger.id,
      type: passenger.type,
      infant_passenger_id: passenger.infant_passenger_id || null,
      given_name: passenger.given_name,
      family_name: passenger.family_name,
      born_on: passenger.born_on,
    }))
  );

  return {
    type: "instant",
    selected_offers: [booking.offerId],
    payments: [
      {
        type: "balance",
        amount: originalAmount.toFixed(2),
        currency: originalCurrency,
      },
    ],
    passengers,
    metadata: {
      source: "utravel_checkout",
      stripe_session_id:
        booking.sessionId || booking.stripeCheckoutSessionId || "",
      booking_reference: booking.bookingReference || "",
      customer_email: booking.customerEmail,
    },
  };
}

function hasDuffelOrder(booking) {
  return Boolean(
    booking?.duffelOrder ||
      booking?.duffelOrderId ||
      booking?.confirmedAt ||
      booking?.status === "confirmed"
  );
}

function isAlreadyBookedOfferError(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("selected_offers") &&
    message.includes("already been booked")
  );
}

function isOfferUnavailableError(error) {
  const message = String(error?.message || "").toLowerCase();
  const errors = Array.isArray(error?.data?.errors) ? error.data.errors : [];

  const hasDuffelCode = errors.some((item) => {
    const code = String(item?.code || "").toLowerCase();
    const title = String(item?.title || "").toLowerCase();
    const itemMessage = String(item?.message || "").toLowerCase();

    return (
      code.includes("offer_no_longer_available") ||
      title.includes("no longer available") ||
      itemMessage.includes("no longer available")
    );
  });

  return (
    hasDuffelCode ||
    message.includes("offer_no_longer_available") ||
    message.includes("no longer available") ||
    message.includes("not available")
  );
}

async function confirmBookingFromCheckoutSession(session) {
  const sessionId = session.id;

  if (!sessionId) {
    throw new Error("Stripe session id saknas.");
  }

  const booking = await getBookingBySessionId(sessionId);

  if (!booking) {
    throw new Error(`Ingen booking hittades för session ${sessionId}.`);
  }

  if (hasDuffelOrder(booking)) {
    console.log("Booking already has Duffel order / confirmed, skipping:", {
      bookingReference: booking.bookingReference,
      sessionId,
      status: booking.status,
    });

    return {
      alreadyConfirmed: true,
      booking,
    };
  }

  await markBookingPaymentReceived(
    sessionId,
    session.payment_intent || null,
    session.payment_status || null
  );

  const freshBooking = await getBookingBySessionId(sessionId);

  if (!freshBooking) {
    throw new Error(`Booking försvann efter payment update: ${sessionId}.`);
  }

  if (hasDuffelOrder(freshBooking)) {
    console.log("Booking became confirmed during payment update, skipping:", {
      bookingReference: freshBooking.bookingReference,
      sessionId,
      status: freshBooking.status,
    });

    return {
      alreadyConfirmed: true,
      booking: freshBooking,
    };
  }

  let orderData = null;

  try {
    const orderPayload = buildDuffelOrderPayload(freshBooking);
    const orderResponse = await createOrder(orderPayload);
    orderData = orderResponse?.data || orderResponse;

    if (!orderData?.id) {
      throw new Error("Duffel order skapades men saknar order id.");
    }

    console.log("Duffel order created:", {
      orderId: orderData.id,
      bookingReference: freshBooking.bookingReference,
    });
  } catch (error) {
    if (isAlreadyBookedOfferError(error)) {
      await markBookingConfirmationFailed(
        sessionId,
        "Duffel offer har redan bokats. Gör en ny flygsökning och välj ett nytt offer."
      );
    } else if (isOfferUnavailableError(error)) {
      await markBookingConfirmationFailed(
        sessionId,
        "Priset eller tillgängligheten har ändrats. Gör en ny flygsökning och välj ett nytt offer."
      );
    } else {
      await markBookingConfirmationFailed(sessionId, error.message);
    }

    throw error;
  }

  try {
    const confirmed = await confirmBooking({
      sessionId,
      stripePaymentIntent: session.payment_intent || null,
      stripePaymentStatus: session.payment_status || null,
      duffelOrderId: orderData.id,
      duffelOrder: orderData,
    });

    return {
      alreadyConfirmed: false,
      booking: confirmed,
    };
  } catch (error) {
    console.error("Duffel order exists but confirmBooking failed:", {
      message: error.message,
      sessionId,
      orderId: orderData.id,
      bookingReference: freshBooking.bookingReference,
    });

    throw error;
  }
}

async function handleStripeEvent(event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      if (session.mode === "payment" && session.payment_status !== "paid") {
        return {
          ignored: true,
          reason: `Session ${session.id} completed men payment_status=${session.payment_status}`,
        };
      }

      const result = await confirmBookingFromCheckoutSession(session);

      return {
        ignored: false,
        type: event.type,
        result,
      };
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      const result = await confirmBookingFromCheckoutSession(session);

      return {
        ignored: false,
        type: event.type,
        result,
      };
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const sessionId = session.id;

      const booking = await getBookingBySessionId(sessionId);

      if (booking && booking.status === "pending_payment") {
        await markBookingExpired(sessionId);
      }

      return {
        ignored: false,
        type: event.type,
        result: {
          expired: true,
          sessionId,
        },
      };
    }

    default:
      return {
        ignored: true,
        reason: `Obehandlad event-typ: ${event.type}`,
      };
  }
}

async function stripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).send("Stripe-signatur saknas.");
  }

  let event;

  try {
    event = constructWebhookEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Stripe webhook signature error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    const result = await handleStripeEvent(event);

    console.log("Stripe webhook processed:", {
      eventId: event.id,
      eventType: event.type,
      ignored: result.ignored,
      reason: result.reason || null,
    });

    return res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error:", {
      message: error.message,
      status: error.status || 500,
      requestId: error.requestId || null,
      data: error.data || null,
      eventType: event.type,
      eventId: event.id,
    });

    return res.status(500).json({
      error: error.message || "Webhook processing failed.",
      requestId: error.requestId || null,
      details: error.data || null,
    });
  }
}

module.exports = {
  stripeWebhook,
};