export interface Countdown {
  /** Milisegundos restantes. 0 si el objetivo ya pasó. */
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isDone: boolean;
}

export function timeUntil(target: number, now: number = Date.now()): Countdown {
  // El clamp evita el clásico "faltan -3 días" cuando el evento ya arrancó y
  // el intervalo del cliente sigue corriendo.
  const total = Math.max(0, target - now);
  const seconds = Math.floor(total / 1000);

  return {
    total,
    days: Math.floor(seconds / 86_400),
    hours: Math.floor((seconds % 86_400) / 3_600),
    minutes: Math.floor((seconds % 3_600) / 60),
    seconds: seconds % 60,
    isDone: total === 0,
  };
}
