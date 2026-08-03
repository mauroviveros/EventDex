import { resolveScheduleDateTime } from "./schedule";

type ScheduledEvent = {
  schedules: { start_datetime: string; end_datetime: string }[];
};

/**
 * Rango completo del evento en milisegundos: del inicio de su primera jornada
 * al fin de la última.
 *
 * Se usa el rango total y no cada jornada suelta para que un evento de sábado y
 * domingo no figure como terminado el sábado a la noche. Null si no tiene
 * jornadas cargadas: sin fechas no hay nada que ubicar en el tiempo.
 */
export function eventRange(event: ScheduledEvent) {
  if (event.schedules.length === 0) return null;

  const starts = event.schedules.map((schedule) =>
    resolveScheduleDateTime(schedule.start_datetime).toMillis(),
  );
  const ends = event.schedules.map((schedule) =>
    resolveScheduleDateTime(schedule.end_datetime).toMillis(),
  );

  return { start: Math.min(...starts), end: Math.max(...ends) };
}

/**
 * Elige qué evento muestra la app, entre los publicados de la organización.
 *
 * El orden de preferencia es el de utilidad para el visitante:
 * 1. **En curso**: si hay uno pasando ahora, es el único que importa.
 * 2. **Próximo**: el que arranca antes, para que la landing cuente hacia él.
 * 3. **Último terminado**: si ya pasaron todos, el más reciente — mejor mostrar
 *    el evento que acaba de pasar que una pantalla vacía.
 *
 * Los eventos sin jornadas quedan afuera: no se pueden ubicar en el tiempo y en
 * el dashboard figuran como borrador.
 *
 * Devuelve null solo si no quedó ninguno elegible.
 */
export function pickActiveEvent<T extends ScheduledEvent>(
  events: T[],
  now = Date.now(),
): T | null {
  const dated = events
    .map((event) => ({ event, range: eventRange(event) }))
    .filter(
      (item): item is { event: T; range: NonNullable<typeof item.range> } =>
        Boolean(item.range),
    );

  // En curso: si hubiera varios superpuestos, el que arrancó primero.
  const live = dated
    .filter(({ range }) => range.start <= now && now <= range.end)
    .sort((a, b) => a.range.start - b.range.start);
  if (live.length > 0) return live[0].event;

  // Próximo: el de arranque más cercano.
  const upcoming = dated
    .filter(({ range }) => range.start > now)
    .sort((a, b) => a.range.start - b.range.start);
  if (upcoming.length > 0) return upcoming[0].event;

  // Terminados: el que terminó último.
  const finished = dated.sort((a, b) => b.range.end - a.range.end);
  return finished[0]?.event ?? null;
}
