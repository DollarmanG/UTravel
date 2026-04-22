/* const express = require("express");
const router = express.Router();
const { createOfferRequest } = require("../services/duffel.service");

router.post("/", async (req, res) => {
  try {
    const { origin, destination, departure_date, return_date, adults = 1 } = req.body;

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
      type: "adult",
    }));

    const response = await createOfferRequest({
      slices,
      passengers,
      cabin_class: "economy",
    });

    const offers = response.data.offers.map((offer) => ({
      id: offer.id,
      total_amount: offer.total_amount,
      total_currency: offer.total_currency,
      expires_at: offer.expires_at,
      owner: offer.owner,
      slices: offer.slices,
    }));

    res.json({ offers });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router; */

const express = require("express");
const router = express.Router();

const { searchFlights } = require("../controllers/search.controller");

router.post("/", searchFlights);

module.exports = router;