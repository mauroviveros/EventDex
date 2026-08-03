import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";

/**
 * Refresca la sesión de Supabase en cada request. Es la única pieza del ciclo
 * que puede escribir cookies en todos los flujos: los Server Components pueden
 * leerlas pero no persistirlas, así que sin esto el access token vence y el
 * organizador termina de vuelta en el login cada hora.
 *
 * No decide accesos a propósito: quién entra a qué lo resuelven
 * `requireMembership` / `requireEditableEvent` en cada página, que además
 * distinguen "sin sesión" (→ /login) de "sin organización" (→ /denied). Repetir
 * esa lógica acá duplicaría la regla y convertiría en redirect al 401 que la
 * ruta del QR devuelve a propósito.
 *
 * El adaptador de cookies es distinto al de los Server Components (escribe en
 * la request y en la response), por eso no usa el factory compartido de
 * `@eventdex/supabase`.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Primero se actualizan las cookies de la request y recién después se
          // rearma la response: `NextResponse.next({ request })` copia los
          // headers en ese momento, así que el orden es lo que hace que los
          // Server Components de esta misma request vean el token nuevo.
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = NextResponse.next({ request });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Es el llamado que dispara el refresh si el token está vencido; el usuario
  // en sí lo vuelve a leer cada página.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Todo menos assets estáticos: son requests sin cookies de sesión que
    // pagarían un roundtrip a Supabase por nada.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
