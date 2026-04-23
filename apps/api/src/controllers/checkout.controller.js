const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { getOffer } = require("../services/duffel.service");
const { pendingBookings } = require("../db/store");

const EUR_TO_SEK = Number(process.env.EUR_TO_SEK || 11.5);
const SERVICE_FEE_SEK = Number(process.env.SERVICE_FEE_SEK || 300);

function convertOfferToSek(offer) {
  const originalAmount = Number(offer.total_amount || 0);
  const originalCurrency = String(offer.total_currency || "").toUpperCase();

  if (originalCurrency === "SEK") {
    return {
      originalAmount,
      originalCurrency,
      flightAmountSek: originalAmount,
      serviceFeeSek: SERVICE_FEE_SEK,
      totalSek: originalAmount + SERVICE_FEE_SEK,
    };
  }

  if (originalCurrency === "EUR") {
    const flightAmountSek = originalAmount * EUR_TO_SEK;

    return {
      originalAmount,
      originalCurrency,
      flightAmountSek,
      serviceFeeSek: SERVICE_FEE_SEK,
      totalSek: flightAmountSek + SERVICE_FEE_SEK,
    };
  }

  throw new Error(`Valutan ${originalCurrency} stöds inte ännu`);
}

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

    const pricing = convertOfferToSek(offer);

    const flightAmountSekMinor = Math.round(pricing.flightAmountSek * 100);
    const serviceFeeSekMinor = Math.round(pricing.serviceFeeSek * 100);
    const totalSekMinor = Math.round(pricing.totalSek * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email,
      currency: "sek",
      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: "Flygbiljett - Utravel",
            },
            unit_amount: flightAmountSekMinor,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: "Skatter och avgifter - Utravel",
            },
            unit_amount: serviceFeeSekMinor,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        offer_id,
        original_currency: pricing.originalCurrency,
        original_amount: String(pricing.originalAmount),
        eur_to_sek_rate: String(EUR_TO_SEK),
      },
    });

    pendingBookings.set(session.id, {
      offer_id,
      passengers,
      customer_email,
      amount: totalSekMinor,
      currency: "sek",
      status: "pending_payment",
      original_currency: pricing.originalCurrency,
      original_amount: pricing.originalAmount,
      flight_amount_sek_minor: flightAmountSekMinor,
      service_fee_sek_minor: serviceFeeSekMinor,
      total_sek_minor: totalSekMinor,
      eur_to_sek_rate: EUR_TO_SEK,
    });

    return res.json({
      url: session.url,
      pricing: {
        display_currency: "SEK",
        original_currency: pricing.originalCurrency,
        original_amount: pricing.originalAmount,
        flight_amount: Number(pricing.flightAmountSek.toFixed(2)),
        service_fee: Number(pricing.serviceFeeSek.toFixed(2)),
        total_amount: Number(pricing.totalSek.toFixed(2)),
      },
    });
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