import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import styles from "../styles/InfoPage.module.css";

export default function CancellationChangesPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.main}>
        <article className={styles.card}>
          <span className={styles.badge}>Kundservice</span>
          <h1 className={styles.title}>Avbokning & ändringar</h1>

          <p className={styles.lead}>
            Möjligheten att ändra eller avboka en flygresa beror på flygbolagets
            regler och den biljettyp du har valt.
          </p>

          <section className={styles.section}>
            <h2>1. Kan jag avboka min flygresa?</h2>
            <p>
              Det beror på flygbolagets villkor och biljettens regler. Vissa
              biljetter är återbetalningsbara, vissa är delvis
              återbetalningsbara och andra är inte återbetalningsbara.
            </p>
            <p>
              Om du vill avboka din resa ska du kontakta UTravel så snart som
              möjligt.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Ingen lagstadgad ångerrätt</h2>
            <p>
              Flygbiljetter omfattas normalt inte av lagstadgad ångerrätt. Det
              innebär att du inte automatiskt kan ångra köpet efter genomförd
              bokning.
            </p>
            <p>
              Avbokning och eventuell återbetalning sker enligt flygbolagets
              villkor.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Återbetalning</h2>
            <p>
              Om din biljett är återbetalningsbar hjälper UTravel dig att begära
              återbetalning enligt flygbolagets regler.
            </p>
            <p>
              Eventuell återbetalning kan påverkas av:
            </p>
            <ul>
              <li>Flygbolagets regler.</li>
              <li>Biljettens villkor.</li>
              <li>Skatter och avgifter.</li>
              <li>Betalningsavgifter.</li>
              <li>Serviceavgifter.</li>
              <li>Administrativa avgifter.</li>
              <li>Tidpunkt för avbokning.</li>
            </ul>
            <p>
              Serviceavgifter och administrativa avgifter kan vara icke
              återbetalningsbara om detta framgått vid köp.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Flygskatter och avgifter</h2>
            <p>
              Även om en biljett inte är återbetalningsbar kan vissa skatter
              eller avgifter vara möjliga att få tillbaka, beroende på
              flygbolagets regler och gällande rätt.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Kan jag ändra min resa?</h2>
            <p>
              Det beror på flygbolagets regler och biljettypen.
            </p>
            <p>
              Vid ändring kan följande kostnader tillkomma:
            </p>
            <ul>
              <li>Flygbolagets ändringsavgift.</li>
              <li>Eventuell prisskillnad mellan gammal och ny biljett.</li>
              <li>UTravels serviceavgift.</li>
              <li>Eventuella avgifter från bokningssystem eller betalningsleverantör.</li>
            </ul>
            <p>
              En ändring är inte bekräftad förrän flygbolaget eller
              bokningssystemet har bekräftat ändringen.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Namnändring</h2>
            <p>
              Flygbolag har ofta strikta regler för namnändringar. I vissa fall
              är namnändring inte tillåten och en ny biljett kan behöva köpas.
            </p>
            <p>
              Kontrollera alltid att namnet stämmer exakt med pass eller
              nationell ID-handling innan du betalar.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. No-show</h2>
            <p>
              Om du inte checkar in eller inte dyker upp till flyget kan
              flygbolaget markera dig som no-show. Det kan innebära att hela
              eller delar av resan avbokas automatiskt av flygbolaget.
            </p>
            <p>
              UTravel ansvarar inte för kostnader som uppstår på grund av
              no-show.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Inställda eller ändrade flyg</h2>
            <p>
              Om flygbolaget ställer in eller ändrar en flygning hjälper UTravel
              dig med information och hantering i den mån det är möjligt.
            </p>
            <p>
              Flygbolaget ansvarar för själva transporten och de alternativ som
              erbjuds enligt flygbolagets regler och tillämplig
              passagerarlagstiftning.
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. Så kontaktar du oss</h2>
            <p>
              Kontakta oss via:
            </p>
            <p>
              E-post: info@utravel.se<br />
              Telefon: 08-123 45 67
            </p>
            <p>
              Ange alltid:
            </p>
            <ul>
              <li>Bokningsreferens.</li>
              <li>Efternamn.</li>
              <li>E-postadress som användes vid bokning.</li>
              <li>Vad du vill ändra eller avboka.</li>
            </ul>
          </section>

          <div className={styles.infoBox}>
            Viktigt: Avbokning eller ändring är inte garanterad förrän den har
            bekräftats av flygbolaget eller bokningssystemet.
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}