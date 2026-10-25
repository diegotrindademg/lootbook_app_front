import { BlockIconBox } from "@/shared/components/ui/BlockIcon";
import Icon from "@/shared/components/ui/Icon";
import { BLOCK_PRESET_SHELVES, BLOCK_TYPE_LABEL, type BlockPreset } from "../../data/blockPresets";
import styles from "./BlockLibrary.module.css";

type BlockLibraryProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onPick: (preset: BlockPreset) => void;
  onClose: () => void;
};

/**
 * The block library (design `BlockLibrary`, frames 03.0 and 04.0; plan M0 L1, L2): search, five
 * shelves, twenty presets in two columns, each added empty. It opens from the editor only.
 * The search matches a preset's name or its type ("res" finds every Resource).
 */
export default function BlockLibrary({ query, onQueryChange, onPick, onClose }: BlockLibraryProps) {
  const needle = query.trim().toLowerCase();
  const shelves = BLOCK_PRESET_SHELVES.map((shelf) => ({
    ...shelf,
    presets: shelf.presets.filter(
      (preset) =>
        !needle ||
        preset.title.toLowerCase().includes(needle) ||
        BLOCK_TYPE_LABEL[preset.type].toLowerCase().includes(needle),
    ),
  })).filter((shelf) => shelf.presets.length);

  return (
    <div className={styles.library}>
      <div className={styles.header}>
        <h2 className={styles.title}>Add a block</h2>
        <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          <Icon name="close" size={16} />
        </button>
      </div>
      <label className={styles.search}>
        <Icon name="search" size={18} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search blocks"
          aria-label="Search blocks"
          value={query}
          data-autofocus
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <div className={styles.body}>
        {shelves.length ? (
          shelves.map((shelf, index) => (
            <section key={shelf.title} className={styles.shelf} aria-labelledby={`library-shelf-${index}`}>
              <h3 id={`library-shelf-${index}`} className={styles.shelfTitle}>
                {shelf.title}
              </h3>
              <div className={styles.grid}>
                {shelf.presets.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    className={styles.entry}
                    onClick={() => onPick(preset)}
                    aria-label={`${preset.title}, ${BLOCK_TYPE_LABEL[preset.type]}`}
                  >
                    <BlockIconBox icon={preset.icon} size={32} />
                    <span className={styles.entryCopy}>
                      <span className={styles.entryTitle}>{preset.title}</span>
                      <span className={styles.entryType}>{BLOCK_TYPE_LABEL[preset.type]}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))
        ) : (
          <p className={styles.noMatch} role="status">
            No block matches “{query.trim()}”.
          </p>
        )}
      </div>
    </div>
  );
}
