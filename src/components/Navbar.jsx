import { useEffect, useState } from "react";
import { navLinks } from "../data/content";
import { navigate, useLocation } from "../router.jsx";
import { openEnquiry } from "../enquiryStore";
import { track } from "../analytics";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const path = useLocation();
  const onHome = path === "/";

  // Add shadow/solid background once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Logo -> home. On a sub-page, route to "/"; on home, just scroll to top.
  const handleLogoClick = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    if (onHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.replaceState(null, "", window.location.pathname + window.location.search);
    } else {
      navigate("/");
    }
  };

  const closeMenu = () => setMenuOpen(false);

  // Handle a nav link click. Path links (e.g. "/properties") do SPA navigation.
  // Hash links (#section) scroll on the home page; from a sub-page they route
  // home first and then scroll to the target section.
  const handleNavClick = (e, href, location = "navbar") => {
    setMenuOpen(false);

    const label = navLinks.find((l) => l.href === href)?.label ?? href;
    track("nav_link_click", { label, href, location });

    // "Contact" / "Get in Touch" opens the enquiry popup instead of navigating.
    if (href === "#contact") {
      e.preventDefault();
      openEnquiry(location);
      return;
    }

    if (href.startsWith("/")) {
      e.preventDefault();
      navigate(href);
      return;
    }

    // Hash link. On home, let the global smooth-scroll handler in App take over.
    if (onHome) return;

    e.preventDefault();
    const id = href.slice(1);
    navigate("/", { scrollToTop: false });
    // Wait for Home to mount, then scroll to the requested section.
    setTimeout(() => {
      const el = document.getElementById(id);
      if (id === "home" || !el) window.scrollTo({ top: 0, behavior: "smooth" });
      else el.scrollIntoView({ behavior: "smooth" });
    }, 60);
  };

  return (
    <header className={`navbar${scrolled ? " scrolled" : ""}`} id="navbar">
      <div className="container nav-inner">
        <a href="#home" className="logo" aria-label="Aagam Realty home" onClick={handleLogoClick}>
          <img src="/images/app_header_logo.png" alt="Aagam Realty" className="logo-img" />
        </a>

        <nav aria-label="Primary">
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={(e) => handleNavClick(e, link.href)}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-cta">
          <a href="#contact" className="btn btn-primary" onClick={(e) => handleNavClick(e, "#contact")}>Get in Touch</a>
        </div>

        <button
          className="hamburger"
          id="hamburger"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobileMenu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <i className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true" />
        </button>
      </div>

      {/* Mobile dropdown */}
      <nav className={`mobile-menu${menuOpen ? " open" : ""}`} id="mobileMenu" aria-label="Mobile">
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href, "mobile")}>
            {link.label}
          </a>
        ))}
        <a href="#contact" className="btn btn-primary" onClick={(e) => handleNavClick(e, "#contact", "mobile")}>Get in Touch</a>
      </nav>
    </header>
  );
}
