const { createOfferRequest } = require('../services/duffel.service');

const EUR_TO_SEK = 11.5;

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
      const totalAmount = parseFloat(offer.total_amount || '0');
      const totalCurrency = offer.total_currency;

      let display_amount_sek = null;

      if (totalCurrency === 'EUR') {
        display_amount_sek = Math.round(totalAmount * EUR_TO_SEK);
      }

      return {
        id: offer.id,
        total_amount: offer.total_amount,
        total_currency: offer.total_currency,
        display_amount_sek,
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