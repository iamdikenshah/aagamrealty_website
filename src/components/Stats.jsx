import { useEffect, useRef, useState } from "react";
import { stats } from "../data/content";

function StatNumber({ target, suffix, started }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!started) return;
    const duration = 1600;
    let start = null;
    let raf;

    const step = (timestamp) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress); // easeOutQuad
      setValue(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, target]);

  return (
    <div className="stat-number">
      {value}
      {suffix}
    </div>
  );
}

export default function Stats() {
  const sectionRef = useRef(null);
  const [started, setStarted] = useState(false);

  // Kick off the count-up once the section is ~35% visible.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      setStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStarted(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="stats" id="stats" aria-label="Our track record" ref={sectionRef}>
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat) => (
            <div className="stat" key={stat.label}>
              <StatNumber target={stat.target} suffix={stat.suffix} started={started} />
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
