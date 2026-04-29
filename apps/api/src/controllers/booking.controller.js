const PDFDocument = require("pdfkit");
const {
  getBookingBySessionId: getBookingBySessionIdFromDb,
  getBookingByReference,
  findBookingByReferenceAndIdentifier,
} = require("../services/booking.service");
const {
  sendMailjetEmail,
  buildBookingConfirmationHtml,
} = require("../services/mail.service");

function mapBookingForFrontend(booking) {
  return {
    id: booking.id,
    bookingReference: booking.bookingReference,
    booking_reference: booking.bookingReference,
    session_id: booking.sessionId,
    stripe_checkout_session_id: booking.stripeCheckoutSessionId,

    offer_id: booking.offerId,
    offer_snapshot: booking.offerSnapshot,

    passengers: booking.passengers.map((p) => ({
      type: p.type,
      title: p.title,
      gender: p.gender,
      given_name: p.givenName,
      family_name: p.familyName,
      born_on: p.bornOn,
    })),

    customer_email: booking.customerEmail,
    phone_number: booking.phoneNumber,

    amount: booking.amount,
    currency: booking.currency,
    status: booking.status,

    original_currency: booking.originalCurrency,
    original_amount: booking.originalAmount,
    passenger_count: booking.passengerCount,

    flight_amount_per_person_sek_minor: booking.flightAmountPerPersonSekMinor,
    service_fee_per_person_sek_minor: booking.serviceFeePerPersonSekMinor,
    seat_price_sek_minor: booking.seatPriceSekMinor,
    bag_price_sek_minor: booking.bagPriceSekMinor,

    flight_total_sek_minor: booking.flightTotalSekMinor,
    service_fee_total_sek_minor: booking.serviceFeeTotalSekMinor,
    seat_total_sek_minor: booking.seatTotalSekMinor,
    baggage_total_sek_minor: booking.baggageTotalSekMinor,
    total_sek_minor: booking.totalSekMinor,

    eur_to_sek_rate: booking.eurToSekRate,

    confirmed_at: booking.confirmedAt,
    created_at: booking.createdAt,

    duffel_order_id: booking.duffelOrderId,
    duffel_order: booking.duffelOrder,
  };
}

async function getBookingBySessionId(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId krävs.",
      });
    }

    const booking = await getBookingBySessionIdFromDb(sessionId);

    if (!booking) {
      return res.status(404).json({
        error: "Bokning hittades inte.",
      });
    }

    return res.json({
      status: booking.status,
      booking: mapBookingForFrontend(booking),
    });
  } catch (error) {
    console.error("getBookingBySessionId error:", error);

    return res.status(500).json({
      error: "Något gick fel vid hämtning av bokning.",
    });
  }
}

async function findBooking(req, res) {
  try {
    const { booking_reference, identifier } = req.body;

    if (!booking_reference || !identifier) {
      return res.status(400).json({
        error: "Bokningsreferens och efternamn eller e-post krävs.",
      });
    }

    const booking = await findBookingByReferenceAndIdentifier(
      booking_reference,
      identifier
    );

    if (!booking) {
      return res.status(404).json({
        error: "Ingen bokning hittades med dessa uppgifter.",
      });
    }

    return res.json({
      success: true,
      status: booking.status,
      booking: mapBookingForFrontend(booking),
    });
  } catch (error) {
    console.error("findBooking error:", error);

    return res.status(500).json({
      error: "Något gick fel när bokningen skulle hämtas.",
    });
  }
}

async function sendBookingEmail(req, res) {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        error: "Bokningsreferens krävs.",
      });
    }

    const dbBooking = await getBookingByReference(reference);

    if (!dbBooking) {
      return res.status(404).json({
        error: "Bokningen hittades inte.",
      });
    }

    if (!dbBooking.customerEmail) {
      return res.status(400).json({
        error: "Bokningen saknar e-postadress.",
      });
    }

    const booking = mapBookingForFrontend(dbBooking);

    const routeLabel = getRouteLabel(booking);
    const route = getRoute(booking);
    const departDate = formatDateOnly(getDepartDate(booking));
    const returnDateValue = getReturnDate(booking);
    const returnDate = returnDateValue ? formatDateOnly(returnDateValue) : "-";

    const html = buildBookingConfirmationHtml({
      booking,
      routeLabel,
      route,
      departDate,
      returnDate,
    });

    await sendMailjetEmail({
      to: booking.customer_email,
      subject: `Bokningsbekräftelse – ${booking.bookingReference}`,
      html,
    });

    return res.json({
      success: true,
      message: "Bekräftelsen har skickats till e-post.",
    });
  } catch (error) {
    console.error("sendBookingEmail error:", error.response?.data || error);

    return res.status(500).json({
      error: "Kunde inte skicka e-postbekräftelsen.",
    });
  }
}

function formatCurrency(amount) {
  const value = Number(amount || 0);
  return `${value.toFixed(2).replace(".", ",")} kr`;
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getPassengers(booking) {
  return Array.isArray(booking?.passengers) ? booking.passengers : [];
}

function getPassengerName(passenger, index = 0) {
  const first = passenger?.given_name || "";
  const last = passenger?.family_name || "";
  const fullName = `${first} ${last}`.trim();
  return fullName || `Resenär ${index + 1}`;
}

function getPrimaryPassengerName(booking) {
  const passengers = getPassengers(booking);
  if (!passengers.length) return "-";
  return getPassengerName(passengers[0], 0);
}

function getSlices(booking) {
  return Array.isArray(booking?.offer_snapshot?.slices)
    ? booking.offer_snapshot.slices
    : [];
}

function getRoute(booking) {
  const slices = getSlices(booking);
  const firstSlice = slices[0];
  const firstSegments = Array.isArray(firstSlice?.segments)
    ? firstSlice.segments
    : [];

  if (!firstSegments.length) return "-";

  const firstSegment = firstSegments[0];
  const lastSegment = firstSegments[firstSegments.length - 1];

  const originCode = firstSegment?.origin?.iata_code || "-";
  const destinationCode = lastSegment?.destination?.iata_code || "-";

  return `${originCode} – ${destinationCode}`;
}

function getRouteLabel(booking) {
  const slices = getSlices(booking);
  const firstSlice = slices[0];
  const firstSegments = Array.isArray(firstSlice?.segments)
    ? firstSlice.segments
    : [];

  if (!firstSegments.length) return "-";

  const firstSegment = firstSegments[0];
  const lastSegment = firstSegments[firstSegments.length - 1];

  const originCity =
    firstSegment?.origin?.city_name ||
    firstSegment?.origin?.name ||
    firstSegment?.origin?.iata_code ||
    "Avresa";

  const destinationCity =
    lastSegment?.destination?.city_name ||
    lastSegment?.destination?.name ||
    lastSegment?.destination?.iata_code ||
    "Destination";

  return `${originCity} – ${destinationCity}`;
}

function getDepartDate(booking) {
  const slices = getSlices(booking);
  const firstSlice = slices[0];
  const firstSegment = firstSlice?.segments?.[0];

  return firstSegment?.departing_at || firstSlice?.departure_date || null;
}

function getReturnDate(booking) {
  const slices = getSlices(booking);

  if (slices.length < 2) return null;

  const returnSlice = slices[slices.length - 1];
  const returnSegments = Array.isArray(returnSlice?.segments)
    ? returnSlice.segments
    : [];
  const firstReturnSegment = returnSegments[0];

  return firstReturnSegment?.departing_at || returnSlice?.departure_date || null;
}

function drawLabelValue(doc, label, value, x, y, width = 220) {
  doc
    .fillColor("#64748B")
    .font("Helvetica")
    .fontSize(9)
    .text(label, x, y, { width });

  doc
    .fillColor("#0F172A")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(value || "-", x, y + 14, { width });
}

function drawInfoCard(doc, x, y, w, h, title) {
  doc
    .save()
    .roundedRect(x, y, w, h, 14)
    .fillAndStroke("#FFFFFF", "#E2E8F0")
    .restore();

  doc
    .fillColor("#0F172A")
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(title, x + 18, y + 16);
}

function drawPaymentRow(doc, label, value, y, isTotal = false) {
  const leftX = 68;
  const rightX = 430;

  doc
    .fillColor(isTotal ? "#0F172A" : "#475569")
    .font(isTotal ? "Helvetica-Bold" : "Helvetica")
    .fontSize(isTotal ? 13 : 11)
    .text(label, leftX, y, { width: 240 });

  doc
    .fillColor("#0F172A")
    .font("Helvetica-Bold")
    .fontSize(isTotal ? 13 : 11)
    .text(value, rightX, y, { width: 90, align: "right" });
}

async function downloadBookingPdf(req, res) {
  try {
    const { reference } = req.params;
    const dbBooking = await getBookingByReference(reference);

    if (!dbBooking) {
      return res.status(404).json({
        success: false,
        message: "Bokningen kunde inte hittas.",
      });
    }

    const booking = mapBookingForFrontend(dbBooking);

    const bookingReference =
      booking?.bookingReference || booking?.booking_reference || reference;

    const passengerName = getPrimaryPassengerName(booking);
    const route = getRoute(booking);
    const routeLabel = getRouteLabel(booking);
    const departDate = getDepartDate(booking);
    const returnDate = getReturnDate(booking);
    const passengers = getPassengers(booking);

    const totalAmount =
      booking?.amount != null ? Number(booking.amount) / 100 : 0;

    const flightAmount =
      booking?.flight_total_sek_minor != null
        ? Number(booking.flight_total_sek_minor) / 100
        : 0;

    const serviceFee =
      booking?.service_fee_total_sek_minor != null
        ? Number(booking.service_fee_total_sek_minor) / 100
        : 0;

    const seats =
      booking?.seat_total_sek_minor != null
        ? Number(booking.seat_total_sek_minor) / 100
        : 0;

    const bags =
      booking?.baggage_total_sek_minor != null
        ? Number(booking.baggage_total_sek_minor) / 100
        : 0;

    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
    });

    const fileName = `bokning-${bookingReference}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    doc.pipe(res);

    doc.rect(0, 0, 595, 842).fill("#F8FAFC");
    doc.rect(0, 0, 595, 170).fill("#0F172A");

    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(28)
      .text("Utravel", 50, 42);

    doc
      .fillColor("#CBD5E1")
      .font("Helvetica")
      .fontSize(12)
      .text("Bokningsbekräftelse", 50, 80);

    doc
      .fillColor("#E2E8F0")
      .font("Helvetica")
      .fontSize(11)
      .text("Tack för att du reser med oss. Här är din sammanfattning.", 50, 104);

    doc.save().roundedRect(390, 42, 155, 34, 17).fill("#1E293B").restore();

    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(bookingReference, 390, 53, {
        width: 155,
        align: "center",
      });

    doc
      .fillColor("#94A3B8")
      .font("Helvetica")
      .fontSize(9)
      .text("Bokningsreferens", 390, 80, {
        width: 155,
        align: "center",
      });

    doc.save().roundedRect(50, 138, 495, 82, 18).fill("#FFFFFF").restore();

    drawLabelValue(
      doc,
      "Status",
      booking.status === "confirmed"
        ? "Bokning bekräftad"
        : "Inväntar bekräftelse",
      72,
      156,
      120
    );

    drawLabelValue(doc, "Resa", routeLabel, 212, 156, 170);

    drawLabelValue(
      doc,
      "Skapad",
      formatDate(booking?.confirmed_at || booking?.created_at),
      400,
      156,
      120
    );

    drawInfoCard(doc, 50, 248, 238, 168, "Resenär");
    drawLabelValue(doc, "Namn", passengerName, 68, 300, 180);
    drawLabelValue(doc, "E-post", booking?.customer_email || "-", 68, 344, 180);
    drawLabelValue(doc, "Telefon", booking?.phone_number || "-", 68, 388, 180);

    drawInfoCard(doc, 307, 248, 238, 168, "Resa");
    drawLabelValue(doc, "Rutt", route, 325, 300, 180);
    drawLabelValue(doc, "Utresa", formatDateOnly(departDate), 325, 344, 180);
    drawLabelValue(
      doc,
      "Hemresa",
      returnDate ? formatDateOnly(returnDate) : "-",
      325,
      388,
      180
    );

    drawInfoCard(doc, 50, 438, 495, 222, "Betalning");
    drawPaymentRow(doc, "Betalningsmetod", "Kort", 478);
    drawPaymentRow(doc, "Resenärer", String(passengers.length || 1), 504);
    drawPaymentRow(doc, "Flygbiljett", formatCurrency(flightAmount), 540);
    drawPaymentRow(doc, "Skatter och avgifter", formatCurrency(serviceFee), 566);

    let nextY = 592;

    if (seats > 0) {
      drawPaymentRow(doc, "Sittplatser", formatCurrency(seats), nextY);
      nextY += 26;
    }

    if (bags > 0) {
      drawPaymentRow(doc, "Incheckat bagage", formatCurrency(bags), nextY);
      nextY += 26;
    }

    doc
      .strokeColor("#E2E8F0")
      .lineWidth(1)
      .moveTo(68, nextY + 10)
      .lineTo(525, nextY + 10)
      .stroke();

    drawPaymentRow(
      doc,
      "Totalt belopp",
      formatCurrency(totalAmount),
      nextY + 28,
      true
    );

    drawInfoCard(doc, 50, 690, 495, 108, "Behöver du hjälp?");

    doc
      .fillColor("#475569")
      .font("Helvetica")
      .fontSize(10)
      .text(
        "Kontakta oss om du har frågor om bokningen, behöver hjälp inför resan eller vill göra ändringar.",
        68,
        728,
        { width: 320, lineGap: 2 }
      );

    drawLabelValue(doc, "Telefon", "08-123 45 67", 410, 724, 100);
    drawLabelValue(doc, "E-post", "info@utravel.se", 410, 764, 100);

    doc
      .fillColor("#94A3B8")
      .font("Helvetica")
      .fontSize(9)
      .text(
        `Utravel • ${bookingReference} • ${formatDate(
          booking?.confirmed_at || booking?.created_at
        )}`,
        50,
        820,
        { width: 495, align: "center" }
      );

    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);

    return res.status(500).json({
      success: false,
      message: "Kunde inte skapa PDF.",
    });
  }
}

module.exports = {
  getBookingBySessionId,
  downloadBookingPdf,
  findBooking,
  sendBookingEmail,
};