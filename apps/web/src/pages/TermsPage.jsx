import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import styles from "../styles/InfoPage.module.css";

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.main}>
        <article className={styles.card}>
          <span className={styles.badge}>Information</span>
          <h1 className={styles.title}>Resevillkor</h1>

          <p className={styles.lead}>
            Dessa resevillkor gäller när du söker, väljer och bokar flygresor
            via UTravel. Genom att genomföra en bokning godkänner du dessa
            resevillkor samt de villkor som gäller hos aktuellt flygbolag.
          </p>

          <section className={styles.section}>
            <h2>1. Om UTravel</h2>
            <p>
              UTravel drivs av Ya Ra AB.
            </p>
            <p>
              Bolagsnamn: Ya Ra AB<br />
              Organisationsnummer: [lägg in organisationsnummer]<br />
              Adress: [lägg in bolagsadress]<br />
              E-post: info@utravel.se<br />
              Telefon: 08-123 45 67
            </p>
            <p>
              UTravel tillhandahåller en digital tjänst för sökning och bokning
              av flygresor. UTravel säljer eller förmedlar flygbiljetter och
              tillhörande information som visas i bokningsflödet.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. UTravel säljer flygresor, inte paketresor</h2>
            <p>
              UTravel erbjuder endast flygresor om inget annat uttryckligen
              anges. UTravel erbjuder inte hotell, hyrbil eller paketresor i
              samma bokning.
            </p>
            <p>
              Om UTravel i framtiden erbjuder paketresor eller sammanlänkade
              researrangemang kommer särskilda regler och information att
              tillämpas enligt gällande lag.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Kundens ansvar</h2>
            <p>
              Du ansvarar för att alla uppgifter du lämnar vid bokning är
              fullständiga och korrekta.
            </p>
            <ul>
              <li>För- och efternamn enligt pass eller nationell ID-handling.</li>
              <li>Födelsedatum och passagerartyp.</li>
              <li>Kön, om flygbolaget kräver det.</li>
              <li>E-postadress och telefonnummer.</li>
              <li>Resedatum, destination och vald resa.</li>
              <li>Eventuella bagageval och tilläggstjänster.</li>
              <li>Övriga uppgifter som krävs av flygbolaget.</li>
            </ul>
            <p>
              Felaktiga uppgifter kan leda till att flygbolaget nekar
              ombordstigning, kräver ändringsavgift eller att en ny biljett
              behöver köpas. UTravel ansvarar inte för kostnader som uppstår på
              grund av felaktiga uppgifter som kunden själv har lämnat.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Bokning och bekräftelse</h2>
            <p>
              En bokning är inte garanterad förrän betalningen har genomförts
              och bokningen har bekräftats.
            </p>
            <p>
              När bokningen är bekräftad skickas bokningsinformation till den
              e-postadress som kunden har angett. Kunden ansvarar för att
              kontrollera att bokningsbekräftelsen stämmer.
            </p>
            <p>
              Om en teknisk störning, prisändring, tillgänglighetsändring eller
              felaktig information gör att bokningen inte kan genomföras, kommer
              UTravel att informera kunden så snart som möjligt.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Priser</h2>
            <p>
              Priser på flygresor kan ändras snabbt och styrs av flygbolagets
              tillgänglighet, skatter, avgifter, valutakurser och andra externa
              faktorer.
            </p>
            <p>
              Det pris som visas innan betalning är det pris som gäller vid
              betalningstillfället, förutsatt att flygresan fortfarande är
              tillgänglig och att bokningen kan genomföras.
            </p>
            <p>
              UTravel kan ta ut serviceavgifter, förmedlingsavgifter eller andra
              avgifter. Sådana avgifter ska framgå innan kunden slutför
              betalningen.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Betalning</h2>
            <p>
              Betalning sker via de betalningsmetoder som visas i kassan.
              UTravel använder externa betalningsleverantörer för att hantera
              betalningar.
            </p>
            <p>
              UTravel lagrar inte fullständiga kortuppgifter.
            </p>
            <p>
              En bokning kan nekas eller avbrytas om betalningen inte godkänns,
              om misstanke om bedrägeri finns eller om bokningen inte kan
              slutföras hos flygbolaget.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Flygbolagets villkor</h2>
            <p>
              Flygbolagets egna villkor gäller för flygresan. Dessa kan omfatta
              regler om:
            </p>
            <ul>
              <li>Bagage och handbagage.</li>
              <li>Incheckning och ombordstigning.</li>
              <li>Ändringar, avbokning och återbetalning.</li>
              <li>No-show.</li>
              <li>Förseningar och inställda flyg.</li>
              <li>Namnändringar.</li>
              <li>Särskild assistans.</li>
              <li>Spädbarn, barn och minderåriga passagerare.</li>
              <li>Dokumentkrav, visum och inresekrav.</li>
            </ul>
            <p>
              Kunden ansvarar för att följa flygbolagets regler och kontrollera
              vilka dokument som krävs för resan.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Bagage</h2>
            <p>
              Information om bagage visas i den mån informationen tillhandahålls
              av flygbolaget eller bokningssystemet. Bagageregler kan skilja sig
              mellan flygbolag, biljettyper och sträckor.
            </p>
            <p>
              Om bagage inte uttryckligen anges som inkluderat ska kunden utgå
              från att extra bagage kan behöva köpas separat.
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. Pass, visum och inresekrav</h2>
            <p>
              Kunden ansvarar själv för att ha giltigt pass, visum, nationellt
              ID-kort, vaccinationer eller andra handlingar som krävs för resan.
            </p>
            <p>
              UTravel ansvarar inte för nekad ombordstigning eller nekad inresa
              på grund av att kunden saknar nödvändiga dokument.
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. Ändringar och avbokningar</h2>
            <p>
              Möjligheten att ändra eller avboka en flygresa beror på
              flygbolagets regler och den valda biljettypen.
            </p>
            <p>
              Vissa biljetter kan vara helt eller delvis återbetalningsbara.
              Andra biljetter kan vara icke återbetalningsbara och inte möjliga
              att ändra.
            </p>
            <p>
              Eventuella avgifter från flygbolag, bokningssystem,
              betalningsleverantör eller UTravel kan tillkomma.
            </p>
          </section>

          <section className={styles.section}>
            <h2>11. Ingen lagstadgad ångerrätt för flygbiljetter</h2>
            <p>
              Vid bokning av flygbiljetter gäller normalt ingen lagstadgad
              ångerrätt. Det innebär att kunden inte automatiskt kan ångra köpet
              efter genomförd bokning.
            </p>
            <p>
              Eventuell avbokning, återbetalning eller ändring sker enligt
              flygbolagets biljettvillkor.
            </p>
          </section>

          <section className={styles.section}>
            <h2>12. Återbetalning</h2>
            <p>
              Om kunden har rätt till återbetalning sker återbetalningen enligt
              flygbolagets regler och efter att UTravel har mottagit eller fått
              bekräftelse på återbetalningsbart belopp från berörd part.
            </p>
            <p>
              Serviceavgifter, betalningsavgifter, förmedlingsavgifter och andra
              administrativa avgifter kan vara icke återbetalningsbara, om detta
              framgått innan köp.
            </p>
            <p>
              Återbetalning kan ta olika lång tid beroende på flygbolag,
              betalningsleverantör och bank.
            </p>
          </section>

          <section className={styles.section}>
            <h2>13. Inställda eller ändrade flyg</h2>
            <p>
              Om flygbolaget ändrar eller ställer in en flygning gäller
              flygbolagets regler samt tillämpliga passagerarrättigheter.
            </p>
            <p>
              UTravel hjälper kunden med information och hantering i den
              utsträckning det är möjligt, men flygbolaget ansvarar för själva
              transporten.
            </p>
          </section>

          <section className={styles.section}>
            <h2>14. Force majeure</h2>
            <p>
              UTravel ansvarar inte för kostnader, förseningar eller skador som
              beror på omständigheter utanför UTravels kontroll, till exempel
              extrema väderförhållanden, myndighetsbeslut, strejk, krig,
              tekniska störningar, naturkatastrofer, säkerhetshändelser,
              pandemier eller liknande händelser.
            </p>
          </section>

          <section className={styles.section}>
            <h2>15. Kundsupport</h2>
            <p>
              Kunden kan kontakta UTravel via:
            </p>
            <p>
              E-post: info@utravel.se<br />
              Telefon: 08-123 45 67<br />
              Öppettider: Mån–Fre 09:00–17:00
            </p>
            <p>
              Vid kontakt bör kunden ange bokningsreferens, efternamn och
              e-postadress som användes vid bokningen.
            </p>
          </section>

          <section className={styles.section}>
            <h2>16. Reklamation</h2>
            <p>
              Om kunden vill reklamera en tjänst ska kunden kontakta UTravel så
              snart som möjligt efter att felet upptäckts.
            </p>
            <p>
              Kunden kan även vända sig till Allmänna reklamationsnämnden om en
              tvist inte kan lösas direkt med UTravel.
            </p>
          </section>

          <section className={styles.section}>
            <h2>17. Ändring av villkor</h2>
            <p>
              UTravel kan uppdatera dessa resevillkor. Den version som gällde
              vid bokningstillfället gäller för den aktuella bokningen.
            </p>
          </section>

          <section className={styles.section}>
            <h2>18. Tillämplig lag</h2>
            <p>
              Dessa villkor ska tolkas enligt svensk rätt.
            </p>
          </section>

          <div className={styles.infoBox}>
            Senast uppdaterad: 2026-04-24. Innan UTravel går live bör dessa
            villkor granskas juridiskt och kompletteras med korrekt
            organisationsnummer, bolagsadress och eventuella faktiska avgifter.
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}