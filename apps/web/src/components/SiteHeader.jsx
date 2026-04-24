import Logo from "./Logo";
import styles from "../styles/SiteHeader.module.css";

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Logo />

        <div className={styles.actions}>
          <button type="button" className={styles.bookingButton}>
            Hitta bokning
          </button>
        </div>
      </div>
    </header>
  );
}