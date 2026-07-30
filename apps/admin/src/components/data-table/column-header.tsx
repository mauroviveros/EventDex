"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

type DataTableColumnHeaderProps<TData, TValue> = Readonly<{
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}>;

/**
 * Encabezado clickeable para columnas ordenables. Si la columna no lo permite,
 * cae al texto plano.
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={className}>{title}</span>;
  }

  const sorted = column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-2 h-8 data-[state=open]:bg-accent", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      <Icon className={cn("size-3.5", !sorted && "text-muted-foreground")} />
    </Button>
  );
}
