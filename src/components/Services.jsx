import Reveal from "./Reveal";
import { services } from "../data/content";

export default function Services() {
  return (
    <section className="services" id="services">
      <div className="container">
        <Reveal as="h2" className="section-heading">What We Deal In</Reveal>
        <Reveal as="p" className="section-subheading">
          From cozy rentals to prime plots, we cover every corner of the property market with expert
          guidance at every step.
        </Reveal>

        <div className="services-grid">
          {services.map((service) => (
            <Reveal as="article" className="service-card" key={service.title}>
              <div className="service-icon">
                <i className={`fa-solid ${service.icon}`} aria-hidden="true" />
              </div>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
