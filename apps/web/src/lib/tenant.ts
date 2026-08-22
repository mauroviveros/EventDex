import { PUBLIC_DEV_HOST } from "astro:env/server";
import type { OrganizationBrand } from "@eventdex/db";
import type { Client } from "@eventdex/supabase/astro";

/**
 * Hostname que decide qué organización se sirve.
 *
 * Un solo deployment atiende a todos los clientes y la organización sale del
 * `Host` de cada request.
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
  organizationName: string;
  brand: OrganizationBrand;
  /** `null` si la organización no tiene ningún evento publicado con fechas. */
  eventId: string | null;
}

/**
 * Host → organización → evento que se muestra, en UNA sola llamada.
 *
 * Antes eran dos RPCs y el primero tiraba el resto de la fila: la organización
 * ya se tocaba pero el nombre quedaba afuera. `resolve_site` devuelve todo
 * junto, y con el proyecto hosteado en otra región ahorrar un round trip en el
 * camino más caliente son 100-300 ms de TTFB por página.
 *
 * `null` si el host no está registrado en `organization_domains`: es un dominio
 * que apunta acá pero no está dado de alta, y la respuesta correcta es 404.
 */
export async function resolveTenant(supabase: Client, hostname: string): Promise<Tenant | null> {
  const { data } = await supabase.rpc("resolve_site", { p_hostname: hostname }).maybeSingle();

  if (!data) return null;

  return {
    organizationId: data.organization_id,
    organizationName: data.organization_name,
    // `brand` es jsonb: el tipo generado dice `Json`, que no sirve para leer
    // `.primary`. El cast declara qué esperamos, igual que con el snapshot.
    brand: (data.brand ?? {}) as OrganizationBrand,
    // El tipo generado dice `string`, pero `resolve_active_event` devuelve null
    // cuando no hay evento publicado con fechas. Postgres no expresa nulabilidad
    // en el retorno de una función, así que el typegen asume no-null y hay que
    // desconfiar a mano.
    eventId: data.event_id ?? null,
  };
}
