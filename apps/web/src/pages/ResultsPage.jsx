import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OfferCard from "../components/OfferCard";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import PageHero from "../components/PageHero";
import styles from "../styles/ResultsPage.module.css";

function getPriceValue(offer) {
  if (offer.display_amount_sek != null) return offer.display_amount_sek;
  return Number(offer.total_amount || 0);
}

function getDurationValue(offer) {
  const duration = offer.slices?.[0]?.duration;
  if (!duration) return Number.MAX_SAFE_INTEGER;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return Number.MAX_SAFE_INTEGER;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);

  return hours * 60 + minutes;
}

function formatTravelMeta(search) {
  if (!search) return "";

  const parts = [];

  if (search.origin && search.destination) {
    parts.push(`${search.origin} → ${search.destination}`);
  }

  if (search.departure_date) {
    parts.push(`Avresa ${search.departure_date}`);
  }

  if (search.return_date) {
    parts.push(`Retur ${search.return_date}`);
  }

  if (search.adults) {
    parts.push(`${search.adults} vuxen${search.adults > 1 ? "a" : ""}`);
  }

  return parts.join(" · ");
}

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const offers = state?.offers || [];
  const search = state?.search;
  const [sortBy, setSortBy] = useState("cheapest");

  function handleSelectOffer(offer) {
    navigate("/passengers", {
      state: {
        offer,
        search,
      },
    });
  }

  const sortedOffers = useMemo(() => {
    const copied = [...offers];

    if (sortBy === "cheapest") {
      copied.sort((a, b) => getPriceValue(a) - getPriceValue(b));
    }

    if (sortBy === "fastest") {
      copied.sort((a, b) => getDurationValue(a) - getDurationValue(b));
    }

    return copied;
  }, [offers, sortBy]);

  if (!search) {
    return (
      <div className="pageShell">
        <SiteHeader />

        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.stateCard}>
              <span className={styles.badge}>Ingen sökning hittades</span>
              <h1 className={styles.stateTitle}>
                Vi kunde inte visa några resultat
              </h1>
              <p className={styles.stateText}>
                Det verkar som att sidan öppnades utan en aktiv sökning. Gå
                tillbaka till startsidan och sök på nytt.
              </p>
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

  return (
    <div className="pageShell">
      <SiteHeader />

      <PageHero
        title="Sökresultat"
        subtitle={`${sortedOffers.length} resa${
          sortedOffers.length !== 1 ? "or" : ""
        } hittades`}
        compact
      >
        <div className={styles.heroSearchCard}>
          <div className={styles.heroSearchMeta}>{formatTravelMeta(search)}</div>
          <button
            className={styles.heroSearchButton}
            onClick={() => navigate("/")}
          >
            Ändra sökning
          </button>
        </div>
      </PageHero>

      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.toolbar}>
            <div className={styles.resultCount}>
              {sortedOffers.length} resa{sortedOffers.length !== 1 ? "or" : ""} hittades
            </div>

            <div className={styles.sortBox}>
              <label className={styles.sortLabel} htmlFor="sortBy">
                Sortera
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="cheapest">Billigast</option>
                <option value="fastest">Snabbast</option>
              </select>
            </div>
          </div>

          <div className={styles.resultsGrid}>
            {sortedOffers.length === 0 ? (
              <div className={styles.emptyCard}>
                <h2 className={styles.emptyTitle}>Inga resor hittades</h2>
                <p className={styles.emptyText}>
                  Testa att ändra datum, destination eller antal resenärer och
                  sök igen.
                </p>
              </div>
            ) : (
              sortedOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onSelect={handleSelectOffer}
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