import { isAuthProvider, safeNext } from "@/lib/auth";
import type { APIRoute } from "astro";

/**
 * Arranca el login OAuth.
 *
 * Es un POST desde un `<form>` y no un `onClick`: así el login **no necesita
 * JavaScript**, que es coherente con haber elegido Astro para que la app
 * pública pese lo mínimo en el 4G de un predio lleno.
 *
 * `signInWithOAuth` en el servidor NO redirige: devuelve la URL y deja la
 * cookie con el code verifier de PKCE. Ese verifier lo escribe el cliente
 * servidor, que es el mismo que después va a leerlo en el callback — por eso
 * conviene iniciar el flujo acá y no desde el navegador.
 */
export const POST = (async ({ request, locals, redirect }) => {
  const form = await request.formData();
  const provider = form.get("provider");
  const next = safeNext(form.get("next")?.toString());

  // si el provider no es válido, redirige a la página de error con un código de razón
  if (!isAuthProvider(provider)) return redirect("/auth/error?reason=provider", 303);

  const { origin } = new URL(request.url);
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { data, error } = await locals.supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });

  if (error || !data.url) return redirect("/auth/error?reason=oauth", 303);

  // 303 y no 302: convierte el POST en un GET, que es lo que espera el
  // proveedor. Con 302 algunos clientes reenvían el POST.
  return redirect(data.url, 303);

}) satisfies APIRoute;
