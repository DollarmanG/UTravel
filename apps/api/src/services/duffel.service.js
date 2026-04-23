const axios = require("axios");

const duffel = axios.create({
  baseURL: "https://api.duffel.com",
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${process.env.DUFFEL_API_TOKEN}`,
    "Duffel-Version": process.env.DUFFEL_API_VERSION || "v2",
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

function buildDuffelError(error) {
  if (error.response) {
    const responseData = error.response.data || {};
    const firstApiError = responseData.errors?.[0];

    const err = new Error(
      firstApiError?.message ||
        responseData.message ||
        "Duffel request failed"
    );

    err.name = "DuffelApiError";
    err.status = error.response.status;
    err.data = responseData;
    err.headers = error.response.headers || {};
    err.requestId =
      responseData?.meta?.request_id ||
      error.response.headers?.["request-id"] ||
      error.response.headers?.["x-request-id"] ||
      null;

    return err;
  }

  if (error.request) {
    const err = new Error("Ingen respons från Duffel API.");
    err.name = "DuffelNetworkError";
    err.status = 503;
    err.data = { message: error.message || "Network error" };
    err.headers = {};
    err.requestId = null;
    return err;
  }

  const err = new Error(error.message || "Unknown Duffel error");
  err.name = "DuffelUnknownError";
  err.status = 500;
  err.data = { message: error.message || "Unknown Duffel error" };
  err.headers = {};
  err.requestId = null;
  return err;
}

async function createOfferRequest(payload) {
  try {
    const res = await duffel.post("/air/offer_requests", {
      data: payload,
    });
    return res.data;
  } catch (error) {
    throw buildDuffelError(error);
  }
}

async function getOffer(offerId, options = {}) {
  const { returnAvailableServices = false } = options;

  try {
    const res = await duffel.get(`/air/offers/${offerId}`, {
      params: {
        return_available_services: returnAvailableServices,
      },
    });
    return res.data;
  } catch (error) {
    throw buildDuffelError(error);
  }
}

async function getLatestOfferForCheckout(offerId) {
  return getOffer(offerId, { returnAvailableServices: true });
}

async function priceOffer({
  offerId,
  intendedPaymentMethods = [],
  intendedServices = [],
}) {
  try {
    const res = await duffel.post(`/air/offers/${offerId}/actions/price`, {
      data: {
        intended_payment_methods: intendedPaymentMethods,
        intended_services: intendedServices,
      },
    });
    return res.data;
  } catch (error) {
    throw buildDuffelError(error);
  }
}

async function updateOfferPassenger({
  offerId,
  offerPassengerId,
  passenger,
}) {
  try {
    const res = await duffel.patch(
      `/air/offers/${offerId}/passengers/${offerPassengerId}`,
      {
        data: passenger,
      }
    );
    return res.data;
  } catch (error) {
    throw buildDuffelError(error);
  }
}

async function refreshOfferAfterPassengerUpdate({
  offerId,
  offerPassengerId,
  passenger,
}) {
  await updateOfferPassenger({
    offerId,
    offerPassengerId,
    passenger,
  });

  return getLatestOfferForCheckout(offerId);
}

async function createOrder(payload) {
  try {
    const res = await duffel.post("/air/orders", {
      data: payload,
    });
    return res.data;
  } catch (error) {
    throw buildDuffelError(error);
  }
}

function assertOfferBookable(offer) {
  const data = offer?.data || offer;

  if (!data || typeof data !== "object") {
    throw new Error("Duffel offer saknas eller har ogiltigt format.");
  }

  if (!data.id) {
    throw new Error("Duffel offer saknar id.");
  }

  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at).getTime();

    if (Number.isNaN(expiresAt)) {
      throw new Error("Duffel offer har ogiltigt expires_at.");
    }

    if (expiresAt <= Date.now()) {
      throw new Error("Duffel offer har gått ut.");
    }
  }

  return true;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeAvailableService(service, fallbackCurrency = null) {
  return {
    id: service?.id || null,
    type: service?.type || null,
    totalAmount: toNumber(service?.total_amount),
    totalCurrency: service?.total_currency || fallbackCurrency,
    passengerIds: Array.isArray(service?.passenger_ids)
      ? service.passenger_ids
      : [],
    segmentIds: Array.isArray(service?.segment_ids) ? service.segment_ids : [],
    metadata: service?.metadata || {},
  };
}

function normalizeOfferPricing(offer) {
  const data = offer?.data || offer;

  if (!data || typeof data !== "object") {
    throw new Error("Kan inte normalisera Duffel offer.");
  }

  const currency =
    data.total_currency ||
    data.base_currency ||
    data.tax_currency ||
    null;

  return {
    offerId: data.id || null,
    owner: data.owner?.name || null,
    currency,
    baseAmount: toNumber(data.base_amount),
    taxAmount: toNumber(data.tax_amount),
    totalAmount: toNumber(data.total_amount),
    expiresAt: data.expires_at || null,
    paymentRequirements: data.payment_requirements || null,
    availableServices: Array.isArray(data.available_services)
      ? data.available_services.map((service) =>
          normalizeAvailableService(service, currency)
        )
      : [],
  };
}

module.exports = {
  createOfferRequest,
  getOffer,
  getLatestOfferForCheckout,
  priceOffer,
  updateOfferPassenger,
  refreshOfferAfterPassengerUpdate,
  createOrder,
  assertOfferBookable,
  normalizeOfferPricing,
};