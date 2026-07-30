/**
 * Formatea siempre en UTC: las fechas llegan como ISO con `Z` y el mismo texto
 * tiene que salir en el render del servidor y en el del cliente (si dependiera
 * de la zona del navegador habría mismatch de hidratación).
 */
const formatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Fecha y hora corta ("5 abr, 16:32") en la zona horaria que se le pase —la del
 * evento, no la del navegador—: al ser explícita, servidor y cliente rinden el
 * mismo texto y no hay mismatch de hidratación.
 *
 * El formatter se cachea por zona porque construir un Intl.DateTimeFormat es
 * caro y en una tabla se llama una vez por fila.
 */
const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

export function formatDateTime(date: string, timeZone: string) {
  let formatter = dateTimeFormatters.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    });
    dateTimeFormatters.set(timeZone, formatter);
  }

  return formatter.format(new Date(date));
}

/**
 * Día calendario (YYYY-MM-DD) de un instante, en la zona del evento.
 * Se usa `en-CA` porque su formato ordena alfabéticamente igual que
 * cronológicamente, así los días se pueden comparar como strings.
 */
export function eventDay(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(iso));
}

/** Hora (0-23) de un instante, en la zona del evento. */
export function eventHour(iso: string, timeZone: string) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      hour12: false,
    }).format(new Date(iso)),
  );
}

/**
 * Etiqueta corta de un día ISO ("dom 5 abr").
 *
 * Formatea en UTC a propósito: `day` ya es una fecha de calendario resuelta en
 * la zona del evento, así que volver a aplicarle una zona la correría de día.
 */
export function formatDayLabel(day: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${day}T00:00:00Z`));
}

/**
 * Tiempo transcurrido en formato corto ("hace 2 min", "hace 3 d").
 *
 * Se calcula en el servidor al renderizar: es una foto del momento de la
 * carga, no un contador vivo. Si se calculara en el cliente el texto no
 * coincidiría con el del HTML del servidor (mismatch de hidratación).
 */
export function formatRelativeTime(date: string, now = Date.now()) {
  const seconds = Math.round((now - new Date(date).getTime()) / 1000);

  if (seconds < 60) return "recién";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `hace ${days} d`;
  const months = Math.round(days / 30);
  if (months < 12) return `hace ${months} meses`;
  return `hace ${Math.round(months / 12)} años`;
}

type Schedule = { start_datetime: string; end_datetime: string };

/**
 * Rango total de un conjunto de horarios: del primer inicio al último fin.
 * Null si el evento todavía no tiene horarios cargados.
 */
export function scheduleRange(schedules: Schedule[]) {
  if (schedules.length === 0) return null;

  return schedules.reduce(
    (range, schedule) => ({
      start:
        schedule.start_datetime < range.start
          ? schedule.start_datetime
          : range.start,
      end:
        schedule.end_datetime > range.end ? schedule.end_datetime : range.end,
    }),
    {
      start: schedules[0].start_datetime,
      end: schedules[0].end_datetime,
    },
  );
}

type DateParts = { day: string; month: string; year: string };

function toParts(date: string): DateParts {
  const parts = formatter.formatToParts(new Date(date));
  const find = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return { day: find("day"), month: find("month"), year: find("year") };
}

/**
 * Rango de fechas compacto, colapsando lo que ambos extremos comparten:
 * "15–17 mar 2026", "28 mar – 2 abr 2026" o "15 mar 2026" si es un solo día.
 */
export function formatDateRange(start: string, end: string) {
  const from = toParts(start);
  const to = toParts(end);

  if (from.year !== to.year) {
    return `${from.day} ${from.month} ${from.year} – ${to.day} ${to.month} ${to.year}`;
  }

  if (from.month !== to.month) {
    return `${from.day} ${from.month} – ${to.day} ${to.month} ${to.year}`;
  }

  if (from.day !== to.day) {
    return `${from.day}–${to.day} ${from.month} ${from.year}`;
  }

  return `${from.day} ${from.month} ${from.year}`;
}
