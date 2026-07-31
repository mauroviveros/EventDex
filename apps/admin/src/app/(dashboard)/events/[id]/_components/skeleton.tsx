import { Skeleton } from "@/components/ui/skeleton";
import { EventTabsSkeleton } from "./tabs-skeleton";

/** Encabezado del evento: título, estado y línea de metadatos. */
export function EventHeadlineSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

/** Pantalla completa del detalle, para el `loading.tsx` de la ruta. */
export function EventDetailSkeleton() {
  return (
    <main className="flex flex-col gap-6 p-4">
      <EventHeadlineSkeleton />
      <EventTabsSkeleton />
    </main>
  );
}
