"use client";

import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type DataTablePaginationProps<TData> = Readonly<{
  table: Table<TData>;
  /** Sustantivo para el contador ("stands", "visitantes"). */
  label: string;
}>;

export function DataTablePagination<TData>({
  table,
  label,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const pages = table.getPageCount();

  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-muted-foreground text-sm tabular-nums">
        {from}–{to} de {total} {label}
      </p>

      {pages > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm tabular-nums">
            Página {pageIndex + 1} de {pages}
          </span>

          <Button
            variant="outline"
            size="icon"
            aria-label="Página anterior"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft />
          </Button>

          <Button
            variant="outline"
            size="icon"
            aria-label="Página siguiente"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
