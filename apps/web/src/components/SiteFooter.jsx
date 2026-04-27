import { Link } from "react-router-dom";
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
            </div>
          </div>

          <div className={styles.linkColumn}>
            <h3 className={styles.columnTitle}>Information</h3>
            <Link to="/om-oss" className={styles.footerLink}>Om oss</Link>
            <Link to="/resevillkor" className={styles.footerLink}>Resevillkor</Link>
            <Link to="/integritetspolicy" className={styles.footerLink}>Integritetspolicy</Link>
            <Link to="/cookies" className={styles.footerLink}>Cookies</Link>
          </div>

          <div className={styles.linkColumn}>
            <h3 className={styles.columnTitle}>Kundservice</h3>
            <Link to="/vanliga-fragor" className={styles.footerLink}>Vanliga frågor</Link>
            <Link to="/betalning-bokning" className={styles.footerLink}>Betalning & bokning</Link>
            <Link to="/avbokning-andringar" className={styles.footerLink}>Avbokning & ändringar</Link>
            <Link to="/kontakta-oss" className={styles.footerLink}>Kontakta oss</Link>
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