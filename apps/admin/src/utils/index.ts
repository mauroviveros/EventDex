export * from "./routes";
export * from "./tailwind";

/** Cuenta ocurrencias por clave; usado para agregar escaneos por evento. */
export function countBy<T>(rows: T[], key: (row: T) => string) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const k = key(row);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  return counts;
}