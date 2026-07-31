import { Skeleton } from "@/components/ui/skeleton";

type DataTableSkeletonProps = Readonly<{
  /** Filas del placeholder: conviene el tamaño de página real. */
  rows?: number;
  columns?: number;
}>;

/**
 * Placeholder de una tabla, con la misma estructura que `DataTable` (toolbar,
 * encabezado, filas y pie) para que al llegar los datos no salte el layout.
 */
export function DataTableSkeleton({
  rows = 5,
  columns = 4,
}: DataTableSkeletonProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-9 w-full lg:max-w-80" />
        <Skeleton className="h-8 w-64" />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="flex items-center gap-4 border-b px-4 py-3">
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: celdas de un placeholder, sin identidad propia.
              key={column}
              className="h-4 flex-1"
            />
          ))}
        </div>

        {Array.from({ length: rows }, (_, row) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: filas de un placeholder, sin identidad propia.
          <div key={row} className="flex items-center gap-4 border-b px-4 py-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            {Array.from({ length: columns - 1 }, (_, column) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: celdas de un placeholder, sin identidad propia.
              <Skeleton key={column} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>

      <Skeleton className="h-5 w-40" />
    </div>
  );
}
