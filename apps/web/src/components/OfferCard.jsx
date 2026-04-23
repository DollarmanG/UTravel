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

function getJourneyData(slice) {
  const segments = slice?.segments || [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  return {
    departure: formatDateTime(firstSegment?.departing_at),
    arrival: formatDateTime(lastSegment?.arriving_at),
    originCode: firstSegment?.origin?.iata_code || "-",
    destinationCode: lastSegment?.destination?.iata_code || "-",
    duration: formatDuration(slice?.duration),
    stops: Math.max(segments.length - 1, 0),
  };
}

export default function OfferCard({ offer, onSelect, variant = "default" }) {
  const slices = offer.slices || [];
  const outbound = getJourneyData(slices[0]);
  const inbound = slices[1] ? getJourneyData(slices[1]) : null;

  const airlineName =
    offer.owner?.name ||
    slices?.[0]?.segments?.[0]?.operating_carrier?.name ||
    "Flygbolag";

  const airlineLogo = offer.owner?.logo_symbol_url;
  const totalAmountSek = offer.display_amount_sek ?? offer.total_amount ?? 0;

  const badgeLabel =
    variant === "best"
      ? "Bäst"
      : variant === "cheapest"
      ? "Billigast"
      : variant === "fastest"
      ? "Snabbast"
      : "";

  return (
    <article className={styles.card}>
      {badgeLabel ? <span className={styles.badge}>{badgeLabel}</span> : null}

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <div className={styles.airlineRow}>
            {airlineLogo ? (
              <img
                src={airlineLogo}
                alt={airlineName}
                className={styles.airlineLogo}
              />
            ) : (
              <div className={styles.airlineFallback}>
                {airlineName.charAt(0)}
              </div>
            )}

            <div>
              <div className={styles.airlineName}>{airlineName}</div>
              <div className={styles.airlineMeta}>
                {outbound.stops === 0 ? "Direktflyg" : `${outbound.stops} stopp`}
              </div>
            </div>
          </div>

          <div className={styles.journeys}>
            <div className={styles.journeyRow}>
              <div className={styles.journeyLabel}>Utresa</div>

              <div className={styles.timeBlock}>
                <div className={styles.time}>{outbound.departure.time}</div>
                <div className={styles.code}>{outbound.originCode}</div>
              </div>

              <div className={styles.routeBlock}>
                <div className={styles.routeDuration}>{outbound.duration}</div>
                <div className={styles.routeLine}>
                  <span className={styles.routeDot} />
                  <span className={styles.routeTrack} />
                  <span className={styles.routeDot} />
                </div>
                <div className={styles.routeStops}>
                  {outbound.stops === 0 ? "Direkt" : `${outbound.stops} stopp`}
                </div>
              </div>

              <div className={styles.timeBlock}>
                <div className={styles.time}>{outbound.arrival.time}</div>
                <div className={styles.code}>{outbound.destinationCode}</div>
              </div>
            </div>

            {inbound ? (
              <div className={styles.journeyRow}>
                <div className={styles.journeyLabel}>Hemresa</div>

                <div className={styles.timeBlock}>
                  <div className={styles.time}>{inbound.departure.time}</div>
                  <div className={styles.code}>{inbound.originCode}</div>
                </div>

                <div className={styles.routeBlock}>
                  <div className={styles.routeDuration}>{inbound.duration}</div>
                  <div className={styles.routeLine}>
                    <span className={styles.routeDot} />
                    <span className={styles.routeTrack} />
                    <span className={styles.routeDot} />
                  </div>
                  <div className={styles.routeStops}>
                    {inbound.stops === 0 ? "Direkt" : `${inbound.stops} stopp`}
                  </div>
                </div>

                <div className={styles.timeBlock}>
                  <div className={styles.time}>{inbound.arrival.time}</div>
                  <div className={styles.code}>{inbound.destinationCode}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.priceRow}>
            <span className={styles.priceFrom}>fr.</span>
            <span className={styles.priceValue}>{formatSek(totalAmountSek)}</span>
          </div>
          <div className={styles.priceSub}>per person</div>

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