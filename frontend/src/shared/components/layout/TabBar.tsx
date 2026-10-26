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
  /** Shown but out of reach while a dialog or menu is over the screen (wide keeps the bar on screen). */
  inert?: boolean;
};

/**
 * The floating tab bar (design S7, Figma "Tab bar" 2352:2360): four equal slots with Create exactly in
 * the centre, so it never moves between screens. Labels are 14px, which does not fit four slots, so
 * only the current tab shows its label (it may run past its slot); the others are icon only and carry
 * their name as the accessible name.
 */
export default function TabBar({ activeId, createHref, onSearch, hidden = false, inert = false }: TabBarProps) {
  const tab = (item: TabItem) => {
    const active = item.id === activeId;
    return (
      <Link
        key={item.id}
        href={item.href}
        className={active ? `${styles.slot} ${styles.active}` : styles.slot}
        aria-label={active ? undefined : item.label}
        aria-current={active ? "page" : undefined}
      >
        <Icon name={item.icon} size={22} />
        {active && <span className={styles.label}>{item.label}</span>}
      </Link>
    );
  };

  return (
    <nav
      className={hidden ? `${styles.tabBar} ${styles.hidden}` : styles.tabBar}
      aria-label="Main"
      aria-hidden={hidden || undefined}
      inert={hidden || inert || undefined}
    >
      {LEFT.map(tab)}
      <div className={styles.createSlot}>
        <Link href={createHref} className={styles.create} aria-label="Create">
          <Icon name="plus" size={26} strokeWidth={3} />
        </Link>
      </div>
      {tab(SETTINGS)}
      {onSearch ? (
        <button type="button" className={styles.slot} aria-label="Search" onClick={onSearch}>
          <Icon name="search" size={22} />
        </button>
      ) : (
        <Link href="/?search=1" className={styles.slot} aria-label="Search">
          <Icon name="search" size={22} />
        </Link>
      )}
    </nav>
  );
}
