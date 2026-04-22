const axios = require("axios");

const duffel = axios.create({
  baseURL: "https://api.duffel.com",
  headers: {
    Authorization: `Bearer ${process.env.DUFFEL_API_TOKEN}`,
    "Duffel-Version": process.env.DUFFEL_API_VERSION || "v2",
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

async function createOfferRequest(payload) {
  const res = await duffel.post("/air/offer_requests", { data: payload });
  return res.data;
}

async function getOffer(offerId) {
  const res = await duffel.get(`/air/offers/${offerId}`);
  return res.data;
}

async function createOrder(payload) {
  const res = await duffel.post("/air/orders", { data: payload });
  return res.data;
}

module.exports = {
  createOfferRequest,
  getOffer,
  createOrder,
};