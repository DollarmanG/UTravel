import { Link } from "react-router-dom";
import styles from "../styles/SiteHeader.module.css";

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="Utravel startsida">
          <span className={styles.logoText}>UTravel</span>
          <span className={styles.logoAccent} />
          <span className={styles.logoMark}>✦</span>
        </Link>

        <div className={styles.actions}>
          <button type="button" className={styles.bookingButton}>
            Hitta bokning
          </button>
        </div>
      </div>
    </header>
  );
}