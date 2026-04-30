import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Users, ArrowRight } from "lucide-react";
import OfferCard from "../components/OfferCard";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import PageHero from "../components/PageHero";
import styles from "../styles/ResultsPage.module.css";

function getPriceValue(offer) {
  if (offer?.display_amount_sek != null) {
    return Number(offer.display_amount_sek);
  }

  return Number(offer?.total_amount || 0);
}

function getSliceDurationMinutes(slice) {
  const duration = slice?.duration;
  if (!duration) return Number.MAX_SAFE_INTEGER;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return Number.MAX_SAFE_INTEGER;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);

  return hours * 60 + minutes;
}

function getTotalDurationValue(offer) {
  const slices = Array.isArray(offer?.slices) ? offer.slices : [];

  if (slices.length === 0) return Number.MAX_SAFE_INTEGER;

  return slices.reduce((sum, slice) => {
    return sum + getSliceDurationMinutes(slice);
  }, 0);
}

function getScoreValue(offer) {
  const price = getPriceValue(offer);
  const duration = getTotalDurationValue(offer);

  return price + duration * 3;
}

function formatDisplayDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPluralTravelText(count) {
  return count === 1 ? "resa" : "resor";
}

function isValidDate(value) {
  if (!value) return false;

  const time = new Date(value).getTime();
  return Number.isFinite(time);
}

function hasValidSegments(offer) {
  const slices = Array.isArray(offer?.slices) ? offer.slices : [];

  if (slices.length === 0) return false;

  return slices.every((slice) => {
    const segments = Array.isArray(slice?.segments) ? slice.segments : [];

    if (segments.length === 0) return false;

    return segments.every((segment) => {
      if (!segment?.origin?.iata_code) return false;
      if (!segment?.destination?.iata_code) return false;
      if (!isValidDate(segment?.departing_at)) return false;
      if (!isValidDate(segment?.arriving_at)) return false;

      const departureTime = new Date(segment.departing_at).getTime();
      const arrivalTime = new Date(segment.arriving_at).getTime();

      return arrivalTime > departureTime;
    });
  });
}

function isDuffelTestOffer(offer) {
  const ownerName = String(offer?.owner?.name || "").toLowerCase();
  const ownerIata = String(offer?.owner?.iata_code || "").toUpperCase();

  return ownerName.includes("duffel") || ownerIata === "ZZ";
}

function isValidOfferForResults(offer) {
  if (!offer?.id) return false;
  if (isDuffelTestOffer(offer)) return false;
  if (!hasValidSegments(offer)) return false;

  const price = getPriceValue(offer);
  if (!Number.isFinite(price) || price <= 0) return false;

  return true;
}

function getUniqueValidOffers(rawOffers) {
  const offers = Array.isArray(rawOffers) ? rawOffers : [];
  const seen = new Set();
  const result = [];

  for (const offer of offers) {
    if (!isValidOfferForResults(offer)) continue;

    if (seen.has(offer.id)) continue;

    seen.add(offer.id);
    result.push(offer);
  }

  return result;
}

function getPassengerLabel(adults, infants) {
  const parts = [];

  parts.push(`${adults} ${adults === 1 ? "vuxen" : "vuxna"}`);

  if (infants > 0) {
    parts.push(`${infants} barn 0–2 år`);
  }

  return parts.join(", ");
}

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const rawOffers = state?.offers || [];
  const search = state?.search || null;
  const meta = state?.meta || state?.searchMeta || null;

  const adults = Number(search?.adults || state?.passengers?.adults || 1);
  const infants = Number(search?.infants || state?.passengers?.infants || 0);
  const passengerLabel = getPassengerLabel(adults, infants);

  const offers = useMemo(() => {
    return getUniqueValidOffers(rawOffers);
  }, [rawOffers]);

  const [sortBy, setSortBy] = useState("best");

  const sortedOffers = useMemo(() => {
    const copied = [...offers];

    if (sortBy === "best") {
      copied.sort((a, b) => getScoreValue(a) - getScoreValue(b));
    }

    if (sortBy === "cheapest") {
      copied.sort((a, b) => getPriceValue(a) - getPriceValue(b));
    }

    if (sortBy === "fastest") {
      copied.sort((a, b) => getTotalDurationValue(a) - getTotalDurationValue(b));
    }

    return copied;
  }, [offers, sortBy]);

  const cheapestOffer = useMemo(() => {
    if (!offers.length) return null;

    return [...offers].sort((a, b) => getPriceValue(a) - getPriceValue(b))[0];
  }, [offers]);

  const fastestOffer = useMemo(() => {
    if (!offers.length) return null;

    return [...offers].sort(
      (a, b) => getTotalDurationValue(a) - getTotalDurationValue(b)
    )[0];
  }, [offers]);

  const bestOffer = useMemo(() => {
    if (!offers.length) return null;

    return [...offers].sort((a, b) => getScoreValue(a) - getScoreValue(b))[0];
  }, [offers]);

  const resultCount = sortedOffers.length;
  const filteredByFrontendCount = Array.isArray(rawOffers)
    ? Math.max(0, rawOffers.length - offers.length)
    : 0;

  const backendFilteredCount = Number(meta?.filtered_count || 0);
  const totalFilteredCount = backendFilteredCount + filteredByFrontendCount;

  function handleSelectOffer(offer) {
    navigate("/passengers", {
      state: {
        offer,
        search: {
          ...search,
          adults,
          infants,
        },
        passengers: {
          adults,
          infants,
        },
        meta: state?.meta || null,
        searchMeta: state?.searchMeta || null,
        searchParams: {
          adults,
          infants,
          from: search?.origin || "",
          to: search?.destination || "",
          departDate: search?.departure_date || "",
          returnDate: search?.return_date || "",
          cabinClass: search?.cabin_class || "Ekonomi",
        },
        bookingSummary: {
          passengersLabel: passengerLabel,
          route: `${search?.origin || ""} - ${search?.destination || ""}`,
        },
      },
    });
  }

  if (!search) {
    return (
      <div className="pageShell">
        <SiteHeader />

        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.stateCard}>
              <span className={styles.stateBadge}>Ingen sökning hittades</span>
              <h1 className={styles.stateTitle}>
                Vi kunde inte visa några resultat
              </h1>
              <p className={styles.stateText}>
                Gå tillbaka till startsidan och gör en ny sökning.
              </p>
              <button
                type="button"
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

  return (
    <div className="pageShell">
      <SiteHeader />

      <PageHero
        title="Sökresultat"
        subtitle={`${resultCount} ${getPluralTravelText(resultCount)} hittades`}
        backgroundImage="/images/results-hero.png"
        compact
      >
        <div className={styles.searchSummaryCard}>
          <div className={styles.searchSummaryMain}>
            <div className={styles.searchSummaryItem}>
              <ArrowRight size={16} />
              <span>
                {search.origin} → {search.destination}
              </span>
            </div>

            <div className={styles.searchSummaryItem}>
              <Calendar size={16} />
              <span>
                {search.return_date
                  ? `${formatDisplayDate(search.departure_date)} – ${formatDisplayDate(
                      search.return_date
                    )}`
                  : `Avresa ${formatDisplayDate(search.departure_date)}`}
              </span>
            </div>

            <div className={styles.searchSummaryItem}>
              <Users size={16} />
              <span>{passengerLabel}</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.changeSearchButton}
            onClick={() => navigate("/")}
          >
            Ändra sökning
          </button>
        </div>
      </PageHero>

      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.topMetaRow}>
            <p className={styles.resultCount}>
              {resultCount} resultat sorterade efter{" "}
              <strong>
                {sortBy === "best"
                  ? "Bäst"
                  : sortBy === "cheapest"
                  ? "Billigast"
                  : "Snabbast"}
              </strong>
            </p>
          </div>

          {totalFilteredCount > 0 ? null : null}

          {resultCount > 0 ? (
            <div className={styles.sortCards}>
              <button
                type="button"
                className={`${styles.sortCard} ${
                  sortBy === "best" ? styles.sortCardActive : ""
                }`}
                onClick={() => setSortBy("best")}
              >
                <span className={styles.sortCardLabel}>Bäst</span>
                <strong className={styles.sortCardPrice}>
                  {bestOffer
                    ? `${Math.round(getPriceValue(bestOffer)).toLocaleString(
                        "sv-SE"
                      )} kr`
                    : "-"}
                </strong>
                <span className={styles.sortCardSub}>
                  Bästa balans mellan pris och restid
                </span>
              </button>

              <button
                type="button"
                className={`${styles.sortCard} ${
                  sortBy === "cheapest" ? styles.sortCardActive : ""
                }`}
                onClick={() => setSortBy("cheapest")}
              >
                <span className={styles.sortCardLabel}>Billigast</span>
                <strong className={styles.sortCardPrice}>
                  {cheapestOffer
                    ? `${Math.round(getPriceValue(cheapestOffer)).toLocaleString(
                        "sv-SE"
                      )} kr`
                    : "-"}
                </strong>
                <span className={styles.sortCardSub}>
                  Lägsta totalpris just nu
                </span>
              </button>

              <button
                type="button"
                className={`${styles.sortCard} ${
                  sortBy === "fastest" ? styles.sortCardActive : ""
                }`}
                onClick={() => setSortBy("fastest")}
              >
                <span className={styles.sortCardLabel}>Snabbast</span>
                <strong className={styles.sortCardPrice}>
                  {fastestOffer
                    ? `${Math.round(getPriceValue(fastestOffer)).toLocaleString(
                        "sv-SE"
                      )} kr`
                    : "-"}
                </strong>
                <span className={styles.sortCardSub}>
                  Kortast total restid
                </span>
              </button>
            </div>
          ) : null}

          <div className={styles.resultsList}>
            {resultCount === 0 ? (
              <div className={styles.emptyCard}>
                <h2 className={styles.emptyTitle}>Inga resor hittades</h2>
                <p className={styles.emptyText}>
                  Vi hittade inga bokningsbara resor för den här sökningen.
                  Testa att ändra datum eller destination och sök igen.
                </p>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => navigate("/")}
                >
                  Gör en ny sökning
                </button>
              </div>
            ) : (
              sortedOffers.map((offer, index) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onSelect={handleSelectOffer}
                  variant={
                    sortBy === "best" && index === 0
                      ? "best"
                      : sortBy === "cheapest" && index === 0
                      ? "cheapest"
                      : sortBy === "fastest" && index === 0
                      ? "fastest"
                      : "default"
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}