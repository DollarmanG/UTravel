import styles from "../styles/BookingSteps.module.css";

const DEFAULT_STEPS = [
  "Sökning",
  "Erbjudande",
  "Resenärer",
  "Betalning",
  "Bekräftelse",
];

export default function BookingSteps({
  currentStep = 1,
  steps = DEFAULT_STEPS,
}) {
  return (
    <div className={styles.wrapper} aria-label="Bokningssteg">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div key={step} className={styles.stepGroup}>
            <div className={styles.stepItem}>
              <div
                className={`${styles.stepCircle} ${
                  isCompleted ? styles.completed : ""
                } ${isActive ? styles.active : ""}`}
              >
                {isCompleted ? "✓" : stepNumber}
              </div>

              <span
                className={`${styles.stepLabel} ${
                  isCompleted || isActive ? styles.stepLabelStrong : ""
                }`}
              >
                {step}
              </span>
            </div>

            {index < steps.length - 1 ? <div className={styles.line} /> : null}
          </div>
        );
      })}
    </div>
  );
}