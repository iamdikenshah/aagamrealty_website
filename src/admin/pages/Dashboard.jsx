import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllProperties, getTestimonials, getEnquiries } from "../../firebase/firestore";
import { useAuth } from "../useAuth";
import { timeAgo, initials, avatarGradient } from "../format";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getAllProperties(), getTestimonials(), getEnquiries()])
      .then(([properties, testimonials, enquiries]) => {
        if (!active) return;
        setData({ properties, testimonials, enquiries });
      })
      .catch((err) => active && setError(err.message || "Failed to load dashboard."));
    return () => { active = false; };
  }, []);

  if (error) return <p className="admin-error">{error}</p>;
  if (!data) return <p className="admin-muted">Loading…</p>;

  const { properties, testimonials, enquiries } = data;
  const published = properties.filter((p) => p.status === "active").length;
  const drafts = properties.filter((p) => (p.status || "active") !== "active").length;
  const newEnquiries = enquiries.filter((e) => e.status === "new").length;
  const name = (user?.email || "").split("@")[0];

  const stats = [
    { key: "props", label: "Properties", value: properties.length, sub: `${published} published · ${drafts} draft`, to: "/properties", icon: "fa-building" },
    { key: "enq", label: "New enquiries", value: newEnquiries, sub: `${enquiries.length} total`, to: "/enquiries", icon: "fa-inbox", alert: newEnquiries > 0 },
    { key: "test", label: "Testimonials", value: testimonials.length, sub: `${testimonials.filter((t) => t.featured).length} featured`, to: "/testimonials", icon: "fa-quote-left" },
    { key: "feat", label: "Featured listings", value: properties.filter((p) => p.featured).length, sub: "shown on homepage", to: "/properties", icon: "fa-star" },
  ];

  const recent = [...enquiries]
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
    .slice(0, 5);

  return (
    <div className="admin-dash">
      <header className="admin-hero">
        <div className="admin-hero__text">
          <p className="admin-hero__eyebrow">{greeting()}</p>
          <h1 className="admin-hero__title">{name ? name.charAt(0).toUpperCase() + name.slice(1) : "Welcome back"}</h1>
          <p className="admin-hero__sub">Here's what's happening across Aagam Realty today.</p>
        </div>
        <div className="admin-hero__actions">
          <Link to="/properties" className="admin-btn admin-btn--gold">
            <i className="fa-solid fa-plus" aria-hidden="true" /> New property
          </Link>
          <Link to="/enquiries" className="admin-btn admin-hero__ghost">
            <i className="fa-solid fa-inbox" aria-hidden="true" /> View enquiries
          </Link>
        </div>
      </header>

      <div className="admin-stats">
        {stats.map((s) => (
          <Link key={s.key} to={s.to} className="admin-stat">
            <span className="admin-stat__icon"><i className={`fa-solid ${s.icon}`} aria-hidden="true" /></span>
            <span className="admin-stat__value">
              {s.value}
              {s.alert && <span className="admin-stat__dot" title="Needs attention" />}
            </span>
            <span className="admin-stat__label">{s.label}</span>
            <span className="admin-stat__sub">{s.sub}</span>
          </Link>
        ))}
      </div>

      <section className="admin-panel">
        <header className="admin-panel__head">
          <h2 className="admin-panel__title"><i className="fa-solid fa-inbox" aria-hidden="true" /> Recent enquiries</h2>
          <Link to="/enquiries" className="admin-panel__link">View all <i className="fa-solid fa-arrow-right" aria-hidden="true" /></Link>
        </header>

        {recent.length === 0 ? (
          <p className="admin-muted admin-panel__empty">No enquiries yet.</p>
        ) : (
          <ul className="admin-feed">
            {recent.map((e) => (
              <li key={e.id} className="admin-feed__row">
                <span className="admin-avatar admin-avatar--sm" style={{ background: avatarGradient(e.name || e.email) }}>
                  {initials(e.name)}
                </span>
                <div className="admin-feed__main">
                  <span className="admin-feed__name">{e.name || "Unknown"}</span>
                  <span className="admin-feed__meta">
                    {e.propertyId ? `Enquired about ${e.propertyId}` : e.email || e.phone || "New enquiry"}
                  </span>
                </div>
                <span className={`admin-badge admin-badge--${e.status || "new"}`}>{e.status || "new"}</span>
                <span className="admin-feed__time">{timeAgo(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
