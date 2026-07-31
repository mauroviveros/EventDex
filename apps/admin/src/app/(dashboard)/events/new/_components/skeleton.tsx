import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Etiqueta + control, la unidad que se repite en todo el formulario. */
function FieldSkeleton({ input = "h-9" }: Readonly<{ input?: string }>) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className={input} />
    </div>
  );
}

/** Espeja el formulario de alta: dos columnas arriba y las jornadas abajo. */
export function NewEventSkeleton() {
  return (
    <div className="flex max-w-6xl flex-col gap-4">
      <Skeleton className="h-4 w-64" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-7">
            <FieldSkeleton />
            <FieldSkeleton input="h-20" />
            <div className="grid gap-7 sm:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="flex flex-col gap-7">
            <FieldSkeleton />
            <FieldSkeleton />
            <div className="grid gap-7 sm:grid-cols-3">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-4 w-96 max-w-full" />

          <div className="grid gap-3 2xl:grid-cols-2">
            <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
              <div className="min-w-44 flex-1">
                <FieldSkeleton />
              </div>
              <div className="min-w-44 flex-1">
                <FieldSkeleton />
              </div>
              <Skeleton className="size-9 shrink-0" />
            </div>
          </div>

          <Skeleton className="h-8 w-40" />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}
