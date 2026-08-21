/**
 * Lo MÍNIMO que se necesita de una jornada.
 *
 * No pide `Tables<"event_schedules">` entera: así sirve igual para una fila de
 * la base, para un formulario a medio llenar, o para un objeto de test escrito
 * a mano.
 *
 * Vive en su propio módulo —y no dentro de `event-phase`— porque lo comparten
 * dos consumidores (`eventPhase` y `formatScheduleLabel`), y "jornada" es un
 * concepto del glosario, no un detalle de implementación del cálculo de fase.
 */
export interface ScheduleLike {
  starts_at: string;
  ends_at: string;
}
