export * from "./dates";
export * from "./routes";
export * from "./tailwind";

/** Iniciales de un nombre (hasta dos), para los fallback de avatar. */
export function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Cuenta ocurrencias por clave; usado para agregar escaneos por evento. */
export function countBy<T>(rows: T[], key: (row: T) => string) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const k = key(row);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  return counts;
}
