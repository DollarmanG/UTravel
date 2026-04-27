import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import styles from "../styles/InfoPage.module.css";

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.main}>
        <article className={styles.card}>
          <span className={styles.badge}>Kundservice</span>
          <h1 className={styles.title}>Kontakta oss</h1>
          <p className={styles.lead}>
            Behöver du hjälp med en bokning eller har du frågor om en resa?
            Kontakta oss så hjälper vi dig.
          </p>

          <section className={styles.section}>
            <h2>Kontaktuppgifter</h2>
            <p>Telefon: 08-123 45 67</p>
            <p>E-post: info@utravel.se</p>
            <p>Öppettider: Mån–Fre 09:00–17:00</p>
          </section>

          <section className={styles.section}>
            <h2>När du kontaktar oss</h2>
            <p>
              Ha gärna din bokningsreferens, efternamn och e-postadress redo.
              Då kan vi hjälpa dig snabbare.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Akuta ärenden</h2>
            <p>
              Om din resa avgår snart bör du kontakta flygbolaget direkt
              samtidigt som du kontaktar oss.
            </p>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}