import type { ScheduleLike } from "./schedule";

/**
 * Etiqueta legible de una jornada, en la zona horaria DEL EVENTO.
 *
 * Formatear en la zona del evento y no en la del visitante es deliberado: para
 * un evento presencial, "abre a las 14:00" significa 14:00 en el predio. Si
 * alguien lo mira desde Madrid tiene que leer la hora local del evento, no las
 * 19:00 de su reloj — si no, se presenta cinco horas tarde.
 *
 * De paso, formatear con una zona fija hace el resultado determinístico: no
 * depende de la máquina que renderiza, así que la página se puede cachear o
 * prerenderizar.
 *
 * Ejemplo: "Domingo 5 de abril · 20:00 a 01:00 (GMT-3)"
 */
export function formatScheduleLabel(
  schedule: ScheduleLike,
  timeZone: string,
  locale = "es-AR"
): string | null {
  const start = new Date(schedule.starts_at);
  const end = new Date(schedule.ends_at);

  // Misma defensa que en eventRange: una fecha inválida es NaN y los
  // formatters de Intl tiran RangeError. Preferimos null a romper el render.
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const day = formatDay(start, timeZone, locale);
  const from = formatTime(start, timeZone, locale);
  const to = formatTime(end, timeZone, locale);
  const zone = formatZone(start, timeZone, locale);

  return `${day} · ${from} a ${to} (${zone})`;
}

/**
 * Cache de formatters.
 *
 * Construir un `Intl.DateTimeFormat` es de las operaciones más caras de `Intl`
 * —carga los datos del locale— y `formatScheduleLabel` arma cuatro por
 * llamada. En una lista de jornadas, o en la grilla de eventos del admin, eso
 * se multiplica rápido.
 *
 * Los formatters son inmutables y sin estado, así que reusarlos es seguro. El
 * cache tampoco crece sin control: cuatro entradas por combinación de locale y
 * zona horaria, y en la práctica hay una sola de cada.
 */
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  // La clave incluye TODAS las opciones y no solo locale + zona: con una clave
  // más pobre, pedir el formatter de la hora devolvería el que se cacheó para
  // la fecha. Los objetos se arman siempre con las mismas claves en el mismo
  // orden, así que `JSON.stringify` es estable.
  const key = `${locale}|${JSON.stringify(options)}`;

  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, options);
    formatters.set(key, cached);
  }

  return cached;
}

/** Una parte de un `formatToParts`, o "" si el formatter no la produjo. */
function partOf(
  parts: readonly Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * "Domingo 5 de abril".
 *
 * Se arma con `formatToParts` y no con `format()` porque el string que devuelve
 * `format()` en es-AR es "domingo, 5 de abril" — con coma y en minúscula. Con
 * las partes sueltas armamos exactamente el formato que queremos sin
 * reemplazos frágiles con regex sobre el resultado.
 *
 * ⚠️ El " de " está hardcodeado, o sea que esto es español y nada más. Es
 * consistente con el no-objetivo de multi-idioma en la v1 (docs/00-vision.md).
 * Si algún día entra i18n, este es el punto exacto a cambiar: pasar a
 * `dateStyle` y aceptar el formato que dicte el locale.
 */
function formatDay(date: Date, timeZone: string, locale: string): string {
  const parts = formatter(locale, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(date);

  return `${capitalize(partOf(parts, "weekday"))} ${partOf(parts, "day")} de ${partOf(parts, "month")}`;
}

/** "20:00" — 24 horas siempre, sin importar lo que prefiera el locale. */
function formatTime(date: Date, timeZone: string, locale: string): string {
  return formatter(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * "GMT-3".
 *
 * Se calcula PARA ESE INSTANTE, no para "ahora". Es la diferencia que rompe las
 * implementaciones caseras con `getTimezoneOffset()`: en una zona con horario
 * de verano, un evento de enero y uno de julio tienen offsets distintos. Como
 * le pasamos el `date` real al formatter, Intl resuelve el DST solo.
 */
function formatZone(date: Date, timeZone: string, locale: string): string {
  const parts = formatter(locale, {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);

  return partOf(parts, "timeZoneName");
}

/**
 * Un instante como ISO 8601 en la zona del evento: "2026-09-19T21:00:00-03:00".
 *
 * `toISOString()` daría el mismo instante en UTC, que es igual de correcto como
 * dato pero se lee distinto: 21:00 GMT-3 es medianoche UTC del día siguiente, y
 * Google usa `startDate` para mostrar el DÍA del evento. Con el offset explícito
 * la fecha local es inequívoca.
 */
export function toZonedIso(instant: number, timeZone: string): string {
  const parts = formatter("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    // h23 y no `hour12: false`: en algunas implementaciones `hour12: false`
    // devuelve "24" para medianoche en vez de "00".
    hourCycle: "h23",
    timeZoneName: "longOffset",
  }).formatToParts(new Date(instant));

  const date = `${partOf(parts, "year")}-${partOf(parts, "month")}-${partOf(parts, "day")}`;
  const time = `${partOf(parts, "hour")}:${partOf(parts, "minute")}:${partOf(parts, "second")}`;
  // `longOffset` devuelve "GMT-03:00", o "GMT" pelado en UTC.
  const zone = partOf(parts, "timeZoneName").replace("GMT", "");

  return `${date}T${time}${zone || "Z"}`;
}
