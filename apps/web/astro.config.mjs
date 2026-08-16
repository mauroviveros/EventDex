// @ts-check
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // SSR obligatorio: la organización se resuelve por `Host` en cada request
  // (ver docs/05-flujos.md). No hay build por cliente.
  output: "server",
  adapter: vercel(),

  // Canónicas y sitemap. En multi-tenant el host real llega por request; esto es
  // solo el fallback para cuando no hay Host que mirar.
  site: process.env.PUBLIC_SITE_URL ?? "https://eventdex.com",

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    // Multi-tenant: en dev hay que poder pegarle con el Host de cualquier cliente
    // (via /etc/hosts o `curl -H Host:`). `server` solo aplica al dev server.
    server: { allowedHosts: true },
  },

  env: {
    schema: {
      // Fuerza el hostname en desarrollo para no tocar /etc/hosts
      PUBLIC_DEV_HOST: envField.string({ context: "server", access: "public", optional: true }),
      PUBLIC_ADMIN_URL: envField.string({ context: "client", access: "public", optional: true }),
      // PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_PUBLISHABLE_KEY entran en la fase 3,
      // junto con packages/supabase. Declararlas requeridas ahora rompe el build.
    },
  },
});
