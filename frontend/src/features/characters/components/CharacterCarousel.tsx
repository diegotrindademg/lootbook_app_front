import { useRef, useState } from "react";
import styles from "./CharacterCarousel.module.css";

const SLOT_PITCH = 286; // card width 292 with the 6px peek overlap

export type CarouselSlide = {
  key: string;
  render: (active: boolean) => React.ReactNode;
};

/**
 * The swipeable row of cards: the centred card is full size, its neighbours peek at a smaller scale.
 * Page dots under it say where you are.
 */
export default function CharacterCarousel({ slides }: { slides: CarouselSlide[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = Math.min(activeIndex, Math.max(slides.length - 1, 0));

  return (
    <>
      <div
        ref={scrollRef}
        className={styles.scroller}
        onScroll={(event) =>
          setActiveIndex(Math.max(0, Math.round(event.currentTarget.scrollLeft / SLOT_PITCH)))
        }
      >
        {slides.map((slide, index) => (
          <div key={slide.key} className={styles.slot}>
            {slide.render(index === active)}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <div className={styles.dots} aria-hidden="true">
          {slides.map((slide, index) => (
            <span key={slide.key} className={index === active ? `${styles.dot} ${styles.dotActive}` : styles.dot} />
          ))}
        </div>
      )}
    </>
  );
}
