import type { Database } from "@eventdex/db";
import { createServerClient } from "@supabase/ssr";
import type { Client, PublicConfig } from "./types";

export interface NextCookieStore {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: Record<string, unknown>): void;
}

export function createClient({ url, key }: PublicConfig, store: NextCookieStore): Client {
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // En un Server Component NO se pueden escribir cookies, y `setAll` se
          // llama cada vez que la librería refresca el token. Se ignora a
          // propósito: el middleware refresca la sesión en cada request, así
          // que la cookie nueva se escribe ahí. Sin este catch, cualquier
          // página que refresque token revienta en render.
        }
      },
    },
  });
}

export type { Client } from "./types";
