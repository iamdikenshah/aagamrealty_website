import { WHATSAPP_LINK } from "../data/content";
import { track } from "../analytics";

export default function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_LINK}
      className="whatsapp-float"
      target="_blank"
      rel="noopener"
      aria-label="Chat with us on WhatsApp"
      onClick={() => track("whatsapp_click", { location: "float" })}
    >
      <i className="fa-brands fa-whatsapp" aria-hidden="true" />
      <span className="whatsapp-float-tooltip">Chat with us</span>
    </a>
  );
}
