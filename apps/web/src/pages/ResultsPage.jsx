import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Users, ArrowRight } from "lucide-react";
import OfferCard from "../components/OfferCard";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import PageHero from "../components/PageHero";
import styles from "../styles/ResultsPage.module.css";

function getPriceValue(offer) {
  if (offer.display_amount_sek != null) return Number(offer.display_amount_sek);
  return Number(offer.total_amount || 0);
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
  const slices = offer.slices || [];
  if (slices.length === 0) return Number.MAX_SAFE_INTEGER;

  return slices.reduce((sum, slice) => sum + getSliceDurationMinutes(slice), 0);
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

function formatSearchSummary(search) {
  if (!search) return "";

  const parts = [];

  if (search.origin && search.destination) {
    parts.push(`${search.origin} ${String.fromCharCode(8594)} ${search.destination}`);
  }

  if (search.departure_date) {
    const departure = formatDisplayDate(search.departure_date);
    if (search.return_date) {
      parts.push(`${departure} – ${formatDisplayDate(search.return_date)}`);
    } else {
      parts.push(`Avresa ${departure}`);
    }
  }

  if (search.adults) {
    parts.push(`${search.adults} vuxen${search.adults > 1 ? "a" : ""}`);
  }

  return parts.join(" • ");
}

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const offers = state?.offers || [];
  const search = state?.search;

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
    return [...offers].sort((a, b) => getTotalDurationValue(a) - getTotalDurationValue(b))[0];
  }, [offers]);

  const bestOffer = useMemo(() => {
    if (!offers.length) return null;
    return [...offers].sort((a, b) => getScoreValue(a) - getScoreValue(b))[0];
  }, [offers]);

  function handleSelectOffer(offer) {
    navigate("/passengers", {
      state: {
        offer,
        search,
        searchParams: {
          adults: Number(search?.adults || 1),
          from: search?.origin || "",
          to: search?.destination || "",
          departDate: search?.departure_date || "",
          returnDate: search?.return_date || "",
          cabinClass: search?.cabin_class || "Ekonomi",
        },
        bookingSummary: {
          passengersLabel: `${Number(search?.adults || 1)} ${
            Number(search?.adults || 1) > 1 ? "vuxna" : "vuxen"
          }`,
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
              <h1 className={styles.stateTitle}>Vi kunde inte visa några resultat</h1>
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
        subtitle={`${sortedOffers.length} resa${sortedOffers.length !== 1 ? "or" : ""} hittades`}
        backgroundImage="/images/results-hero.png"
        compact
      >
        <div className={styles.searchSummaryCard}>
          <div className={styles.searchSummaryMain}>
            <div className={styles.searchSummaryItem}>
              <ArrowRight size={16} />
              <span>{search.origin} → {search.destination}</span>
            </div>

            <div className={styles.searchSummaryItem}>
              <Calendar size={16} />
              <span>
                {search.return_date
                  ? `${formatDisplayDate(search.departure_date)} – ${formatDisplayDate(search.return_date)}`
                  : `Avresa ${formatDisplayDate(search.departure_date)}`}
              </span>
            </div>

            <div className={styles.searchSummaryItem}>
              <Users size={16} />
              <span>{search.adults} {search.adults > 1 ? "vuxna" : "vuxen"}</span>
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
              {sortedOffers.length} resultat sorterade efter{" "}
              <strong>
                {sortBy === "best"
                  ? "Bäst"
                  : sortBy === "cheapest"
                  ? "Billigast"
                  : "Snabbast"}
              </strong>
            </p>
          </div>

          <div className={styles.sortCards}>
            <button
              type="button"
              className={`${styles.sortCard} ${sortBy === "best" ? styles.sortCardActive : ""}`}
              onClick={() => setSortBy("best")}
            >
              <span className={styles.sortCardLabel}>Bäst</span>
              <strong className={styles.sortCardPrice}>
                {bestOffer ? `${Math.round(getPriceValue(bestOffer)).toLocaleString("sv-SE")} kr` : "-"}
              </strong>
              <span className={styles.sortCardSub}>
                Bästa balans mellan pris och restid
              </span>
            </button>

            <button
              type="button"
              className={`${styles.sortCard} ${sortBy === "cheapest" ? styles.sortCardActive : ""}`}
              onClick={() => setSortBy("cheapest")}
            >
              <span className={styles.sortCardLabel}>Billigast</span>
              <strong className={styles.sortCardPrice}>
                {cheapestOffer ? `${Math.round(getPriceValue(cheapestOffer)).toLocaleString("sv-SE")} kr` : "-"}
              </strong>
              <span className={styles.sortCardSub}>
                Lägsta totalpris just nu
              </span>
            </button>

            <button
              type="button"
              className={`${styles.sortCard} ${sortBy === "fastest" ? styles.sortCardActive : ""}`}
              onClick={() => setSortBy("fastest")}
            >
              <span className={styles.sortCardLabel}>Snabbast</span>
              <strong className={styles.sortCardPrice}>
                {fastestOffer ? `${Math.round(getPriceValue(fastestOffer)).toLocaleString("sv-SE")} kr` : "-"}
              </strong>
              <span className={styles.sortCardSub}>
                Kortast total restid
              </span>
            </button>
          </div>

          <div className={styles.resultsList}>
            {sortedOffers.length === 0 ? (
              <div className={styles.emptyCard}>
                <h2 className={styles.emptyTitle}>Inga resor hittades</h2>
                <p className={styles.emptyText}>
                  Testa att ändra datum eller destination och sök igen.
                </p>
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