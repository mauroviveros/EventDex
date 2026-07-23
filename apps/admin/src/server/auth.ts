import { createClient } from "@/libs/supabase/server";
import { createServiceClient } from "@/libs/supabase/service";
import { Membership } from "@/types";
import type { User } from "@supabase/supabase-js";

/** Usuario autenticado en la request actual, o null si no hay sesión. */
export async function getCurrentUser(): Promise<User | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return user;
}

/**
 * Membresía del usuario en una organización, o null si no es organizador.
 * Cualquier fila en `organization_members` da acceso al dashboard (mismo
 * criterio que `isOrganizer()` en apps/event); los permisos finos por rol
 * vienen después.
 *
 * Usa la service key porque también resuelve la organización (RLS solo expone
 * la propia membresía, no la tabla `organizations`); el `userId` viene siempre
 * de `getUser()`, nunca del cliente. Si el usuario pertenece a varias
 * organizaciones toma la primera; multi-org queda fuera del MVP.
 */
export async function getMembership(userId: string): Promise<Membership | null> {
    const service = createServiceClient();
    const { data } = await service
        .from("organization_members")
        .select("organization_id, role, organization:organizations(id, name, slug)")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

    if (!data?.organization) return null;

    return {
        role: data.role,
        organization: data.organization,
    };
}