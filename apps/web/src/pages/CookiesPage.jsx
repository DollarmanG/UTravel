import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import styles from "../styles/InfoPage.module.css";

export default function CookiesPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.main}>
        <article className={styles.card}>
          <span className={styles.badge}>Information</span>
          <h1 className={styles.title}>Cookies</h1>

          <p className={styles.lead}>
            Denna cookiepolicy beskriver hur UTravel använder cookies och
            liknande tekniker på vår webbplats.
          </p>

          <section className={styles.section}>
            <h2>1. Vad är cookies?</h2>
            <p>
              Cookies är små textfiler som lagras på din enhet när du besöker en
              webbplats. Cookies kan användas för att webbplatsen ska fungera,
              komma ihåg val, förbättra användarupplevelsen, mäta användning
              eller visa relevant innehåll.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Vilka typer av cookies använder vi?</h2>
            <p>
              UTravel kan använda följande kategorier av cookies:
            </p>
            <p>
              <strong>Nödvändiga cookies:</strong> cookies som krävs för att
              webbplatsen och bokningsflödet ska fungera. Dessa kan till exempel
              användas för säkerhet, teknisk funktionalitet och för att komma
              ihåg val i bokningsprocessen.
            </p>
            <p>
              <strong>Analyscookies:</strong> cookies som hjälper oss att förstå
              hur webbplatsen används, till exempel vilka sidor som besöks och
              hur användare navigerar på sidan.
            </p>
            <p>
              <strong>Marknadsföringscookies:</strong> cookies som kan användas
              för att mäta eller anpassa marknadsföring. Dessa används endast om
              du har samtyckt till det.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Nödvändiga cookies</h2>
            <p>
              Nödvändiga cookies används utan samtycke när de krävs för att
              tillhandahålla en tjänst som du uttryckligen har begärt, till
              exempel att använda bokningsflödet eller webbplatsens grundläggande
              funktioner.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Cookies som kräver samtycke</h2>
            <p>
              Cookies som inte är nödvändiga, till exempel analyscookies eller
              marknadsföringscookies, används endast om du har lämnat samtycke.
            </p>
            <p>
              Du kan när som helst ändra eller återkalla ditt samtycke.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Hantera cookieinställningar</h2>
            <p>
              Du ska kunna ändra dina cookieinställningar via webbplatsens
              cookieinställningar.
            </p>
            <p>
              När cookiehantering är fullt implementerad ska du kunna:
            </p>
            <ul>
              <li>Acceptera cookies.</li>
              <li>Neka icke-nödvändiga cookies.</li>
              <li>Välja kategorier.</li>
              <li>Ändra tidigare val.</li>
              <li>Återkalla samtycke.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Cookies från tredje part</h2>
            <p>
              Vissa cookies kan komma från externa leverantörer, till exempel
              analysverktyg, betalningslösningar eller tekniska tjänster.
            </p>
            <p>
              Om vi använder tredjepartscookies ska information om dessa visas i
              cookieinställningarna.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Hur länge cookies sparas</h2>
            <p>
              Hur länge cookies sparas beror på typen av cookie. Vissa cookies
              raderas när du stänger webbläsaren, medan andra sparas under en
              viss tid.
            </p>
            <p>
              När cookiehanteringen är implementerad ska mer detaljerad
              information visas om varje cookie, inklusive namn, leverantör,
              ändamål och lagringstid.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Kontakt</h2>
            <p>
              Om du har frågor om vår användning av cookies kan du kontakta oss:
            </p>
            <p>
              E-post: info@utravel.se<br />
              Telefon: 08-123 45 67
            </p>
          </section>

          <div className={styles.infoBox}>
            Senast uppdaterad: 2026-04-24. Om UTravel använder analyscookies,
            marknadsföringscookies eller andra icke-nödvändiga cookies behöver
            ni även ha en cookie-banner där användaren kan acceptera, neka och
            ändra sitt val.
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}