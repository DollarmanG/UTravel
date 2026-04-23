const { getPlaceSuggestions } = require("../services/duffel.service");
const { getCountryName } = require("../utils/countryMap");

function getPlaceCode(item) {
  if (item.type === "city") {
    return item.iata_code || item.iata_city_code || "";
  }

  return item.iata_code || "";
}

function getPlaceCityName(item) {
  return item.city_name || item.city?.name || item.name || "";
}

function getPlaceCountryCode(item) {
  return item.iata_country_code || item.city?.iata_country_code || "";
}

function buildPlaceLabel(item) {
  const code = getPlaceCode(item);
  const cityName = getPlaceCityName(item);

  if (item.type === "city") {
    return `${item.name || cityName}${code ? ` (${code})` : ""}`;
  }

  return `${cityName ? `${cityName} – ` : ""}${item.name || ""}${
    code ? ` (${code})` : ""
  }`;
}

async function listPlaceSuggestions(req, res) {
  try {
    const query = String(req.query.q || "").trim();

    console.log("Places query:", query);

    if (query.length < 2) {
      return res.json({ places: [] });
    }

    const response = await getPlaceSuggestions(query);
    const rawPlaces = Array.isArray(response?.data) ? response.data : [];

    console.log("Duffel places count:", rawPlaces.length);

    const places = rawPlaces
      .map((item) => {
        const code = getPlaceCode(item);
        const countryCode = getPlaceCountryCode(item);

        return {
          id: item.id,
          type: item.type,
          name: item.name || "",
          cityName: getPlaceCityName(item),
          code,
          iataCode: item.iata_code || "",
          iataCityCode: item.iata_city_code || item.city?.iata_code || "",
          countryCode,
          countryName: getCountryName(countryCode),
          label: buildPlaceLabel(item),
        };
      })
      .filter((place) => place.code);

    return res.json({ places });
  } catch (error) {
    console.error("listPlaceSuggestions error:", {
      message: error.message,
      status: error.status,
      data: error.data,
    });

    return res.status(error.status || 500).json({
      error: error.message || "Kunde inte hämta platsförslag.",
    });
  }
}

module.exports = {
  listPlaceSuggestions,
};