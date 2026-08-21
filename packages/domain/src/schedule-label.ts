export interface ScheduleLike {
  starts_at: string;
  ends_at: string;
}

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
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long"
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? "";

  const weekday = get("weekday");
  const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return `${capitalized} ${get("day")} de ${get("month")}`;
}

/** "20:00" — 24 horas siempre, sin importar lo que prefiera el locale. */
function formatTime(date: Date, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
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
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    timeZoneName: "shortOffset"
  }).formatToParts(date);

  return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
}
