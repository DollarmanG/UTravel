const {
  getLatestOfferForCheckout,
  assertOfferBookable,
  normalizeOfferPricing,
} = require("./duffel.service");

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value) {
  return Number(toNumber(value).toFixed(2));
}

function calculateUtravelAmounts({
  insurance = false,
  cancellationProtection = false,
  agencyFee = 0,
  campaignDiscount = 0,
  paymentMethodDiscount = 0,
}) {
  return {
    agencyFee: roundMoney(agencyFee),
    insurance: insurance ? 326 : 0,
    cancellationProtection: cancellationProtection ? 522 : 0,
    campaignDiscount: roundMoney(campaignDiscount),
    paymentMethodDiscount: roundMoney(paymentMethodDiscount),
  };
}

async function buildCheckoutQuote({
  offerId,
  insurance = false,
  cancellationProtection = false,
  agencyFee = 0,
  campaignDiscount = 0,
  paymentMethodDiscount = 0,
}) {
  if (!offerId) {
    throw new Error("offerId krävs för att bygga checkout quote.");
  }

  const latestOffer = await getLatestOfferForCheckout(offerId);
  assertOfferBookable(latestOffer);

  const airline = normalizeOfferPricing(latestOffer);

  const utravel = calculateUtravelAmounts({
    insurance,
    cancellationProtection,
    agencyFee,
    campaignDiscount,
    paymentMethodDiscount,
  });

  const subtotal =
    airline.totalAmount +
    utravel.agencyFee +
    utravel.insurance +
    utravel.cancellationProtection;

  const discountTotal =
    utravel.campaignDiscount + utravel.paymentMethodDiscount;

  const grandTotal = Math.max(0, roundMoney(subtotal - discountTotal));

  return {
    offerId: airline.offerId,
    currency: airline.currency,
    expiresAt: airline.expiresAt,
    airlinePricing: {
      owner: airline.owner,
      baseFare: airline.baseAmount,
      taxes: airline.taxAmount,
      total: airline.totalAmount,
      availableServices: airline.availableServices,
    },
    utravelPricing: utravel,
    totals: {
      subtotal: roundMoney(subtotal),
      discountTotal: roundMoney(discountTotal),
      grandTotal,
    },
  };
}

module.exports = {
  buildCheckoutQuote,
  calculateUtravelAmounts,
};