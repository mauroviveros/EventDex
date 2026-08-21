import type { Database } from "@eventdex/db";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { Client, PublicConfig } from "./types";

/**
 * Lo mínimo que se necesita del `APIContext` de Astro.
 *
 * Estructural y NO `import type { APIContext } from "astro"` a propósito: si
 * este paquete dependiera de Astro, `apps/admin` —que es Next— se arrastraría
 * los tipos de Astro por consumir el mismo paquete. Mismo criterio que
 * `ScheduleLike` en `@eventdex/domain`.
 *
 * `options` queda como `Record<string, unknown>` por lo mismo: tiparlo fuerte
 * exigiría el tipo de cookies de Astro. Es laxo a propósito, y alcanza porque
 * el objeto siempre viene de Supabase, nunca de código nuestro.
 */
export interface AstroContext {
  request: Request;
  cookies: {
    set(name: string, value: string, options?: Record<string, unknown>): void;
  };
}

export function createClient({ url, key }: PublicConfig, context: AstroContext): Client {
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        // Se leen del header y no de `context.cookies` porque en el SSR de
        // Astro el header es la fuente de verdad de lo que mandó el navegador.
        // El `?? ""` es porque esta versión de `parseCookieHeader` tipa `value`
        // como opcional y el contrato de `getAll` pide `string`.
        return parseCookieHeader(context.request.headers.get("Cookie") ?? "").map((cookie) => ({
          name: cookie.name,
          value: cookie.value ?? "",
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          context.cookies.set(name, value, options);
        }
      },
    },
  });
}

export type { Client } from "./types";
