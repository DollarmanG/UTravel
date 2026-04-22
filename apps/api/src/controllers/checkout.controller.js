const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { getOffer } = require("../services/duffel.service");
const { pendingBookings } = require("../db/store");

async function createCheckoutSession(req, res) {
  try {
    const { offer_id, passengers, customer_email } = req.body;

    if (!offer_id || !passengers || !customer_email) {
      return res.status(400).json({
        error: "offer_id, passengers och customer_email krävs",
      });
    }

    const offerResponse = await getOffer(offer_id);
    const offer = offerResponse.data;

    const currency = offer.total_currency.toLowerCase();
    const offerAmountMinor = Math.round(Number(offer.total_amount) * 100);
    const serviceFeeMinor = Number(process.env.SERVICE_FEE_SEK || 300) * 100;
    const totalMinor = offerAmountMinor + serviceFeeMinor;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "Flight booking - Utravel",
            },
            unit_amount: totalMinor,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        offer_id,
      },
    });

    pendingBookings.set(session.id, {
      offer_id,
      passengers,
      customer_email,
      amount: totalMinor,
      currency,
      status: "pending_payment",
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("checkout error:", error.response?.data || error.message);
    return res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
}

module.exports = {
  createCheckoutSession,
};