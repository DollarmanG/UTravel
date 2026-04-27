import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Headphones,
  Leaf,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { searchFlights, getPlaceSuggestions } from "../api/flights";
import styles from "../styles/HomePage.module.css";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import AppDatePicker, { parseDateString } from "../components/AppDatePicker";

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

function getPassengerSummary(adults, children) {
  const adultLabel = adults === 1 ? "vuxen" : "vuxna";
  const parts = [`${adults} ${adultLabel}`];

  if (children > 0) {
    parts.push(`${children} barn 0–2 år`);
  }

  return parts.join(" • ");
}

function groupPlacesByCountry(options) {
  return options.reduce((acc, option) => {
    const country = option.countryName || "Övrigt";
    if (!acc[country]) acc[country] = [];
    acc[country].push(option);
    return acc;
  }, {});
}

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

function normalizePlace(place) {
  return {
    id: place.id,
    type: place.type,
    city: place.cityName || place.name || "",
    name: place.name || "",
    code: place.code || "",
    countryName: place.countryName || "",
    label: place.label || "",
  };
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function placeMatchesQuery(place, query) {
  const q = normalizeSearchText(query);
  if (q.length < 2) return false;

  const code = normalizeSearchText(place.code);
  const city = normalizeSearchText(place.city);
  const name = normalizeSearchText(place.name);
  const label = normalizeSearchText(place.label);
  const country = normalizeSearchText(place.countryName);

  if (code === q) return true;
  if (city === q) return true;
  if (name === q) return true;

  if (q.length <= 3) {
    return code.startsWith(q) || city.startsWith(q) || name.startsWith(q);
  }

  return (
    city.includes(q) ||
    name.includes(q) ||
    label.includes(q) ||
    country.includes(q)
  );
}

function sortPlacesByRelevance(places, query) {
  const q = normalizeSearchText(query);

  function score(place) {
    const code = normalizeSearchText(place.code);
    const city = normalizeSearchText(place.city);
    const name = normalizeSearchText(place.name);
    const label = normalizeSearchText(place.label);
    const country = normalizeSearchText(place.countryName);

    let value = 0;

    if (code === q) value += 120;
    if (city === q) value += 110;
    if (name === q) value += 100;

    if (place.type === "city") value += 25;

    if (code.startsWith(q)) value += 20;
    if (city.startsWith(q)) value += 18;
    if (name.startsWith(q)) value += 14;
    if (label.startsWith(q)) value += 10;
    if (country.startsWith(q)) value += 8;

    if (city.includes(q)) value += 6;
    if (name.includes(q)) value += 5;
    if (label.includes(q)) value += 3;

    return value;
  }

  return [...places].sort((a, b) => score(b) - score(a));
}

function getFilteredRelevantPlaces(places, query) {
  return sortPlacesByRelevance(
    places.filter((place) => placeMatchesQuery(place, query)),
    query
  ).slice(0, 8);
}

export default function HomePage() {
  const navigate = useNavigate();

  const originBoxRef = useRef(null);
  const destinationBoxRef = useRef(null);
  const passengerBoxRef = useRef(null);

  const [tripType, setTripType] = useState("roundtrip");

  const [originQuery, setOriginQuery] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [showOriginResults, setShowOriginResults] = useState(false);
  const [activeOriginIndex, setActiveOriginIndex] = useState(-1);

  const [destinationQuery, setDestinationQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [showDestinationResults, setShowDestinationResults] = useState(false);
  const [activeDestinationIndex, setActiveDestinationIndex] = useState(-1);

  const [originOptions, setOriginOptions] = useState([]);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [originSuggestionsLoading, setOriginSuggestionsLoading] =
    useState(false);
  const [destinationSuggestionsLoading, setDestinationSuggestionsLoading] =
    useState(false);

  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isPassengerOpen, setIsPassengerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [featuredLoading, setFeaturedLoading] = useState("");
  const [featuredPrices, setFeaturedPrices] = useState({});

  const passengerSummary = useMemo(
    () => getPassengerSummary(adults, children),
    [adults, children]
  );

  const groupedOrigins = useMemo(
    () => groupPlacesByCountry(originOptions),
    [originOptions]
  );

  const groupedDestinations = useMemo(
    () => groupPlacesByCountry(destinationOptions),
    [destinationOptions]
  );

  const flatOrigins = useMemo(() => originOptions, [originOptions]);
  const flatDestinations = useMemo(
    () => destinationOptions,
    [destinationOptions]
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (originBoxRef.current && !originBoxRef.current.contains(event.target)) {
        setShowOriginResults(false);
        setActiveOriginIndex(-1);
      }

      if (
        destinationBoxRef.current &&
        !destinationBoxRef.current.contains(event.target)
      ) {
        setShowDestinationResults(false);
        setActiveDestinationIndex(-1);
      }

      if (
        passengerBoxRef.current &&
        !passengerBoxRef.current.contains(event.target)
      ) {
        setIsPassengerOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOriginSuggestions() {
      const query = originQuery.trim();

      if (!showOriginResults || query.length < 2) {
        setOriginOptions([]);
        setOriginSuggestionsLoading(false);
        return;
      }

      try {
        setOriginSuggestionsLoading(true);

        const data = await getPlaceSuggestions(query);
        const normalized = (data.places || []).map(normalizePlace);
        const relevant = getFilteredRelevantPlaces(normalized, query);

        if (!cancelled) {
          setOriginOptions(relevant);
        }
      } catch {
        if (!cancelled) {
          setOriginOptions([]);
        }
      } finally {
        if (!cancelled) {
          setOriginSuggestionsLoading(false);
        }
      }
    }

    const timer = setTimeout(loadOriginSuggestions, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [originQuery, showOriginResults]);

  useEffect(() => {
    let cancelled = false;

    async function loadDestinationSuggestions() {
      const query = destinationQuery.trim();

      if (!showDestinationResults || query.length < 2) {
        setDestinationOptions([]);
        setDestinationSuggestionsLoading(false);
        return;
      }

      try {
        setDestinationSuggestionsLoading(true);

        const data = await getPlaceSuggestions(query);
        const normalized = (data.places || []).map(normalizePlace);
        const relevant = getFilteredRelevantPlaces(normalized, query);

        if (!cancelled) {
          setDestinationOptions(relevant);
        }
      } catch {
        if (!cancelled) {
          setDestinationOptions([]);
        }
      } finally {
        if (!cancelled) {
          setDestinationSuggestionsLoading(false);
        }
      }
    }

    const timer = setTimeout(loadDestinationSuggestions, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [destinationQuery, showDestinationResults]);

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
            adults: adults,
          };

          try {
            const data = await searchFlights(form);
            const offers = data?.offers || [];
            const lowestPrice = getLowestOfferPrice(offers);

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

  function handleTripTypeChange(nextTripType) {
    setTripType(nextTripType);
    setError("");

    if (nextTripType === "oneway") {
      setReturnDate("");
    }
  }

  function selectOrigin(option) {
    setSelectedOrigin(option);
    setOriginQuery(option.label);
    setShowOriginResults(false);
    setActiveOriginIndex(-1);
    setError("");
  }

  function selectDestination(option) {
    setSelectedDestination(option);
    setDestinationQuery(option.label);
    setShowDestinationResults(false);
    setActiveDestinationIndex(-1);
    setError("");
  }

  function handleOriginKeyDown(e) {
    if (!showOriginResults || flatOrigins.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveOriginIndex((prev) =>
        prev < flatOrigins.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveOriginIndex((prev) =>
        prev > 0 ? prev - 1 : flatOrigins.length - 1
      );
    }

    if (e.key === "Enter" && activeOriginIndex >= 0) {
      e.preventDefault();
      selectOrigin(flatOrigins[activeOriginIndex]);
    }

    if (e.key === "Escape") {
      setShowOriginResults(false);
      setActiveOriginIndex(-1);
    }
  }

  function handleDestinationKeyDown(e) {
    if (!showDestinationResults || flatDestinations.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveDestinationIndex((prev) =>
        prev < flatDestinations.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveDestinationIndex((prev) =>
        prev > 0 ? prev - 1 : flatDestinations.length - 1
      );
    }

    if (e.key === "Enter" && activeDestinationIndex >= 0) {
      e.preventDefault();
      selectDestination(flatDestinations[activeDestinationIndex]);
    }

    if (e.key === "Escape") {
      setShowDestinationResults(false);
      setActiveDestinationIndex(-1);
    }
  }

  function nextReview() {
    setReviewIndex((prev) => (prev + 1) % REVIEWS.length);
  }

  function previousReview() {
    setReviewIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  }

  async function handleSearch(e) {
    e.preventDefault();
    setError("");

    const origin = selectedOrigin?.code;
    const destinationCode = selectedDestination?.code;
    const departureDate = departDate;
    const returnDateValue = tripType === "oneway" ? "" : returnDate;

    if (!origin) {
      setError("Välj en avreseflygplats eller stad från förslagen.");
      return;
    }

    if (!destinationCode) {
      setError("Välj en destination från förslagen.");
      return;
    }

    if (!departureDate) {
      setError("Välj ett avresedatum.");
      return;
    }

    if (tripType === "roundtrip" && !returnDateValue) {
      setError("Välj ett hemresedatum för tur och retur.");
      return;
    }

    if (tripType === "roundtrip" && returnDateValue < departureDate) {
      setError("Hemresedatum kan inte vara tidigare än avresedatum.");
      return;
    }

    setLoading(true);

    const form = {
      origin,
      destination: destinationCode,
      departure_date: departureDate,
      return_date: returnDateValue,
      adults,
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
      setError(err.message || "Något gick fel vid sökning av flyg.");
    } finally {
      setLoading(false);
    }
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

  function renderPlaceOption(option, activeIndex, selectedItem, onSelect, flatList) {
    const absoluteIndex = flatList.findIndex((item) => item.id === option.id);

    return (
      <button
        key={option.id}
        type="button"
        className={`${styles.destinationOption} ${
          activeIndex === absoluteIndex ? styles.destinationOptionActive : ""
        } ${
          selectedItem?.id === option.id ? styles.destinationOptionSelected : ""
        }`}
        onClick={() => onSelect(option)}
      >
        <span className={styles.destinationOptionMain}>
          <span>{option.city || option.name}</span>
          <span className={styles.destinationCode}>{option.code}</span>
        </span>
        <span className={styles.destinationOptionSub}>
          {option.type === "city" ? "Stad" : "Flygplats"} · {option.label}
        </span>
      </button>
    );
  }

  const currentReview = REVIEWS[reviewIndex];

  return (
    <div className="pageShell">
      <SiteHeader />

      <main className={styles.page}>
        <section className={styles.heroWrap}>
          <div className={styles.hero}>
            <div className={styles.heroOverlay} />

            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Din nästa resa börjar här.</h1>

              <p className={styles.heroSubtitle}>
                Upptäck Nordens mest magiska platser.
                <br />
                Naturen. Kulturen. Lugnet.
              </p>
            </div>

            <div className={styles.searchPanel}>
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <div className={styles.tripTypeRow}>
                  <button
                    type="button"
                    onClick={() => handleTripTypeChange("roundtrip")}
                    className={`${styles.tripTypeButton} ${
                      tripType === "roundtrip" ? styles.tripTypeButtonActive : ""
                    }`}
                  >
                    Tur & retur
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTripTypeChange("oneway")}
                    className={`${styles.tripTypeButton} ${
                      tripType === "oneway" ? styles.tripTypeButtonActive : ""
                    }`}
                  >
                    Enkelresa
                  </button>
                </div>

                <div
                  className={`${styles.searchRow} ${
                    tripType === "roundtrip"
                      ? styles.searchRowRoundtrip
                      : styles.searchRowOneway
                  }`}
                >
                  <div className={styles.originWrap} ref={originBoxRef}>
                    <div className={styles.heroField}>
                      <div className={styles.heroFieldIcon}>
                        <MapPin size={18} />
                      </div>

                      <div className={styles.heroFieldBody}>
                        <span className={styles.heroFieldLabel}>Från</span>
                        <input
                          type="text"
                          value={originQuery}
                          onChange={(e) => {
                            setOriginQuery(e.target.value);
                            setSelectedOrigin(null);
                            setShowOriginResults(true);
                            setActiveOriginIndex(-1);
                            setError("");
                          }}
                          onFocus={() => setShowOriginResults(true)}
                          onKeyDown={handleOriginKeyDown}
                          placeholder="Sök land, stad eller flygplats"
                          className={styles.heroInput}
                        />
                      </div>
                    </div>

                    {showOriginResults && originQuery.trim().length >= 2 && (
                      <div className={styles.originPopover}>
                        {Object.entries(groupedOrigins).length > 0 ? (
                          Object.entries(groupedOrigins).map(
                            ([country, airports]) => (
                              <div
                                key={country}
                                className={styles.destinationGroup}
                              >
                                <div className={styles.destinationGroupTitle}>
                                  {country}
                                </div>

                                {airports.map((option) =>
                                  renderPlaceOption(
                                    option,
                                    activeOriginIndex,
                                    selectedOrigin,
                                    selectOrigin,
                                    flatOrigins
                                  )
                                )}
                              </div>
                            )
                          )
                        ) : (
                          <div className={styles.destinationEmpty}>
                            {originSuggestionsLoading
                              ? "Söker platser..."
                              : "Inga relevanta avreseplatser hittades."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.heroDivider} />

                  <div
                    className={styles.destinationWrap}
                    ref={destinationBoxRef}
                  >
                    <div className={styles.heroField}>
                      <div className={styles.heroFieldIcon}>
                        <MapPin size={18} />
                      </div>

                      <div className={styles.heroFieldBody}>
                        <span className={styles.heroFieldLabel}>Till</span>
                        <input
                          type="text"
                          value={destinationQuery}
                          onChange={(e) => {
                            setDestinationQuery(e.target.value);
                            setSelectedDestination(null);
                            setShowDestinationResults(true);
                            setActiveDestinationIndex(-1);
                            setError("");
                          }}
                          onFocus={() => setShowDestinationResults(true)}
                          onKeyDown={handleDestinationKeyDown}
                          placeholder="Sök land, stad eller flygplats"
                          className={styles.heroInput}
                        />
                      </div>
                    </div>

                    {showDestinationResults &&
                      destinationQuery.trim().length >= 2 && (
                        <div className={styles.destinationPopover}>
                          {Object.entries(groupedDestinations).length > 0 ? (
                            Object.entries(groupedDestinations).map(
                              ([country, airports]) => (
                                <div
                                  key={country}
                                  className={styles.destinationGroup}
                                >
                                  <div className={styles.destinationGroupTitle}>
                                    {country}
                                  </div>

                                  {airports.map((option) =>
                                    renderPlaceOption(
                                      option,
                                      activeDestinationIndex,
                                      selectedDestination,
                                      selectDestination,
                                      flatDestinations
                                    )
                                  )}
                                </div>
                              )
                            )
                          ) : (
                            <div className={styles.destinationEmpty}>
                              {destinationSuggestionsLoading
                                ? "Söker platser..."
                                : "Inga relevanta destinationer hittades."}
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  <div className={styles.heroDivider} />

                  <div className={styles.heroField}>
                    <div className={styles.heroFieldIcon}>
                      <Calendar size={18} />
                    </div>

                    <div className={styles.heroFieldBody}>
                      <span className={styles.heroFieldLabel}>Avresa</span>
                      <AppDatePicker
                        value={departDate}
                        onChange={(value) => {
                          setDepartDate(value);
                          setError("");

                          if (returnDate && value && returnDate < value) {
                            setReturnDate("");
                          }
                        }}
                        placeholder="Välj avresedatum"
                        minDate={new Date()}
                        className={styles.heroInput}
                      />
                    </div>
                  </div>

                  {tripType === "roundtrip" && (
                    <>
                      <div className={styles.heroDivider} />

                      <div className={styles.heroField}>
                        <div className={styles.heroFieldIcon}>
                          <Calendar size={18} />
                        </div>

                        <div className={styles.heroFieldBody}>
                          <span className={styles.heroFieldLabel}>
                            Hemresa
                          </span>
                          <AppDatePicker
                            value={returnDate}
                            onChange={(value) => {
                              setReturnDate(value);
                              setError("");
                            }}
                            placeholder="Välj hemresedatum"
                            minDate={parseDateString(departDate) || new Date()}
                            className={styles.heroInput}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className={styles.heroDivider} />

                  <div
                    className={styles.passengerFieldWrap}
                    ref={passengerBoxRef}
                  >
                    <button
                      type="button"
                      className={styles.passengerButton}
                      onClick={() => setIsPassengerOpen((prev) => !prev)}
                    >
                      <div className={styles.heroFieldIcon}>
                        <Users size={18} />
                      </div>

                      <div className={styles.heroFieldBody}>
                        <span className={styles.heroFieldLabel}>
                          Resenärer
                        </span>
                        <span className={styles.passengerSummary}>
                          {passengerSummary}
                        </span>
                      </div>
                    </button>

                    {isPassengerOpen && (
                      <div className={styles.passengerPopover}>
                        <div className={styles.passengerRow}>
                          <div>
                            <div className={styles.popoverTitle}>Vuxna</div>
                          </div>

                          <select
                            value={adults}
                            onChange={(e) => setAdults(Number(e.target.value))}
                            className={styles.popoverSelect}
                          >
                            {Array.from(
                              { length: 15 },
                              (_, index) => index + 1
                            ).map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={styles.passengerRow}>
                          <div>
                            <div className={styles.popoverTitle}>Barn</div>
                            <div className={styles.popoverText}>
                              Endast 0–2 år
                            </div>
                          </div>

                          <select
                            value={children}
                            onChange={(e) =>
                              setChildren(Number(e.target.value))
                            }
                            className={styles.popoverSelect}
                          >
                            {Array.from({ length: 5 }, (_, index) => index).map(
                              (value) => (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <button
                          type="button"
                          className={styles.passengerDoneButton}
                          onClick={() => setIsPassengerOpen(false)}
                        >
                          Klar
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.heroSearchButton}
                  >
                    <Search size={16} />
                    {loading ? "Söker..." : "Sök resa"}
                  </button>
                </div>

                {error && <div className={styles.errorBox}>{error}</div>}
              </form>
            </div>
          </div>
        </section>

        <section className={styles.featuredSection}>
          <div className={styles.sectionInner}>
            <h2 className={styles.sectionTitle}>Utvalda resor</h2>

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
                    aria-label={`Visa resor för ${trip.title}`}
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

              <div
                className={`${styles.trustItem} ${styles.trustItemSpacious}`}
              >
                <Headphones size={22} strokeWidth={1.8} />
                <div>
                  <h3 className={styles.trustTitle}>Personlig service</h3>
                  <p className={styles.trustText}>
                    Vi finns här före, under och efter din resa.
                  </p>
                </div>
              </div>

              <div className={styles.trustDivider} />

              <div
                className={`${styles.trustItem} ${styles.trustItemSpacious}`}
              >
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
                      aria-label={`Visa recension ${index + 1}`}
                    />
                  ))}
                </div>

                <div className={styles.reviewArrows}>
                  <button
                    type="button"
                    className={styles.reviewArrowButton}
                    onClick={previousReview}
                    aria-label="Föregående recension"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    className={styles.reviewArrowButton}
                    onClick={nextReview}
                    aria-label="Nästa recension"
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