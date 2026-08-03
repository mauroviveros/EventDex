import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/libs/supabase/service";
import type { Membership } from "@/types";
import { eventPhase } from "@/utils";
import { getCurrentUser, getMembership } from "./auth";
import { getOrganizationEvent } from "./events";

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

/**
 * Guard de todo lo que escribe sobre un evento (sus datos, sus stands): exige
 * membresía, que el evento sea de esa organización y que todavía no haya
 * terminado.
 *
 * Un evento finalizado es historia: sus datos quedan como respaldo de los
 * escaneos que ya ocurrieron. El bloqueo se repite acá y no solo en la
 * interfaz, porque la interfaz se puede saltear.
 *
 * Devuelve el service client ya creado porque quien escribe lo necesita: el
 * `organization_id` que se acaba de verificar es la única barrera de
 * autorización (el service client no pasa por RLS).
 */
export async function requireEditableEvent(eventId: string) {
  const { membership } = await requireMembership();
  const event = await getOrganizationEvent(membership.organization.id, eventId);

  if (!event) redirect("/events");
  if (eventPhase(event) === "FINISHED") redirect(`/events/${eventId}`);

  return { event, service: createServiceClient() };
}
