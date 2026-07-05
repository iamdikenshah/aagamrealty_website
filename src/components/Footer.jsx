import { navLinks, footerLocalities } from "../data/content";
import { Link, navigate } from "../router.jsx";
import { openEnquiry } from "../enquiryStore";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/images/app_logo_footer.png" alt="Aagam Realty" className="footer-logo-img" />
            <p>
              Your trusted real estate partner — helping you rent, buy, invest, and build with
              confidence.
            </p>
            <p>&copy; 2026 Aagam Realty</p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <ul className="footer-links">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      // "Contact" opens the enquiry popup.
                      if (link.href === "#contact") {
                        e.preventDefault();
                        openEnquiry();
                        return;
                      }
                      // Path links (e.g. /properties) do SPA navigation.
                      if (link.href.startsWith("/")) {
                        e.preventDefault();
                        navigate(link.href);
                        return;
                      }
                      // Hash link from a sub-page: route home, then scroll.
                      // On home it falls through to the global scroll handler.
                      if (window.location.pathname !== "/") {
                        e.preventDefault();
                        const id = link.href.slice(1);
                        navigate("/", { scrollToTop: false });
                        setTimeout(() => {
                          const el = document.getElementById(id);
                          if (id === "home" || !el) window.scrollTo({ top: 0, behavior: "smooth" });
                          else el.scrollIntoView({ behavior: "smooth" });
                        }, 60);
                      }
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Popular Localities</h4>
            <ul className="footer-links">
              {footerLocalities.map((locality) => (
                <li key={locality}>
                  <Link to={`/properties?locality=${encodeURIComponent(locality)}`}>
                    Property in {locality}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Connect With Us</h4>
            <div className="social-icons">
              <a
                href="https://www.instagram.com/aagam.realty/?__pwa=1"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-instagram" aria-hidden="true" />
              </a>
              <a
                href="https://www.facebook.com/share/1GfvHx7MFz/?mibextid=wwXIfr"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-facebook-f" aria-hidden="true" />
              </a>
            </div>
            <div className="footer-contact-item">
              <i className="fa-solid fa-phone" aria-hidden="true" />
              <a href="tel:+919227100299">+91 92271 00299</a>
            </div>
            <div className="footer-contact-item">
              <i className="fa-solid fa-envelope" aria-hidden="true" />
              <a href="mailto:info@aagamrealty.com">info@aagamrealty.com</a>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">&copy; 2026 Aagam Realty. All rights reserved.</div>
    </footer>
  );
}
