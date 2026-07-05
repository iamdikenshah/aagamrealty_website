import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * A lightweight custom dropdown used in the hero search. It replaces the native
 * <select> because native option popups mis-anchor (jump to the page's top-left)
 * on several mobile browsers / emulators.
 *
 * The option list is rendered in a portal to <body> with fixed positioning, so
 * no ancestor's `overflow: hidden` (the hero has one) can clip it, and it flips
 * above the control when there isn't enough room below.
 *
 * @param {object}   props
 * @param {string}   props.icon        Font Awesome class for the leading icon.
 * @param {string}   props.value       Currently selected value.
 * @param {{value:string,label:string}[]} props.options
 * @param {(v:string)=>void} props.onChange
 * @param {string}   props.ariaLabel
 */
export default function HeroSelect({ icon, value, options, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const controlRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];

  // Position the portaled menu relative to the control, flipping up if needed.
  const computePos = () => {
    const el = controlRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
    const avail = (openUp ? spaceAbove : spaceBelow) - 16;
    setPos({
      left: r.left,
      width: r.width,
      top: openUp ? undefined : Math.round(r.bottom + 6),
      bottom: openUp ? Math.round(window.innerHeight - r.top + 6) : undefined,
      maxHeight: Math.max(160, Math.min(420, avail)),
    });
  };

  useLayoutEffect(() => {
    if (open) computePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (controlRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    // Close on page scroll/resize (a fixed menu would otherwise drift from the
    // control) — but ignore scrolling *inside* the menu itself.
    const onReflow = (e) => {
      if (e?.type === "scroll" && menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open]);

  const pick = (v) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className={`hero-select${open ? " open" : ""}`}>
      <button
        ref={controlRef}
        type="button"
        className="hero-select__control"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <i className={`fa-solid ${icon} hero-select__icon`} aria-hidden="true" />
        <span className="hero-select__value">{selected?.label}</span>
        <i className="fa-solid fa-chevron-down hero-select__caret" aria-hidden="true" />
      </button>

      {open && pos &&
        createPortal(
          <ul
            ref={menuRef}
            className="hero-select__menu"
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              left: pos.left,
              width: pos.width,
              right: "auto",
              top: pos.top,
              bottom: pos.bottom,
              maxHeight: pos.maxHeight,
              zIndex: 1200,
            }}
          >
            {options.map((o) => (
              <li key={o.value || "any"} role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  className={`hero-select__option${o.value === value ? " selected" : ""}`}
                  onClick={() => pick(o.value)}
                >
                  {o.label}
                  {o.value === value && <i className="fa-solid fa-check" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  );
}
