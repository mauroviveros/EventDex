import type { Database } from "@eventdex/db";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * El cliente, ya parametrizado con el esquema.
 *
 * Es el tipo que devuelven las cuatro fábricas, así que una función que reciba
 * un cliente no necesita saber de qué runtime salió.
 */
export type Client = SupabaseClient<Database>;

/**
 * Credenciales públicas. Las lee cada app de SU entorno y las pasa acá:
 * Astro usa `import.meta.env.PUBLIC_*` y Next `process.env.NEXT_PUBLIC_*`,
 * y ningún módulo compartido puede leer las dos formas.
 */
export interface PublicConfig {
  url: string;
  key: string;
}
