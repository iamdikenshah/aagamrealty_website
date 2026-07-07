import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOutAdmin } from "../firebase/auth";
import { useAuth } from "./useAuth";
import { adminName, initials } from "./format";

const NAV = [
  { to: "/", label: "Dashboard", icon: "fa-gauge", end: true },
  { to: "/properties", label: "Properties", icon: "fa-building" },
  { to: "/testimonials", label: "Testimonials", icon: "fa-quote-left" },
  { to: "/enquiries", label: "Enquiries", icon: "fa-inbox" },
  { to: "/lists", label: "Lists", icon: "fa-list-check" },
  { to: "/faqs", label: "FAQs", icon: "fa-circle-question" },
  { to: "/settings", label: "Settings", icon: "fa-gear" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOutAdmin();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`admin-shell${menuOpen ? " admin-shell--menu-open" : ""}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <img src="/images/app_logo_footer.png" alt="Aagam Realty" className="admin-sidebar__logo-img" />
        </div>

        <nav className="admin-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav__link${isActive ? " is-active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__foot">
          <a className="admin-nav__link" href="/" target="_blank" rel="noopener noreferrer">
            <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /> View site
          </a>
          <button type="button" className="admin-nav__link admin-nav__signout" onClick={handleSignOut}>
            <i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-topbar__menu"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <i className="fa-solid fa-bars" aria-hidden="true" />
          </button>
          {user?.email && (
            <span className="admin-topbar__user">
              <span className="admin-topbar__avatar" aria-hidden="true">{initials(adminName(user))}</span>
              {adminName(user)}
            </span>
          )}
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {menuOpen && <div className="admin-backdrop" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}
