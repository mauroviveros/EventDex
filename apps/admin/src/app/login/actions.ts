"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";

/** Puerto de `next dev` en esta app; solo aplica si falta el header `origin`. */
const FALLBACK_ORIGIN = "http://localhost:3001";

/**
 * Arranca el OAuth de Google. El `next` viaja al callback para volver a la
 * pantalla desde la que se pidió el login; se sanea allá con
 * `resolveSafeNextPath`, no acá, porque el callback es el que redirige.
 */
export async function signInWithGoogle(next?: string) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? FALLBACK_ORIGIN;

  const callback = new URL("/api/auth/callback", origin);
  callback.searchParams.set("next", next ?? "/events");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error) redirect("/login?error=oauth_error");

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}
