"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
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
import { useUrlStateReader, useUrlStateWriter } from "@/hooks/use-url-state";
import { DataTablePagination } from "./pagination";
import { formatSort, parseSort } from "./sorting";
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
  /**
   * Prefijo con el que la vista se persiste en la URL (`spots.q`, `spots.sort`…).
   * Sin prefijo, el estado no sobrevive a una recarga.
   */
  urlPrefix?: string;
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
  urlPrefix = "",
}: DataTableProps<TData, TValue>) {
  const readParam = useUrlStateReader(urlPrefix);

  // El estado inicial sale de la URL: se lee una sola vez (los cambios
  // posteriores los escribe el efecto de abajo, sin navegar).
  const [sorting, setSorting] = useState<SortingState>(() =>
    parseSort(readParam("sort")),
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    const initial: ColumnFiltersState = [];

    if (searchColumn && readParam("q")) {
      initial.push({ id: searchColumn, value: readParam("q") });
    }
    for (const filter of filters ?? []) {
      const value = readParam(filter.column);
      if (value) initial.push({ id: filter.column, value });
    }

    return initial;
  });
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: Math.max(0, Number(readParam("page") || 1) - 1),
    pageSize,
  }));

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
  });

  const filterValue = (id: string) =>
    (columnFilters.find((filter) => filter.id === id)?.value as string) ?? null;

  useUrlStateWriter(urlPrefix, {
    q: searchColumn ? filterValue(searchColumn) : null,
    sort: formatSort(sorting),
    // La página se guarda en base 1, como se muestra, y se omite en la primera.
    page: pagination.pageIndex > 0 ? String(pagination.pageIndex + 1) : null,
    ...Object.fromEntries(
      (filters ?? []).map((filter) => [
        filter.column,
        filterValue(filter.column),
      ]),
    ),
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
