const prisma = require("../lib/prisma");

const OFFER_PENDING_HOLD_MINUTES = 20;

function getRecentPendingCutoff() {
  return new Date(Date.now() - OFFER_PENDING_HOLD_MINUTES * 60 * 1000);
}

function bookingHasCreatedOrder(booking) {
  return Boolean(
    booking?.status === "confirmed" ||
      booking?.duffelOrderId ||
      booking?.confirmedAt ||
      booking?.duffelOrder
  );
}

async function createPendingBooking(data) {
  return prisma.booking.create({
    data: {
      bookingReference: data.bookingReference,
      sessionId: data.sessionId || null,
      stripeCheckoutSessionId: data.stripeCheckoutSessionId || null,

      customerEmail: data.customerEmail,
      phoneNumber: data.phoneNumber,
      offerId: data.offerId,

      status: "pending_payment",
      currency: data.currency || "sek",
      amount: data.amount,

      originalCurrency: data.originalCurrency,
      originalAmount: data.originalAmount,
      passengerCount: data.passengerCount,

      flightAmountPerPersonSekMinor: data.flightAmountPerPersonSekMinor,
      serviceFeePerPersonSekMinor: data.serviceFeePerPersonSekMinor,
      seatPriceSekMinor: data.seatPriceSekMinor || 0,
      bagPriceSekMinor: data.bagPriceSekMinor || 0,

      flightTotalSekMinor: data.flightTotalSekMinor,
      serviceFeeTotalSekMinor: data.serviceFeeTotalSekMinor,
      seatTotalSekMinor: data.seatTotalSekMinor || 0,
      baggageTotalSekMinor: data.baggageTotalSekMinor || 0,
      totalSekMinor: data.totalSekMinor,

      eurToSekRate: data.eurToSekRate,

      seatSelection: data.seatSelection || false,
      checkedBags: data.checkedBags || 0,

      offerSnapshot: data.offerSnapshot,

      passengers: {
        create: data.passengers.map((passenger) => ({
          type: passenger.type || "adult",
          title: passenger.title || null,
          gender: passenger.gender || null,
          givenName: passenger.given_name,
          familyName: passenger.family_name,
          bornOn: passenger.born_on,
        })),
      },
    },
    include: {
      passengers: true,
    },
  });
}

async function attachStripeSessionToBooking(bookingId, sessionId) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      sessionId,
      stripeCheckoutSessionId: sessionId,
    },
  });
}

async function getBookingBySessionId(sessionId) {
  return prisma.booking.findFirst({
    where: {
      OR: [{ sessionId }, { stripeCheckoutSessionId: sessionId }],
    },
    include: {
      passengers: true,
    },
  });
}

async function getBookingByReference(reference) {
  return prisma.booking.findUnique({
    where: {
      bookingReference: reference,
    },
    include: {
      passengers: true,
    },
  });
}

async function findBookingByReferenceAndIdentifier(reference, identifier) {
  const cleanReference = String(reference || "").trim().toUpperCase();
  const cleanIdentifier = String(identifier || "").trim();

  return prisma.booking.findFirst({
    where: {
      bookingReference: cleanReference,
      OR: [
        {
          customerEmail: {
            equals: cleanIdentifier,
            mode: "insensitive",
          },
        },
        {
          passengers: {
            some: {
              familyName: {
                equals: cleanIdentifier,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    },
    include: {
      passengers: true,
    },
  });
}

/**
 * Stoppar återanvändning av exakt samma Duffel offerId.
 *
 * Viktigt:
 * Detta blockerar inte samma flygavgång.
 * Det blockerar bara samma unika offerId från samma sökning.
 *
 * En annan kund kan fortfarande boka samma flyg,
 * men då måste kunden göra en ny sökning och få ett nytt Duffel offerId.
 */
async function findBlockingBookingByOfferId(offerId) {
  if (!offerId) return null;

  return prisma.booking.findFirst({
    where: {
      offerId,
      OR: [
        {
          status: {
            in: ["payment_received", "confirmed"],
          },
        },
        {
          stripePaymentStatus: "paid",
        },
        {
          duffelOrderId: {
            not: null,
          },
        },
        {
          confirmedAt: {
            not: null,
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      passengers: true,
    },
  });
}

async function markBookingPaymentReceived(
  sessionId,
  stripePaymentIntent,
  stripePaymentStatus
) {
  const booking = await getBookingBySessionId(sessionId);
  if (!booking) return null;

  /**
   * Viktigt:
   * Om webhooken kommer igen efter att bokningen redan är confirmed
   * får vi inte skriva tillbaka status till payment_received.
   */
  if (bookingHasCreatedOrder(booking)) {
    return booking;
  }

  return prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "payment_received",
      stripePaymentIntent: stripePaymentIntent || null,
      stripePaymentStatus: stripePaymentStatus || null,
    },
    include: {
      passengers: true,
    },
  });
}

async function confirmBooking({
  sessionId,
  stripePaymentIntent,
  stripePaymentStatus,
  duffelOrderId,
  duffelOrder,
}) {
  const booking = await getBookingBySessionId(sessionId);

  if (!booking) {
    throw new Error(`Ingen booking hittades för session ${sessionId}.`);
  }

  return prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "confirmed",
      stripePaymentIntent: stripePaymentIntent || null,
      stripePaymentStatus: stripePaymentStatus || null,
      duffelOrderId: duffelOrderId || null,
      duffelOrder: duffelOrder || null,
      confirmedAt: new Date(),
      confirmationError: null,
    },
    include: {
      passengers: true,
    },
  });
}

async function markBookingConfirmationFailed(sessionId, reason) {
  const booking = await getBookingBySessionId(sessionId);
  if (!booking) return null;

  /**
   * Viktigt:
   * Skriv aldrig över en redan lyckad Duffel-order till confirmation_failed.
   * Det var en av orsakerna till "Manuell kontroll krävs" trots att order fanns.
   */
  if (bookingHasCreatedOrder(booking)) {
    return booking;
  }

  return prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "confirmation_failed",
      confirmationError: reason || "Kunde inte bekräfta bokningen.",
    },
    include: {
      passengers: true,
    },
  });
}

async function markBookingExpired(sessionId) {
  const booking = await getBookingBySessionId(sessionId);
  if (!booking) return null;

  if (bookingHasCreatedOrder(booking)) {
    return booking;
  }

  return prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "expired",
      expiredAt: new Date(),
    },
    include: {
      passengers: true,
    },
  });
}

module.exports = {
  createPendingBooking,
  attachStripeSessionToBooking,
  getBookingBySessionId,
  getBookingByReference,
  findBookingByReferenceAndIdentifier,
  findBlockingBookingByOfferId,
  markBookingPaymentReceived,
  confirmBooking,
  markBookingConfirmationFailed,
  markBookingExpired,
};