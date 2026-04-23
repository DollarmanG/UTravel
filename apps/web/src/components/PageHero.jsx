import styles from "../styles/PageHero.module.css";

export default function PageHero({
  title,
  subtitle,
  backgroundImage,
  centered = true,
  compact = false,
  children,
}) {
  const heroStyle = backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.48), rgba(15, 23, 42, 0.52)), url(${backgroundImage})`,
      }
    : undefined;

  return (
    <section
      className={`${styles.hero} ${compact ? styles.heroCompact : ""}`}
      style={heroStyle}
    >
      <div className={styles.overlay} />
      <div className={styles.inner}>
        <div
          className={`${styles.content} ${centered ? styles.centered : styles.left}`}
        >
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>

        {children ? <div className={styles.bottomSlot}>{children}</div> : null}
      </div>
    </section>
  );
}