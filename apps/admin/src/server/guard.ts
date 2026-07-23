import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getCurrentUser, getMembership } from "./auth";
import type { Membership } from "@/types";


/**
 * Guard de las rutas del dashboard: exige sesión (redirige a /login) y
 * membresía en una organización (redirige a /denied). Devuelve ambas para que
 * los layouts/páginas no repitan las queries.
 */
export async function requireMembership(): Promise<{
    user: User;
    membership: Membership;
}> {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const membership = await getMembership(user.id);
    if (!membership) redirect("/denied");

    return { user, membership };
}