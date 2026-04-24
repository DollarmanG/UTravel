import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Luggage,
  Mail,
  Phone,
  Shield,
  User,
  Plane,
  Briefcase,
  Armchair,
} from "lucide-react";
import { createCheckout } from "../api/flights";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import BookingSteps from "../components/BookingSteps";
import AppDatePicker from "../components/AppDatePicker";
import styles from "../styles/PassengerPage.module.css";


const EUR_TO_SEK = Number(import.meta.env.VITE_EUR_TO_SEK || 11.5);
const SERVICE_FEE_SEK = Number(import.meta.env.VITE_SERVICE_FEE_SEK || 300);
const SEAT_PRICE_SEK = 149;
const BAG_PRICE_SEK = 299;

function formatMoney(amount, currency = "SEK") {
  const value = Number(amount || 0);

  try {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${Math.round(value)} ${currency}`;
  }
}

function normalizePhoneNumber(value) {
  const raw = String(value || "").replace(/\s+/g, "");

  if (!raw) return "";

  if (raw.startsWith("+")) return raw;
  if (raw.startsWith("00")) return `+${raw.slice(2)}`;
  if (raw.startsWith("0")) return `+46${raw.slice(1)}`;

  return raw;
}

function isValidInternationalPhone(value) {
  return /^\+\d{8,15}$/.test(value);
}

function getAgeFromDate(dateString) {
  if (!dateString) return null;

  const birthDate = new Date(dateString);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

function isFutureDate(dateString) {
  if (!dateString) return false;

  const birthDate = new Date(dateString);
  if (Number.isNaN(birthDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  birthDate.setHours(0, 0, 0, 0);

  return birthDate > today;
}

function getDisplayPricing(offer, passengerCount) {
  const originalAmount = Number(offer?.total_amount || 0);
  const originalCurrency = String(offer?.total_currency || "").toUpperCase();

  let pricePerPersonSek = 0;

  if (originalCurrency === "SEK") {
    pricePerPersonSek = originalAmount;
  } else if (originalCurrency === "EUR") {
    pricePerPersonSek = originalAmount * EUR_TO_SEK;
  } else {
    pricePerPersonSek = originalAmount;
  }

  const taxesAndFeesPerPersonSek = SERVICE_FEE_SEK;

  const flightAmountSek = pricePerPersonSek * passengerCount;
  const serviceFeeSek = taxesAndFeesPerPersonSek * passengerCount;
  const totalAmountSek = flightAmountSek + serviceFeeSek;

  return {
    pricePerPersonSek,
    taxesAndFeesPerPersonSek,
    flightAmountSek,
    serviceFeeSek,
    totalAmountSek,
  };
}

function formatDate(dateString) {
  if (!dateString) return "-";

  try {
    return new Intl.DateTimeFormat("sv-SE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

function createPassenger(index) {
  return {
    id: `pas_${index + 1}_${Date.now()}`,
    type: "adult",
    title: "mr",
    given_name: "",
    family_name: "",
    born_on: "",
    gender: "m",
    nationality: "Sverige",
    passport_number: "",
  };
}

function getPassengerCountFromState(state, offer) {
  const adultsFromState = Number(state?.searchParams?.adults || 0);
  if (adultsFromState > 0) return adultsFromState;

  const offerPassengers = Array.isArray(offer?.passengers)
    ? offer.passengers.length
    : 0;

  if (offerPassengers > 0) return offerPassengers;

  return 1;
}

function extractTripSummary(offer, state, passengerCount) {
  const slices = Array.isArray(offer?.slices) ? offer.slices : [];

  const outboundSlice = slices[0];
  const returnSlice = slices.length > 1 ? slices[slices.length - 1] : null;

  const outboundSegments = outboundSlice?.segments || [];
  const firstOutboundSegment = outboundSegments[0];
  const lastOutboundSegment = outboundSegments[outboundSegments.length - 1];

  const returnSegments = returnSlice?.segments || [];
  const lastReturnSegment = returnSegments[returnSegments.length - 1];

  const originCode =
    state?.search?.origin ||
    state?.searchParams?.from ||
    firstOutboundSegment?.origin?.iata_code ||
    "";

  const destinationCode =
    state?.search?.destination ||
    state?.searchParams?.to ||
    lastOutboundSegment?.destination?.iata_code ||
    "";

  const originCity =
    firstOutboundSegment?.origin?.city_name ||
    firstOutboundSegment?.origin?.name ||
    originCode ||
    "Avresa";

  const destinationCity =
    lastOutboundSegment?.destination?.city_name ||
    lastOutboundSegment?.destination?.name ||
    destinationCode ||
    "Destination";

  const departDate =
    state?.search?.departure_date ||
    state?.searchParams?.departDate ||
    firstOutboundSegment?.departing_at?.slice?.(0, 10) ||
    outboundSlice?.departure_date ||
    "";

  const returnDate =
    state?.search?.return_date ||
    state?.searchParams?.returnDate ||
    lastReturnSegment?.departing_at?.slice?.(0, 10) ||
    returnSlice?.departure_date ||
    "";

  const cabinRaw =
    state?.searchParams?.cabinClass ||
    state?.search?.cabin_class ||
    offer?.cabin_class_marketing_name ||
    offer?.cabin_class ||
    "Ekonomi";

  const cabin =
    String(cabinRaw).charAt(0).toUpperCase() +
    String(cabinRaw).slice(1).toLowerCase();

  return {
    originCity,
    destinationCity,
    originCode,
    destinationCode,
    departDate,
    returnDate,
    passengersLabel: `${passengerCount} ${
      passengerCount === 1 ? "vuxen" : "vuxna"
    }`,
    cabin,
  };
}

export default function PassengerPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const offer = state?.offer;

  const basePassengerCount = getPassengerCountFromState(state, offer);

  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const [contact, setContact] = useState({
    email: "",
    phone: "",
    confirmEmail: "",
    newsletter: true,
  });

  const [passengers, setPassengers] = useState(() =>
    Array.from({ length: basePassengerCount }, (_, index) =>
      createPassenger(index)
    )
  );

  const [addons, setAddons] = useState({
    seatSelection: false,
    checkedBags: 0,
  });

  const passengerCount = passengers.length;

  const pricing = useMemo(
    () => getDisplayPricing(offer, passengerCount),
    [offer, passengerCount]
  );

  const seatTotal = addons.seatSelection
    ? SEAT_PRICE_SEK * passengerCount
    : 0;

  const baggageTotal = BAG_PRICE_SEK * addons.checkedBags;

  const grandTotal =
    pricing.flightAmountSek + pricing.serviceFeeSek + seatTotal + baggageTotal;

  const basePerPerson =
    pricing.pricePerPersonSek + pricing.taxesAndFeesPerPersonSek;

  const trip = useMemo(
    () => extractTripSummary(offer, state, passengerCount),
    [offer, state, passengerCount]
  );

  function updatePassenger(index, key, value) {
    setPassengers((current) =>
      current.map((passenger, passengerIndex) =>
        passengerIndex === index ? { ...passenger, [key]: value } : passenger
      )
    );
  }

  async function handleCheckout(e) {
    e.preventDefault();
    setCheckoutError("");

    const normalizedEmail = contact.email.trim();
    const normalizedConfirmEmail = contact.confirmEmail.trim();
    const normalizedPhone = normalizePhoneNumber(contact.phone);

    if (passengers.length !== basePassengerCount) {
      alert(
        `Antalet resenärer måste vara ${basePassengerCount}. Gör en ny sökning om du vill ändra antal.`
      );
      return;
    }

    if (normalizedEmail !== normalizedConfirmEmail) {
      alert("E-postadresserna matchar inte.");
      return;
    }

    if (!normalizedPhone) {
      alert("Mobilnummer krävs.");
      return;
    }

    if (!isValidInternationalPhone(normalizedPhone)) {
      alert(
        "Mobilnumret måste anges i internationellt format, till exempel +46700000000."
      );
      return;
    }

    for (let i = 0; i < passengers.length; i += 1) {
      const passenger = passengers[i];
      const age = getAgeFromDate(passenger.born_on);

      if (!passenger.given_name?.trim()) {
        alert(`Förnamn saknas för resenär ${i + 1}.`);
        return;
      }

      if (!passenger.family_name?.trim()) {
        alert(`Efternamn saknas för resenär ${i + 1}.`);
        return;
      }

      if (!passenger.born_on) {
        alert(`Födelsedatum saknas för resenär ${i + 1}.`);
        return;
      }

      if (isFutureDate(passenger.born_on)) {
        alert(
          `Födelsedatum för resenär ${i + 1} kan inte ligga i framtiden.`
        );
        return;
      }

      if (age == null) {
        alert(`Ogiltigt födelsedatum för resenär ${i + 1}.`);
        return;
      }

      if (passenger.type === "adult" && age < 12) {
        alert(`Resenär ${i + 1} är inte vuxen enligt valt passagerartyp.`);
        return;
      }
    }

    setLoading(true);

    try {
      const checkoutPassengers = passengers.map((passenger, index) => ({
        id: passenger.id || `pas_${index + 1}`,
        type: passenger.type || "adult",
        title: passenger.title || (passenger.gender === "f" ? "ms" : "mr"),
        given_name: passenger.given_name?.trim(),
        family_name: passenger.family_name?.trim(),
        born_on: passenger.born_on,
        gender: passenger.gender,
        nationality: passenger.nationality?.trim(),
        passport_number: passenger.passport_number?.trim(),
      }));

      const data = await createCheckout({
        offer_id: offer.id,
        passengers: checkoutPassengers,
        customer_email: normalizedEmail,
        phone_number: normalizedPhone,
        addons: {
          seat_selection: addons.seatSelection,
          checked_bags: addons.checkedBags,
        },
      });

      if (!data?.url) {
        throw new Error("Checkout-URL saknas från servern.");
      }

      window.location.href = data.url;
    } catch (err) {
      setCheckoutError(
        err.message ||
          "Priset eller tillgängligheten har ändrats. Gå tillbaka och sök igen."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!offer) {
    return (
      <div className="pageShell">
        <SiteHeader />

        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.stateCard}>
              <span className={styles.badge}>Ingen resa vald</span>
              <h1 className={styles.stateTitle}>Vi hittade ingen vald resa</h1>
              <p className={styles.stateText}>
                Gå tillbaka till startsidan och sök fram en resa innan du fyller
                i passageraruppgifterna.
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

      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.stepsWrap}>
            <BookingSteps currentStep={3} />
          </div>

          <div className={styles.topIntro}>
            <div>
              <h1 className={styles.pageTitle}>Resenärsuppgifter</h1>
              <p className={styles.pageSubtitle}>
                Fyll i uppgifterna för alla resenärer så att vi kan skapa din
                bokning.
              </p>
            </div>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => navigate("/results", { state })}
            >
              Tillbaka till resultat
            </button>
          </div>

          <div className={styles.layout}>
            <main className={styles.mainContent}>
              <form onSubmit={handleCheckout} className={styles.form}>
                <section className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Kontaktinformation</h2>
                    <p className={styles.sectionText}>
                      Vi skickar bokningsbekräftelse och viktiga uppdateringar
                      till dessa uppgifter.
                    </p>
                  </div>

                  <div className={styles.fieldGridThree}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="email">
                        E-postadress *
                      </label>
                      <div className={styles.inputWrap}>
                        <Mail size={18} />
                        <input
                          id="email"
                          type="email"
                          className={styles.input}
                          placeholder="namn@exempel.se"
                          value={contact.email}
                          onChange={(e) =>
                            setContact((current) => ({
                              ...current,
                              email: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="phone">
                        Mobilnummer *
                      </label>
                      <div className={styles.inputWrap}>
                        <Phone size={18} />
                        <input
                          id="phone"
                          type="tel"
                          className={styles.input}
                          placeholder="+46700000000"
                          value={contact.phone}
                          onChange={(e) =>
                            setContact((current) => ({
                              ...current,
                              phone: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="confirmEmail">
                        Bekräfta e-post *
                      </label>
                      <div className={styles.inputWrap}>
                        <Mail size={18} />
                        <input
                          id="confirmEmail"
                          type="email"
                          className={styles.input}
                          placeholder="namn@exempel.se"
                          value={contact.confirmEmail}
                          onChange={(e) =>
                            setContact((current) => ({
                              ...current,
                              confirmEmail: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {passengers.map((passenger, index) => (
                  <section className={styles.formSection} key={passenger.id}>
                    <div className={styles.sectionHeaderRow}>
                      <div>
                        <h2 className={styles.sectionTitle}>
                          Resenär {index + 1}
                          {index === 0 ? " (Huvudresenär)" : ""}
                        </h2>
                        <p className={styles.sectionText}>
                          Kontrollera att namnet matchar pass eller nationellt
                          ID.
                        </p>
                      </div>

                      <span className={styles.lockedPassengerText}>
                        Antal resenärer är låst
                      </span>
                    </div>

                    <div className={styles.fieldGridThree}>
                      <div className={styles.fieldGroup}>
                        <label
                          className={styles.label}
                          htmlFor={`title_${index}`}
                        >
                          Titel *
                        </label>
                        <select
                          id={`title_${index}`}
                          className={styles.select}
                          value={passenger.title}
                          onChange={(e) =>
                            updatePassenger(index, "title", e.target.value)
                          }
                          required
                        >
                          <option value="mr">Mr</option>
                          <option value="ms">Ms</option>
                          <option value="mrs">Mrs</option>
                          <option value="miss">Miss</option>
                        </select>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label
                          className={styles.label}
                          htmlFor={`given_name_${index}`}
                        >
                          Förnamn *
                        </label>
                        <input
                          id={`given_name_${index}`}
                          className={styles.inputPlain}
                          placeholder="Förnamn"
                          value={passenger.given_name}
                          onChange={(e) =>
                            updatePassenger(
                              index,
                              "given_name",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>

                      <div className={styles.fieldGroup}>
                        <label
                          className={styles.label}
                          htmlFor={`family_name_${index}`}
                        >
                          Efternamn *
                        </label>
                        <input
                          id={`family_name_${index}`}
                          className={styles.inputPlain}
                          placeholder="Efternamn"
                          value={passenger.family_name}
                          onChange={(e) =>
                            updatePassenger(
                              index,
                              "family_name",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>

                      <div className={styles.fieldGroup}>
                        <label
                          className={styles.label}
                          htmlFor={`born_on_${index}`}
                        >
                          Födelsedatum *
                        </label>
                        <div className={styles.inputWrap}>
                          <CalendarDays size={18} />
                          <AppDatePicker
                            id={`born_on_${index}`}
                            value={passenger.born_on}
                            onChange={(value) => updatePassenger(index, "born_on", value)}
                            placeholder="Välj födelsedatum"
                            maxDate={new Date()}
                            className={styles.input}
                            required
                          />
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label
                          className={styles.label}
                          htmlFor={`gender_${index}`}
                        >
                          Kön
                        </label>
                        <select
                          id={`gender_${index}`}
                          className={styles.select}
                          value={passenger.gender}
                          onChange={(e) =>
                            updatePassenger(index, "gender", e.target.value)
                          }
                        >
                          <option value="m">Man</option>
                          <option value="f">Kvinna</option>
                        </select>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label
                          className={styles.label}
                          htmlFor={`nationality_${index}`}
                        >
                          Nationalitet *
                        </label>
                        <input
                          id={`nationality_${index}`}
                          className={styles.inputPlain}
                          placeholder="Sverige"
                          value={passenger.nationality}
                          onChange={(e) =>
                            updatePassenger(
                              index,
                              "nationality",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>

                      <div className={styles.fieldGroup}>
                        <label
                          className={styles.label}
                          htmlFor={`passport_${index}`}
                        >
                          Passnummer *
                        </label>
                        <input
                          id={`passport_${index}`}
                          className={styles.inputPlain}
                          placeholder="SE1234567"
                          value={passenger.passport_number}
                          onChange={(e) =>
                            updatePassenger(
                              index,
                              "passport_number",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </section>
                ))}

                <section className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Tillägg (valfritt)</h2>
                    <p className={styles.sectionText}>
                      Gör resan ännu smidigare med extra tillval.
                    </p>
                  </div>

                  <div className={styles.addonsGrid}>
                    <div className={styles.addonCard}>
                      <div className={styles.addonIcon}>
                        <Armchair size={20} />
                      </div>

                      <div className={styles.addonContent}>
                        <h3 className={styles.addonTitle}>Välj sittplats</h3>
                        <p className={styles.addonText}>
                          Välj din favoritplats för en mer bekväm resa.
                        </p>
                      </div>

                      <div className={styles.addonFooter}>
                        <span className={styles.addonPrice}>
                          fr. {formatMoney(SEAT_PRICE_SEK, "SEK")} / pers
                        </span>
                        <button
                          type="button"
                          className={
                            addons.seatSelection
                              ? styles.addonButtonActive
                              : styles.addonButton
                          }
                          onClick={() =>
                            setAddons((current) => ({
                              ...current,
                              seatSelection: !current.seatSelection,
                            }))
                          }
                        >
                          {addons.seatSelection ? "Vald" : "Välj plats"}
                        </button>
                      </div>
                    </div>

                    <div className={styles.addonCard}>
                      <div className={styles.addonIcon}>
                        <Briefcase size={20} />
                      </div>

                      <div className={styles.addonContent}>
                        <h3 className={styles.addonTitle}>
                          Incheckat bagage (23 kg)
                        </h3>
                        <p className={styles.addonText}>
                          Lägg till bagage och res utan bekymmer. Exakt vikt kan
                          variera beroende på flygbolag.
                        </p>
                      </div>

                      <div className={styles.baggageControls}>
                        <button
                          type="button"
                          className={styles.counterButton}
                          onClick={() =>
                            setAddons((current) => ({
                              ...current,
                              checkedBags: Math.max(
                                0,
                                current.checkedBags - 1
                              ),
                            }))
                          }
                        >
                          −
                        </button>

                        <span className={styles.counterValue}>
                          {addons.checkedBags}
                        </span>

                        <button
                          type="button"
                          className={styles.counterButton}
                          onClick={() =>
                            setAddons((current) => ({
                              ...current,
                              checkedBags: current.checkedBags + 1,
                            }))
                          }
                        >
                          +
                        </button>
                      </div>

                      <div className={styles.addonFooter}>
                        <span className={styles.addonPrice}>
                          fr. {formatMoney(BAG_PRICE_SEK, "SEK")} / väska
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.actionSection}>
                  <div className={styles.termsRow}>
                    <input id="terms" type="checkbox" required />
                    <label htmlFor="terms">
                      Jag har läst och godkänner villkoren, integritetspolicyn
                      och resevillkoren.
                    </label>
                  </div>

                  {checkoutError && (
                    <div className={styles.checkoutErrorBox}>
                      <strong>Resan behöver uppdateras</strong>
                      <p>{checkoutError}</p>
                      <button
                        type="button"
                        className={styles.errorButton}
                        onClick={() => navigate("/results", { state })}
                      >
                        Gå tillbaka och välj ny resa
                      </button>
                    </div>
                  )}

                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={styles.backButton}
                      onClick={() => navigate("/results", { state })}
                    >
                      Tillbaka
                    </button>

                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !contact.email ||
                        !contact.confirmEmail ||
                        contact.email.trim() !== contact.confirmEmail.trim() ||
                        !contact.phone.trim()
                      }
                      className={styles.primaryButton}
                    >
                      {loading
                        ? "Skickar till betalning..."
                        : "Fortsätt till betalning"}
                    </button>
                  </div>
                </section>
              </form>
            </main>

            <aside className={styles.sidebar}>
              <div className={styles.tripCard}>
                <div className={styles.tripImage}>
                  <div className={styles.tripOverlay}>
                    <button
                      type="button"
                      className={styles.editTripButton}
                      onClick={() => navigate("/results", { state })}
                    >
                      Ändra
                    </button>

                    <div className={styles.tripRoute}>
                      <span>{trip.originCity}</span>
                      <Plane size={14} />
                      <span>{trip.destinationCity}</span>
                    </div>

                    <div className={styles.tripCodes}>
                      {trip.originCode} · {trip.destinationCode}
                    </div>

                    <div className={styles.tripMeta}>
                      <div className={styles.tripMetaRow}>
                        <CalendarDays size={15} />
                        <span>
                          {formatDate(trip.departDate)}
                          {trip.returnDate
                            ? ` – ${formatDate(trip.returnDate)}`
                            : ""}
                        </span>
                      </div>

                      <div className={styles.tripMetaRow}>
                        <User size={15} />
                        <span>{trip.passengersLabel}</span>
                      </div>

                      <div className={styles.tripMetaRow}>
                        <Luggage size={15} />
                        <span>{trip.cabin}</span>
                      </div>
                    </div>

                    <div className={styles.tripPriceBlock}>
                      <span className={styles.tripPriceLabel}>Totalpris</span>
                      <strong className={styles.tripPrice}>
                        {formatMoney(grandTotal, "SEK")}
                      </strong>
                      <span className={styles.tripPriceSub}>
                        {formatMoney(basePerPerson, "SEK")} per person inkl.
                        skatter och avgifter
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoRow}>
                  <Shield size={18} />
                  <div>
                    <strong>Tryggt & säkert</strong>
                    <p>Vi följer branschens regler och skyddar dina uppgifter.</p>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <Phone size={18} />
                  <div>
                    <strong>Personlig service</strong>
                    <p>Vi finns här före, under och efter din resa.</p>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <Plane size={18} />
                  <div>
                    <strong>Smidig bokning</strong>
                    <p>Snabb betalning och tydlig bekräftelse direkt efter köp.</p>
                  </div>
                </div>
              </div>

              <div className={styles.priceCard}>
                <h3 className={styles.priceCardTitle}>Prisöversikt</h3>

                <div className={styles.priceRows}>
                  <div className={styles.priceRow}>
                    <span>Flygbiljett</span>
                    <strong>{formatMoney(pricing.flightAmountSek, "SEK")}</strong>
                  </div>

                  <div className={styles.priceRow}>
                    <span>Skatter och avgifter</span>
                    <strong>{formatMoney(pricing.serviceFeeSek, "SEK")}</strong>
                  </div>

                  {addons.seatSelection && (
                    <div className={styles.priceRow}>
                      <span>Sittplats ({passengerCount} st)</span>
                      <strong>{formatMoney(seatTotal, "SEK")}</strong>
                    </div>
                  )}

                  {addons.checkedBags > 0 && (
                    <div className={styles.priceRow}>
                      <span>Incheckat bagage ({addons.checkedBags} st)</span>
                      <strong>{formatMoney(baggageTotal, "SEK")}</strong>
                    </div>
                  )}

                  <div className={styles.divider} />

                  <div className={styles.priceRowMuted}>
                    <span>Resenärer</span>
                    <strong>{passengerCount}</strong>
                  </div>

                  <div className={styles.priceRowMuted}>
                    <span>Grundpris per person</span>
                    <strong>{formatMoney(basePerPerson, "SEK")}</strong>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.priceRowTotal}>
                    <span>Totaltpris</span>
                    <strong>{formatMoney(grandTotal, "SEK")}</strong>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}