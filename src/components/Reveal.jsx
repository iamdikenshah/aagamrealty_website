import { useReveal } from "../hooks/useReveal";

/**
 * Wraps children in an element that fades/slides in on scroll.
 * Renders as `as` (default <div>) and merges the `reveal`/`visible` classes.
 */
export default function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const [ref, visible] = useReveal();
  const classes = ["reveal", visible ? "visible" : "", className].filter(Boolean).join(" ");
  return (
    <Tag ref={ref} className={classes} {...rest}>
      {children}
    </Tag>
  );
}
