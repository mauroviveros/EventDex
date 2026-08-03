/**
 * Normaliza el parámetro `next` de un redirect post-login a una ruta interna
 * segura. Rechaza URLs absolutas y protocol-relative (open redirect).
 */
export const resolveSafeNextPath = (next: string | null) => {
  if (!next) return "/";
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//")) return "/";
  return next;
};

/**
 * Ruta con la que la app pública reclama una medalla. Tiene que seguir a
 * `apps/event/src/app/spot/[id]/page.tsx`: es lo que queda impreso en los QR,
 * así que un cambio de ruta ahí invalida los carteles ya pegados.
 */
export const SPOT_PATH = "/spot";

/**
 * URL pública de un stand: `https://<dominio de la organización>/spot/<id>`.
 *
 * El dominio se guarda como host pelado (`evento.lodecharlytcg.com`), pero se
 * tolera que lo hayan cargado con esquema o con barra final. Devuelve null si
 * la organización todavía no tiene dominio: sin él no hay QR que imprimir.
 */
export function spotPublicUrl(
  domain: string | null | undefined,
  spotId: string,
): string | null {
  const host = (domain ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");

  if (!host) return null;

  return `https://${host}${SPOT_PATH}/${spotId}`;
}
