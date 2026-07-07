import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllProperties, getTestimonials, getEnquiries } from "../../firebase/firestore";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getAllProperties(), getTestimonials(), getEnquiries()])
      .then(([properties, testimonials, enquiries]) => {
        if (!active) return;
        setStats({
          properties: properties.length,
          drafts: properties.filter((p) => p.status === "draft").length,
          testimonials: testimonials.length,
          enquiries: enquiries.length,
          newEnquiries: enquiries.filter((e) => e.status === "new").length,
        });
      })
      .catch((err) => active && setError(err.message || "Failed to load dashboard."));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="admin-error">{error}</p>;
  if (!stats) return <p className="admin-muted">Loading…</p>;

  const tiles = [
    { label: "Properties", value: stats.properties, sub: `${stats.drafts} draft`, to: "/properties", icon: "fa-building" },
    { label: "New enquiries", value: stats.newEnquiries, sub: `${stats.enquiries} total`, to: "/enquiries", icon: "fa-inbox" },
    { label: "Testimonials", value: stats.testimonials, sub: "published", to: "/testimonials", icon: "fa-quote-left" },
  ];

  return (
    <div>
      <h1 className="admin-h1">Dashboard</h1>
      <div className="admin-tiles">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className="admin-tile">
            <i className={`fa-solid ${t.icon} admin-tile__icon`} aria-hidden="true" />
            <span className="admin-tile__value">{t.value}</span>
            <span className="admin-tile__label">{t.label}</span>
            <span className="admin-tile__sub">{t.sub}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
