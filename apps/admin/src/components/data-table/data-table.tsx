"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./pagination";
import { type DataTableFilter, DataTableToolbar } from "./toolbar";

type DataTableProps<TData, TValue> = Readonly<{
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Sustantivo para el contador de la paginación ("stands", "visitantes"). */
  label: string;
  /** Columna sobre la que busca el input del toolbar. */
  searchColumn?: string;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  /** Mensaje cuando no hay datos (distinto de "no hay resultados del filtro"). */
  empty: string;
  pageSize?: number;
}>;

/**
 * Tabla con búsqueda, filtros, orden y paginación del lado del cliente
 * (TanStack Table).
 *
 * Los datos llegan completos desde el server component: a la escala del
 * dashboard (decenas de stands, cientos de visitantes) filtrar en memoria es
 * instantáneo y evita un round-trip por tecla. Si alguna tabla crece a miles
 * de filas, el cambio es mover paginado y filtros al servidor.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  label,
  searchColumn,
  searchPlaceholder,
  filters,
  empty,
  pageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize } },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
  });

  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-12 text-center text-muted-foreground text-sm">
        {empty}
      </p>
    );
  }

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar
        table={table}
        searchColumn={searchColumn}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
      />

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Ningún resultado para esa búsqueda.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} label={label} />
    </div>
  );
}
