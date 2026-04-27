const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {
  getOffer,
  assertOfferBookable,
} = require("../services/duffel.service");
const { generateBookingReference } = require("../utils/bookingReference");
const {
  createPendingBooking,
  attachStripeSessionToBooking,
  findBlockingBookingByOfferId,
} = require("../services/booking.service");

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

  throw new Error(`Valutan ${originalCurrency || "okänd"} stöds inte ännu`);
}

function buildCheckoutLineItems({
  flightTotalSekMinor,
  serviceFeeTotalSekMinor,
  seatTotalSekMinor,
  baggageTotalSekMinor,
}) {
  const items = [];

  if (flightTotalSekMinor > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency: "sek",
        unit_amount: flightTotalSekMinor,
        product_data: {
          name: "Flygbiljett",
        },
      },
    });
  }

  if (serviceFeeTotalSekMinor > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency: "sek",
        unit_amount: serviceFeeTotalSekMinor,
        product_data: {
          name: "Skatter och avgifter",
        },
      },
    });
  }

  if (seatTotalSekMinor > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency: "sek",
        unit_amount: seatTotalSekMinor,
        product_data: {
          name: "Sittplats",
        },
      },
    });
  }

  if (baggageTotalSekMinor > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency: "sek",
        unit_amount: baggageTotalSekMinor,
        product_data: {
          name: "Incheckat bagage (23 kg)",
        },
      },
    });
  }

  return items;
}

function validatePassengers(passengers) {
  if (!Array.isArray(passengers) || passengers.length === 0) {
    return "Minst en passagerare krävs.";
  }

  for (let i = 0; i < passengers.length; i += 1) {
    const passenger = passengers[i];

    if (
      !passenger.given_name ||
      !passenger.family_name ||
      !passenger.born_on
    ) {
      return `Passagerare ${i + 1} saknar förnamn, efternamn eller födelsedatum.`;
    }
  }

  return null;
}

function isOfferFromDuffelAirways(offer) {
  const ownerName = String(offer?.owner?.name || "").toLowerCase();
  const ownerIata = String(offer?.owner?.iata_code || "").toLowerCase();

  return ownerName.includes("duffel") || ownerIata === "zz";
}

function hasValidSlicesAndSegments(offer) {
  const slices = Array.isArray(offer?.slices) ? offer.slices : [];

  if (slices.length === 0) return false;

  return slices.every((slice) => {
    const segments = Array.isArray(slice?.segments) ? slice.segments : [];

    if (segments.length === 0) return false;

    return segments.every((segment) => {
      return Boolean(
        segment?.origin?.iata_code &&
          segment?.destination?.iata_code &&
          segment?.departing_at &&
          segment?.arriving_at
      );
    });
  });
}

function validateOfferForCheckout(offer) {
  assertOfferBookable(offer);

  if (isOfferFromDuffelAirways(offer)) {
    throw new Error(
      "Detta testflygbolag kan inte bokas. Välj en annan resa."
    );
  }

  if (!hasValidSlicesAndSegments(offer)) {
    throw new Error(
      "Flygresan saknar fullständiga reseuppgifter. Välj en annan resa."
    );
  }

  return true;
}

function isOfferBlockedByExistingBooking(booking) {
  if (!booking) return false;

  return Boolean(
    booking.status === "pending_payment" ||
      booking.status === "payment_received" ||
      booking.status === "confirmed" ||
      booking.stripePaymentStatus === "paid" ||
      booking.duffelOrderId ||
      booking.confirmedAt
  );
}

async function createCheckoutSession(req, res) {
  try {
    const {
      offer_id,
      passengers,
      customer_email,
      phone_number,
      addons = {},
    } = req.body;

    if (!offer_id || !customer_email || !phone_number) {
      return res.status(400).json({
        code: "MISSING_REQUIRED_FIELDS",
        error: "offer_id, customer_email och phone_number krävs.",
      });
    }

    const passengerValidationError = validatePassengers(passengers);

    if (passengerValidationError) {
      return res.status(400).json({
        code: "INVALID_PASSENGERS",
        error: passengerValidationError,
      });
    }

    /**
     * Stoppa samma Duffel offerId från att återanvändas.
     *
     * Detta blockerar inte samma flygavgång.
     * Det blockerar bara samma unika offerId från samma sökning.
     */
    const blockingBooking = await findBlockingBookingByOfferId(offer_id);

    if (isOfferBlockedByExistingBooking(blockingBooking)) {
      return res.status(409).json({
        code: "OFFER_ALREADY_USED",
        error:
          "Den här biljetten är inte längre tillgänglig. Gå tillbaka och gör en ny sökning för att hämta aktuella biljetter.",
      });
    }

    const offerResponse = await getOffer(offer_id);
    const offer = offerResponse?.data || offerResponse;

    if (!offer?.id) {
      return res.status(400).json({
        code: "OFFER_NOT_FOUND",
        error: "Kunde inte hämta erbjudandet från Duffel.",
      });
    }

    validateOfferForCheckout(offer);

    const seatSelection = Boolean(addons.seat_selection);
    const checkedBags = Math.max(0, Number(addons.checked_bags || 0));
    const passengerCount = passengers.length;

    const bookingReference = generateBookingReference();
    const pricing = convertOfferToSekPerPerson(offer);

    const flightAmountPerPersonSek = pricing.flightAmountPerPersonSek;
    const serviceFeePerPersonSek = pricing.serviceFeePerPersonSek;

    const flightTotalSek = flightAmountPerPersonSek * passengerCount;
    const serviceFeeTotalSek = serviceFeePerPersonSek * passengerCount;
    const seatTotalSek = seatSelection ? SEAT_PRICE_SEK * passengerCount : 0;
    const baggageTotalSek = BAG_PRICE_SEK * checkedBags;

    const grandTotalSek =
      flightTotalSek + serviceFeeTotalSek + seatTotalSek + baggageTotalSek;

    const flightAmountPerPersonSekMinor = Math.round(
      flightAmountPerPersonSek * 100
    );
    const serviceFeePerPersonSekMinor = Math.round(
      serviceFeePerPersonSek * 100
    );
    const seatPriceSekMinor = Math.round(SEAT_PRICE_SEK * 100);
    const bagPriceSekMinor = Math.round(BAG_PRICE_SEK * 100);

    const flightTotalSekMinor = Math.round(flightTotalSek * 100);
    const serviceFeeTotalSekMinor = Math.round(serviceFeeTotalSek * 100);
    const seatTotalSekMinor = Math.round(seatTotalSek * 100);
    const baggageTotalSekMinor = Math.round(baggageTotalSek * 100);
    const grandTotalSekMinor = Math.round(grandTotalSek * 100);

    const pendingBooking = await createPendingBooking({
      bookingReference,
      customerEmail: customer_email,
      phoneNumber: phone_number,
      offerId: offer_id,
      offerSnapshot: offer,
      passengers,

      amount: grandTotalSekMinor,
      currency: "sek",

      originalCurrency: pricing.originalCurrency,
      originalAmount: pricing.originalAmount,
      passengerCount,

      flightAmountPerPersonSekMinor,
      serviceFeePerPersonSekMinor,
      seatPriceSekMinor: seatSelection ? seatPriceSekMinor : 0,
      bagPriceSekMinor: checkedBags > 0 ? bagPriceSekMinor : 0,

      flightTotalSekMinor,
      serviceFeeTotalSekMinor,
      seatTotalSekMinor,
      baggageTotalSekMinor,
      totalSekMinor: grandTotalSekMinor,

      eurToSekRate: EUR_TO_SEK,

      seatSelection,
      checkedBags,
    });

    const lineItems = buildCheckoutLineItems({
      flightTotalSekMinor,
      serviceFeeTotalSekMinor,
      seatTotalSekMinor,
      baggageTotalSekMinor,
    });

    if (!lineItems.length) {
      return res.status(400).json({
        code: "NO_PAYMENT_LINES",
        error: "Kunde inte skapa betalningsrader.",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/cancel`,

      customer_email,

      billing_address_collection: "auto",
      phone_number_collection: {
        enabled: true,
      },

      payment_method_types: ["card", "klarna"],

      branding_settings: {
        display_name: "UTravel",
      },

      line_items: lineItems,

      metadata: {
        booking_id: pendingBooking.id,
        booking_reference: bookingReference,
        offer_id: offer.id,
        customer_email,
        passenger_count: String(passengerCount),
        checked_bags: String(checkedBags),
        seat_selection: String(seatSelection),
      },
    });

    await attachStripeSessionToBooking(pendingBooking.id, session.id);

    return res.json({
      url: session.url,
      booking_id: pendingBooking.id,
      booking_reference: bookingReference,
      pricing: {
        display_currency: "SEK",
        original_currency: pricing.originalCurrency,
        original_amount: pricing.originalAmount,
        booking_reference: bookingReference,
        passenger_count: passengerCount,
        flight_amount_per_person: Number(flightAmountPerPersonSek.toFixed(2)),
        service_fee_per_person: Number(serviceFeePerPersonSek.toFixed(2)),
        seat_price_per_person: seatSelection
          ? Number(SEAT_PRICE_SEK.toFixed(2))
          : 0,
        bag_price_per_unit:
          checkedBags > 0 ? Number(BAG_PRICE_SEK.toFixed(2)) : 0,
        flight_total: Number(flightTotalSek.toFixed(2)),
        service_fee_total: Number(serviceFeeTotalSek.toFixed(2)),
        seat_total: Number(seatTotalSek.toFixed(2)),
        baggage_total: Number(baggageTotalSek.toFixed(2)),
        total_amount: Number(grandTotalSek.toFixed(2)),
      },
    });
  } catch (error) {
    const duffelError = error.response?.data || error.data || null;
    const rawMessage =
      duffelError?.errors?.[0]?.message ||
      duffelError?.message ||
      error.message ||
      "";

    console.error("checkout error:", duffelError || rawMessage);

    const lowerMessage = rawMessage.toLowerCase();

    const isOfferUnavailable =
      lowerMessage.includes("select another offer") ||
      lowerMessage.includes("latest availability") ||
      lowerMessage.includes("offer") ||
      lowerMessage.includes("gått ut") ||
      lowerMessage.includes("testflygbolag") ||
      lowerMessage.includes("fullständiga reseuppgifter") ||
      error.response?.status === 422 ||
      error.status === 422;

    if (isOfferUnavailable) {
      return res.status(409).json({
        code: "OFFER_UNAVAILABLE",
        error:
          "Priset eller tillgängligheten har ändrats. Gå tillbaka och sök igen för att hämta aktuella biljetter.",
      });
    }

    return res.status(500).json({
      code: "CHECKOUT_FAILED",
      error: "Kunde inte starta betalningen just nu. Försök igen om en stund.",
    });
  }
}

module.exports = {
  createCheckoutSession,
};