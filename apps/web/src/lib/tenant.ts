import { PUBLIC_DEV_HOST } from "astro:env/server";
import type { Client } from "@eventdex/supabase/astro";

/**
 * Hostname que decide qué organización se sirve.
 *
 * un solo deployment atiende a todos los clientes y la organización sale del `Host` de cada request.
 *
 * `PUBLIC_DEV_HOST` lo pisa en desarrollo para no tener que tocar `/etc/hosts`
 * cuando querés probar el dominio de un cliente real.
 */
export function resolveHostname(request: Request): string {
  if (PUBLIC_DEV_HOST) return PUBLIC_DEV_HOST;
  return request.headers.get("Host") ?? "";
}

export interface Tenant {
  organizationId: string;
  /** `null` si la organización no tiene ningún evento publicado con fechas. */
  eventId: string | null;
}

/**
 * Host → organización → evento que se muestra.
 *
 * Las dos resoluciones son funciones SQL (`resolve_organization`, `resolve_active_event`),
 * no lógica de esta app; ahora la base devuelve un uuid.
 *
 * `null` si el host no está registrado en `organization_domains`: es un dominio
 * que apunta acá pero no está dado de alta, y la respuesta correcta es 404.
 */
export async function resolveTenant(supabase: Client, hostname: string): Promise<Tenant | null> {
  const { data: organizationId } = await supabase.rpc("resolve_organization", {
    p_hostname: hostname,
  });

  if (!organizationId) return null;

  const { data: eventId } = await supabase.rpc("resolve_active_event", {
    p_organization_id: organizationId,
  });

  return { organizationId, eventId: eventId ?? null };
}
