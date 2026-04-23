const { createOfferRequest } = require('../services/duffel.service');

const EUR_TO_SEK = Number(process.env.EUR_TO_SEK || 11.5);
const SERVICE_FEE_SEK = Number(process.env.SERVICE_FEE_SEK || 300);

function getAmountsInSek(totalAmount, totalCurrency) {
  const amount = Number(totalAmount || 0);
  const currency = String(totalCurrency || '').toUpperCase();

  if (currency === 'SEK') {
    const baseAmountSek = amount;
    const totalAmountSek = baseAmountSek + SERVICE_FEE_SEK;

    return {
      display_base_amount_sek: Math.round(baseAmountSek),
      service_fee_sek: SERVICE_FEE_SEK,
      display_amount_sek: Math.round(totalAmountSek),
    };
  }

  if (currency === 'EUR') {
    const baseAmountSek = amount * EUR_TO_SEK;
    const totalAmountSek = baseAmountSek + SERVICE_FEE_SEK;

    return {
      display_base_amount_sek: Math.round(baseAmountSek),
      service_fee_sek: SERVICE_FEE_SEK,
      display_amount_sek: Math.round(totalAmountSek),
    };
  }

  const baseAmountSek = amount;
  const totalAmountSek = baseAmountSek + SERVICE_FEE_SEK;

  return {
    display_base_amount_sek: Math.round(baseAmountSek),
    service_fee_sek: SERVICE_FEE_SEK,
    display_amount_sek: Math.round(totalAmountSek),
  };
}

async function searchFlights(req, res) {
  try {
    const {
      origin,
      destination,
      departure_date,
      return_date,
      adults = 1,
    } = req.body;

    const slices = [
      {
        origin,
        destination,
        departure_date,
      },
    ];

    if (return_date) {
      slices.push({
        origin: destination,
        destination: origin,
        departure_date: return_date,
      });
    }

    const passengers = Array.from({ length: adults }).map(() => ({
      type: 'adult',
    }));

    const response = await createOfferRequest({
      slices,
      passengers,
      cabin_class: 'economy',
    });

    const offers = response.data.offers.map((offer) => {
      const pricing = getAmountsInSek(
        offer.total_amount,
        offer.total_currency
      );

      return {
        id: offer.id,
        total_amount: offer.total_amount,
        total_currency: offer.total_currency,
        display_base_amount_sek: pricing.display_base_amount_sek,
        service_fee_sek: pricing.service_fee_sek,
        display_amount_sek: pricing.display_amount_sek,
        expires_at: offer.expires_at,
        owner: offer.owner,
        slices: offer.slices,
      };
    });

    res.json({ offers });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
}

module.exports = {
  searchFlights,
};