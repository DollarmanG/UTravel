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
import { searchFlights } from "../api/flights";
import styles from "../styles/HomePage.module.css";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const FEATURED_TRIPS = [
  {
    tag: "Norge",
    title: "Lofoten – Natur och fjordar",
    meta: "Direktflyg • 7 dagar",
    price: "fr. 11 995 kr",
    image: "/images/home-lofoten.png",
  },
  {
    tag: "Island",
    title: "Islands höjdpunkter",
    meta: "Flygresa • 6 dagar",
    price: "fr. 9 495 kr",
    image: "/images/Island.png",
  },
  {
    tag: "Japan",
    title: "Tokyo & Kyoto",
    meta: "Flygresa • 10 dagar",
    price: "fr. 15 995 kr",
    image: "/images/Japan.png",
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

const AIRPORT_OPTIONS = [
  { code: "ARN", city: "Stockholm", country: "Sverige", label: "Stockholm Arlanda (ARN)" },
  { code: "BMA", city: "Stockholm", country: "Sverige", label: "Stockholm Bromma (BMA)" },
  { code: "NYO", city: "Stockholm", country: "Sverige", label: "Stockholm Skavsta (NYO)" },
  { code: "VST", city: "Västerås", country: "Sverige", label: "Stockholm Västerås (VST)" },
  { code: "GOT", city: "Göteborg", country: "Sverige", label: "Göteborg Landvetter (GOT)" },
  { code: "MMX", city: "Malmö", country: "Sverige", label: "Malmö Airport (MMX)" },

  { code: "CPH", city: "Köpenhamn", country: "Danmark", label: "Köpenhamn Kastrup (CPH)" },
  { code: "BLL", city: "Billund", country: "Danmark", label: "Billund Airport (BLL)" },

  { code: "OSL", city: "Oslo", country: "Norge", label: "Oslo Gardermoen (OSL)" },
  { code: "BGO", city: "Bergen", country: "Norge", label: "Bergen Flesland (BGO)" },
  { code: "TOS", city: "Tromsø", country: "Norge", label: "Tromsø Airport (TOS)" },

  { code: "HEL", city: "Helsingfors", country: "Finland", label: "Helsingfors Vanda (HEL)" },
  { code: "KEF", city: "Reykjavik", country: "Island", label: "Keflavik (KEF)" },

  { code: "CDG", city: "Paris", country: "Frankrike", label: "Paris Charles de Gaulle (CDG)" },
  { code: "ORY", city: "Paris", country: "Frankrike", label: "Paris Orly (ORY)" },
  { code: "NCE", city: "Nice", country: "Frankrike", label: "Nice Côte d’Azur (NCE)" },

  { code: "LHR", city: "London", country: "Storbritannien", label: "London Heathrow (LHR)" },
  { code: "LGW", city: "London", country: "Storbritannien", label: "London Gatwick (LGW)" },
  { code: "MAN", city: "Manchester", country: "Storbritannien", label: "Manchester Airport (MAN)" },

  { code: "FRA", city: "Frankfurt", country: "Tyskland", label: "Frankfurt Airport (FRA)" },
  { code: "MUC", city: "München", country: "Tyskland", label: "Munich Airport (MUC)" },
  { code: "BER", city: "Berlin", country: "Tyskland", label: "Berlin Brandenburg (BER)" },

  { code: "AMS", city: "Amsterdam", country: "Nederländerna", label: "Amsterdam Schiphol (AMS)" },

  { code: "MAD", city: "Madrid", country: "Spanien", label: "Madrid Barajas (MAD)" },
  { code: "BCN", city: "Barcelona", country: "Spanien", label: "Barcelona El Prat (BCN)" },
  { code: "AGP", city: "Málaga", country: "Spanien", label: "Málaga Airport (AGP)" },

  { code: "FCO", city: "Rom", country: "Italien", label: "Rome Fiumicino (FCO)" },
  { code: "MXP", city: "Milano", country: "Italien", label: "Milan Malpensa (MXP)" },
  { code: "VCE", city: "Venedig", country: "Italien", label: "Venice Marco Polo (VCE)" },

  { code: "ATH", city: "Aten", country: "Grekland", label: "Athens International (ATH)" },
  { code: "IST", city: "Istanbul", country: "Turkiet", label: "Istanbul Airport (IST)" },

  { code: "JFK", city: "New York", country: "USA", label: "New York JFK (JFK)" },
  { code: "EWR", city: "New York", country: "USA", label: "Newark (EWR)" },
  { code: "LAX", city: "Los Angeles", country: "USA", label: "Los Angeles (LAX)" },
  { code: "MIA", city: "Miami", country: "USA", label: "Miami International (MIA)" },

  { code: "DXB", city: "Dubai", country: "Förenade Arabemiraten", label: "Dubai International (DXB)" },
  { code: "DOH", city: "Doha", country: "Qatar", label: "Doha Hamad (DOH)" },
  { code: "AUH", city: "Abu Dhabi", country: "Förenade Arabemiraten", label: "Abu Dhabi (AUH)" },

  { code: "JED", city: "Jeddah", country: "Saudiarabien", label: "Jeddah (JED)" },
  { code: "RUH", city: "Riyadh", country: "Saudiarabien", label: "Riyadh (RUH)" },

  { code: "NRT", city: "Tokyo", country: "Japan", label: "Tokyo Narita (NRT)" },
  { code: "HND", city: "Tokyo", country: "Japan", label: "Tokyo Haneda (HND)" },
  { code: "KIX", city: "Osaka", country: "Japan", label: "Osaka Kansai (KIX)" },

  { code: "BKK", city: "Bangkok", country: "Thailand", label: "Bangkok Suvarnabhumi (BKK)" },
  { code: "SIN", city: "Singapore", country: "Singapore", label: "Singapore Changi (SIN)" },
];

function getPassengerSummary(adults, children) {
  const parts = [`${adults} vuxen${adults > 1 ? "a" : ""}`];
  if (children > 0) {
    parts.push(`${children} barn 0–2 år`);
  }
  return parts.join(" • ");
}

function groupAirportsByCountry(options) {
  return options.reduce((acc, option) => {
    if (!acc[option.country]) acc[option.country] = [];
    acc[option.country].push(option);
    return acc;
  }, {});
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

  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isPassengerOpen, setIsPassengerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewIndex, setReviewIndex] = useState(0);

  const passengerSummary = useMemo(
    () => getPassengerSummary(adults, children),
    [adults, children]
  );

  const filteredOrigins = useMemo(() => {
    const query = originQuery.trim().toLowerCase();

    if (!query) return AIRPORT_OPTIONS;

    return AIRPORT_OPTIONS.filter((option) => {
      return (
        option.country.toLowerCase().includes(query) ||
        option.city.toLowerCase().includes(query) ||
        option.code.toLowerCase().includes(query) ||
        option.label.toLowerCase().includes(query)
      );
    });
  }, [originQuery]);

  const filteredDestinations = useMemo(() => {
    const query = destinationQuery.trim().toLowerCase();

    if (!query) return AIRPORT_OPTIONS;

    return AIRPORT_OPTIONS.filter((option) => {
      return (
        option.country.toLowerCase().includes(query) ||
        option.city.toLowerCase().includes(query) ||
        option.code.toLowerCase().includes(query) ||
        option.label.toLowerCase().includes(query)
      );
    });
  }, [destinationQuery]);

  const groupedOrigins = useMemo(
    () => groupAirportsByCountry(filteredOrigins),
    [filteredOrigins]
  );

  const groupedDestinations = useMemo(
    () => groupAirportsByCountry(filteredDestinations),
    [filteredDestinations]
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

  function handleTripTypeChange(nextTripType) {
    setTripType(nextTripType);
    setError("");

    if (nextTripType === "oneway") {
      setReturnDate("");
    }
  }

  function selectOrigin(option) {
    setSelectedOrigin(option);
    setOriginQuery(`${option.country} – ${option.label}`);
    setShowOriginResults(false);
    setActiveOriginIndex(-1);
    setError("");
  }

  function selectDestination(option) {
    setSelectedDestination(option);
    setDestinationQuery(`${option.country} – ${option.label}`);
    setShowDestinationResults(false);
    setActiveDestinationIndex(-1);
    setError("");
  }

  function handleOriginKeyDown(e) {
    if (!showOriginResults || filteredOrigins.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveOriginIndex((prev) =>
        prev < filteredOrigins.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveOriginIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOrigins.length - 1
      );
    }

    if (e.key === "Enter" && activeOriginIndex >= 0) {
      e.preventDefault();
      selectOrigin(filteredOrigins[activeOriginIndex]);
    }

    if (e.key === "Escape") {
      setShowOriginResults(false);
      setActiveOriginIndex(-1);
    }
  }

  function handleDestinationKeyDown(e) {
    if (!showDestinationResults || filteredDestinations.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveDestinationIndex((prev) =>
        prev < filteredDestinations.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveDestinationIndex((prev) =>
        prev > 0 ? prev - 1 : filteredDestinations.length - 1
      );
    }

    if (e.key === "Enter" && activeDestinationIndex >= 0) {
      e.preventDefault();
      selectDestination(filteredDestinations[activeDestinationIndex]);
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
      setError("Välj en avreseflygplats från förslagen.");
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
          search: form,
        },
      });
    } catch (err) {
      setError(err.message || "Något gick fel vid sökning av flyg.");
    } finally {
      setLoading(false);
    }
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

                    {showOriginResults && (
                      <div className={styles.originPopover}>
                        {Object.entries(groupedOrigins).length > 0 ? (
                          Object.entries(groupedOrigins).map(([country, airports]) => (
                            <div key={country} className={styles.destinationGroup}>
                              <div className={styles.destinationGroupTitle}>{country}</div>

                              {airports.map((option) => {
                                const absoluteIndex = filteredOrigins.findIndex(
                                  (item) => item.code === option.code
                                );

                                return (
                                  <button
                                    key={option.code}
                                    type="button"
                                    className={`${styles.destinationOption} ${
                                      activeOriginIndex === absoluteIndex
                                        ? styles.destinationOptionActive
                                        : ""
                                    } ${
                                      selectedOrigin?.code === option.code
                                        ? styles.destinationOptionSelected
                                        : ""
                                    }`}
                                    onClick={() => selectOrigin(option)}
                                  >
                                    <span className={styles.destinationOptionMain}>
                                      {option.city}
                                    </span>
                                    <span className={styles.destinationOptionSub}>
                                      {option.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          ))
                        ) : (
                          <div className={styles.destinationEmpty}>
                            Inga avreseflygplatser hittades.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.heroDivider} />

                  <div className={styles.destinationWrap} ref={destinationBoxRef}>
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

                    {showDestinationResults && (
                      <div className={styles.destinationPopover}>
                        {Object.entries(groupedDestinations).length > 0 ? (
                          Object.entries(groupedDestinations).map(([country, airports]) => (
                            <div key={country} className={styles.destinationGroup}>
                              <div className={styles.destinationGroupTitle}>{country}</div>

                              {airports.map((option) => {
                                const absoluteIndex = filteredDestinations.findIndex(
                                  (item) => item.code === option.code
                                );

                                return (
                                  <button
                                    key={option.code}
                                    type="button"
                                    className={`${styles.destinationOption} ${
                                      activeDestinationIndex === absoluteIndex
                                        ? styles.destinationOptionActive
                                        : ""
                                    } ${
                                      selectedDestination?.code === option.code
                                        ? styles.destinationOptionSelected
                                        : ""
                                    }`}
                                    onClick={() => selectDestination(option)}
                                  >
                                    <span className={styles.destinationOptionMain}>
                                      {option.city}
                                    </span>
                                    <span className={styles.destinationOptionSub}>
                                      {option.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          ))
                        ) : (
                          <div className={styles.destinationEmpty}>
                            Inga flygplatser hittades för din sökning.
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
                      <input
                        type="date"
                        value={departDate}
                        onChange={(e) => {
                          setDepartDate(e.target.value);
                          setError("");
                        }}
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
                          <span className={styles.heroFieldLabel}>Hemresa</span>
                          <input
                            type="date"
                            value={returnDate}
                            onChange={(e) => {
                              setReturnDate(e.target.value);
                              setError("");
                            }}
                            className={styles.heroInput}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className={styles.heroDivider} />

                  <div className={styles.passengerFieldWrap} ref={passengerBoxRef}>
                    <button
                      type="button"
                      className={styles.passengerButton}
                      onClick={() => setIsPassengerOpen((prev) => !prev)}
                    >
                      <div className={styles.heroFieldIcon}>
                        <Users size={18} />
                      </div>
                      <div className={styles.heroFieldBody}>
                        <span className={styles.heroFieldLabel}>Resenärer</span>
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
                            {Array.from({ length: 15 }, (_, index) => index + 1).map(
                              (value) => (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div className={styles.passengerRow}>
                          <div>
                            <div className={styles.popoverTitle}>Barn</div>
                            <div className={styles.popoverText}>Endast 0–2 år</div>
                          </div>
                          <select
                            value={children}
                            onChange={(e) => setChildren(Number(e.target.value))}
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
              {FEATURED_TRIPS.map((trip) => (
                <article key={trip.title} className={styles.tripCard}>
                  <div
                    className={styles.tripImage}
                    style={{ backgroundImage: `url(${trip.image})` }}
                  >
                    <span className={styles.tripTag}>{trip.tag}</span>
                  </div>

                  <div className={styles.tripBody}>
                    <h3 className={styles.tripTitle}>{trip.title}</h3>
                    <p className={styles.tripMeta}>{trip.meta}</p>
                    <p className={styles.tripPrice}>{trip.price}</p>
                  </div>
                </article>
              ))}
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
                    <div className={styles.reviewName}>{currentReview.name}</div>
                    <div className={styles.reviewCity}>{currentReview.city}</div>
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