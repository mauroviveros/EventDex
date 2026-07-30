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
