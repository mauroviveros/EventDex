import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { resolveSafeNextPath } from "@/utils";

/**
 * Vuelta del OAuth: cambia el `code` por una sesión y manda a donde el usuario
 * quería ir. Es un Route Handler porque es el único punto del flujo que puede
 * escribir las cookies de sesión en la respuesta.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = resolveSafeNextPath(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    // Si el intercambio falla se vuelve al login señalando el error, en vez de
    // redirigir a una ruta para la que el usuario no quedó autenticado.
    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_error", url.origin),
      );
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
