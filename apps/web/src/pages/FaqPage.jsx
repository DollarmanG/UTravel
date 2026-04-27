import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import styles from "../styles/InfoPage.module.css";

export default function FaqPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.main}>
        <article className={styles.card}>
          <span className={styles.badge}>Kundservice</span>
          <h1 className={styles.title}>Vanliga frågor</h1>
          <p className={styles.lead}>
            Här hittar du svar på vanliga frågor om bokning, betalning,
            bagage och support.
          </p>

          <section className={styles.section}>
            <h2>När är min bokning bekräftad?</h2>
            <p>
              Din bokning är bekräftad när betalningen har gått igenom och du
              har fått en bokningsbekräftelse.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Ingår bagage i priset?</h2>
            <p>
              Det beror på flygbolaget och biljettypen. Bagageinformation visas
              i samband med erbjudandet när den finns tillgänglig.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Kan jag ändra min resa?</h2>
            <p>
              Det beror på biljettens regler och flygbolagets villkor.
              Kontakta oss så hjälper vi dig att kontrollera möjligheterna.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Hur hittar jag min bokning?</h2>
            <p>
              Du kan använda sidan Hitta bokning och ange din bokningsreferens
              samt efternamn.
            </p>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}