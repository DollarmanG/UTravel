import { useState } from "react";
import { findBooking, downloadBookingPdf } from "../api/flights";
import SiteHeader from "../components/SiteHeader";
import styles from "../styles/FindBookingPage.module.css";

function formatCurrencyFromMinor(value) {
  const amount = Number(value || 0) / 100;
  return `${amount.toFixed(2).replace(".", ",")} kr`;
}

function getRoute(booking) {
  const slices = booking?.offer_snapshot?.slices || [];
  const firstSlice = slices[0];
  const segments = firstSlice?.segments || [];

  if (!segments.length) return "-";

  const first = segments[0];
  const last = segments[segments.length - 1];

  return `${first?.origin?.iata_code || "-"} – ${
    last?.destination?.iata_code || "-"
  }`;
}

function getRouteTitle(booking) {
  const slices = booking?.offer_snapshot?.slices || [];
  const firstSlice = slices[0];
  const segments = firstSlice?.segments || [];

  if (!segments.length) return "Din resa";

  const first = segments[0];
  const last = segments[segments.length - 1];

  const origin =
    first?.origin?.city_name || first?.origin?.name || first?.origin?.iata_code;

  const destination =
    last?.destination?.city_name ||
    last?.destination?.name ||
    last?.destination?.iata_code;

  return `${origin} – ${destination}`;
}

export default function FindBookingPage() {
  const [bookingReference, setBookingReference] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const data = await findBooking({
        booking_reference: bookingReference,
        identifier,
      });

      setBooking(data.booking);
    } catch (err) {
      setError(err.message || "Kunde inte hitta bokningen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />

      <main className={styles.page}>
        <section className={styles.card}>
          <p className={styles.badge}>Hitta bokning</p>

          <h1 className={styles.title}>Sök fram din resa</h1>

          <p className={styles.subtitle}>
            Ange din bokningsreferens och ditt efternamn eller din e-postadress.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              value={bookingReference}
              onChange={(e) => setBookingReference(e.target.value)}
              placeholder="Bokningsreferens, t.ex. UT409597"
              required
              className={styles.input}
            />

            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Efternamn eller e-post"
              required
              className={styles.input}
            />

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "Söker..." : "Hitta bokning"}
            </button>
          </form>

          {error && <div className={styles.error}>{error}</div>}

          {booking && (
            <section className={styles.result}>
              <h2 className={styles.resultTitle}>Din bokning</h2>

              <div className={styles.grid}>
                <div className={styles.infoCard}>
                  <span className={styles.label}>Status</span>
                  <strong>
                    {booking.status === "confirmed"
                      ? "Bokning bekräftad"
                      : booking.status}
                  </strong>
                </div>

                <div className={styles.infoCard}>
                  <span className={styles.label}>Bokningsreferens</span>
                  <strong>{booking.bookingReference}</strong>
                </div>

                <div className={styles.infoCard}>
                  <span className={styles.label}>Resa</span>
                  <strong>{getRouteTitle(booking)}</strong>
                  <span className={styles.muted}>{getRoute(booking)}</span>
                </div>

                <div className={styles.infoCard}>
                  <span className={styles.label}>Kontakt</span>
                  <strong>{booking.customer_email}</strong>
                  <span className={styles.muted}>{booking.phone_number}</span>
                </div>
              </div>

              <h3 className={styles.sectionTitle}>Resenärer</h3>

              <div className={styles.passengerList}>
                {booking.passengers?.map((passenger, index) => (
                  <div key={index} className={styles.passenger}>
                    <strong>
                      {passenger.given_name} {passenger.family_name}
                    </strong>
                    <span>{passenger.born_on}</span>
                  </div>
                ))}
              </div>

              <div className={styles.paymentBox}>
                <h3>Betalning</h3>

                <p>
                  <strong>Flygbiljett:</strong>{" "}
                  {formatCurrencyFromMinor(booking.flight_total_sek_minor)}
                </p>

                <p>
                  <strong>Skatter och avgifter:</strong>{" "}
                  {formatCurrencyFromMinor(booking.service_fee_total_sek_minor)}
                </p>

                {Number(booking.seat_total_sek_minor || 0) > 0 && (
                  <p>
                    <strong>Sittplatser:</strong>{" "}
                    {formatCurrencyFromMinor(booking.seat_total_sek_minor)}
                  </p>
                )}

                {Number(booking.baggage_total_sek_minor || 0) > 0 && (
                  <p>
                    <strong>Incheckat bagage:</strong>{" "}
                    {formatCurrencyFromMinor(booking.baggage_total_sek_minor)}
                  </p>
                )}

                <p className={styles.total}>
                  <strong>Totalt:</strong>{" "}
                  {formatCurrencyFromMinor(booking.amount)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => downloadBookingPdf(booking.bookingReference)}
                className={styles.pdfButton}
              >
                Ladda ner bekräftelse PDF
              </button>
            </section>
          )}
        </section>
      </main>
    </>
  );
}