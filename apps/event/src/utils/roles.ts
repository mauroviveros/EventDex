import type { Enums } from "@/types";

/**
 * Roles que cuentan como organizador: los que administran el evento.
 *
 * `SPOT_OWNER` queda afuera a propósito — es miembro de la organización, pero
 * administra su propio stand, no el evento. Mismo criterio que el dashboard
 * (`DASHBOARD_ROLES` en apps/admin), para que "ser organizador" signifique lo
 * mismo en las dos apps.
 *
 * Vive en `utils` y no en `server` porque también lo usa el `<Account/>` del
 * cliente para decidir qué muestra el menú.
 */
export const ORGANIZER_ROLES: Enums<"ORGANIZATION_MEMBER_ROLE">[] = [
  "ADMIN",
  "STAFF",
];
