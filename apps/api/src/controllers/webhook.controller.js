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

function getDuffelPassengerId(booking, index) {
  const offerPassengers = Array.isArray(booking?.offerSnapshot?.passengers)
    ? booking.offerSnapshot.passengers
    : [];

  const duffelPassenger = offerPassengers[index];

  if (!duffelPassenger?.id) {
    throw new Error(`Duffel passenger id saknas för passagerare ${index + 1}.`);
  }

  return duffelPassenger.id;
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

  return {
    id: getDuffelPassengerId(booking, index),
    type: passenger.type || "adult",
    title: mapTitle(passenger),
    given_name: passenger.givenName,
    family_name: passenger.familyName,
    born_on: passenger.bornOn,
    gender: passenger.gender || "m",
    email: booking.customerEmail,
    phone_number: booking.phoneNumber,
  };
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

  const passengers = booking.passengers.map((passenger, index) =>
    mapPassengerForDuffel(passenger, booking, index)
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

async function confirmBookingFromCheckoutSession(session) {
  const sessionId = session.id;

  if (!sessionId) {
    throw new Error("Stripe session id saknas.");
  }

  const booking = await getBookingBySessionId(sessionId);

  if (!booking) {
    throw new Error(`Ingen booking hittades för session ${sessionId}.`);
  }

  /**
   * Viktigt:
   * Stripe kan skicka samma webhook flera gånger.
   * Då får vi absolut inte skapa en ny Duffel-order igen.
   */
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

  /**
   * Hämta bokningen igen efter payment update.
   * Detta minskar risken att vi jobbar med gammal status/data.
   */
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
    /**
     * Detta är det vanliga felet när man återanvänder samma Duffel offer.
     * Det ska bli confirmation_failed för denna booking.
     */
    if (isAlreadyBookedOfferError(error)) {
      await markBookingConfirmationFailed(
        sessionId,
        "Duffel offer har redan bokats. Gör en ny flygsökning och välj ett nytt offer."
      );
    } else {
      await markBookingConfirmationFailed(sessionId, error.message);
    }

    throw error;
  }

  /**
   * Viktigt:
   * När Duffel-order väl är skapad får vi inte hamna i confirmation_failed
   * bara för att en DB-update eller liknande strular efteråt.
   */
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

    /**
     * Kasta felet så ni ser det i backend-loggen,
     * men skriv INTE över till confirmation_failed här.
     * Annars kan en faktiskt skapad Duffel-order visas som manuell kontroll.
     */
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