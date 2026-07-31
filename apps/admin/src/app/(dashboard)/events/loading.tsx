import { Header } from "@/components/header";
import { EventsSkeleton } from "./_components/skeleton";

/**
 * El título es fijo, así que el header se renderiza real: solo el contenido
 * que depende de la consulta aparece como placeholder.
 */
export default function EventsLoading() {
  return (
    <>
      <Header items={[{ label: "Eventos" }]} />
      <EventsSkeleton />
    </>
  );
}
