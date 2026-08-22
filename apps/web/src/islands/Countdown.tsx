import { type Countdown as Remaining, timeUntil } from "@eventdex/domain";
import { useEffect, useState } from "react";

interface Props {
  /** Instante al que se cuenta, en milisegundos. */
  target: number;
  /**
   * "Ahora" del servidor, también en milisegundos.
   *
   * Se recibe como prop en vez de llamar `Date.now()` en el primer render por
   * la hidratación: Astro renderiza esta isla en el SERVIDOR y después React la
   * hidrata en el cliente. Si cada lado calculara su propio "ahora", el HTML
   * del servidor y el primer render del cliente diferirían por uno o dos
   * segundos y React tiraría un hydration mismatch.
   *
   * Con el mismo `now` en ambos lados el primer frame es idéntico, y el reloj
   * real arranca recién en el efecto.
   */
  now: number;
}

export default function Countdown({ target, now }: Props) {
  // Inicializador perezoso: la función corre una sola vez, no en cada render.
  const [remaining, setRemaining] = useState<Remaining>(() => timeUntil(target, now));

  useEffect(() => {
    // Recalcular apenas hidrata: entre el render del servidor y este momento
    // pasaron el viaje de red y el parseo, así que el `now` del servidor ya
    // quedó viejo.
    setRemaining(timeUntil(target));

    const id = setInterval(() => setRemaining(timeUntil(target)), 1000);

    // Sin esto el intervalo sobrevive al desmontaje y sigue llamando
    // `setRemaining` sobre un componente que ya no existe.
    return () => clearInterval(id);
  }, [target]);

  if (remaining.isDone) {
    return <p className="text-sm font-medium">¡El evento ya empezó!</p>;
  }

  return (
    <p className="flex gap-4 tabular-nums" aria-live="off">
      <Unit value={remaining.days} label="días" />
      <Unit value={remaining.hours} label="hs" />
      <Unit value={remaining.minutes} label="min" />
      <Unit value={remaining.seconds} label="seg" />
    </p>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex flex-col items-center">
      <strong className="text-2xl">{String(value).padStart(2, "0")}</strong>
      <span className="text-xs uppercase tracking-wide">{label}</span>
    </span>
  );
}
