import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Custom dropdown for the admin forms — same interaction pattern as the public
 * site's HeroSelect (portaled menu that never clips and flips up when needed),
 * styled to match the admin inputs. Replaces native <select> so the admin's
 * dropdowns look consistent with the rest of the site.
 *
 * @param {object} props
 * @param {string} props.value
 * @param {(v:string)=>void} props.onChange
 * @param {Array<string | {value:string,label:string}>} props.options
 * @param {string} [props.placeholder]  shown when value is empty/unmatched
 * @param {boolean} [props.disabled]
 * @param {string} [props.ariaLabel]
 */
export default function AdminSelect({ value, onChange, options, placeholder = "Select…", disabled, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const controlRef = useRef(null);
  const menuRef = useRef(null);

  const norm = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const selected = norm.find((o) => o.value === value);

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
      maxHeight: Math.max(160, Math.min(360, avail)),
    });
  };

  useLayoutEffect(() => { if (open) computePos(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (controlRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
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

  const pick = (v) => { onChange(v); setOpen(false); };

  return (
    <div className={`admin-select${open ? " open" : ""}${disabled ? " is-disabled" : ""}`}>
      <button
        ref={controlRef}
        type="button"
        className="admin-select__control"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`admin-select__value${selected ? "" : " is-placeholder"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <i className="fa-solid fa-chevron-down admin-select__caret" aria-hidden="true" />
      </button>

      {open && pos &&
        createPortal(
          <ul
            ref={menuRef}
            className="admin-select__menu"
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
            {norm.map((o) => (
              <li key={o.value || "__empty"} role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  className={`admin-select__option${o.value === value ? " selected" : ""}`}
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
