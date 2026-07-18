import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "../SmartImage.jsx";

/**
 * Fullscreen, tabbed image viewer (Adani-Realty style). Opens over the whole
 * screen with category tabs (Outdoor / Interior / Project Status / …), a large
 * main image with prev/next controls, a caption + "Artistic Impression" style
 * tag, and a scrollable thumbnail strip for the active category.
 *
 * @param {object}   props
 * @param {object[]} props.gallery     [{ url, category, caption?, tag? }, …]
 * @param {string}   props.title       Property title (header).
 * @param {number}   [props.startIndex=0]  Global gallery index to open on.
 * @param {() => void} props.onClose
 */
export default function PropertyLightbox({ gallery, title, startIndex = 0, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  const activeThumbRef = useRef(null);

  // The category field is optional, but this view *groups and navigates* by it —
  // so uncategorised images need a real bucket rather than an `undefined` key,
  // which would render as an empty, unlabelled tab.
  const UNCATEGORISED = "Other";
  const items = useMemo(
    () => gallery.map((g) => ({ ...g, cat: g.category?.trim() || UNCATEGORISED })),
    [gallery]
  );

  // Ordered, de-duplicated list of categories with per-category counts.
  const categories = useMemo(() => {
    const map = new Map();
    items.forEach((g) => map.set(g.cat, (map.get(g.cat) || 0) + 1));
    return [...map.entries()].map(([name, count]) => ({ name, count }));
  }, [items]);

  const active = items[current] || items[0];
  const activeCat = active?.cat;

  // Global indices of the images in the currently-active category, in order.
  const catIndices = useMemo(
    () => items.map((g, i) => (g.cat === activeCat ? i : -1)).filter((i) => i >= 0),
    [items, activeCat]
  );
  const posInCat = catIndices.indexOf(current);

  const go = useCallback(
    (dir) => {
      if (!catIndices.length) return;
      const next = (posInCat + dir + catIndices.length) % catIndices.length;
      setCurrent(catIndices[next]);
    },
    [catIndices, posInCat]
  );

  const selectCategory = (name) => {
    const first = items.findIndex((g) => g.cat === name);
    if (first >= 0) setCurrent(first);
  };

  // Keyboard: Esc closes, arrows navigate. Lock body scroll while open.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  // Keep the active thumbnail in view as the selection / category changes.
  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [current]);

  if (!active) return null;

  return (
    <div className="prop-lightbox" role="dialog" aria-modal="true" aria-label={`${title} gallery`}>
      <div className="prop-lightbox__bar">
        <button type="button" className="prop-lightbox__close" onClick={onClose} aria-label="Close gallery">
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
        <h2 className="prop-lightbox__title">{title}</h2>
      </div>

      {categories.length > 1 && (
        <div className="prop-lightbox__tabs" role="tablist">
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              role="tab"
              aria-selected={c.name === activeCat}
              className={`prop-lightbox__tab${c.name === activeCat ? " active" : ""}`}
              onClick={() => selectCategory(c.name)}
            >
              {c.name} ({c.count})
            </button>
          ))}
        </div>
      )}

      <div className="prop-lightbox__stage">
        {catIndices.length > 1 && (
          <button
            type="button"
            className="prop-lightbox__nav prop-lightbox__nav--prev"
            onClick={() => go(-1)}
            aria-label="Previous image"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
        )}

        <figure className="prop-lightbox__figure">
          <div className="prop-lightbox__imgwrap">
            <span className="prop-lightbox__imgbox">
              <img src={active.url} alt={active.caption || active.cat} />
              {active.tag && <span className="prop-lightbox__tag">{active.tag}</span>}
            </span>
          </div>
          {active.caption && <figcaption className="prop-lightbox__caption">{active.caption}</figcaption>}
        </figure>

        {catIndices.length > 1 && (
          <button
            type="button"
            className="prop-lightbox__nav prop-lightbox__nav--next"
            onClick={() => go(1)}
            aria-label="Next image"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="prop-lightbox__thumbs">
        {items.map((g, gi) => {
          const isActive = gi === current;
          // Mark the start of each category group so the strip reads as sections.
          const isGroupStart = gi === 0 || items[gi - 1].cat !== g.cat;
          return (
            <button
              key={`${g.url}-${gi}`}
              type="button"
              ref={isActive ? activeThumbRef : null}
              className={`prop-lightbox__thumb${isActive ? " active" : ""}${isGroupStart && gi !== 0 ? " group-start" : ""}`}
              onClick={() => setCurrent(gi)}
              aria-label={g.caption || g.cat}
              title={`${g.cat}${g.caption ? " · " + g.caption : ""}`}
            >
              <SmartImage src={g.url} alt="" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
