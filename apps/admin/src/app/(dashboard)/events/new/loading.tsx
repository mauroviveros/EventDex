import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import { EventFormSkeleton } from "../_components/form-skeleton";

/**
 * El breadcrumb de esta ruta es fijo, así que se renderiza real: solo el
 * formulario, que espera al guard de membresía, va como placeholder.
 */
export default function NewEventLoading() {
  return (
    <>
      <Header
        items={[
          { label: "Eventos", href: "/events" },
          { label: "Nuevo evento" },
        ]}
      />

      <main className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        <EventFormSkeleton />
      </main>
    </>
  );
}
