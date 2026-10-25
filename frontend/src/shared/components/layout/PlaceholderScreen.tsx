import AppColumn from "./AppColumn";
import TabBar, { type TabBarId } from "./TabBar";
import styles from "./PlaceholderScreen.module.css";

type PlaceholderScreenProps = {
  title: string;
  activeTab: TabBarId;
  createHref: string;
  children?: React.ReactNode;
};

/** A plain stand-in for a place the first slice reaches but does not build yet. */
export default function PlaceholderScreen({
  title,
  activeTab,
  createHref,
  children,
}: PlaceholderScreenProps) {
  return (
    <AppColumn>
      <main className={styles.placeholder}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.body}>Not built in this slice yet.</p>
        {children}
      </main>
      <TabBar activeId={activeTab} createHref={createHref} />
    </AppColumn>
  );
}
