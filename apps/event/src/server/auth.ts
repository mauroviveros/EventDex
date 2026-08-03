import type { User } from "@supabase/supabase-js";
import { createClient } from "@/libs/supabase/server";
import { createServiceClient } from "@/libs/supabase/service";
import { ORGANIZER_ROLES } from "@/utils";

/** Usuario autenticado en la request actual, o null si no hay sesión. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Única fuente de verdad para saber si un usuario es organizador. Antes esta
 * comprobación estaba duplicada e inconsistente en el header, el perfil y el
 * sorteo.
 *
 * No alcanza con ser miembro de la organización: el rol tiene que estar en
 * `ORGANIZER_ROLES`. Un `SPOT_OWNER` es miembro pero no administra el evento,
 * así que no entra al sorteo ni al dashboard.
 *
 * `limit(1)` porque `maybeSingle()` falla si hay más de una fila, y nada impide
 * que un usuario tenga varias membresías.
 */
export async function isOrganizer(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", userId)
    .in("role", ORGANIZER_ROLES)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

/**
 * IDs de todo el que trabaja en el evento, para excluirlos del sorteo.
 *
 * Es más amplio que `isOrganizer` a propósito: acá no se decide un permiso sino
 * una cuestión de limpieza del sorteo, y un `SPOT_OWNER` no debería poder
 * ganarse el premio del evento donde atiende su propio stand.
 *
 * Usa la service key porque necesita ver la membresía de otros usuarios (RLS
 * solo expone la propia).
 */
export async function getOrganizerUserIds(): Promise<string[]> {
  const service = createServiceClient();
  const { data } = await service.from("organization_members").select("user_id");
  return (data ?? [])
    .map((member) => member.user_id)
    .filter((id): id is string => Boolean(id));
}
