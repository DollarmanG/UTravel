import styles from "../styles/SiteFooter.module.css";
import Logo from "./Logo";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brandColumn}>
            <div className={styles.brandBlock}>
              <Logo
                className={styles.footerLogo}
                textClassName={styles.footerLogoText}
                planeClassName={styles.footerLogoPlane}
              />

              <p className={styles.brandText}>
                Din partner för minnesvärda resor sedan 2025.
              </p>

              {/*
                Sociala medier - sparas för framtida användning

                <div className={styles.socials}>
                  <a href="#" aria-label="Instagram" className={styles.socialLink}>
                    <span className={styles.socialFallback}>ig</span>
                  </a>

                  <a href="#" aria-label="Facebook" className={styles.socialLink}>
                    <span className={styles.socialFallback}>f</span>
                  </a>
                </div>
              */}
            </div>
          </div>

          <div className={styles.linkColumn}>
            <h3 className={styles.columnTitle}>Information</h3>
            <a href="#" className={styles.footerLink}>Om oss</a>
            <a href="#" className={styles.footerLink}>Resevillkor</a>
            <a href="#" className={styles.footerLink}>Integritetspolicy</a>
            <a href="#" className={styles.footerLink}>Cookies</a>
          </div>

          <div className={styles.linkColumn}>
            <h3 className={styles.columnTitle}>Kundservice</h3>
            <a href="#" className={styles.footerLink}>Vanliga frågor</a>
            <a href="#" className={styles.footerLink}>Betalning & bokning</a>
            <a href="#" className={styles.footerLink}>Avbokning & ändringar</a>
            <a href="#" className={styles.footerLink}>Kontakta oss</a>
          </div>

          <div className={styles.contactColumn}>
            <h3 className={styles.columnTitle}>Kontakt</h3>

            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>☎</span>
              <span>08-123 45 67</span>
            </div>

            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>✉</span>
              <span>info@utravel.se</span>
            </div>

            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>◷</span>
              <span>Mån–Fre 09:00–17:00</span>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <span className={styles.copy}>
            © 2025 Ya Ra AB All rights reserved
          </span>
        </div>
      </div>
    </footer>
  );
}