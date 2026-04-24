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
  if (!booking.customerEmail) throw new Error("customer_email saknas i booking.");
  if (!booking.phoneNumber) throw new Error("phone_number saknas i booking.");

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
      stripe_session_id: booking.sessionId || booking.stripeCheckoutSessionId || "",
      booking_reference: booking.bookingReference || "",
      customer_email: booking.customerEmail,
    },
  };
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

  if (booking.status === "confirmed") {
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

  try {
    const orderPayload = buildDuffelOrderPayload(booking);
    const orderResponse = await createOrder(orderPayload);
    const orderData = orderResponse?.data || orderResponse;

    console.log("Duffel order created:", {
      orderId: orderData?.id,
      bookingReference: booking.bookingReference,
    });

    const confirmed = await confirmBooking({
      sessionId,
      stripePaymentIntent: session.payment_intent || null,
      stripePaymentStatus: session.payment_status || null,
      duffelOrderId: orderData?.id || null,
      duffelOrder: orderData || null,
    });

    return {
      alreadyConfirmed: false,
      booking: confirmed,
    };
  } catch (error) {
    await markBookingConfirmationFailed(sessionId, error.message);

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