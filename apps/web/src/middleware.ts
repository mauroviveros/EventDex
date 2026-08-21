import { defineMiddleware } from "astro:middleware";
import { supabaseFor } from "@/lib/supabase";
import { resolveHostname, resolveTenant } from "@/lib/tenant";

/**
 * Resuelve el tenant una vez por request y lo deja en `Astro.locals`.
 *
 * Que viva acá y no en cada página es lo que evita que dos rutas resuelvan la
 * organización de formas distintas — el tipo de inconsistencia que en la v1
 * aparecía con el chequeo de organizador repetido en tres lugares.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = supabaseFor(context);
  context.locals.supabase = supabase;

  const hostname = resolveHostname(context.request);
  const tenant = await resolveTenant(supabase, hostname);

  // Dominio que apunta acá pero no está dado de alta en `organization_domains`.
  // No es un error de la app: es una request para un sitio que no existe.
  if (!tenant) return new Response("Dominio no configurado", { status: 404 });

  context.locals.organizationId = tenant.organizationId;
  context.locals.eventId = tenant.eventId;

  return next();
});
