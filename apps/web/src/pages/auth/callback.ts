import { safeNext } from "@/lib/auth";
import type { APIRoute } from "astro";

/**
 * Vuelta del proveedor OAuth: canjea el código por una sesión.
 *
 * `exchangeCodeForSession` necesita el code verifier que dejó `/auth/signin` en
 * una cookie. Se usa `locals.supabase` —el cliente que arma el middleware con
 * las cookies de ESTE request— justamente para que lo encuentre; un cliente
 * nuevo sin cookies fallaría con un error de PKCE difícil de leer.
 *
 * El `next` se vuelve a sanear aunque ya se haya saneado al salir: llega por
 * query string, o sea desde afuera, y nada garantiza que sea el mismo que
 * mandamos.
 */
export const GET = (async ({ url, locals, redirect }) => {
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const oauthError = url.searchParams.get("error");

  if (oauthError) return redirect(`/auth/error?reason=${encodeURIComponent(oauthError)}`, 303);
  if (!code) return redirect("/auth/error?reason=missing-code", 303);

  const { error } = await locals.supabase.auth.exchangeCodeForSession(code);

  if (error) return redirect("/auth/error?reason=exchange", 303);

  return redirect(next, 303);
}) satisfies APIRoute;
