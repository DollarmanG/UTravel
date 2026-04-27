import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import styles from "../styles/InfoPage.module.css";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.main}>
        <article className={styles.card}>
          <span className={styles.badge}>Information</span>
          <h1 className={styles.title}>Om UTravel</h1>
          <p className={styles.lead}>
            UTravel hjälper kunder att hitta och boka flygresor på ett enkelt,
            tryggt och smidigt sätt.
          </p>

          <section className={styles.section}>
            <h2>Vår idé</h2>
            <p>
              Vi vill göra bokning av flygresor tydligare och mer tillgängligt.
              Hos oss ska kunden snabbt kunna jämföra alternativ, välja resa och
              genomföra sin bokning på ett säkert sätt.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Vad vi erbjuder</h2>
            <ul>
              <li>Sökning och bokning av flygresor.</li>
              <li>Tydlig information om pris, resväg och passageraruppgifter.</li>
              <li>Säker betalning via våra betalningspartners.</li>
              <li>Kundsupport vid frågor om bokning och resa.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Bolagsinformation</h2>
            <p>
              UTravel drivs av Ya Ra AB. Mer detaljerad bolagsinformation kan
              komma att visas här innan sidan går live.
            </p>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}