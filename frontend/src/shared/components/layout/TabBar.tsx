import Link from "next/link";
import Icon, { type IconName } from "@/shared/components/ui/Icon";
import styles from "./TabBar.module.css";

export type TabBarId = "characters" | "equipments" | "settings" | "search";

type TabItem = { id: Exclude<TabBarId, "search">; label: string; icon: IconName; href: string };

const LEFT: TabItem[] = [
  { id: "characters", label: "Characters", icon: "users", href: "/" },
  { id: "equipments", label: "Equipments", icon: "sword", href: "/equipments" },
];
const SETTINGS: TabItem = { id: "settings", label: "Settings", icon: "settings", href: "/settings" };

type TabBarProps = {
  activeId: TabBarId;
  /** Where Create (+) goes from this screen: a new character on Characters, new equipment on Equipments. */
  createHref: string;
  /** Search is an action, not a place: on the character screen it focuses the search field. */
  onSearch?: () => void;
  hidden?: boolean;
};

/**
 * The floating tab bar (design S7): Characters, Equipments, Create, Settings, Search.
 * The design labels every tab at 10px; at the 14px floor four labels do not fit beside Create, so
 * only the current tab shows its label and the others carry it as their accessible name.
 */
export default function TabBar({ activeId, createHref, onSearch, hidden = false }: TabBarProps) {
  const tab = (item: TabItem) => {
    const active = item.id === activeId;
    return (
      <Link
        key={item.id}
        href={item.href}
        className={active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
        aria-label={active ? undefined : item.label}
        aria-current={active ? "page" : undefined}
      >
        <Icon name={item.icon} size={22} />
        {active && <span className={styles.label}>{item.label}</span>}
      </Link>
    );
  };

  const searchActive = activeId === "search";
  const searchClass = searchActive ? `${styles.tab} ${styles.tabActive}` : styles.tab;
  const searchContent = (
    <>
      <Icon name="search" size={22} />
      {searchActive && <span className={styles.label}>Search</span>}
    </>
  );

  return (
    <nav
      className={hidden ? `${styles.tabBar} ${styles.hidden}` : styles.tabBar}
      aria-label="Main"
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      {LEFT.map(tab)}
      <Link href={createHref} className={styles.create} aria-label="Create">
        <Icon name="plus" size={26} strokeWidth={3} />
      </Link>
      {tab(SETTINGS)}
      {onSearch ? (
        <button type="button" className={searchClass} aria-label="Search" onClick={onSearch}>
          {searchContent}
        </button>
      ) : (
        <Link href="/?search=1" className={searchClass} aria-label="Search">
          {searchContent}
        </Link>
      )}
    </nav>
  );
}
