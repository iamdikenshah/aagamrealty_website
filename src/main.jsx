import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./analytics"; // side-effect: initialise Firebase Analytics (no-ops if unconfigured)
import "./index.css";
import "./properties.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
