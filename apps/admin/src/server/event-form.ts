/**
 * Parseo y validación del formulario de eventos. Sin I/O, para poder testear
 * las reglas; la Server Action se encarga de escribir.
 */

export type EventFormValues = {
  title: string;
  description: string;
  edition: string | null;
  timezone: string;
  location: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  /**
   * Jornadas en hora de pared, tal como las escribió el organizador, ordenadas
   * por inicio. Un evento puede tener varias: días distintos, o varios tramos
   * dentro del mismo día.
   */
  schedules: { start: string; end: string }[];
};

/** Errores por campo; `_form` es el que no pertenece a ninguno. */
export type EventFormErrors = Record<string, string>;

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
};

/** Un identificador IANA es válido si Intl puede construir un formatter con él. */
export function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

const REQUIRED = [
  { field: "title", message: "El título es obligatorio." },
  { field: "description", message: "La descripción es obligatoria." },
  { field: "location_name", message: "El nombre del lugar es obligatorio." },
  { field: "location_address", message: "La dirección es obligatoria." },
  { field: "location_city", message: "La ciudad es obligatoria." },
  { field: "location_state", message: "La provincia es obligatoria." },
  { field: "location_country", message: "El país es obligatorio." },
];

export function parseEventForm(formData: FormData): {
  values: EventFormValues | null;
  errors: EventFormErrors;
} {
  const errors: EventFormErrors = {};

  for (const { field, message } of REQUIRED) {
    if (!text(formData, field)) errors[field] = message;
  }

  const timezone = text(formData, "timezone");
  if (!timezone) {
    errors.timezone = "El timezone es obligatorio.";
  } else if (!isValidTimeZone(timezone)) {
    errors.timezone = "Timezone inválido: usá un identificador IANA.";
  }

  const schedules = parseSchedules(formData, errors);

  if (Object.keys(errors).length > 0) return { values: null, errors };

  return {
    values: {
      title: text(formData, "title"),
      description: text(formData, "description"),
      edition: text(formData, "edition") || null,
      timezone,
      location: {
        name: text(formData, "location_name"),
        address: text(formData, "location_address"),
        city: text(formData, "location_city"),
        state: text(formData, "location_state"),
        country: text(formData, "location_country"),
      },
      schedules,
    },
    errors,
  };
}

/** Nombre del error de una jornada puntual, por posición en el formulario. */
export const scheduleErrorKey = (index: number) => `schedule_${index}`;

/**
 * Las jornadas viajan como campos repetidos (`start_datetime` y
 * `end_datetime`), así que se emparejan por posición. Cada fila valida por
 * separado para poder marcar exactamente cuál está mal.
 */
function parseSchedules(formData: FormData, errors: EventFormErrors) {
  const read = (name: string) =>
    formData
      .getAll(name)
      .map((value) => (typeof value === "string" ? value.trim() : ""));

  const starts = read("start_datetime");
  const ends = read("end_datetime");
  const rows = Math.max(starts.length, ends.length);

  if (rows === 0) {
    errors.schedule = "Cargá al menos una jornada.";
    return [];
  }

  const schedules: { start: string; end: string }[] = [];

  for (let index = 0; index < rows; index++) {
    const start = starts[index] ?? "";
    const end = ends[index] ?? "";

    if (!start || !end) {
      errors[scheduleErrorKey(index)] = "Completá el inicio y el fin.";
      continue;
    }

    // Los valores de `datetime-local` se comparan como texto: el formato ISO
    // ordena igual alfabética que cronológicamente.
    if (end <= start) {
      errors[scheduleErrorKey(index)] =
        "El fin tiene que ser posterior al inicio.";
      continue;
    }

    schedules.push({ start, end });
  }

  return schedules.toSorted((a, b) => a.start.localeCompare(b.start));
}
