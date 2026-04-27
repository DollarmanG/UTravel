import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import styles from "../styles/InfoPage.module.css";

export default function PaymentBookingPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.main}>
        <article className={styles.card}>
          <span className={styles.badge}>Kundservice</span>
          <h1 className={styles.title}>Betalning & bokning</h1>

          <p className={styles.lead}>
            Här förklarar vi hur bokning och betalning fungerar hos UTravel.
          </p>

          <section className={styles.section}>
            <h2>1. Så bokar du en resa</h2>
            <p>
              När du bokar en flygresa via UTravel går processen normalt till
              så här:
            </p>
            <ul>
              <li>Du söker efter en flygresa.</li>
              <li>Du väljer ett flygerbjudande.</li>
              <li>Du fyller i passageraruppgifter.</li>
              <li>Du kontrollerar resedetaljer, pris och villkor.</li>
              <li>Du går vidare till betalning.</li>
              <li>När betalningen och bokningen är genomförd får du en bokningsbekräftelse.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>2. När är bokningen bindande?</h2>
            <p>
              Bokningen blir bindande när betalningen har genomförts och
              bokningen har bekräftats.
            </p>
            <p>
              Eftersom flygpriser och tillgänglighet kan ändras snabbt är en
              resa inte garanterad förrän bokningen är bekräftad.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Kontrollera uppgifter innan betalning</h2>
            <p>
              Innan du slutför bokningen ansvarar du för att kontrollera:
            </p>
            <ul>
              <li>Namn enligt pass eller nationell ID-handling.</li>
              <li>Födelsedatum.</li>
              <li>E-postadress.</li>
              <li>Telefonnummer.</li>
              <li>Resedatum.</li>
              <li>Destination.</li>
              <li>Flygtider.</li>
              <li>Flygbolag.</li>
              <li>Bagageinformation.</li>
              <li>Totalpris.</li>
            </ul>
            <p>
              Felaktiga uppgifter kan leda till extra kostnader eller att du
              nekas ombordstigning.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Betalningsmetoder</h2>
            <p>
              De betalningsmetoder som är tillgängliga visas i kassan.
            </p>
            <p>
              UTravel kan använda externa betalningsleverantörer för att hantera
              betalningar. UTravel lagrar inte fullständiga kortuppgifter.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Betalningsavgifter</h2>
            <p>
              Eventuella betalningsavgifter, serviceavgifter eller andra
              avgifter ska visas innan du slutför betalningen.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Valuta</h2>
            <p>
              Priser visas normalt i svenska kronor om inget annat anges. I vissa
              fall kan priset påverkas av valutakurser, flygbolagets prissättning
              eller externa avgifter.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Misslyckad betalning</h2>
            <p>
              Om betalningen misslyckas genomförs ingen bokning. Du kan behöva
              försöka igen eller välja en annan betalningsmetod.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Bokningsbekräftelse</h2>
            <p>
              När bokningen är genomförd skickas bokningsinformation till den
              e-postadress du angav vid bokning.
            </p>
            <p>
              Kontrollera alltid bokningsbekräftelsen direkt. Om något är fel
              ska du kontakta UTravel så snart som möjligt.
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. Kvitto</h2>
            <p>
              Kvitto eller betalningsbekräftelse skickas digitalt eller görs
              tillgängligt via bokningsflödet.
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. Säkerhet</h2>
            <p>
              UTravel arbetar med tekniska och organisatoriska säkerhetsåtgärder
              för att skydda boknings- och betalningsinformation.
            </p>
          </section>

          <div className={styles.infoBox}>
            Observera: Flygbiljetter omfattas normalt inte av lagstadgad
            ångerrätt. Ändring, avbokning och återbetalning sker enligt
            flygbolagets villkor.
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}