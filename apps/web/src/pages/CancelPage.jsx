import { useNavigate } from "react-router-dom";
import styles from "../styles/CancelPage.module.css";

export default function CancelPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <span className={styles.badge}>Betalning avbruten</span>

          <h1 className={styles.title}>Din bokning slutfördes inte</h1>

          <p className={styles.text}>
            Ingen fara. Din betalning avbröts innan bokningen bekräftades. Du kan
            gå tillbaka och välja en resa igen när du vill.
          </p>

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              onClick={() => navigate("/")}
            >
              Till startsidan
            </button>

            <button
              className={styles.secondaryButton}
              onClick={() => navigate(-1)}
            >
              Gå tillbaka
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}