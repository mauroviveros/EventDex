import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from "astro:env/client";
import { type AstroContext, createClient } from "@eventdex/supabase/astro";

const config = {
  url: PUBLIC_SUPABASE_URL,
  key: PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

/**
 * Cliente para el request en curso, con la sesión del visitante.
 *
 * See crea uno por request y no un singleton de módulo: el cliente lleva las
 * cookies de ESTE visitante. Uno compartido entre requests mezclaría sesiones
 * en el servidor.
 */
export function supabaseFor(context: AstroContext) {
  return createClient(config, context);
}
