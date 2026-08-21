import type { Enums } from "@eventdex/db";
import type { ScheduleLike } from "./schedule";

/** La fase la define la base (enum `event_phase`); aca solo la reusamos. */
export type EventPhase = Enums<"event_phase">;

export interface EventRange {
  start: number;
  end: number;
}

/**
 * Rango completo del evento: del inicio de la PRIMERA jornada al fin de la
 * ÚLTIMA.
 *
 * No se evalúa jornada por jornada a propósito. Un evento de sábado y domingo
 * tiene un hueco de 16 horas entre jornadas; mirando cada una por separado, el
 * sábado a la medianoche el evento figuraría como terminado y los QR dejarían
 * de entregar medallas hasta el día siguiente.
 *
 * Null si no hay jornadas: un evento sin fechas no se puede ubicar en el
 * tiempo, y devolver null obliga a quien llama a decidir qué hacer en vez de
 * inventarle una fase.
 */
export function eventRange(schedules: readonly ScheduleLike[]): EventRange | null {
  if (schedules.length === 0) return null;

  let start = Number.POSITIVE_INFINITY;
  let end = Number.NEGATIVE_INFINITY;

  for (const schedule of schedules) {
    const from = Date.parse(schedule.starts_at);
    const to = Date.parse(schedule.ends_at);

    // Una fecha inválida es NaN, y TODA comparación con NaN da false. Sin este
    // guard, `now < start` y `now > end` darían ambas false y la función
    // devolvería "live": el peor default posible, porque abre la ventana de
    // reclamo de un evento cuyas fechas no sabemos leer.
    if (Number.isNaN(from) || Number.isNaN(to)) return null;

    if (from < start) start = from;
    if (to > end) end = to;
  }

  return { start, end };
}

/**
 * Fase temporal del evento. Es lo mismo que calcula la vista SQL
 * `event_timeline`, escrito con la MISMA forma de comparación a propósito:
 * si algún día hay que cambiar el criterio, poner los dos lado a lado tiene
 * que dejar ver la diferencia de una.
 *
 *   SQL:  now() <  min(starts_at) → upcoming
 *         now() >  max(ends_at)   → finished
 *         else                    → live
 *
 * Los bordes son inclusivos en las dos puntas: arrancando justo a la hora de
 * inicio el evento ya está `live`. Si acá usáramos `<=` donde el SQL usa `<`,
 * el desacuerdo aparecería solo en el instante exacto del borde — un bug que
 * no se reproduce cuando lo buscás.
 */
export function eventPhase(
  schedules: readonly ScheduleLike[],
  now: number = Date.now()
): EventPhase | null {
  const range = eventRange(schedules);
  if (!range) return null;

  if (now < range.start) return "upcoming";
  if (now > range.end) return "finished";
  return "live";
}
