import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Minus,
  Plus,
  Search,
  Users,
  ArrowRight,
  ArrowLeftRight,
  X,
  Menu,
} from "lucide-react";
import { searchFlights, getPlaceSuggestions } from "../api/flights";
import Logo from "./Logo";
import styles from "../styles/HomeSearchHero.module.css";

const HERO_IMAGE = "/images/hero-home.png";

const MONTHS_SV = [
  "januari",
  "februari",
  "mars",
  "april",
  "maj",
  "juni",
  "juli",
  "augusti",
  "september",
  "oktober",
  "november",
  "december",
];

const WEEKDAYS_SV = ["må", "ti", "on", "to", "fr", "lö", "sö"];

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(date) {
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

function sameDay(a, b) {
  return a && b && toDateKey(a) === toDateKey(b);
}

function isBetween(date, start, end) {
  if (!date || !start || !end) return false;
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

function addMonths(date, amount) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function formatDateShort(date) {
  if (!date) return "Välj datum";
  return `${date.getDate()} ${
    MONTHS_SV[date.getMonth()].slice(0, 3)
  }. ${date.getFullYear()}`;
}

function nightsBetween(start, end) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isPastDate(date) {
  if (!date) return false;
  return startOfDay(date).getTime() < startOfDay(new Date()).getTime();
}

function isBeforeCurrentMonth(date) {
  if (!date) return false;

  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const compareMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  compareMonth.setHours(0, 0, 0, 0);

  return compareMonth.getTime() < currentMonth.getTime();
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

  if (code === q || city === q || name === q) return true;

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

function groupPlacesByCountry(options) {
  return options.reduce((acc, option) => {
    const country = option.countryName || "Övrigt";
    if (!acc[country]) acc[country] = [];
    acc[country].push(option);
    return acc;
  }, {});
}

function buildMonthDays(displayDate) {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days = [];

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      currentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      date: new Date(year, month, day),
      currentMonth: true,
    });
  }

  while (days.length % 7 !== 0) {
    const nextDay = days.length - firstWeekday - daysInMonth + 1;
    days.push({
      date: new Date(year, month + 1, nextDay),
      currentMonth: false,
    });
  }

  return days;
}

function CalendarMonth({
  displayDate,
  departureDate,
  returnDate,
  onSelectDate,
}) {
  const days = useMemo(() => buildMonthDays(displayDate), [displayDate]);

  return (
    <div className={styles.calendarMonth}>
      <div className={styles.weekdays}>
        {WEEKDAYS_SV.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={styles.daysGrid}>
        {days.map(({ date, currentMonth }) => {
          const pastDate = isPastDate(date);

          const selected =
            !pastDate &&
            (sameDay(date, departureDate) || sameDay(date, returnDate));

          const inRange =
            !pastDate && isBetween(date, departureDate, returnDate);

          return (
            <button
              type="button"
              key={toDateKey(date)}
              disabled={pastDate}
              className={[
                styles.dayButton,
                !currentMonth ? styles.mutedDay : "",
                inRange ? styles.rangeDay : "",
                selected ? styles.selectedDay : "",
                pastDate ? styles.disabledDay : "",
              ].join(" ")}
              onClick={() => {
                if (!pastDate) {
                  onSelectDate(date);
                }
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DatePicker({
  tripType,
  departureDate,
  returnDate,
  setDepartureDate,
  setReturnDate,
  onClose,
}) {
  const initialMonth =
    departureDate && !isPastDate(departureDate)
      ? departureDate
      : startOfDay(new Date());

  const [visibleMonth, setVisibleMonth] = useState(initialMonth);

  const secondMonth = addMonths(visibleMonth, 1);
  const nights = nightsBetween(departureDate, returnDate);
  const canGoPrev = !isBeforeCurrentMonth(addMonths(visibleMonth, -1));

  function handleSelectDate(date) {
    if (isPastDate(date)) return;

    if (tripType === "oneway") {
      setDepartureDate(date);
      setReturnDate(null);
      onClose();
      return;
    }

    if (!departureDate || returnDate) {
      setDepartureDate(date);
      setReturnDate(null);
      return;
    }

    if (date < departureDate) {
      setDepartureDate(date);
      setReturnDate(null);
      return;
    }

    setReturnDate(date);
    onClose();
  }

  return (
    <div className={styles.datePicker}>
      <div className={styles.mobilePanelHeader}>
        <button type="button" className={styles.iconOnlyButton} onClick={onClose}>
          <ChevronLeft size={22} />
        </button>
        <strong>Utresa – Hemresa</strong>
        <button type="button" className={styles.iconOnlyButton} onClick={onClose}>
          <X size={22} />
        </button>
      </div>

      <div className={styles.calendarTop}>
        <button
          type="button"
          className={styles.calendarArrow}
          disabled={!canGoPrev}
          onClick={() => {
            if (canGoPrev) {
              setVisibleMonth(addMonths(visibleMonth, -1));
            }
          }}
        >
          <ChevronLeft size={22} />
        </button>

        <div className={styles.calendarTitles}>
          <strong>
            {MONTHS_SV[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
          </strong>
          <strong className={styles.desktopOnly}>
            {MONTHS_SV[secondMonth.getMonth()]} {secondMonth.getFullYear()}
          </strong>
        </div>

        <button
          type="button"
          className={styles.calendarArrow}
          onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className={styles.calendarBody}>
        <CalendarMonth
          displayDate={visibleMonth}
          departureDate={departureDate}
          returnDate={returnDate}
          onSelectDate={handleSelectDate}
        />

        <div className={styles.calendarDivider} />

        <div className={styles.desktopOnly}>
          <CalendarMonth
            displayDate={secondMonth}
            departureDate={departureDate}
            returnDate={returnDate}
            onSelectDate={handleSelectDate}
          />
        </div>
      </div>

      <div className={styles.calendarFooter}>
        <div className={styles.dateSummary}>
          {departureDate && (
            <>
              <strong>Utresa</strong> {formatDateShort(departureDate)}
            </>
          )}

          {tripType === "roundtrip" && departureDate && returnDate && (
            <>
              <span>–</span>
              <strong>Hemresa</strong> {formatDateShort(returnDate)}
              <span className={styles.nightsText}>({nights} nätter)</span>
            </>
          )}
        </div>

        <button
          type="button"
          className={styles.clearButton}
          onClick={() => {
            setDepartureDate(null);
            setReturnDate(null);
          }}
        >
          Rensa
        </button>
      </div>

      <button type="button" className={styles.mobileDoneButton} onClick={onClose}>
        Klar
      </button>
    </div>
  );
}

function TravelerPicker({ adults, infants, setAdults, setInfants, onClose }) {
  return (
    <div className={styles.travelerPicker}>
      <div className={styles.mobilePanelHeader}>
        <span />
        <strong>Resenärer</strong>
        <button type="button" className={styles.iconOnlyButton} onClick={onClose}>
          <X size={22} />
        </button>
      </div>

      <div className={styles.travelerRow}>
        <div>
          <strong>Vuxna</strong>
          <span>Från 13 år</span>
        </div>

        <div className={styles.stepper}>
          <button
            type="button"
            onClick={() => setAdults((value) => Math.max(1, value - 1))}
          >
            <Minus size={18} />
          </button>
          <strong>{adults}</strong>
          <button
            type="button"
            className={styles.plusButton}
            onClick={() => setAdults((value) => Math.min(9, value + 1))}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className={styles.travelerRow}>
        <div>
          <strong>Barn</strong>
          <span>Endast 0–2 år</span>
        </div>

        <div className={styles.stepper}>
          <button
            type="button"
            onClick={() => setInfants((value) => Math.max(0, value - 1))}
          >
            <Minus size={18} />
          </button>
          <strong>{infants}</strong>
          <button
            type="button"
            className={styles.plusButton}
            onClick={() => setInfants((value) => Math.min(adults, value + 1))}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <button type="button" className={styles.doneButton} onClick={onClose}>
        Klar
      </button>

      <p className={styles.travelerNote}>
        Spädbarn 0–2 år reser i knä och räknas inte som en egen resenär.
      </p>
    </div>
  );
}

export default function HomeSearchHero() {
  const navigate = useNavigate();

  const originBoxRef = useRef(null);
  const destinationBoxRef = useRef(null);
  const dateBoxRef = useRef(null);
  const travelerBoxRef = useRef(null);

  const [tripType, setTripType] = useState("roundtrip");

  const [originQuery, setOriginQuery] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [originOptions, setOriginOptions] = useState([]);
  const [showOriginResults, setShowOriginResults] = useState(false);
  const [originLoading, setOriginLoading] = useState(false);

  const [destinationQuery, setDestinationQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [showDestinationResults, setShowDestinationResults] = useState(false);
  const [destinationLoading, setDestinationLoading] = useState(false);

  const [departureDate, setDepartureDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);

  const [adults, setAdults] = useState(2);
  const [infants, setInfants] = useState(0);

  const [openPanel, setOpenPanel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const travelerText = `${adults} vuxna, ${infants} barn`;

  const groupedOrigins = useMemo(
    () => groupPlacesByCountry(originOptions),
    [originOptions]
  );

  const groupedDestinations = useMemo(
    () => groupPlacesByCountry(destinationOptions),
    [destinationOptions]
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (originBoxRef.current && !originBoxRef.current.contains(event.target)) {
        setShowOriginResults(false);
      }

      if (
        destinationBoxRef.current &&
        !destinationBoxRef.current.contains(event.target)
      ) {
        setShowDestinationResults(false);
      }

      if (dateBoxRef.current && !dateBoxRef.current.contains(event.target)) {
        if (openPanel === "dates") setOpenPanel(null);
      }

      if (
        travelerBoxRef.current &&
        !travelerBoxRef.current.contains(event.target)
      ) {
        if (openPanel === "travelers") setOpenPanel(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openPanel]);

  useEffect(() => {
    let cancelled = false;

    async function loadOriginSuggestions() {
      const query = originQuery.trim();

      if (!showOriginResults || query.length < 2) {
        setOriginOptions([]);
        setOriginLoading(false);
        return;
      }

      try {
        setOriginLoading(true);
        const data = await getPlaceSuggestions(query);
        const normalized = (data.places || []).map(normalizePlace);
        const relevant = getFilteredRelevantPlaces(normalized, query);

        if (!cancelled) setOriginOptions(relevant);
      } catch {
        if (!cancelled) setOriginOptions([]);
      } finally {
        if (!cancelled) setOriginLoading(false);
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
        setDestinationLoading(false);
        return;
      }

      try {
        setDestinationLoading(true);
        const data = await getPlaceSuggestions(query);
        const normalized = (data.places || []).map(normalizePlace);
        const relevant = getFilteredRelevantPlaces(normalized, query);

        if (!cancelled) setDestinationOptions(relevant);
      } catch {
        if (!cancelled) setDestinationOptions([]);
      } finally {
        if (!cancelled) setDestinationLoading(false);
      }
    }

    const timer = setTimeout(loadDestinationSuggestions, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [destinationQuery, showDestinationResults]);

  function selectOrigin(option) {
    setSelectedOrigin(option);
    setOriginQuery(option.label);
    setShowOriginResults(false);
    setError("");
  }

  function selectDestination(option) {
    setSelectedDestination(option);
    setDestinationQuery(option.label);
    setShowDestinationResults(false);
    setError("");
  }

  function renderPlaceOptions(groupedPlaces, loadingState, selectedItem, onSelect) {
    const groups = Object.entries(groupedPlaces);

    if (loadingState) {
      return <div className={styles.placeEmpty}>Söker platser...</div>;
    }

    if (groups.length === 0) {
      return (
        <div className={styles.placeEmpty}>
          Inga relevanta platser hittades.
        </div>
      );
    }

    return groups.map(([country, places]) => (
      <div key={country} className={styles.placeGroup}>
        <div className={styles.placeGroupTitle}>{country}</div>

        {places.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`${styles.placeOption} ${
              selectedItem?.id === option.id ? styles.placeOptionSelected : ""
            }`}
            onClick={() => onSelect(option)}
          >
            <span className={styles.placeMain}>
              <span>{option.city || option.name}</span>
              <strong>{option.code}</strong>
            </span>
            <span className={styles.placeSub}>
              {option.type === "city" ? "Stad" : "Flygplats"} · {option.label}
            </span>
          </button>
        ))}
      </div>
    ));
  }

  async function handleSearch() {
    setError("");

    const origin = selectedOrigin?.code;
    const destination = selectedDestination?.code;
    const departure_date = toDateKey(departureDate);
    const return_date = tripType === "oneway" ? "" : toDateKey(returnDate);

    if (!origin) {
      setError("Välj en avreseflygplats eller stad från förslagen.");
      return;
    }

    if (!destination) {
      setError("Välj en destination från förslagen.");
      return;
    }

    if (!departure_date) {
      setError("Välj ett avresedatum.");
      return;
    }

    if (departureDate && isPastDate(departureDate)) {
      setError("Utresedatum kan inte vara tidigare än dagens datum.");
      return;
    }

    if (tripType === "roundtrip" && !return_date) {
      setError("Välj ett hemresedatum för tur och retur.");
      return;
    }

    if (tripType === "roundtrip" && returnDate && isPastDate(returnDate)) {
      setError("Hemresedatum kan inte vara tidigare än dagens datum.");
      return;
    }

    if (tripType === "roundtrip" && return_date < departure_date) {
      setError("Hemresedatum kan inte vara tidigare än avresedatum.");
      return;
    }

    setLoading(true);

    const form = {
      origin,
      destination,
      departure_date,
      return_date,
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
      const rawMessage = String(err?.message || "");

      if (rawMessage.includes("departure_date")) {
        setError("Utresedatum kan inte vara tidigare än dagens datum.");
      } else {
        setError(err.message || "Något gick fel vid sökning av flyg.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={styles.hero}
      style={{ "--hero-image": `url(${HERO_IMAGE})` }}
    >
      <header className={styles.navbar}>
        <div className={styles.navbarInner}>
          <Link to="/" className={styles.logoLink} aria-label="UTravel startsida">
            <Logo
              className={styles.headerLogo}
              textClassName={styles.headerLogoText}
              planeClassName={styles.headerLogoPlane}
            />
          </Link>

          <div className={styles.navActions}>
            <Link to="/hitta-bokning" className={styles.findBookingButton}>
              Hitta bokning
            </Link>

            <button type="button" className={styles.mobileMenuButton}>
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.heroContent}>
        <div className={styles.heroText}>
          <h1>Din nästa resa börjar här.</h1>
          <p>
            Upptäck Nordens mest magiska platser.
            <br />
            Naturen. Kulturen. Lugnet.
          </p>
        </div>

        <div className={styles.tripToggle}>
          <button
            type="button"
            className={tripType === "roundtrip" ? styles.activeTrip : ""}
            onClick={() => {
              setTripType("roundtrip");
              setError("");
            }}
          >
            <ArrowLeftRight size={18} />
            Tur & retur
          </button>

          <button
            type="button"
            className={tripType === "oneway" ? styles.activeTrip : ""}
            onClick={() => {
              setTripType("oneway");
              setReturnDate(null);
              setError("");
            }}
          >
            <ArrowRight size={18} />
            Enkelresa
          </button>
        </div>

        <div className={styles.searchArea}>
          <div className={styles.searchBar}>
            <div className={styles.placeFieldWrap} ref={originBoxRef}>
              <label className={styles.searchField}>
                <MapPin size={26} />
                <span>
                  <strong>Från</strong>
                  <input
                    value={originQuery}
                    onChange={(event) => {
                      setOriginQuery(event.target.value);
                      setSelectedOrigin(null);
                      setShowOriginResults(true);
                      setError("");
                    }}
                    onFocus={() => setShowOriginResults(true)}
                    placeholder="Sök land, stad eller flygplats"
                  />
                </span>
                <ChevronDown className={styles.mobileChevron} size={20} />
              </label>

              {showOriginResults && originQuery.trim().length >= 2 && (
                <div className={styles.placePopover}>
                  {renderPlaceOptions(
                    groupedOrigins,
                    originLoading,
                    selectedOrigin,
                    selectOrigin
                  )}
                </div>
              )}
            </div>

            <div className={styles.placeFieldWrap} ref={destinationBoxRef}>
              <label className={styles.searchField}>
                <MapPin size={26} />
                <span>
                  <strong>Till</strong>
                  <input
                    value={destinationQuery}
                    onChange={(event) => {
                      setDestinationQuery(event.target.value);
                      setSelectedDestination(null);
                      setShowDestinationResults(true);
                      setError("");
                    }}
                    onFocus={() => setShowDestinationResults(true)}
                    placeholder="Sök land, stad eller flygplats"
                  />
                </span>
                <ChevronDown className={styles.mobileChevron} size={20} />
              </label>

              {showDestinationResults &&
                destinationQuery.trim().length >= 2 && (
                  <div className={styles.placePopover}>
                    {renderPlaceOptions(
                      groupedDestinations,
                      destinationLoading,
                      selectedDestination,
                      selectDestination
                    )}
                  </div>
                )}
            </div>

            <button
              type="button"
              className={styles.searchField}
              onClick={() =>
                setOpenPanel(openPanel === "dates" ? null : "dates")
              }
            >
              <CalendarDays size={26} />
              <span>
                <strong>Utresa</strong>
                <em>{formatDateShort(departureDate)}</em>
              </span>
              <ChevronDown className={styles.mobileChevron} size={20} />
            </button>

            {tripType === "roundtrip" && (
              <button
                type="button"
                className={styles.searchField}
                onClick={() =>
                  setOpenPanel(openPanel === "dates" ? null : "dates")
                }
              >
                <CalendarDays size={26} />
                <span>
                  <strong>Hemresa</strong>
                  <em>{formatDateShort(returnDate)}</em>
                </span>
                <ChevronDown className={styles.mobileChevron} size={20} />
              </button>
            )}

            <button
              type="button"
              className={styles.searchField}
              onClick={() =>
                setOpenPanel(openPanel === "travelers" ? null : "travelers")
              }
            >
              <Users size={26} />
              <span>
                <strong>Resenärer</strong>
                <em>{travelerText}</em>
              </span>
              <ChevronDown className={styles.mobileChevron} size={20} />
            </button>

            <button
              type="button"
              className={styles.searchButton}
              onClick={handleSearch}
              disabled={loading}
            >
              <Search size={23} />
              {loading ? "Söker..." : "Sök resa"}
            </button>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          {openPanel === "dates" && (
            <div className={styles.dateDropdown} ref={dateBoxRef}>
              <DatePicker
                tripType={tripType}
                departureDate={departureDate}
                returnDate={returnDate}
                setDepartureDate={setDepartureDate}
                setReturnDate={setReturnDate}
                onClose={() => setOpenPanel(null)}
              />
            </div>
          )}

          {openPanel === "travelers" && (
            <div className={styles.travelerDropdown} ref={travelerBoxRef}>
              <TravelerPicker
                adults={adults}
                infants={infants}
                setAdults={setAdults}
                setInfants={setInfants}
                onClose={() => setOpenPanel(null)}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}