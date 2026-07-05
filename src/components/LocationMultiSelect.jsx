import { useEffect, useRef, useState } from "react";
import { locationOptions } from "../data/content";

export default function LocationMultiSelect({ selected, onChange, invalid }) {
  const [open, setOpen] = useState(false);
  const groupRef = useRef(null);

  // Close when clicking outside the group.
  useEffect(() => {
    const onDocClick = (e) => {
      if (groupRef.current && !groupRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const toggleValue = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const label =
    selected.length === 0
      ? "Select location(s)"
      : selected.length <= 2
      ? selected.join(", ")
      : `${selected.length} locations selected`;

  const groupClasses = [
    "multiselect",
    open ? "open" : "",
    invalid ? "invalid" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      className={groupClasses}
      id="locationGroup"
      ref={groupRef}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="multiselect-trigger"
        id="locationTrigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="locationLabel"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`multiselect-value${selected.length === 0 ? " placeholder" : ""}`}>
          {label}
        </span>
        <i className="fa-solid fa-chevron-down multiselect-caret" aria-hidden="true" />
      </button>

      <div className="multiselect-panel" role="listbox" aria-multiselectable="true">
        {locationOptions.map((option) => (
          <label className="ms-option" key={option}>
            <input
              type="checkbox"
              name="locations"
              value={option}
              checked={selected.includes(option)}
              onChange={() => toggleValue(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
