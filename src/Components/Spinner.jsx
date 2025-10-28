import styles from "./Spinner.module.css";

function Spinner() {
  return (
    <div className={styles.spinnerContainer} style={{ height: "200px" }}>
      <div className={styles.spinner}></div>
    </div>
  );
}

export default Spinner;
