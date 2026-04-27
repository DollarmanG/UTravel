import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Headphones,
  Leaf,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { searchFlights } from "../api/flights";
import styles from "../styles/HomePage.module.css";
import SiteFooter from "../components/SiteFooter";
import HomeSearchHero from "../components/HomeSearchHero";

const FEATURED_TRIPS = [
  {
    tag: "Norge",
    title: "Lofoten – Natur och fjordar",
    meta: "Direktflyg • 7 dagar",
    image: "/images/home-lofoten.png",
    origin: "ARN",
    destination: "TOS",
    departureOffsetDays: 21,
    returnOffsetDays: 28,
    adults: 2,
  },
  {
    tag: "Island",
    title: "Islands höjdpunkter",
    meta: "Flygresa • 6 dagar",
    image: "/images/Island.png",
    origin: "ARN",
    destination: "KEF",
    departureOffsetDays: 30,
    returnOffsetDays: 36,
    adults: 2,
  },
  {
    tag: "Japan",
    title: "Tokyo & Kyoto",
    meta: "Flygresa • 10 dagar",
    image: "/images/Japan.png",
    origin: "ARN",
    destination: "NRT",
    departureOffsetDays: 45,
    returnOffsetDays: 55,
    adults: 2,
  },
];

const REVIEWS = [
  {
    text: "Allt var så välplanerat och smidigt. Vi fick uppleva mer än vi hade kunnat drömma om.",
    name: "Emma S.",
    city: "Göteborg",
  },
  {
    text: "Bokningen gick snabbt och vi fick tydlig hjälp hela vägen. Det kändes tryggt från start till mål.",
    name: "Johan R.",
    city: "Malmö",
  },
  {
    text: "Vi uppskattade den personliga servicen och att allt var så enkelt att förstå. Rekommenderas varmt.",
    name: "Sara K.",
    city: "Stockholm",
  },
];

function formatDateForApi(date) {
  return date.toISOString().split("T")[0];
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateForApi(date);
}

function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  });
}

function formatSek(amount) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function getLowestOfferPrice(offers) {
  if (!Array.isArray(offers) || offers.length === 0) return null;

  return offers.reduce((lowest, offer) => {
    const current = Number(
      offer?.display_amount_sek ?? offer?.total_amount ?? 0
    );

    if (lowest == null) return current;
    return current < lowest ? current : lowest;
  }, null);
}

export default function HomePage() {
  const navigate = useNavigate();

  const [reviewIndex, setReviewIndex] = useState(0);
  const [featuredLoading, setFeaturedLoading] = useState("");
  const [featuredPrices, setFeaturedPrices] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadFeaturedPrices() {
      const entries = await Promise.all(
        FEATURED_TRIPS.map(async (trip) => {
          const form = {
            origin: trip.origin,
            destination: trip.destination,
            departure_date: addDays(trip.departureOffsetDays),
            return_date: addDays(trip.returnOffsetDays),
            adults: trip.adults || 2,
          };

          try {
            const data = await searchFlights(form);
            const lowestPrice = getLowestOfferPrice(data?.offers || []);

            return [
              trip.title,
              lowestPrice != null
                ? `fr. ${formatSek(lowestPrice)}`
                : "Se aktuella priser",
            ];
          } catch {
            return [trip.title, "Se aktuella priser"];
          }
        })
      );

      if (!isCancelled) {
        setFeaturedPrices(Object.fromEntries(entries));
      }
    }

    loadFeaturedPrices();

    return () => {
      isCancelled = true;
    };
  }, []);

  function nextReview() {
    setReviewIndex((prev) => (prev + 1) % REVIEWS.length);
  }

  function previousReview() {
    setReviewIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  }

  async function handleFeaturedTripClick(trip) {
    setError("");
    setFeaturedLoading(trip.title);

    const form = {
      origin: trip.origin,
      destination: trip.destination,
      departure_date: addDays(trip.departureOffsetDays),
      return_date: addDays(trip.returnOffsetDays),
      adults: trip.adults || 2,
    };

    try {
      const data = await searchFlights(form);

      navigate("/results", {
        state: {
          offers: data.offers || [],
          meta: data.meta || null,
          searchMeta: data.meta || null,
          search: form,
        },
      });
    } catch (err) {
      setError(err.message || "Kunde inte hämta resor för det valda paketet.");
    } finally {
      setFeaturedLoading("");
    }
  }

  const currentReview = REVIEWS[reviewIndex];

  return (
    <div className="pageShell">
      <HomeSearchHero />

      <main className={styles.page}>
        <section className={styles.featuredSection}>
          <div className={styles.sectionInner}>
            <h2 className={styles.sectionTitle}>Utvalda resor</h2>

            {error && <div className={styles.errorBox}>{error}</div>}

            <div className={styles.tripGrid}>
              {FEATURED_TRIPS.map((trip) => {
                const departureDate = addDays(trip.departureOffsetDays);
                const returnDate = addDays(trip.returnOffsetDays);

                return (
                  <button
                    key={trip.title}
                    type="button"
                    className={styles.tripCard}
                    onClick={() => handleFeaturedTripClick(trip)}
                    disabled={featuredLoading === trip.title}
                  >
                    <div
                      className={styles.tripImage}
                      style={{ backgroundImage: `url(${trip.image})` }}
                    >
                      <span className={styles.tripTag}>{trip.tag}</span>
                    </div>

                    <div className={styles.tripBody}>
                      <h3 className={styles.tripTitle}>{trip.title}</h3>
                      <p className={styles.tripMeta}>{trip.meta}</p>

                      <div className={styles.tripInfoRow}>
                        <span className={styles.tripRoute}>
                          {trip.origin} → {trip.destination}
                        </span>
                        <span className={styles.tripDates}>
                          {formatShortDate(departureDate)} -{" "}
                          {formatShortDate(returnDate)}
                        </span>
                      </div>

                      <p className={styles.tripPrice}>
                        {featuredLoading === trip.title
                          ? "Söker..."
                          : featuredPrices[trip.title] || "Hämtar pris..."}
                      </p>

                      <p className={styles.tripPriceSub}>
                        per person • baserat på {trip.adults} vuxna
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={styles.trustBar}>
              <div className={styles.trustItem}>
                <ShieldCheck size={22} strokeWidth={1.8} />
                <div>
                  <h3 className={styles.trustTitle}>Tryggt & säkert</h3>
                  <p className={styles.trustText}>
                    Vi följer branschens regler och skyddar dig.
                  </p>
                </div>
              </div>

              <div className={styles.trustDivider} />

              <div className={`${styles.trustItem} ${styles.trustItemSpacious}`}>
                <Headphones size={22} strokeWidth={1.8} />
                <div>
                  <h3 className={styles.trustTitle}>Personlig service</h3>
                  <p className={styles.trustText}>
                    Vi finns här före, under och efter din resa.
                  </p>
                </div>
              </div>

              <div className={styles.trustDivider} />

              <div className={`${styles.trustItem} ${styles.trustItemSpacious}`}>
                <Leaf size={22} strokeWidth={1.8} />
                <div>
                  <h3 className={styles.trustTitle}>Hållbart resande</h3>
                  <p className={styles.trustText}>
                    För en mer hållbar och ansvarsfull turism.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.reviewQuoteMark}>“</div>

              <div className={styles.reviewContent}>
                <p className={styles.reviewText}>{currentReview.text}</p>

                <div className={styles.reviewAuthor}>
                  <div className={styles.reviewAvatar}>
                    {currentReview.name.charAt(0)}
                  </div>

                  <div>
                    <div className={styles.reviewName}>
                      {currentReview.name}
                    </div>
                    <div className={styles.reviewCity}>
                      {currentReview.city}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.reviewControls}>
                <div className={styles.reviewDots}>
                  {REVIEWS.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={
                        index === reviewIndex
                          ? styles.reviewDotActive
                          : styles.reviewDot
                      }
                      onClick={() => setReviewIndex(index)}
                    />
                  ))}
                </div>

                <div className={styles.reviewArrows}>
                  <button
                    type="button"
                    className={styles.reviewArrowButton}
                    onClick={previousReview}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    className={styles.reviewArrowButton}
                    onClick={nextReview}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}