import styles from "../styles/OfferCard.module.css";

function formatDateTime(value) {
  if (!value) return { time: "-", date: "-" };

  const date = new Date(value);

  return {
    time: date.toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    date: date.toLocaleDateString("sv-SE"),
  };
}

function formatDuration(isoDuration) {
  if (!isoDuration) return "-";

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;

  const hours = match[1] ? `${match[1]} h` : "";
  const minutes = match[2] ? `${match[2]} min` : "";

  return `${hours} ${minutes}`.trim();
}

function formatSek(amount) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatExpiry(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OfferCard({ offer, onSelect }) {
  const firstSlice = offer.slices?.[0];
  const segments = firstSlice?.segments || [];

  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  const departure = formatDateTime(firstSegment?.departing_at);
  const arrival = formatDateTime(lastSegment?.arriving_at);

  const stops = Math.max(segments.length - 1, 0);
  const duration = formatDuration(firstSlice?.duration);

  const airlineName =
    offer.owner?.name || firstSegment?.operating_carrier?.name || "Flygbolag";

  const airlineLogo = offer.owner?.logo_symbol_url;
  const totalAmountSek = offer.display_amount_sek ?? 0;

  return (
    <article className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.airlineMeta}>
          {airlineLogo ? (
            <img
              src={airlineLogo}
              alt={airlineName}
              className={styles.airlineLogo}
            />
          ) : (
            <div className={styles.airlineLogoFallback}>
              {airlineName.charAt(0)}
            </div>
          )}

          <div className={styles.airlineText}>
            <div className={styles.airlineName}>{airlineName}</div>
            <div className={styles.airlineSubtext}>
              {stops === 0 ? "Direktflyg" : `${stops} stopp`}
            </div>
          </div>
        </div>

        <div className={styles.expiry}>
          <span className={styles.expiryLabel}>Offert giltig till</span>
          <span className={styles.expiryValue}>{formatExpiry(offer.expires_at)}</span>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.routeSection}>
          <div className={styles.timeBlock}>
            <div className={styles.time}>{departure.time}</div>
            <div className={styles.airportCode}>
              {firstSegment?.origin?.iata_code || "-"}
            </div>
            <div className={styles.date}>{departure.date}</div>
          </div>

          <div className={styles.journeyBlock}>
            <div className={styles.duration}>{duration}</div>

            <div className={styles.lineTrack}>
              <span className={styles.lineDot} />
              <span className={styles.line} />
              <span className={styles.lineDot} />
            </div>

            <div className={styles.stops}>
              {stops === 0 ? "Direkt" : `${stops} stopp`}
            </div>
          </div>

          <div className={`${styles.timeBlock} ${styles.timeBlockRight}`}>
            <div className={styles.time}>{arrival.time}</div>
            <div className={styles.airportCode}>
              {lastSegment?.destination?.iata_code || "-"}
            </div>
            <div className={styles.date}>{arrival.date}</div>
          </div>
        </div>

        <div className={styles.priceSection}>
          <div className={styles.priceMeta}>
            <span className={styles.priceLabel}>Totalpris</span>
            <strong className={styles.priceValue}>{formatSek(totalAmountSek)}</strong>
          </div>

          <button
            type="button"
            className={styles.selectButton}
            onClick={() => onSelect(offer)}
          >
            Välj resa
          </button>
        </div>
      </div>
    </article>
  );
}