import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OfferCard from "../components/OfferCard";
import { searchFlights } from "../api/flights";
import styles from "../styles/OffersPage.module.css";

export default function OffersPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const searchData = location.state;

  useEffect(() => {
    async function loadOffers() {
      if (!searchData?.from || !searchData?.to || !searchData?.departDate) {
        setError("Sökdata saknas. Gör en ny sökning från startsidan.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await searchFlights({
          from: searchData.from,
          to: searchData.to,
          departDate: searchData.departDate,
          returnDate: searchData.returnDate || "",
          passengers: searchData.passengers || 1,
          cabinClass: searchData.cabinClass || "economy",
          tripType: searchData.tripType || "roundtrip",
        });

        const offersArray = Array.isArray(result)
          ? result
          : Array.isArray(result?.offers)
          ? result.offers
          : [];

        setOffers(offersArray);
      } catch (err) {
        setError(err.message || "Kunde inte hämta resor.");
      } finally {
        setLoading(false);
      }
    }

    loadOffers();
  }, [searchData]);

  function handleSelectOffer(offer) {
    navigate("/passengers", {
      state: {
        offer,
      },
    });
  }

  function getSortedOffers(items) {
    if (!Array.isArray(items)) return [];

    return [...items].sort((a, b) => {
      const aPrice = Number(a?.display_amount_sek ?? a?.total_amount ?? 0);
      const bPrice = Number(b?.display_amount_sek ?? b?.total_amount ?? 0);
      return aPrice - bPrice;
    });
  }

  const sortedOffers = getSortedOffers(offers);

  const bestOffer = sortedOffers[0] || null;
  const cheapestOffer = sortedOffers[0] || null;

  const fastestOffer =
    [...offers].sort((a, b) => {
      const aDuration = a?.slices?.reduce((sum, slice) => {
        return sum + durationToMinutes(slice?.duration);
      }, 0);

      const bDuration = b?.slices?.reduce((sum, slice) => {
        return sum + durationToMinutes(slice?.duration);
      }, 0);

      return aDuration - bDuration;
    })[0] || null;

  const highlightedIds = new Set();
  if (bestOffer?.id) highlightedIds.add(bestOffer.id);
  if (cheapestOffer?.id) highlightedIds.add(cheapestOffer.id);
  if (fastestOffer?.id) highlightedIds.add(fastestOffer.id);

  const remainingOffers = sortedOffers.filter(
    (offer) => !highlightedIds.has(offer.id)
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Tillgängliga flyg</h1>

          {searchData ? (
            <p className={styles.subheading}>
              {searchData.from} → {searchData.to} · {searchData.departDate}
              {searchData.returnDate ? ` · retur ${searchData.returnDate}` : ""}
            </p>
          ) : null}
        </div>

        {loading ? <p className={styles.message}>Laddar resor...</p> : null}

        {!loading && error ? (
          <p className={styles.error}>{error}</p>
        ) : null}

        {!loading && !error && offers.length === 0 ? (
          <p className={styles.message}>Inga resor hittades.</p>
        ) : null}

        {!loading && !error && offers.length > 0 ? (
          <div className={styles.list}>
            {bestOffer ? (
              <OfferCard
                offer={bestOffer}
                onSelect={handleSelectOffer}
                variant="best"
              />
            ) : null}

            {cheapestOffer && cheapestOffer.id !== bestOffer?.id ? (
              <OfferCard
                offer={cheapestOffer}
                onSelect={handleSelectOffer}
                variant="cheapest"
              />
            ) : null}

            {fastestOffer &&
            fastestOffer.id !== bestOffer?.id &&
            fastestOffer.id !== cheapestOffer?.id ? (
              <OfferCard
                offer={fastestOffer}
                onSelect={handleSelectOffer}
                variant="fastest"
              />
            ) : null}

            {remainingOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onSelect={handleSelectOffer}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function durationToMinutes(isoDuration) {
  if (!isoDuration) return 999999;

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 999999;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);

  return hours * 60 + minutes;
}