import { Link } from "react-router-dom";
import styles from "../styles/Logo.module.css";

export default function Logo({
  className = "",
  textClassName = "",
  planeClassName = "",
}) {
  return (
    <Link
      to="/"
      className={`${styles.logo} ${className}`}
      aria-label="UTravel startsida"
    >
      <img
        src="/images/plane-logo-transparent.png"
        alt=""
        aria-hidden="true"
        className={`${styles.logoPlaneImage} ${planeClassName}`}
      />

      <span className={`${styles.logoText} ${textClassName}`}>UTravel</span>
    </Link>
  );
}