import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Check,
  Mail,
  Briefcase,
  CalendarDays,
  Users,
  ShieldCheck,
  Phone,
  Clock3,
  CircleCheck,
  CircleDot,
} from "lucide-react";
import { getBooking, downloadBookingPdf } from "../api/flights";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import styles from "../styles/SuccessPage.module.css";

function formatMoney(amount, currency = "SEK") {
  const value = Number(amount || 0);

  try {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function formatBookingAmount(amountMinor, currency = "sek") {
  if (amountMinor == null) return "-";
  return formatMoney(
    Number(amountMinor) / 100,
    String(currency || "sek").toUpperCase()
  );
}

function formatDateTime(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("sv-SE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

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

function extractTripSummary(booking) {
  const passengers = Array.isArray(booking?.passengers)
    ? booking.passengers
    : [];

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

  const cabin =
    snapshot?.cabin_class_marketing_name ||
    snapshot?.cabin_class ||
    "Ekonomi";

  return {
    originCity,
    destinationCity,
    originCode,
    destinationCode,
    departDate,
    returnDate,
    passengerCount: passengers.length || 1,
    cabin,
  };
}

function getPassengerDisplayName(passenger, index) {
  const first = passenger?.given_name || "";
  const last = passenger?.family_name || "";
  const fullName = `${first} ${last}`.trim();
  return fullName || `Resenär ${index + 1}`;
}

function getStatusLabel(status) {
  if (!status) return "Bokning mottagen";

  const value = String(status).toLowerCase();

  if (value === "confirmed") return "Bokning bekräftad";
  if (value === "payment_received") return "Betalning mottagen";
  if (value === "pending_payment") return "Inväntar betalning";
  if (value === "pending") return "Behandling pågår";
  if (value === "confirmation_failed") return "Manuell kontroll krävs";
  if (value === "expired") return "Bokningen har löpt ut";
  if (value.includes("failed")) return "Något gick fel";

  return status;
}

export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState("");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    async function loadBooking(attempt = 0) {
      if (!sessionId) {
        setError("Vi kunde inte hitta någon bokningsreferens.");
        setLoading(false);
        return;
      }

      try {
        const data = await getBooking(sessionId);

        if (cancelled) return;

        const nextStatus = data?.status || "";
        const nextBooking = data?.booking || null;

        setBookingStatus(nextStatus);
        setBooking(nextBooking);
        setError("");
        setLoading(false);

        const normalizedStatus = String(nextStatus || "").toLowerCase();

        const shouldKeepPolling =
          ["pending_payment", "payment_received", "pending"].includes(
            normalizedStatus
          ) && attempt < 20;

        if (shouldKeepPolling) {
          timeoutId = setTimeout(() => {
            loadBooking(attempt + 1);
          }, 3000);
        }
      } catch (err) {
        if (cancelled) return;

        if (attempt < 5) {
          timeoutId = setTimeout(() => {
            loadBooking(attempt + 1);
          }, 3000);
          return;
        }

        setError(err.message || "Kunde inte hämta bokningen.");
        setLoading(false);
      }
    }

    loadBooking();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionId]);

  const trip = useMemo(() => extractTripSummary(booking || {}), [booking]);

  const passengers = Array.isArray(booking?.passengers)
    ? booking.passengers
    : [];

  const paymentRows = useMemo(() => {
    const rows = [];

    if (booking?.flight_total_sek_minor != null) {
      rows.push({
        label: "Flygbiljett",
        value: formatBookingAmount(
          booking.flight_total_sek_minor,
          booking.currency
        ),
      });
    }

    if (booking?.service_fee_total_sek_minor != null) {
      rows.push({
        label: "Skatter och avgifter",
        value: formatBookingAmount(
          booking.service_fee_total_sek_minor,
          booking.currency
        ),
      });
    }

    if (booking?.seat_total_sek_minor > 0) {
      rows.push({
        label: "Sittplatser",
        value: formatBookingAmount(
          booking.seat_total_sek_minor,
          booking.currency
        ),
      });
    }

    if (booking?.baggage_total_sek_minor > 0) {
      rows.push({
        label: "Incheckat bagage",
        value: formatBookingAmount(
          booking.baggage_total_sek_minor,
          booking.currency
        ),
      });
    }

    return rows;
  }, [booking]);

  if (loading) {
    return (
      <div className="pageShell">
        <SiteHeader />

        <main className={styles.page}>
          <div className={styles.container}>
            <div className={styles.stateCard}>
              <span className={styles.badge}>Hämtar bokning</span>
              <h1 className={styles.stateTitle}>Vi laddar din bokning</h1>
              <p className={styles.stateText}>
                Detta tar bara några sekunder.
              </p>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="pageShell">
        <SiteHeader />

        <main className={styles.page}>
          <div className={styles.container}>
            <div className={styles.stateCard}>
              <span className={styles.badge}>Något gick fel</span>

              <h1 className={styles.stateTitle}>
                Vi kunde inte visa bokningen
              </h1>

              <p className={styles.stateText}>
                {error ||
                  "Försök igen om en stund eller gå tillbaka till startsidan."}
              </p>

              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => navigate("/")}
              >
                Till startsidan
              </button>

              <button
                type="button"
                className={styles.secondaryActionButton}
                onClick={() => navigate("/hitta-bokning")}
              >
                <Briefcase size={18} />
                Hitta min bokning
              </button>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="pageShell">
      <SiteHeader />

      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <div className={styles.heroOverlay}>
              <div className={styles.heroIcon}>
                <Check size={36} />
              </div>

              <h1 className={styles.heroTitle}>
                {bookingStatus === "confirmed"
                  ? "Din bokning är bekräftad"
                  : bookingStatus === "confirmation_failed"
                    ? "Vi kontrollerar din bokning"
                    : "Din bokning behandlas"}
              </h1>

              <p className={styles.heroText}>
                {bookingStatus === "confirmed" ? (
                  <>
                    Tack för att du reser med oss.
                    <br />
                    Din betalning och bokning är bekräftad.
                  </>
                ) : bookingStatus === "confirmation_failed" ? (
                  <>
                    Din betalning är mottagen.
                    <br />
                    Vi behöver kontrollera bokningen manuellt och kontaktar dig
                    vid behov.
                  </>
                ) : (
                  <>
                    Din betalning behandlas.
                    <br />
                    Sidan uppdateras automatiskt när bokningen är bekräftad.
                  </>
                )}
              </p>

              <div className={styles.bookingNumber}>
                Status: {getStatusLabel(bookingStatus)}
              </div>
            </div>
          </section>

          <section className={styles.actionBar}>
            <button
              type="button"
              className={styles.primaryActionButton}
              onClick={() => downloadBookingPdf(booking?.bookingReference)}
            >
              Ladda ner bekräftelse (PDF)
            </button>

            <button type="button" className={styles.secondaryActionButton}>
              <Mail size={18} />
              Skicka till e-post
            </button>

            <button
              type="button"
              className={styles.secondaryActionButton}
              onClick={() => navigate("/hitta-bokning")}
            >
              <Briefcase size={18} />
              Hitta min bokning
            </button>
          </section>

          <section className={styles.gridTop}>
            <article className={styles.tripCard}>
              <h2 className={styles.cardTitle}>Din resa</h2>

              <div className={styles.tripBody}>
                <div className={styles.tripImage} />

                <div className={styles.tripContent}>
                  <span className={styles.tripCountry}>Flygresa</span>

                  <h3 className={styles.tripRoute}>
                    {trip.originCity} &amp; {trip.destinationCity}
                  </h3>

                  <p className={styles.tripMetaLine}>
                    {trip.cabin} • {trip.passengerCount}{" "}
                    {trip.passengerCount === 1 ? "vuxen" : "vuxna"}
                  </p>

                  <div className={styles.tripFacts}>
                    <div className={styles.factItem}>
                      <CalendarDays size={18} />
                      <div>
                        <span className={styles.factLabel}>Resedatum</span>
                        <strong>
                          {formatDateOnly(trip.departDate)}
                          {trip.returnDate
                            ? ` – ${formatDateOnly(trip.returnDate)}`
                            : ""}
                        </strong>
                      </div>
                    </div>

                    <div className={styles.factItem}>
                      <Users size={18} />
                      <div>
                        <span className={styles.factLabel}>Resenärer</span>
                        <strong>
                          {trip.passengerCount}{" "}
                          {trip.passengerCount === 1 ? "vuxen" : "vuxna"}
                        </strong>
                      </div>
                    </div>

                    <div className={styles.factItem}>
                      <CalendarDays size={18} />
                      <div>
                        <span className={styles.factLabel}>Rutt</span>
                        <strong>
                          {trip.originCode || "-"} –{" "}
                          {trip.destinationCode || "-"}
                        </strong>
                      </div>
                    </div>

                    <div className={styles.factItem}>
                      <ShieldCheck size={18} />
                      <div>
                        <span className={styles.factLabel}>Referens</span>
                        <strong>
                          {booking?.bookingReference ||
                            booking?.booking_reference ||
                            "-"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <button type="button" className={styles.textLinkButton}>
                    Visa resedetaljer
                  </button>
                </div>
              </div>
            </article>

            <article className={styles.travelersCard}>
              <h2 className={styles.cardTitle}>Resenärer</h2>

              <div className={styles.travelersList}>
                {passengers.length > 0 ? (
                  passengers.map((passenger, index) => (
                    <div
                      className={styles.travelerRow}
                      key={passenger.id || index}
                    >
                      <div className={styles.travelerAvatar}>
                        <Users size={16} />
                      </div>

                      <div>
                        <strong>
                          {getPassengerDisplayName(passenger, index)}
                        </strong>
                        <span className={styles.travelerSub}>
                          {booking?.customer_email || "-"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.travelerRow}>
                    <div className={styles.travelerAvatar}>
                      <Users size={16} />
                    </div>

                    <div>
                      <strong>Resenär</strong>
                      <span className={styles.travelerSub}>
                        {booking?.customer_email || "-"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.contactHelp}>
                <p>Kontakta oss om något behöver ändras.</p>
                <strong>08-123 45 67</strong>
              </div>
            </article>
          </section>

          <section className={styles.gridBottom}>
            <article className={styles.paymentCard}>
              <h2 className={styles.cardTitle}>Betalning</h2>

              <div className={styles.paymentStatus}>
                <CircleCheck size={18} />

                <div>
                  <strong>
                    {bookingStatus === "confirmed"
                      ? "Betalningen är genomförd"
                      : bookingStatus === "confirmation_failed"
                        ? "Betalningen är mottagen"
                        : "Betalningen behandlas"}
                  </strong>

                  <p>
                    {bookingStatus === "confirmed"
                      ? "Tack! Vi har tagit emot din betalning och bekräftat bokningen."
                      : bookingStatus === "confirmation_failed"
                        ? "Betalningen gick igenom, men flygbokningen behöver kontrolleras manuellt."
                        : "Vi inväntar slutlig bekräftelse på din bokning."}
                  </p>
                </div>
              </div>

              <div className={styles.infoRows}>
                <div className={styles.infoRow}>
                  <span>Betalningsmetod</span>
                  <strong>Kort</strong>
                </div>

                <div className={styles.infoRow}>
                  <span>Betaldatum</span>
                  <strong>
                    {formatDateTime(
                      booking?.confirmed_at || booking?.created_at
                    )}
                  </strong>
                </div>

                {paymentRows.map((row) => (
                  <div className={styles.infoRow} key={row.label}>
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}

                <div className={styles.infoRowTotal}>
                  <span>Totalt belopp</span>
                  <strong>
                    {formatBookingAmount(booking?.amount, booking?.currency)}
                  </strong>
                </div>
              </div>
            </article>

            <article className={styles.nextStepsCard}>
              <h2 className={styles.cardTitle}>Nästa steg</h2>

              <div className={styles.stepsList}>
                <div className={styles.stepItemActive}>
                  <CircleCheck size={18} />

                  <div>
                    <strong>
                      {bookingStatus === "confirmed"
                        ? "Bokning bekräftad"
                        : "Bokning mottagen"}
                    </strong>

                    <p>
                      {bookingStatus === "confirmed"
                        ? "En bekräftelse har skickats till din e-post."
                        : "Vi behandlar din bokning just nu."}
                    </p>
                  </div>
                </div>

                <div className={styles.stepItem}>
                  <CircleDot size={18} />

                  <div>
                    <strong>Vi förbereder din resa</strong>
                    <p>Du får mer information inför avresa.</p>
                  </div>
                </div>

                <div className={styles.stepItem}>
                  <CircleDot size={18} />

                  <div>
                    <strong>Resan börjar snart</strong>
                    <p>Ha en fantastisk resa!</p>
                  </div>
                </div>
              </div>
            </article>

            <article className={styles.helpCard}>
              <h2 className={styles.helpTitle}>Behöver du hjälp?</h2>

              <p className={styles.helpText}>
                Vi finns här om du har frågor eller behöver göra ändringar.
              </p>

              <div className={styles.helpRows}>
                <div className={styles.helpRow}>
                  <Phone size={18} />

                  <div>
                    <strong>08-123 45 67</strong>
                    <span>Mån–Fre 09:00–17:00</span>
                  </div>
                </div>

                <div className={styles.helpRow}>
                  <Mail size={18} />

                  <div>
                    <strong>info@utravel.se</strong>
                    <span>Svar inom 24 timmar</span>
                  </div>
                </div>

                <div className={styles.helpRow}>
                  <Clock3 size={18} />

                  <div>
                    <strong>Snabb support</strong>
                    <span>Vi hjälper dig före, under och efter resan</span>
                  </div>
                </div>
              </div>

              <button type="button" className={styles.helpButton}>
                Kontakta oss
              </button>
            </article>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}