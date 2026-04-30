const fs = require("fs");
const path = require("path");
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
      subject: `Bokningsbekräftelse - ${booking.bookingReference}`,
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

/* -----------------------------
   Hjälpfunktioner
----------------------------- */

function cleanPdfText(value, fallback = "-") {
  if (value == null || value === "") return fallback;

  return String(value)
    .replace(/[–—−]/g, "-")
    .replace(/[→➜➝]/g, "-")
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[•]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCurrency(amount) {
  const value = Number(amount || 0);

  return (
    new Intl.NumberFormat("sv-SE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + " kr"
  );
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

function formatTimeOnly(value) {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  return `${formatDateOnly(value)} kl. ${formatTimeOnly(value)}`;
}

function getPassengers(booking) {
  return Array.isArray(booking?.passengers) ? booking.passengers : [];
}

function getPassengerName(passenger, index = 0) {
  const first = passenger?.given_name || "";
  const last = passenger?.family_name || "";
  const fullName = `${first} ${last}`.trim();

  return cleanPdfText(fullName || `Resenär ${index + 1}`);
}

function getPassengerTypeLabel(type) {
  const value = String(type || "").toLowerCase();

  if (value === "adult") return "Vuxen";
  if (value === "child") return "Barn";
  if (value === "infant_without_seat") return "Spädbarn utan säte";
  if (value === "infant_with_seat") return "Spädbarn med säte";

  return cleanPdfText(type || "Resenär");
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

function getSegmentsFromSlice(slice) {
  return Array.isArray(slice?.segments) ? slice.segments : [];
}

function getAirportLabel(place) {
  if (!place) return "-";

  const city = place.city_name || place.city || "";
  const code = place.iata_code || "";
  const name = place.name || "";

  if (city && code) return cleanPdfText(`${city} (${code})`);
  if (name && code) return cleanPdfText(`${name} (${code})`);
  if (code) return cleanPdfText(code);
  if (city) return cleanPdfText(city);
  if (name) return cleanPdfText(name);

  return "-";
}

function getCarrierLabel(segment) {
  const marketingCarrier =
    segment?.marketing_carrier?.name ||
    segment?.marketing_carrier?.iata_code ||
    segment?.operating_carrier?.name ||
    segment?.operating_carrier?.iata_code ||
    "";

  const flightNumber =
    segment?.marketing_carrier_flight_number ||
    segment?.operating_carrier_flight_number ||
    "";

  return cleanPdfText(`${marketingCarrier} ${flightNumber}`.trim() || "-");
}

function getRoute(booking) {
  const slices = getSlices(booking);
  const firstSlice = slices[0];
  const firstSegments = getSegmentsFromSlice(firstSlice);

  if (!firstSegments.length) return "-";

  const firstSegment = firstSegments[0];
  const lastSegment = firstSegments[firstSegments.length - 1];

  const originCode = firstSegment?.origin?.iata_code || "-";
  const destinationCode = lastSegment?.destination?.iata_code || "-";

  return cleanPdfText(`${originCode} - ${destinationCode}`);
}

function getRouteLabel(booking) {
  const slices = getSlices(booking);
  const firstSlice = slices[0];
  const firstSegments = getSegmentsFromSlice(firstSlice);

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

  return cleanPdfText(`${originCity} - ${destinationCity}`);
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
  const returnSegments = getSegmentsFromSlice(returnSlice);
  const firstReturnSegment = returnSegments[0];

  return firstReturnSegment?.departing_at || returnSlice?.departure_date || null;
}

/* -----------------------------
   Logga
----------------------------- */

function findLogoPath() {
  const fileName = "Loggo_UTravel.png";

  const candidates = [
    path.resolve(process.cwd(), "public", "images", fileName),
    path.resolve(process.cwd(), "public/images", fileName),

    path.resolve(process.cwd(), "apps", "web", "public", "images", fileName),
    path.resolve(process.cwd(), "apps/web/public/images", fileName),

    path.resolve(process.cwd(), "..", "public", "images", fileName),
    path.resolve(process.cwd(), "..", "..", "public", "images", fileName),

    path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "web",
      "public",
      "images",
      fileName
    ),

    path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "public",
      "images",
      fileName
    ),
  ];

  const uniqueCandidates = [...new Set(candidates)];

  return (
    uniqueCandidates.find((logoPath) => {
      try {
        return fs.existsSync(logoPath);
      } catch {
        return false;
      }
    }) || null
  );
}

function drawLogoOrText(doc, x, y) {
  const logoPath = findLogoPath();

  if (logoPath) {
    try {
      doc.image(logoPath, x, y, {
        fit: [175, 64],
        align: "left",
        valign: "center",
      });
      return;
    } catch (error) {
      console.warn("Kunde inte läsa PDF-loggan:", error.message);
    }
  }

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(31)
    .text("UTravel", x, y + 8, {
      lineBreak: false,
    });
}

/* -----------------------------
   PDF Drawing
----------------------------- */

function ensureSpace(doc, currentY, neededHeight = 90) {
  if (currentY + neededHeight <= 800) return currentY;

  doc.addPage({
    size: "A4",
    margin: 0,
  });

  doc.rect(0, 0, 595, 842).fill("#F8FAFC");
  return 44;
}

function drawLabelValue(doc, label, value, x, y, width = 220) {
  doc
    .fillColor("#64748B")
    .font("Helvetica")
    .fontSize(9)
    .text(cleanPdfText(label), x, y, { width });

  doc
    .fillColor("#0F172A")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(cleanPdfText(value), x, y + 14, { width });
}

function drawInfoCard(doc, x, y, w, h, title) {
  doc
    .save()
    .roundedRect(x, y, w, h, 18)
    .fillAndStroke("#FFFFFF", "#E2E8F0")
    .restore();

  doc
    .fillColor("#0F172A")
    .font("Helvetica-Bold")
    .fontSize(16)
    .text(cleanPdfText(title), x + 18, y + 16);
}

function drawPaymentRow(doc, label, value, y, isTotal = false) {
  const leftX = 68;
  const rightX = 380;

  doc
    .fillColor(isTotal ? "#0F172A" : "#475569")
    .font(isTotal ? "Helvetica-Bold" : "Helvetica")
    .fontSize(isTotal ? 13 : 11)
    .text(cleanPdfText(label), leftX, y, {
      width: 250,
      lineBreak: false,
    });

  doc
    .fillColor("#0F172A")
    .font("Helvetica-Bold")
    .fontSize(isTotal ? 13 : 11)
    .text(cleanPdfText(value), rightX, y, {
      width: 145,
      align: "right",
      lineBreak: false,
    });
}

function drawMiniFlightBox(doc, label, timeValue, dateValue, x, y, w = 96, h = 42) {
  doc
    .save()
    .roundedRect(x, y, w, h, 10)
    .fillAndStroke("#F8FAFC", "#E2E8F0")
    .restore();

  doc
    .fillColor("#64748B")
    .font("Helvetica")
    .fontSize(7.5)
    .text(cleanPdfText(label), x, y + 6, {
      width: w,
      align: "center",
    });

  doc
    .fillColor("#0F172A")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(cleanPdfText(timeValue), x, y + 16, {
      width: w,
      align: "center",
    });

  doc
    .fillColor("#64748B")
    .font("Helvetica")
    .fontSize(7.5)
    .text(cleanPdfText(dateValue), x, y + 29, {
      width: w,
      align: "center",
    });
}

function drawPassengerSection(doc, booking, startY) {
  const passengers = getPassengers(booking);
  const safePassengers = passengers.length ? passengers : [{}];

  const rowHeight = 30;
  const tableHeaderHeight = 28;
  const cardHeight = 62 + tableHeaderHeight + safePassengers.length * rowHeight + 18;

  let y = ensureSpace(doc, startY, cardHeight + 20);

  drawInfoCard(doc, 50, y, 495, cardHeight, "Resenärer");

  const tableX = 68;
  const tableY = y + 50;
  const tableW = 459;

  doc
    .save()
    .roundedRect(tableX, tableY, tableW, tableHeaderHeight, 10)
    .fill("#F8FAFC")
    .restore();

  doc
    .fillColor("#64748B")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("Nr", tableX + 10, tableY + 9, { width: 30 });

  doc
    .fillColor("#64748B")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("Namn", tableX + 46, tableY + 9, { width: 200 });

  doc
    .fillColor("#64748B")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("Typ", tableX + 270, tableY + 9, { width: 100 });

  doc
    .fillColor("#64748B")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("Födelsedatum", tableX + 360, tableY + 9, {
      width: 88,
      align: "right",
    });

  let rowY = tableY + tableHeaderHeight;

  safePassengers.forEach((passenger, index) => {
    if (index % 2 === 0) {
      doc
        .save()
        .roundedRect(tableX, rowY, tableW, rowHeight, 6)
        .fill("#FCFDFE")
        .restore();
    }

    const passengerName = getPassengerName(passenger, index);
    const passengerType = getPassengerTypeLabel(passenger?.type);
    const bornOn = passenger?.born_on ? formatDateOnly(passenger.born_on) : "-";

    doc
      .fillColor("#0F172A")
      .font("Helvetica")
      .fontSize(9.5)
      .text(String(index + 1), tableX + 10, rowY + 9, { width: 30 });

    doc
      .fillColor("#0F172A")
      .font("Helvetica-Bold")
      .fontSize(9.8)
      .text(cleanPdfText(passengerName), tableX + 46, rowY + 8, {
        width: 205,
      });

    doc
      .fillColor("#475569")
      .font("Helvetica")
      .fontSize(9.3)
      .text(cleanPdfText(passengerType), tableX + 270, rowY + 9, {
        width: 100,
      });

    doc
      .fillColor("#475569")
      .font("Helvetica")
      .fontSize(9.3)
      .text(cleanPdfText(bornOn), tableX + 360, rowY + 9, {
        width: 88,
        align: "right",
      });

    rowY += rowHeight;
  });

  return y + cardHeight + 22;
}

function drawFlightSection(doc, booking, startY) {
  const slices = getSlices(booking);

  if (!slices.length) {
    const y = ensureSpace(doc, startY, 120);
    drawInfoCard(doc, 50, y, 495, 110, "Flygtider");
    drawLabelValue(doc, "Rutt", getRoute(booking), 68, y + 54, 180);
    return y + 132;
  }

  let totalSegments = 0;
  slices.forEach((slice) => {
    const segments = getSegmentsFromSlice(slice);
    totalSegments += Math.max(segments.length, 1);
  });

  const cardHeight = 66 + slices.length * 28 + totalSegments * 74 + 12;
  let y = ensureSpace(doc, startY, cardHeight + 20);

  drawInfoCard(doc, 50, y, 495, cardHeight, "Flygtider");

  let currentY = y + 50;

  slices.forEach((slice, sliceIndex) => {
    const sliceLabel = sliceIndex === 0 ? "UTRESA" : "HEMRESA";
    const segments = getSegmentsFromSlice(slice);

    doc
      .save()
      .roundedRect(68, currentY, 86, 22, 11)
      .fill("#EDF4FF")
      .restore();

    doc
      .fillColor("#0F172A")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(sliceLabel, 68, currentY + 7, {
        width: 86,
        align: "center",
      });

    currentY += 32;

    if (!segments.length) {
      doc
        .fillColor("#64748B")
        .font("Helvetica")
        .fontSize(10)
        .text("Ingen flyginformation hittades.", 68, currentY);

      currentY += 28;
      return;
    }

    segments.forEach((segment) => {
      const origin = getAirportLabel(segment?.origin);
      const destination = getAirportLabel(segment?.destination);
      const departingAt = segment?.departing_at;
      const arrivingAt = segment?.arriving_at;
      const carrier = getCarrierLabel(segment);

      doc
        .save()
        .roundedRect(68, currentY, 459, 60, 14)
        .fillAndStroke("#FBFCFD", "#E2E8F0")
        .restore();

      doc
        .fillColor("#0F172A")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(cleanPdfText(`${origin} - ${destination}`), 84, currentY + 12, {
          width: 205,
        });

      doc
        .fillColor("#64748B")
        .font("Helvetica")
        .fontSize(9)
        .text(cleanPdfText(carrier), 84, currentY + 30, {
          width: 205,
        });

      drawMiniFlightBox(
        doc,
        "Avgång",
        formatTimeOnly(departingAt),
        formatDateOnly(departingAt),
        310,
        currentY + 9,
        94,
        42
      );

      drawMiniFlightBox(
        doc,
        "Ankomst",
        formatTimeOnly(arrivingAt),
        formatDateOnly(arrivingAt),
        416,
        currentY + 9,
        94,
        42
      );

      currentY += 72;
    });
  });

  return y + cardHeight + 22;
}

function drawPaymentSection(doc, booking, startY, passengers, amounts) {
  const { totalAmount, flightAmount, serviceFee, seats, bags } = amounts;

  const rows = [
    { label: "Betalningsmetod", value: "Kort", gapAfter: 26 },
    { label: "Resenärer", value: String(passengers.length || 1), gapAfter: 36 },
    { label: "Flygbiljett", value: formatCurrency(flightAmount), gapAfter: 26 },
    {
      label: "Skatter och avgifter",
      value: formatCurrency(serviceFee),
      gapAfter: 26,
    },
  ];

  if (seats > 0) {
    rows.push({
      label: "Sittplatser",
      value: formatCurrency(seats),
      gapAfter: 26,
    });
  }

  if (bags > 0) {
    rows.push({
      label: "Incheckat bagage",
      value: formatCurrency(bags),
      gapAfter: 26,
    });
  }

  let cardHeight = 52;

  rows.forEach((row) => {
    cardHeight += row.gapAfter;
  });

  cardHeight += 78;

  let y = ensureSpace(doc, startY, cardHeight + 20);

  drawInfoCard(doc, 50, y, 495, cardHeight, "Betalning");

  let rowY = y + 52;

  rows.forEach((row) => {
    drawPaymentRow(doc, row.label, row.value, rowY);
    rowY += row.gapAfter;
  });

  doc
    .strokeColor("#E2E8F0")
    .lineWidth(1)
    .moveTo(68, rowY + 8)
    .lineTo(525, rowY + 8)
    .stroke();

  drawPaymentRow(
    doc,
    "Totalt belopp",
    formatCurrency(totalAmount),
    rowY + 26,
    true
  );

  return y + cardHeight + 22;
}

function drawHelpSection(doc, booking, bookingReference, startY) {
  const y = ensureSpace(doc, startY, 150);

  drawInfoCard(doc, 50, y, 495, 108, "Behöver du hjälp?");

  doc
    .fillColor("#475569")
    .font("Helvetica")
    .fontSize(10)
    .text(
      "Kontakta oss om du har frågor om bokningen, behöver hjälp inför resan eller vill göra ändringar.",
      68,
      y + 40,
      { width: 320, lineGap: 2 }
    );

  drawLabelValue(doc, "Telefon", "08-123 45 67", 410, y + 34, 100);
  drawLabelValue(doc, "E-post", "info@utravel.se", 410, y + 74, 100);

  doc
    .fillColor("#94A3B8")
    .font("Helvetica")
    .fontSize(9)
    .text(
      cleanPdfText(
        `UTravel - ${bookingReference} - ${formatDate(
          booking?.confirmed_at || booking?.created_at
        )}`
      ),
      50,
      820,
      { width: 495, align: "center" }
    );

  return y + 130;
}

/* -----------------------------
   PDF
----------------------------- */

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
      autoFirstPage: true,
    });

    const fileName = `bokning-${bookingReference}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    doc.pipe(res);

    doc.rect(0, 0, 595, 842).fill("#F8FAFC");
    doc.rect(0, 0, 595, 170).fill("#0F172A");

    drawLogoOrText(doc, 50, 30);

    doc
      .fillColor("#CBD5E1")
      .font("Helvetica")
      .fontSize(12)
      .text("Bokningsbekräftelse", 50, 88);

    doc
      .fillColor("#E2E8F0")
      .font("Helvetica")
      .fontSize(11)
      .text("Tack för att du reser med oss. Här är din sammanfattning.", 50, 112);

    doc
      .save()
      .roundedRect(390, 42, 155, 34, 17)
      .fill("#1E293B")
      .restore();

    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(cleanPdfText(bookingReference), 390, 53, {
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

    doc
      .save()
      .roundedRect(50, 138, 495, 82, 22)
      .fill("#FFFFFF")
      .restore();

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

    drawInfoCard(doc, 50, 248, 238, 168, "Kontakt");

    drawLabelValue(
      doc,
      "Huvudresenär",
      getPrimaryPassengerName(booking),
      68,
      300,
      180
    );

    drawLabelValue(doc, "E-post", booking?.customer_email || "-", 68, 344, 180);
    drawLabelValue(doc, "Telefon", booking?.phone_number || "-", 68, 388, 180);

    drawInfoCard(doc, 307, 248, 238, 168, "Resa");
    drawLabelValue(doc, "Rutt", route, 325, 300, 180);
    drawLabelValue(doc, "Utresa", formatDateTime(departDate), 325, 344, 180);

    drawLabelValue(
      doc,
      "Hemresa",
      returnDate ? formatDateTime(returnDate) : "-",
      325,
      388,
      180
    );

    let currentY = 438;

    currentY = drawPassengerSection(doc, booking, currentY);
    currentY = drawFlightSection(doc, booking, currentY);

    currentY = drawPaymentSection(doc, booking, currentY, passengers, {
      totalAmount,
      flightAmount,
      serviceFee,
      seats,
      bags,
    });

    drawHelpSection(doc, booking, bookingReference, currentY);

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