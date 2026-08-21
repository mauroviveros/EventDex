import type { Database } from "@eventdex/db";
import { createBrowserClient } from "@supabase/ssr";
import type { Client, PublicConfig } from "./types";

/**
 * Cliente para el navegador: islas de Astro y componentes cliente de Next.
 *
 * `createBrowserClient` memoiza internamente por url+key, así que llamarlo en
 * varios componentes devuelve la misma instancia y no duplica el listener de
 * refresh de sesión.
 */
export function createClient({ url, key }: PublicConfig): Client {
  return createBrowserClient<Database>(url, key);
}

export type { Client } from "./types";
