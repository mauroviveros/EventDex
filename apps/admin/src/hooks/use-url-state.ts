"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Estado de vista (búsqueda, filtros, orden, página) persistido en la URL.
 *
 * Se escribe con `history.replaceState` y no con `router.replace` a propósito:
 * en el App Router cualquier cambio de searchParams vuelve a ejecutar el
 * server component, y esta página consulta escaneos, stands y visitantes —
 * sería una recarga completa por cada tecla del buscador.
 *
 * Como contrapartida, después del montaje la URL deja de ser la fuente de
 * verdad: el estado vive en el componente y la URL solo lo refleja para poder
 * recargar o compartir la vista.
 */

/** Prefijo por vista: dos tablas en la misma página no deben pisarse. */
const withPrefix = (prefix: string, key: string) =>
  prefix ? `${prefix}.${key}` : key;

/**
 * Lector de los parámetros iniciales. Devuelve los valores de la URL de la
 * request, así el primer render del cliente coincide con el del servidor.
 */
export function useUrlStateReader(prefix = "") {
  const searchParams = useSearchParams();
  return (key: string) => searchParams.get(withPrefix(prefix, key)) ?? "";
}

/**
 * Refleja el estado en la URL. Los valores vacíos o nulos se quitan, para que
 * la vista por defecto tenga la URL limpia.
 */
export function useUrlStateWriter(
  prefix: string,
  values: Record<string, string | null>,
) {
  // El objeto `values` es nuevo en cada render; se compara por su contenido
  // serializado para no reescribir la URL sin motivo.
  const serialized = JSON.stringify(values);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    for (const [key, value] of Object.entries(
      JSON.parse(serialized) as Record<string, string | null>,
    )) {
      const name = withPrefix(prefix, key);
      if (value) params.set(name, value);
      else params.delete(name);
    }

    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;

    window.history.replaceState(null, "", url);
  }, [prefix, serialized]);
}
