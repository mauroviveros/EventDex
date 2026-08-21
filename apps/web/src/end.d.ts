/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Cliente con la sesión del visitante de este request. */
    supabase: import("@eventdex/supabase/astro").Client;
    /** Organización dueña del dominio. El middleware corta con 404 si no hay. */
    organizationId: string;
    /** Evento a mostrar, o null si la organización no publicó ninguno con fechas. */
    eventId: string | null;
  }
}
