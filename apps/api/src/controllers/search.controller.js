const { createOfferRequest } = require("../services/duffel.service");

const EUR_TO_SEK = Number(process.env.EUR_TO_SEK || 11.5);
const SERVICE_FEE_SEK = Number(process.env.SERVICE_FEE_SEK || 300);

function getAmountsInSek(totalAmount, totalCurrency) {
  const amount = Number(totalAmount || 0);
  const currency = String(totalCurrency || "").toUpperCase();

  if (currency === "SEK") {
    const baseAmountSek = amount;
    const totalAmountSek = baseAmountSek + SERVICE_FEE_SEK;

    return {
      display_base_amount_sek: Math.round(baseAmountSek),
      service_fee_sek: SERVICE_FEE_SEK,
      display_amount_sek: Math.round(totalAmountSek),
    };
  }

  if (currency === "EUR") {
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

function isValidDate(value) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time);
}

function isExpiredOffer(offer) {
  if (!offer?.expires_at) return false;

  const expiresAt = new Date(offer.expires_at).getTime();

  if (!Number.isFinite(expiresAt)) return true;

  return expiresAt <= Date.now();
}

function isDuffelTestAirlineName(value) {
  const text = String(value || "").toLowerCase();

  return (
    text.includes("duffel") ||
    text.includes("test airline") ||
    text.includes("testflygbolag")
  );
}

function isDuffelTestOffer(offer) {
  const ownerName = offer?.owner?.name;
  const ownerIata = String(offer?.owner?.iata_code || "").toUpperCase();

  if (isDuffelTestAirlineName(ownerName)) return true;
  if (ownerIata === "ZZ") return true;

  const slices = Array.isArray(offer?.slices) ? offer.slices : [];

  for (const slice of slices) {
    const segments = Array.isArray(slice?.segments) ? slice.segments : [];

    for (const segment of segments) {
      const marketingCarrier = segment?.marketing_carrier;
      const operatingCarrier = segment?.operating_carrier;
      const aircraft = segment?.aircraft;

      const carrierNames = [
        marketingCarrier?.name,
        operatingCarrier?.name,
        aircraft?.name,
      ];

      const carrierIataCodes = [
        marketingCarrier?.iata_code,
        operatingCarrier?.iata_code,
      ].map((value) => String(value || "").toUpperCase());

      if (carrierNames.some(isDuffelTestAirlineName)) return true;
      if (carrierIataCodes.includes("ZZ")) return true;
    }
  }

  return false;
}

function hasValidPrice(offer) {
  const totalAmount = Number(offer?.total_amount || 0);
  const totalCurrency = String(offer?.total_currency || "").toUpperCase();

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) return false;

  return ["SEK", "EUR"].includes(totalCurrency);
}

function hasValidSlicesAndSegments(offer) {
  const slices = Array.isArray(offer?.slices) ? offer.slices : [];

  if (slices.length === 0) return false;

  return slices.every((slice) => {
    const segments = Array.isArray(slice?.segments) ? slice.segments : [];

    if (segments.length === 0) return false;

    return segments.every((segment) => {
      const departingAt = segment?.departing_at;
      const arrivingAt = segment?.arriving_at;

      if (!segment?.origin?.iata_code) return false;
      if (!segment?.destination?.iata_code) return false;
      if (!isValidDate(departingAt)) return false;
      if (!isValidDate(arrivingAt)) return false;

      const departureTime = new Date(departingAt).getTime();
      const arrivalTime = new Date(arrivingAt).getTime();

      if (arrivalTime <= departureTime) return false;

      return true;
    });
  });
}

function isBookableSearchOffer(offer) {
  if (!offer?.id) return false;
  if (isExpiredOffer(offer)) return false;
  if (!hasValidPrice(offer)) return false;
  if (!hasValidSlicesAndSegments(offer)) return false;
  if (isDuffelTestOffer(offer)) return false;

  return true;
}

function mapOfferForFrontend(offer) {
  const pricing = getAmountsInSek(offer.total_amount, offer.total_currency);

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

    if (!origin || !destination || !departure_date) {
      return res.status(400).json({
        error: "origin, destination och departure_date krävs.",
      });
    }

    const adultCount = Math.max(1, Number(adults || 1));

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

    const passengers = Array.from({ length: adultCount }).map(() => ({
      type: "adult",
    }));

    const response = await createOfferRequest({
      slices,
      passengers,
      cabin_class: "economy",
    });

    const rawOffers = Array.isArray(response?.data?.offers)
      ? response.data.offers
      : [];

    const filteredOffers = rawOffers.filter(isBookableSearchOffer);

    console.log("Duffel search offers:", {
      received: rawOffers.length,
      returned: filteredOffers.length,
      filteredOut: rawOffers.length - filteredOffers.length,
    });

    const offers = filteredOffers.map(mapOfferForFrontend);

    return res.json({
      offers,
      meta: {
        received_count: rawOffers.length,
        returned_count: offers.length,
        filtered_count: rawOffers.length - offers.length,
      },
    });
  } catch (error) {
    console.error("searchFlights error:", error.response?.data || error.message);

    return res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
}

module.exports = {
  searchFlights,
};