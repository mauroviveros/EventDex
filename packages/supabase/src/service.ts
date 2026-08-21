import type { Database } from "@eventdex/db";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Client } from "./types";

export interface ServiceConfig {
  url: string;
  serviceRoleKey: string;
}

/**
 * Cliente con service-role: SE SALTEA RLS.
 *
 * Es la excepción documentada, no el default.
 * Casos legítimos: alta de una organización nueva, jobs sin usuario, backfills.
 * Regla práctica: si una pantalla lo necesita, falta una política.
 *
 * Se llama `createServiceClient` y no `createClient` como los otros justamente
 * para que un `grep -r createServiceClient` liste todos los usos de un vistazo.
 *
 * La protección real contra filtrarlo al navegador no es el guard de abajo: es
 * que `SUPABASE_SERVICE_ROLE_KEY` no lleva prefijo `PUBLIC_`/`NEXT_PUBLIC_`, así
 * que ningún bundler la inlinea y en el browser sería `undefined`. El guard
 * está para que el error diga qué pasó en vez de un "Invalid API key".
 */
export function createServiceClient({ url, serviceRoleKey }: ServiceConfig): Client {
  if (typeof window !== "undefined")
    throw new Error("createServiceClient() es server-only: no puede correr en el navegador.");

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    // No hay sesión de usuario que mantener: es una identidad de máquina.
    // Persistirla intentaría escribir en un storage que no existe.
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export type { Client } from "./types";
