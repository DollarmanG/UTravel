const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { getOffer } = require("../services/duffel.service");
const { pendingBookings } = require("../db/store");

const EUR_TO_SEK = Number(process.env.EUR_TO_SEK || 11.5);
const SERVICE_FEE_SEK = Number(process.env.SERVICE_FEE_SEK || 300);
const SEAT_PRICE_SEK = Number(process.env.SEAT_PRICE_SEK || 149);
const BAG_PRICE_SEK = Number(process.env.BAG_PRICE_SEK || 299);

function convertOfferToSekPerPerson(offer) {
  const originalAmount = Number(offer?.total_amount || 0);
  const originalCurrency = String(offer?.total_currency || "").toUpperCase();

  if (originalCurrency === "SEK") {
    return {
      originalAmount,
      originalCurrency,
      flightAmountPerPersonSek: originalAmount,
      serviceFeePerPersonSek: SERVICE_FEE_SEK,
    };
  }

  if (originalCurrency === "EUR") {
    return {
      originalAmount,
      originalCurrency,
      flightAmountPerPersonSek: originalAmount * EUR_TO_SEK,
      serviceFeePerPersonSek: SERVICE_FEE_SEK,
    };
  }

  throw new Error(`Valutan ${originalCurrency} stöds inte ännu`);
}

async function createCheckoutSession(req, res) {
  try {
    const { offer_id, passengers, customer_email, addons = {} } = req.body;

    if (!offer_id || !Array.isArray(passengers) || passengers.length === 0 || !customer_email) {
      return res.status(400).json({
        error: "offer_id, passengers och customer_email krävs",
      });
    }

    const seatSelection = Boolean(addons.seat_selection);
    const checkedBags = Math.max(0, Number(addons.checked_bags || 0));
    const passengerCount = passengers.length;

    const offerResponse = await getOffer(offer_id);
    const offer = offerResponse.data;

    const pricing = convertOfferToSekPerPerson(offer);

    const flightAmountPerPersonSek = pricing.flightAmountPerPersonSek;
    const serviceFeePerPersonSek = pricing.serviceFeePerPersonSek;

    const flightTotalSek = flightAmountPerPersonSek * passengerCount;
    const serviceFeeTotalSek = serviceFeePerPersonSek * passengerCount;
    const seatTotalSek = seatSelection ? SEAT_PRICE_SEK * passengerCount : 0;
    const baggageTotalSek = BAG_PRICE_SEK * checkedBags;
    const grandTotalSek =
      flightTotalSek + serviceFeeTotalSek + seatTotalSek + baggageTotalSek;

    const flightAmountPerPersonSekMinor = Math.round(flightAmountPerPersonSek * 100);
    const serviceFeePerPersonSekMinor = Math.round(serviceFeePerPersonSek * 100);
    const seatPriceSekMinor = Math.round(SEAT_PRICE_SEK * 100);
    const bagPriceSekMinor = Math.round(BAG_PRICE_SEK * 100);
    const grandTotalSekMinor = Math.round(grandTotalSek * 100);

    const lineItems = [
      {
        price_data: {
          currency: "sek",
          product_data: {
            name: "Flygbiljett - Utravel",
          },
          unit_amount: flightAmountPerPersonSekMinor,
        },
        quantity: passengerCount,
      },
      {
        price_data: {
          currency: "sek",
          product_data: {
            name: "Skatter och avgifter - Utravel",
          },
          unit_amount: serviceFeePerPersonSekMinor,
        },
        quantity: passengerCount,
      },
    ];

    if (seatSelection) {
      lineItems.push({
        price_data: {
          currency: "sek",
          product_data: {
            name: "Sittplats - Utravel",
          },
          unit_amount: seatPriceSekMinor,
        },
        quantity: passengerCount,
      });
    }

    if (checkedBags > 0) {
      lineItems.push({
        price_data: {
          currency: "sek",
          product_data: {
            name: "Incheckat bagage (23 kg) - Utravel",
          },
          unit_amount: bagPriceSekMinor,
        },
        quantity: checkedBags,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email,
      currency: "sek",
      line_items: lineItems,
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        offer_id,
        passenger_count: String(passengerCount),
        seat_selection: String(seatSelection),
        checked_bags: String(checkedBags),
        original_currency: pricing.originalCurrency,
        original_amount: String(pricing.originalAmount),
        eur_to_sek_rate: String(EUR_TO_SEK),
      },
    });

    pendingBookings.set(session.id, {
      offer_id,
      passengers,
      customer_email,
      addons: {
        seat_selection: seatSelection,
        checked_bags: checkedBags,
      },
      amount: grandTotalSekMinor,
      currency: "sek",
      status: "pending_payment",
      original_currency: pricing.originalCurrency,
      original_amount: pricing.originalAmount,
      passenger_count: passengerCount,
      flight_amount_per_person_sek_minor: flightAmountPerPersonSekMinor,
      service_fee_per_person_sek_minor: serviceFeePerPersonSekMinor,
      seat_price_sek_minor: seatSelection ? seatPriceSekMinor : 0,
      bag_price_sek_minor: checkedBags > 0 ? bagPriceSekMinor : 0,
      flight_total_sek_minor: Math.round(flightTotalSek * 100),
      service_fee_total_sek_minor: Math.round(serviceFeeTotalSek * 100),
      seat_total_sek_minor: Math.round(seatTotalSek * 100),
      baggage_total_sek_minor: Math.round(baggageTotalSek * 100),
      total_sek_minor: grandTotalSekMinor,
      eur_to_sek_rate: EUR_TO_SEK,
    });

    return res.json({
      url: session.url,
      pricing: {
        display_currency: "SEK",
        original_currency: pricing.originalCurrency,
        original_amount: pricing.originalAmount,
        passenger_count: passengerCount,
        flight_amount_per_person: Number(flightAmountPerPersonSek.toFixed(2)),
        service_fee_per_person: Number(serviceFeePerPersonSek.toFixed(2)),
        seat_price_per_person: seatSelection ? Number(SEAT_PRICE_SEK.toFixed(2)) : 0,
        bag_price_per_unit: checkedBags > 0 ? Number(BAG_PRICE_SEK.toFixed(2)) : 0,
        flight_total: Number(flightTotalSek.toFixed(2)),
        service_fee_total: Number(serviceFeeTotalSek.toFixed(2)),
        seat_total: Number(seatTotalSek.toFixed(2)),
        baggage_total: Number(baggageTotalSek.toFixed(2)),
        total_amount: Number(grandTotalSek.toFixed(2)),
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