import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getBooking } from "../api/flights";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import PageHero from "../components/PageHero";
import styles from "../styles/SuccessPage.module.css";

function formatBookingAmount(amount, currency) {
  if (amount == null || !currency) return "-";

  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(amount) / 100);
}

function getStatusLabel(status) {
  if (status === "pending_payment") return "Bekräftar din bokning...";
  if (status === "confirmed_test_only") return "Bokning bekräftad (testläge)";
  if (status === "confirmed") return "Bokning bekräftad";
  if (status === "order_failed") return "Bokningen kunde inte bekräftas";
  return status || "-";
}

function getStatusBadge(status) {
  if (status === "pending_payment") return "Under behandling";
  if (status === "confirmed_test_only") return "Bekräftad";
  if (status === "confirmed") return "Bekräftad";
  if (status === "order_failed") return "Misslyckades";
  return "Status";
}

function getStatusTone(status) {
  if (status === "order_failed") return "danger";
  if (status === "confirmed" || status === "confirmed_test_only") return "success";
  return "neutral";
}

export default function SuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = useMemo(() => params.get("session_id"), [params]);

  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(
    sessionId ? "" : "Ingen session_id hittades."
  );
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let intervalId;

    async function fetchBooking() {
      try {
        const data = await getBooking(sessionId);

        if (cancelled) return;

        setBooking(data);
        setLoading(false);

        if (
          data.status === "confirmed_test_only" ||
          data.status === "confirmed" ||
          data.status === "order_failed"
        ) {
          clearInterval(intervalId);
        }
      } catch (err) {
        if (cancelled) return;

        setError(err.message || "Kunde inte hämta bokning.");
        setLoading(false);
        clearInterval(intervalId);
      }
    }

    fetchBooking();
    intervalId = setInterval(fetchBooking, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="pageShell">
        <SiteHeader />

        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.stateCard}>
              <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                Hämtar bokning
              </span>
              <h1 className={styles.stateTitle}>
                Vi hämtar din bokningsstatus
              </h1>
              <p className={styles.stateText}>
                Vänta ett ögonblick medan vi kontrollerar den senaste
                informationen.
              </p>
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pageShell">
        <SiteHeader />

        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.stateCard}>
              <span className={`${styles.badge} ${styles.badgeDanger}`}>
                Något gick fel
              </span>
              <h1 className={styles.stateTitle}>
                Vi kunde inte visa bokningen
              </h1>
              <p className={styles.stateText}>{error}</p>
              <button
                className={styles.primaryButton}
                onClick={() => navigate("/")}
              >
                Till startsidan
              </button>
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    );
  }

  const tone = getStatusTone(booking?.status);

  return (
    <div className="pageShell">
      <SiteHeader />

      <PageHero
        title="Din bokning är bekräftad"
        subtitle="Tack för att du reser med oss. Här ser du den senaste informationen om din bokning."
        compact
      >
        <div className={styles.heroBadgeWrap}>
          <span
            className={`${styles.badge} ${
              tone === "success"
                ? styles.badgeSuccess
                : tone === "danger"
                ? styles.badgeDanger
                : styles.badgeNeutral
            }`}
          >
            {getStatusBadge(booking?.status)}
          </span>
        </div>
      </PageHero>

      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.header}>
              <div>
                <h2 className={styles.pageTitle}>Bokningsstatus</h2>
                <p className={styles.pageSubtitle}>
                  Här ser du den senaste informationen om din betalning och
                  bokning.
                </p>
              </div>

              <button
                className={styles.secondaryButton}
                onClick={() => navigate("/")}
              >
                Till startsidan
              </button>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Status</span>
                <strong className={styles.infoValue}>
                  {getStatusLabel(booking?.status)}
                </strong>
              </div>

              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>E-post</span>
                <strong className={styles.infoValue}>
                  {booking?.customer_email || "-"}
                </strong>
              </div>

              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Belopp</span>
                <strong className={styles.infoValue}>
                  {formatBookingAmount(booking?.amount, booking?.currency)}
                </strong>
              </div>

              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Duffel-order</span>
                <strong className={styles.infoValue}>
                  {booking?.duffel_order_id || "-"}
                </strong>
              </div>
            </div>

            <div className={styles.actionRow}>
              <button
                className={styles.primaryButton}
                onClick={() => navigate("/")}
              >
                Boka en ny resa
              </button>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}