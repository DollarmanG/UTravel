import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { createCheckout } from "../api/flights";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import BookingSteps from "../components/BookingSteps";
import styles from "../styles/PassengerPage.module.css";

const EUR_TO_SEK = Number(import.meta.env.VITE_EUR_TO_SEK || 11.5);
const SERVICE_FEE_SEK = Number(import.meta.env.VITE_SERVICE_FEE_SEK || 300);

function formatMoney(amount, currency = "SEK") {
  const value = Number(amount || 0);

  try {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function getDisplayPricing(offer) {
  const originalAmount = Number(offer?.total_amount || 0);
  const originalCurrency = String(offer?.total_currency || "").toUpperCase();

  if (originalCurrency === "SEK") {
    const flightAmountSek = originalAmount;
    const totalAmountSek = flightAmountSek + SERVICE_FEE_SEK;

    return {
      flightAmountSek,
      serviceFeeSek: SERVICE_FEE_SEK,
      totalAmountSek,
    };
  }

  if (originalCurrency === "EUR") {
    const flightAmountSek = originalAmount * EUR_TO_SEK;
    const totalAmountSek = flightAmountSek + SERVICE_FEE_SEK;

    return {
      flightAmountSek,
      serviceFeeSek: SERVICE_FEE_SEK,
      totalAmountSek,
    };
  }

  return {
    flightAmountSek: originalAmount,
    serviceFeeSek: SERVICE_FEE_SEK,
    totalAmountSek: originalAmount + SERVICE_FEE_SEK,
  };
}

export default function PassengerPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const offer = state?.offer;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [passenger, setPassenger] = useState({
    given_name: "",
    family_name: "",
    born_on: "",
    gender: "m",
  });

  const pricing = useMemo(() => getDisplayPricing(offer), [offer]);

  async function handleCheckout(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const passengers = [
        {
          id: "pas_1",
          type: "adult",
          given_name: passenger.given_name,
          family_name: passenger.family_name,
          born_on: passenger.born_on,
          gender: passenger.gender,
        },
      ];

      const data = await createCheckout({
        offer_id: offer.id,
        passengers,
        customer_email: email,
      });

      window.location.href = data.url;
    } catch (err) {
      alert(err.message || "Något gick fel vid skickning till betalning.");
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

          <div className={styles.headerCard}>
            <div>
              <p className={styles.eyebrow}>Steg 3 av 5</p>
              <h1 className={styles.pageTitle}>Passageraruppgifter</h1>
              <p className={styles.pageSubtitle}>
                Fyll i kontaktuppgifter och resenärens information för att gå
                vidare till betalning.
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
            <aside className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <span className={styles.summaryBadge}>Prisöversikt</span>
                <h2 className={styles.summaryTitle}>Din resa</h2>
              </div>

              <div className={styles.priceRows}>
                <div className={styles.priceRow}>
                  <span>Flygpris</span>
                  <strong>{formatMoney(pricing.flightAmountSek, "SEK")}</strong>
                </div>

                <div className={styles.priceRow}>
                  <span>Skatter och avgifter</span>
                  <strong>{formatMoney(pricing.serviceFeeSek, "SEK")}</strong>
                </div>

                <div className={styles.divider} />

                <div className={styles.priceRowTotal}>
                  <span>Totalt att betala</span>
                  <strong>{formatMoney(pricing.totalAmountSek, "SEK")}</strong>
                </div>
              </div>
            </aside>

            <section className={styles.formCard}>
              <form onSubmit={handleCheckout} className={styles.form}>
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Kontaktuppgifter</h2>
                    <p className={styles.sectionText}>
                      Vi skickar bokningsbekräftelsen till denna e-postadress.
                    </p>
                  </div>

                  <div className={styles.fieldGridSingle}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="email">
                        E-post
                      </label>
                      <input
                        id="email"
                        type="email"
                        className={styles.input}
                        placeholder="namn@exempel.se"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Resenär</h2>
                    <p className={styles.sectionText}>
                      Kontrollera att namnet matchar pass eller nationellt ID.
                    </p>
                  </div>

                  <div className={styles.fieldGrid}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="given_name">
                        Förnamn
                      </label>
                      <input
                        id="given_name"
                        className={styles.input}
                        placeholder="Förnamn"
                        value={passenger.given_name}
                        onChange={(e) =>
                          setPassenger({
                            ...passenger,
                            given_name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="family_name">
                        Efternamn
                      </label>
                      <input
                        id="family_name"
                        className={styles.input}
                        placeholder="Efternamn"
                        value={passenger.family_name}
                        onChange={(e) =>
                          setPassenger({
                            ...passenger,
                            family_name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="born_on">
                        Födelsedatum
                      </label>
                      <input
                        id="born_on"
                        type="date"
                        className={styles.input}
                        value={passenger.born_on}
                        onChange={(e) =>
                          setPassenger({
                            ...passenger,
                            born_on: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="gender">
                        Kön
                      </label>
                      <select
                        id="gender"
                        className={styles.select}
                        value={passenger.gender}
                        onChange={(e) =>
                          setPassenger({
                            ...passenger,
                            gender: e.target.value,
                          })
                        }
                      >
                        <option value="m">Man</option>
                        <option value="f">Kvinna</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.actionRow}>
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.primaryButton}
                  >
                    {loading
                      ? "Skickar till betalning..."
                      : `Betala ${formatMoney(pricing.totalAmountSek, "SEK")}`}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}