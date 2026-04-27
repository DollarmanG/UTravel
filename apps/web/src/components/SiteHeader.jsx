import { Link } from "react-router-dom";
import Logo from "./Logo";
import styles from "../styles/SiteHeader.module.css";

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Logo
          className={styles.logo}
          textClassName={styles.logoText}
          planeClassName={styles.logoPlane}
        />

        <div className={styles.actions}>
          <Link to="/hitta-bokning" className={styles.bookingButton}>
            Hitta bokning
          </Link>
        </div>
      </div>
    </header>
  );
}