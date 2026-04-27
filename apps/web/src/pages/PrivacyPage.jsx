import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import styles from "../styles/InfoPage.module.css";

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.main}>
        <article className={styles.card}>
          <span className={styles.badge}>Information</span>
          <h1 className={styles.title}>Integritetspolicy</h1>

          <p className={styles.lead}>
            Denna integritetspolicy beskriver hur UTravel behandlar
            personuppgifter när du använder vår webbplats, söker resor, gör en
            bokning, kontaktar kundservice eller använder våra tjänster.
          </p>

          <section className={styles.section}>
            <h2>1. Personuppgiftsansvarig</h2>
            <p>
              Personuppgiftsansvarig är:
            </p>
            <p>
              Ya Ra AB<br />
              Organisationsnummer: [lägg in organisationsnummer]<br />
              Adress: [lägg in bolagsadress]<br />
              E-post: info@utravel.se<br />
              Telefon: 08-123 45 67
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Vilka personuppgifter vi behandlar</h2>
            <p>
              Vi kan behandla följande personuppgifter:
            </p>
            <ul>
              <li>Namn.</li>
              <li>E-postadress.</li>
              <li>Telefonnummer.</li>
              <li>Födelsedatum.</li>
              <li>Passagerartyp.</li>
              <li>Kön, om flygbolaget kräver det.</li>
              <li>Bokningsreferens.</li>
              <li>Reseinformation.</li>
              <li>Betalstatus.</li>
              <li>Kvitto- och fakturainformation.</li>
              <li>Kundsupportärenden.</li>
              <li>Teknisk information som IP-adress, enhetsinformation och webbläsarinformation.</li>
              <li>Cookieinformation enligt vår cookiepolicy.</li>
            </ul>
            <p>
              Om flygbolag eller myndighet kräver ytterligare information för
              att genomföra en resa kan sådan information också behöva
              behandlas.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Varför vi behandlar personuppgifter</h2>
            <p>
              Vi behandlar personuppgifter för att:
            </p>
            <ul>
              <li>Kunna söka och visa flygresor.</li>
              <li>Genomföra bokningar.</li>
              <li>Hantera betalningar.</li>
              <li>Skicka bokningsbekräftelser.</li>
              <li>Ge kundsupport.</li>
              <li>Hantera ändringar, avbokningar och återbetalningar.</li>
              <li>Uppfylla bokföringskrav.</li>
              <li>Förebygga bedrägerier och missbruk.</li>
              <li>Förbättra våra tjänster.</li>
              <li>Följa lagkrav och myndighetsbeslut.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Rättslig grund</h2>
            <p>
              Vi behandlar personuppgifter med följande rättsliga grunder:
            </p>
            <p>
              <strong>Avtal:</strong> när behandlingen är nödvändig för att
              genomföra bokningen eller tillhandahålla tjänsten.
            </p>
            <p>
              <strong>Rättslig förpliktelse:</strong> när vi måste spara
              uppgifter enligt exempelvis bokföringsregler eller andra lagkrav.
            </p>
            <p>
              <strong>Berättigat intresse:</strong> när vi behöver hantera
              kundservice, säkerhet, felsökning, bedrägeriförebyggande åtgärder
              och förbättring av våra tjänster.
            </p>
            <p>
              <strong>Samtycke:</strong> när vi använder icke-nödvändiga cookies,
              marknadsföringscookies eller andra funktioner som kräver samtycke.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Mottagare av personuppgifter</h2>
            <p>
              Vi kan dela personuppgifter med:
            </p>
            <ul>
              <li>Flygbolag.</li>
              <li>Bokningssystem och reseleverantörer.</li>
              <li>Betalningsleverantörer.</li>
              <li>Tekniska driftleverantörer.</li>
              <li>E-postleverantörer.</li>
              <li>Kundsupportsystem.</li>
              <li>Myndigheter när lagen kräver det.</li>
              <li>Rådgivare, revisorer eller juridiska ombud vid behov.</li>
            </ul>
            <p>
              Vi delar endast personuppgifter när det är nödvändigt för att
              tillhandahålla tjänsten, uppfylla avtal, följa lag eller skydda
              våra rättigheter.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Tredjelandsöverföring</h2>
            <p>
              Vissa leverantörer eller flygbolag kan finnas utanför EU/EES. Om
              personuppgifter överförs utanför EU/EES ska UTravel vidta lämpliga
              skyddsåtgärder enligt GDPR, till exempel standardavtalsklausuler
              eller andra godkända mekanismer.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Hur länge vi sparar personuppgifter</h2>
            <p>
              Vi sparar personuppgifter så länge det är nödvändigt för de
              ändamål som anges i denna policy.
            </p>
            <p>
              Boknings- och betalningsuppgifter kan behöva sparas enligt
              bokföringskrav och för att hantera kundservice, reklamationer,
              återbetalningar och rättsliga anspråk.
            </p>
            <p>
              Kundsupportärenden sparas så länge det behövs för att hantera
              ärendet och eventuella uppföljningar.
            </p>
            <p>
              Cookieinformation sparas enligt de lagringstider som anges i vår
              cookiepolicy.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Dina rättigheter</h2>
            <p>
              Du har rätt att:
            </p>
            <ul>
              <li>Begära tillgång till dina personuppgifter.</li>
              <li>Begära rättelse av felaktiga uppgifter.</li>
              <li>Begära radering i vissa fall.</li>
              <li>Begära begränsning av behandling.</li>
              <li>Invända mot viss behandling.</li>
              <li>Begära dataportabilitet i vissa fall.</li>
              <li>Återkalla samtycke när behandlingen grundas på samtycke.</li>
            </ul>
            <p>
              Om du vill utöva dina rättigheter kan du kontakta oss via
              info@utravel.se.
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. Klagomål</h2>
            <p>
              Om du anser att vi behandlar dina personuppgifter felaktigt kan du
              kontakta oss. Du har även rätt att lämna klagomål till
              Integritetsskyddsmyndigheten.
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. Säkerhet</h2>
            <p>
              Vi arbetar för att skydda personuppgifter genom tekniska och
              organisatoriska säkerhetsåtgärder. Endast personer och leverantörer
              som behöver uppgifterna för sitt arbete ska ha tillgång till dem.
            </p>
          </section>

          <section className={styles.section}>
            <h2>11. Ändringar i denna policy</h2>
            <p>
              Vi kan uppdatera denna integritetspolicy. Den senaste versionen ska
              alltid finnas tillgänglig på vår webbplats.
            </p>
          </section>

          <div className={styles.infoBox}>
            Senast uppdaterad: 2026-04-24. GDPR kräver bland annat tydlig
            information, rättslig grund och att personuppgifter skyddas och inte
            sparas längre än nödvändigt. Se till att fylla i korrekt
            bolagsinformation och faktiska leverantörer innan lansering.
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}