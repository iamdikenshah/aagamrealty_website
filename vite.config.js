import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Deployed to a custom domain (aagamrealty.com) at the site root,
// so the base path stays "/".
export default defineConfig({
  base: "/",
  plugins: [react()],
});
