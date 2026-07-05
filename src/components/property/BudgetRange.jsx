/**
 * A dual-thumb budget range slider (zero-dependency — two overlaid range inputs).
 * Values are absolute rupees; a thumb sitting at a domain edge is reported as
 * `null` (i.e. "no bound") so it doesn't create a spurious filter.
 *
 * @param {object}   props
 * @param {number}   props.min        Domain minimum.
 * @param {number}   props.max        Domain maximum.
 * @param {number}   props.step
 * @param {number?}  props.valueMin   Current lower selection (null = at min).
 * @param {number?}  props.valueMax   Current upper selection (null = at max).
 * @param {(v:{budgetMin:number|null, budgetMax:number|null})=>void} props.onChange
 * @param {(n:number)=>string} props.format  Label formatter.
 */
export default function BudgetRange({ min, max, step, valueMin, valueMax, onChange, format }) {
  const lo = valueMin ?? min;
  const hi = valueMax ?? max;
  const pct = (v) => ((v - min) / (max - min)) * 100;

  const emit = (nextLo, nextHi) =>
    onChange({
      budgetMin: nextLo <= min ? null : nextLo,
      budgetMax: nextHi >= max ? null : nextHi,
    });

  // Keep the thumbs from crossing (min stays at least one step below max).
  const onLo = (e) => emit(Math.min(Number(e.target.value), hi - step), hi);
  const onHi = (e) => emit(lo, Math.max(Number(e.target.value), lo + step));

  return (
    <div className="range">
      <div className="range__slider">
        <div className="range__rail" />
        <div className="range__fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          className="range__input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={onLo}
          aria-label="Minimum budget"
        />
        <input
          className="range__input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={onHi}
          aria-label="Maximum budget"
        />
      </div>
      <div className="range__labels">
        <span>{format(lo)}</span>
        <span>{valueMax == null ? `${format(hi)}+` : format(hi)}</span>
      </div>
    </div>
  );
}
