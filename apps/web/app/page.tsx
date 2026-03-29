import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>GBSW Platform</p>
        <h1 className={styles.title}>사이트가 실행 중입니다.</h1>
        <p className={styles.description}>
          필요한 준비는 끝났고, 이제 원하는 기능을 붙이면 됩니다.
        </p>
      </section>
    </main>
  );
}
