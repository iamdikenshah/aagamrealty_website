import HeroSearch from "./HeroSearch";
import { openEnquiry } from "../enquiryStore";

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <span className="hero-badge">
          <i className="fa-solid fa-star" aria-hidden="true" /> 9+ Years of Trusted Expertise
        </span>
        <h1>Your Trusted Partner in <span className="hero-highlight">Real Estate</span></h1>
        <p className="sub">
          Helping you find the perfect property — whether it's for rent, purchase, pre-lease, or a
          plot of land. 9+ years of trusted expertise in the real estate market.
        </p>

        <HeroSearch />

        <div className="hero-cta">
          <a href="#featured" className="btn btn-primary">Explore Properties</a>
          <a
            href="#contact"
            className="btn btn-white-outline"
            onClick={(e) => {
              e.preventDefault();
              openEnquiry();
            }}
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}
