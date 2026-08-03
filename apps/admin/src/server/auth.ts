import type { User } from "@supabase/supabase-js";
import { createClient } from "@/libs/supabase/server";
import { createServiceClient } from "@/libs/supabase/service";
import type { DashboardRole, Membership } from "@/types";

/** Usuario autenticado en la request actual, o null si no hay sesión. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Roles que pueden entrar al dashboard. Es la lista de autorización: un
 * `SPOT_OWNER` tiene membresía en la organización pero administra su stand, no
 * el evento, así que para el dashboard es como no tener acceso.
 */
const DASHBOARD_ROLES: DashboardRole[] = ["ADMIN", "STAFF"];

/**
 * Membresía del usuario en una organización, o null si no puede entrar al
 * dashboard (no es miembro, o lo es con un rol sin acceso).
 *
 * Usa la service key porque también resuelve la organización (RLS solo expone
 * la propia membresía, no la tabla `organizations`); el `userId` viene siempre
 * de `getUser()`, nunca del cliente. Si el usuario pertenece a varias
 * organizaciones toma la más antigua; multi-org queda fuera del MVP, pero el
 * orden explícito evita que la elegida cambie de una request a otra.
 */
export async function getMembership(
  userId: string,
): Promise<Membership | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("organization_members")
    .select(
      "organization_id, role, organization:organizations(id, name, slug, domain)",
    )
    .eq("user_id", userId)
    .in("role", DASHBOARD_ROLES)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data?.organization) return null;

  return {
    // El `in` de arriba ya descartó los roles sin acceso; el cast solo se lo
    // cuenta al tipo, que no puede deducirlo del filtro.
    role: data.role as DashboardRole,
    organization: data.organization,
  };
}
