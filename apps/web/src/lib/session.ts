import type { Client } from "@eventdex/supabase/astro";

/**
 * Quién está mirando la página.
 *
 * Vive separado de `auth.ts` —que es la plomería del flujo OAuth: proveedores,
 * saneo del `next`, motivos de error— porque tiene otra razón de cambio: aquello
 * cambia cuando se toca el login, esto cuando cambia qué sabemos del visitante.
 *
 * Y sobre todo porque **esto es lo que va a mudarse a `packages/auth`** cuando el
 * dashboard necesite guards de membresía y rol. Tenerlo en su propio archivo
 * marca esa frontera antes de que llegue.
 */

export interface Visitor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
}

/**
 * El visitante de este request, o null si no hay sesión.
 *
 * `getClaims()` y no `getUser()`: verifica el JWT localmente con las claves
 * asimétricas del proyecto, sin ir a la red. `getUser()` pega al servidor de
 * Auth en CADA llamada, y esto se usa en todas las páginas.
 */
export async function getVisitor(supabase: Client): Promise<Visitor | null> {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) return null;

  // `user_metadata` lo escribe el proveedor OAuth: es JSON libre, sin tipo.
  // Google manda `full_name`, GitHub suele mandar `name`.
  const metadata = claims.user_metadata as
    | { full_name?: string; name?: string; avatar_url?: string }
    | undefined;

  return {
    id: claims.sub,
    displayName: metadata?.full_name ?? metadata?.name ?? claims.email ?? "Visitante",
    avatarUrl: metadata?.avatar_url ?? null,
    email: claims.email ?? null,
  };
}
