const axios = require("axios");

function formatMoneyFromMinor(amountMinor, currency = "SEK") {
  const value = Number(amountMinor || 0) / 100;

  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: String(currency || "SEK").toUpperCase(),
  }).format(value);
}

async function sendMailjetEmail({ to, subject, html }) {
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_SECRET_KEY;
  const fromEmail = process.env.SENDER_EMAIL || "info@utravel.se";
  const fromName = process.env.SENDER_NAME || "Utravel";

  if (!apiKey || !apiSecret) {
    throw new Error("MAILJET_API_KEY eller MAILJET_SECRET_KEY saknas.");
  }

  if (!to) {
    throw new Error("Mottagarens e-post saknas.");
  }

  const payload = {
    Messages: [
      {
        From: {
          Email: fromEmail,
          Name: fromName,
        },
        To: [
          {
            Email: to,
          },
        ],
        Subject: subject,
        HTMLPart: html,
      },
    ],
  };

  const response = await axios.post("https://api.mailjet.com/v3.1/send", payload, {
    auth: {
      username: apiKey,
      password: apiSecret,
    },
    timeout: 15000,
  });

  const status = response?.data?.Messages?.[0]?.Status;

  if (status !== "success") {
    throw new Error("Mailjet returnerade inte success-status.");
  }

  return response.data;
}

function buildBookingConfirmationHtml({ booking, routeLabel, route, departDate, returnDate }) {
  const reference = booking.bookingReference || booking.booking_reference || "-";
  const total = formatMoneyFromMinor(booking.amount, booking.currency || "SEK");

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2>Bokningsbekräftelse – Utravel</h2>

      <p>Hej!</p>

      <p>Tack för din bokning. Här är din bokningsbekräftelse.</p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin:20px 0;">
        <p><strong>Bokningsreferens:</strong> ${reference}</p>
        <p><strong>Status:</strong> ${booking.status === "confirmed" ? "Bokning bekräftad" : "Bokning mottagen"}</p>
        <p><strong>Resa:</strong> ${routeLabel || "-"}</p>
        <p><strong>Rutt:</strong> ${route || "-"}</p>
        <p><strong>Utresa:</strong> ${departDate || "-"}</p>
        <p><strong>Hemresa:</strong> ${returnDate || "-"}</p>
        <p><strong>Totalt belopp:</strong> ${total}</p>
      </div>

      <p>Du kan alltid hitta din bokning via bokningsreferensen ovan.</p>

      <p>
        Vid frågor, kontakta oss på
        <a href="mailto:info@utravel.se">info@utravel.se</a>.
      </p>

      <p>Vänliga hälsningar,<br><strong>Utravel</strong></p>
    </div>
  `;
}

module.exports = {
  sendMailjetEmail,
  buildBookingConfirmationHtml,
};