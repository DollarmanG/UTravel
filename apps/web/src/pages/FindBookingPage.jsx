import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Headphones,
  Mail,
  Plane,
  ShieldCheck,
  Ticket,
  User,
  Users,
} from "lucide-react";
import { findBooking } from "../api/flights";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import styles from "../styles/FindBookingPage.module.css";

function formatDateOnly(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("sv-SE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatMoneyFromMinor(amountMinor, currency = "SEK") {
  if (amountMinor == null) return "-";

  const amount = Number(amountMinor) / 100;

  try {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: String(currency || "SEK").toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function getBookingReference(booking) {
  return (
    booking?.bookingReference ||
    booking?.booking_reference ||
    booking?.reference ||
    "-"
  );
}

function getCustomerEmail(booking) {
  return booking?.customer_email || booking?.customerEmail || "-";
}

function getPassengers(booking) {
  const passengers = Array.isArray(booking?.passengers)
    ? booking.passengers
    : [];

  if (passengers.length === 0) {
    return [
      {
        id: "fallback-passenger",
        name: "Resenär",
        type: "Resenär",
      },
    ];
  }

  return passengers.map((passenger, index) => {
    const first = passenger?.given_name || "";
    const last = passenger?.family_name || "";
    const fullName = `${first} ${last}`.trim();

    const type =
      passenger?.type === "infant_without_seat"
        ? "Spädbarn"
        : passenger?.type === "child"
          ? "Barn"
          : "Vuxen";

    return {
      id: passenger?.id || `passenger-${index}`,
      name: fullName || `Resenär ${index + 1}`,
      type,
    };
  });
}

function getTripSummary(booking) {
  const snapshot = booking?.offer_snapshot || {};
  const slices = Array.isArray(snapshot?.slices) ? snapshot.slices : [];

  const outboundSlice = slices[0];
  const returnSlice = slices.length > 1 ? slices[slices.length - 1] : null;

  const outboundSegments = outboundSlice?.segments || [];
  const firstSegment = outboundSegments[0];
  const lastOutboundSegment = outboundSegments[outboundSegments.length - 1];

  const returnSegments = returnSlice?.segments || [];
  const lastReturnSegment = returnSegments[returnSegments.length - 1];

  const originCity =
    firstSegment?.origin?.city_name ||
    firstSegment?.origin?.name ||
    firstSegment?.origin?.iata_code ||
    "Avresa";

  const destinationCity =
    lastOutboundSegment?.destination?.city_name ||
    lastOutboundSegment?.destination?.name ||
    lastOutboundSegment?.destination?.iata_code ||
    "Destination";

  const originCode = firstSegment?.origin?.iata_code || "";
  const destinationCode = lastOutboundSegment?.destination?.iata_code || "";

  const departDate =
    firstSegment?.departing_at?.slice?.(0, 10) ||
    outboundSlice?.departure_date ||
    "";

  const returnDate =
    lastReturnSegment?.departing_at?.slice?.(0, 10) ||
    returnSlice?.departure_date ||
    "";

  const passengers = Array.isArray(booking?.passengers)
    ? booking.passengers.length
    : 1;

  return {
    originCity,
    destinationCity,
    originCode,
    destinationCode,
    departDate,
    returnDate,
    passengers,
  };
}

export default function FindBookingPage() {
  const [bookingReference, setBookingReference] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [foundBooking, setFoundBooking] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setFoundBooking(null);

    const reference = bookingReference.trim();
    const customerIdentifier = identifier.trim();

    if (!reference) {
      setError("Ange din bokningsreferens.");
      return;
    }

    if (!customerIdentifier) {
      setError("Ange efternamn eller e-postadress.");
      return;
    }

    try {
      setLoading(true);

      const data = await findBooking({
        bookingReference: reference,
        booking_reference: reference,
        reference,

        identifier: customerIdentifier,
        lastNameOrEmail: customerIdentifier,
        lastnameOrEmail: customerIdentifier,

        lastName: customerIdentifier,
        lastname: customerIdentifier,
        familyName: customerIdentifier,
        family_name: customerIdentifier,

        email: customerIdentifier,
        customerEmail: customerIdentifier,
        customer_email: customerIdentifier,
      });

      const booking = data?.booking || data;

      if (!booking) {
        setError("Vi kunde inte hitta någon bokning med dessa uppgifter.");
        return;
      }

      setFoundBooking(booking);
    } catch (err) {
      const message = String(err?.message || "");

      if (message.includes("Failed to fetch")) {
        setError(
          "Kunde inte ansluta till API:t. Kontrollera att backend-servern är igång."
        );
        return;
      }

      if (message.includes("krävs")) {
        setError(
          "Bokningsreferens och efternamn eller e-post krävs. Kontrollera uppgifterna och försök igen."
        );
        return;
      }

      setError(
        err.message || "Vi kunde inte hitta någon bokning med dessa uppgifter."
      );
    } finally {
      setLoading(false);
    }
  }

  const trip = foundBooking ? getTripSummary(foundBooking) : null;
  const passengers = foundBooking ? getPassengers(foundBooking) : [];
  return (
    <div className="pageShell">
      <SiteHeader />

      <main className={styles.page}>
        <section className={styles.lookupSection}>
          <div className={styles.backgroundGlow} />

          <div className={styles.lookupCard}>
            <div className={styles.lookupVisual}>
              <div className={styles.visualOverlay} />

              <div className={styles.visualContent}>
                <span className={styles.badge}>
                  <Plane size={17} />
                  Hitta bokning
                </span>

                <h1>Sök fram din resa</h1>

                <p>
                  Ange din bokningsreferens och ditt efternamn
                  <br />
                  eller din e-postadress.
                </p>

                <form className={styles.form} onSubmit={handleSubmit}>
                  <label className={styles.inputWrap}>
                    <Ticket size={22} />
                    <input
                      value={bookingReference}
                      onChange={(event) => {
                        setBookingReference(event.target.value);
                        setError("");
                      }}
                      placeholder="Bokningsreferens, t.ex. UT409597"
                      autoComplete="off"
                    />
                  </label>

                  <label className={styles.inputWrap}>
                    <User size={22} />
                    <input
                      value={identifier}
                      onChange={(event) => {
                        setIdentifier(event.target.value);
                        setError("");
                      }}
                      placeholder="Efternamn eller e-post"
                      autoComplete="email"
                    />
                  </label>

                  {error && <div className={styles.errorBox}>{error}</div>}

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    <span>{loading ? "Söker bokning..." : "Hitta bokning"}</span>
                    <ArrowRight size={28} />
                  </button>
                </form>

                <div className={styles.secureLine}>
                  <span />
                  <ShieldCheck size={18} />
                  <p>Dina uppgifter hanteras säkert</p>
                  <span />
                </div>
              </div>
            </div>
          </div>

          {foundBooking && (
            <section className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <div>
                  <span className={styles.resultBadge}>Bokning hittad</span>
                  <h2>Din resa</h2>
                  <p>
                    Här är informationen kopplad till din bokningsreferens.
                  </p>
                </div>

                <div className={styles.referenceBox}>
                  <span>Bokningsreferens</span>
                  <strong>{getBookingReference(foundBooking)}</strong>
                </div>
              </div>

              <div className={styles.resultGrid}>
                <article className={styles.resultInfoCard}>
                  <div className={styles.resultIcon}>
                    <Plane size={22} />
                  </div>

                  <div>
                    <span>Resa</span>
                    <strong>
                      {trip.originCity} – {trip.destinationCity}
                    </strong>
                    <p>
                      {trip.originCode || "-"} – {trip.destinationCode || "-"}
                    </p>
                  </div>
                </article>

                <article className={styles.resultInfoCard}>
                  <div className={styles.resultIcon}>
                    <CalendarDays size={22} />
                  </div>

                  <div>
                    <span>Resedatum</span>
                    <strong>
                      {formatDateOnly(trip.departDate)}
                      {trip.returnDate
                        ? ` – ${formatDateOnly(trip.returnDate)}`
                        : ""}
                    </strong>
                    <p>Datum för din bokade flygresa.</p>
                  </div>
                </article>

<article className={`${styles.resultInfoCard} ${styles.passengersResultCard}`}>
  <div className={styles.resultIcon}>
    <Users size={22} />
  </div>

  <div className={styles.passengersResultContent}>
    <span>Resenärer</span>

    <strong>
      {passengers.length}{" "}
      {passengers.length === 1 ? "resenär" : "resenärer"}
    </strong>

                <div className={styles.passengerList}>
                  {passengers.map((passenger, index) => (
                    <div className={styles.passengerItem} key={passenger.id}>
                      <div className={styles.passengerNumber}>
                        {index + 1}
                      </div>

                      <div>
                        <p className={styles.passengerName}>{passenger.name}</p>
                        <p className={styles.passengerType}>{passenger.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>

                <article className={styles.resultInfoCard}>
                  <div className={styles.resultIcon}>
                    <Mail size={22} />
                  </div>

                  <div>
                    <span>E-post</span>
                    <strong>{getCustomerEmail(foundBooking)}</strong>
                    <p>Bekräftelsen skickas till denna e-post.</p>
                  </div>
                </article>
              </div>

              <div className={styles.resultFooter}>
                <div>
                  <span>Totalt belopp</span>
                  <strong>
                    {formatMoneyFromMinor(
                      foundBooking?.amount,
                      foundBooking?.currency
                    )}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>
                    {foundBooking?.status === "confirmed"
                      ? "Bokning bekräftad"
                      : foundBooking?.status || "Bokning mottagen"}
                  </strong>
                </div>
              </div>
            </section>
          )}

          <div className={styles.trustGrid}>
            <article className={styles.trustCard}>
              <div className={styles.trustIcon}>
                <ShieldCheck size={24} />
              </div>

              <div>
                <h2>Tryggt & säkert</h2>
                <p>
                  Dina uppgifter är skyddade
                  <br />
                  med högsta säkerhet.
                </p>
              </div>
            </article>

            <article className={styles.trustCard}>
              <div className={styles.trustIcon}>
                <Headphones size={24} />
              </div>

              <div>
                <h2>Snabb support</h2>
                <p>
                  Vi finns här för att hjälpa dig
                  <br />
                  – när du behöver oss.
                </p>
              </div>
            </article>

            <article className={styles.trustCard}>
              <div className={styles.trustIcon}>
                <BadgeCheck size={24} />
              </div>

              <div>
                <h2>Tillgänglig kundservice</h2>
                <p>
                  Vårt team är redo att hjälpa dig
                  <br />
                  alla dagar i veckan.
                </p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}