const { constructWebhookEvent } = require("../services/stripe.service");
const { createOrder } = require("../services/duffel.service");
const { pendingBookings, confirmedBookings } = require("../db/store");
const { generateBookingReference } = require("../utils/bookingReference");

function mapTitle(passenger) {
  if (passenger?.title) return passenger.title;

  return passenger?.gender === "f" ? "ms" : "mr";
}

function getDuffelPassengerId(booking, index) {
  const offerPassengers = Array.isArray(booking?.offer_snapshot?.passengers)
    ? booking.offer_snapshot.passengers
    : [];

  const duffelPassenger = offerPassengers[index];

  if (!duffelPassenger?.id) {
    throw new Error(`Duffel passenger id saknas för passagerare ${index + 1}.`);
  }

  return duffelPassenger.id;
}

function mapPassengerForDuffel(passenger, booking, index) {
  if (!passenger?.given_name) {
    throw new Error(`given_name saknas för passagerare ${index + 1}.`);
  }

  if (!passenger?.family_name) {
    throw new Error(`family_name saknas för passagerare ${index + 1}.`);
  }

  if (!passenger?.born_on) {
    throw new Error(`born_on saknas för passagerare ${index + 1}.`);
  }

  if (!booking?.customer_email) {
    throw new Error("customer_email saknas i booking.");
  }

  if (!booking?.phone_number) {
    throw new Error("phone_number saknas i booking.");
  }

  return {
    id: getDuffelPassengerId(booking, index),
    type: passenger.type || "adult",
    title: mapTitle(passenger),
    given_name: passenger.given_name,
    family_name: passenger.family_name,
    born_on: passenger.born_on,
    gender: passenger.gender || "m",
    email: booking.customer_email,
    phone_number: booking.phone_number,
  };
}

function buildDuffelOrderPayload(booking) {
  if (!booking) {
    throw new Error("Booking saknas.");
  }

  if (!booking.offer_id) {
    throw new Error("offer_id saknas i booking.");
  }

  if (!Array.isArray(booking.passengers) || booking.passengers.length === 0) {
    throw new Error("passengers saknas i booking.");
  }

  if (!booking.customer_email) {
    throw new Error("customer_email saknas i booking.");
  }

  if (!booking.phone_number) {
    throw new Error("phone_number saknas i booking.");
  }

  const originalAmount = Number(booking.original_amount || 0);
  const originalCurrency = String(booking.original_currency || "").toUpperCase();

  if (!originalAmount || !originalCurrency) {
    throw new Error("original_amount eller original_currency saknas i booking.");
  }

  const passengers = booking.passengers.map((passenger, index) =>
    mapPassengerForDuffel(passenger, booking, index)
  );

  return {
    type: "instant",
    selected_offers: [booking.offer_id],
    payments: [
      {
        type: "balance",
        amount: originalAmount.toFixed(2),
        currency: originalCurrency,
      },
    ],
    passengers,
    metadata: {
      source: "utravel_test_checkout",
      stripe_session_id: booking.session_id || booking.stripe_checkout_session_id || "",
      booking_reference: booking.bookingReference || booking.booking_reference || "",
      customer_email: booking.customer_email,
    },
  };
}

async function confirmBookingFromCheckoutSession(session) {
  const sessionId = session.id;

  if (!sessionId) {
    throw new Error("Stripe session id saknas.");
  }

  if (confirmedBookings.has(sessionId)) {
    return {
      alreadyConfirmed: true,
      booking: confirmedBookings.get(sessionId),
    };
  }

  if (!pendingBookings.has(sessionId)) {
    throw new Error(`Ingen pending booking hittades för session ${sessionId}.`);
  }

  const pendingBooking = pendingBookings.get(sessionId);

  const orderPayload = buildDuffelOrderPayload(pendingBooking);
  const orderResponse = await createOrder(orderPayload);
  const orderData = orderResponse?.data || orderResponse;

  console.log("Duffel order created:", {
    orderId: orderData?.id,
    bookingReference: pendingBooking?.bookingReference || pendingBooking?.booking_reference,
  });

  const existingReferences = new Set(
    Array.from(confirmedBookings.values())
      .map((booking) => booking.bookingReference || booking.booking_reference)
      .filter(Boolean)
  );

  const bookingReference = generateBookingReference(existingReferences);

  const confirmedBooking = {
    ...pendingBooking,
    bookingReference,
    booking_reference: bookingReference,
    status: "confirmed",
    confirmed_at: new Date().toISOString(),
    stripe_payment_status: session.payment_status || null,
    stripe_customer_email:
      session.customer_details?.email || session.customer_email || null,
    stripe_session_id: sessionId,
    stripe_payment_intent: session.payment_intent || null,
    duffel_order_id: orderData?.id || null,
    duffel_order: orderData || null,
  };

  confirmedBookings.set(sessionId, confirmedBooking);
  pendingBookings.delete(sessionId);

  return {
    alreadyConfirmed: false,
    booking: confirmedBooking,
  };
}

async function handleStripeEvent(event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      if (session.mode === "payment" && session.payment_status !== "paid") {
        return {
          ignored: true,
          reason: `Session ${session.id} är completed men payment_status=${session.payment_status}`,
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

      if (pendingBookings.has(sessionId)) {
        const pendingBooking = pendingBookings.get(sessionId);

        pendingBookings.set(sessionId, {
          ...pendingBooking,
          status: "expired",
          expired_at: new Date().toISOString(),
        });
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

    return res.status(error.status || 500).json({
      error: error.message || "Webhook processing failed.",
      requestId: error.requestId || null,
      details: error.data || null,
    });
  }
}

module.exports = {
  stripeWebhook,
};