export interface CollectionProgress {
  /** Medallas que cuentan para la colección vigente. */
  claimed: number;
  /** Spots activos del evento. */
  total: number;
  /** Cuántas faltan. Nunca negativo. */
  remaining: number;
  /** 0-100, entero. Nunca pasa de 100 ni baja de 0. */
  percent: number;
  isComplete: boolean;
}

/**
 * Progreso de colección de un visitante.
 *
 * Recibe IDS y no cantidades a propósito. Con dos números sueltos
 * (`claimed = 5`, `total = 4`) no hay forma de saber que uno de los reclamos
 * era de un stand que el organizador desactivó a mitad del evento — y ahí el
 * porcentaje da 125%.
 *
 * Con los ids se intersectan: la colección son los spots ACTIVOS, y un reclamo
 * de un spot que ya no está no cuenta para la meta actual.
 *
 * ⚠️ El número que sale de acá NO sirve para el sorteo: la elegibilidad cuenta
 * todos los reclamos, no solo los de spots activos. Ver `raffleEligibility`.
 */
export function collectionProgress(
  claimedSpotIds: readonly string[],
  activeSpotIds: readonly string[]
): CollectionProgress {
  const active = new Set(activeSpotIds);
  // Set y no `.filter().length`: si algún día se afloja el índice único
  // (event_spot_id, user_id), un reclamo duplicado no infla el conteo.
  const claimedActive = new Set(claimedSpotIds.filter((id) => active.has(id)));

  const claimed = claimedActive.size;
  const total = active.size;

  return {
    claimed,
    total,
    remaining: Math.max(0, total - claimed),
    // total === 0 es división por cero: un evento sin spots activos daria NaN
    // y el ancho de la barra quedaría en el literal "NaN%".
    percent: total === 0 ? 0 : Math.min(100, Math.round((claimed / total) * 100)),
    // Sin el `total > 0`, un evento vacío reportaría "completaste la colección"
    // a alguien que no reclamó nada.
    isComplete: total > 0 && claimed >= total,
  };
}

export interface RaffleEligibility {
  isEligible: boolean;
  claims: number;
  required: number;
  /** Cuántas medallas más para entrar. 0 si ya entra o si está excluido. */
  missing: number;
  /** Trabaja en el evento: no participa por más medallas que junte. */
  isExcluded: boolean;
}

/**
 * Si ESTE visitante entra al sorteo, para mostrárselo.
 *
 * No decide ganadores ni enumera elegibles: eso lo hace `draw_raffle()` en el
 * servidor, donde el visitante no llega. Acá solo se pinta UI, así que lo peor
 * que puede pasar si el número no coincide es que alguien vea "ya participás"
 * y no gane.
 *
 * `claims` es el conteo CRUDO de reclamos del evento, no `collectionProgress().claimed`:
 * `raffle_eligible` en SQL hace `count(*)` sobre `spot_claims` sin filtrar por
 * spots activos. Pasarle el progreso hace que la UI y el sorteo real no
 * coincidan cuando el organizador dio de baja algún stand.
 *
 * `isExcluded` llega resuelto del servidor: saber si alguien es staff exige
 * leer organization_members / event_members / platform_admins, y eso es I/O.
 * Domain no consulta nada.
 *
 * Cuenta RECLAMOS, no puntos. Si algún día el sorteo pondera por `points`,
 * hay que cambiar los dos lados juntos.
 */
export function raffleEligibility(
  claims: number,
  minClaims: number,
  isExcluded = false
): RaffleEligibility {
  const required = Math.max(0, minClaims);
  const isEligible = !isExcluded && claims >= required;

  return {
    isEligible,
    claims,
    required,
    // Un excluido tiene `missing = 0` y `isEligible = false`. Mostrarle
    // "te faltan 3 medallas" sería mentirle: por mas que junte, no participa.
    missing: isExcluded ? 0 : Math.max(0, required - claims),
    isExcluded,
  };
}
