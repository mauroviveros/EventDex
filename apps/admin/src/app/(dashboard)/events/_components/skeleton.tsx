import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Espeja el layout de /events: subtítulo, métricas, filtros y grilla. */
export function EventsSkeleton() {
  return (
    <main className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: tarjetas de un placeholder, sin identidad propia.
          <Card key={index}>
            <CardHeader className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-9 flex-1 lg:max-w-80" />
        <Skeleton className="h-8 w-80" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: tarjetas de un placeholder, sin identidad propia.
          <Card key={index}>
            <CardHeader className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-56" />
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
              <Skeleton className="h-1.5 w-full" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </main>
  );
}
