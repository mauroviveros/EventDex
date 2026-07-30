import type { SortingState } from "@tanstack/react-table";

/**
 * El orden viaja en la URL como `columna` (asc) o `-columna` (desc): más corto
 * y legible que dos parámetros separados.
 */
export function parseSort(value: string): SortingState {
  if (!value) return [];

  const desc = value.startsWith("-");
  const id = desc ? value.slice(1) : value;

  return id ? [{ id, desc }] : [];
}

export function formatSort(sorting: SortingState): string {
  const [first] = sorting;
  if (!first) return "";

  return first.desc ? `-${first.id}` : first.id;
}
