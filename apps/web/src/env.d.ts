/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Cliente con la sesión del visitante de este request. */
    supabase: import("@eventdex/supabase/astro").Client;
    /** Organización dueña del dominio. El middleware corta con 404 si no hay. */
    organizationId: string;
    /** Nombre público, para el `<title>` y el `og:site_name`. */
    organizationName: string;
    brand: import("@eventdex/db").OrganizationBrand;
    /** Evento a mostrar, o null si la organización no publicó ninguno con fechas. */
    eventId: string | null;
  }
}
