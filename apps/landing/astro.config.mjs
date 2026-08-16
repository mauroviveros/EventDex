// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // Marketing puro: no resuelve tenant ni toca la base, así que sale estática.
  output: "static",
  site: "https://eventdex.com",

  vite: {
    plugins: [tailwindcss()],
  },
});
