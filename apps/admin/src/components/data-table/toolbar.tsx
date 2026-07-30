"use client";

import type { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Filtro de opciones fijas sobre una columna (estado, tipo, etc.). */
export type DataTableFilter = {
  /** id de la columna sobre la que aplica. */
  column: string;
  label: string;
  options: { value: string; label: string }[];
};

/** Valor del select cuando el filtro está sin aplicar (Radix no acepta ""). */
const ALL = "__all__";

type DataTableToolbarProps<TData> = Readonly<{
  table: Table<TData>;
  searchColumn?: string;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
}>;

export function DataTableToolbar<TData>({
  table,
  searchColumn,
  searchPlaceholder = "Buscar…",
  filters = [],
}: DataTableToolbarProps<TData>) {
  const search = searchColumn ? table.getColumn(searchColumn) : undefined;
  const isFiltered = table.getState().columnFilters.length > 0;

  if (!search && filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {search && (
        <InputGroup className="w-full sm:max-w-64">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={searchPlaceholder}
            value={(search.getFilterValue() as string) ?? ""}
            onChange={(event) => search.setFilterValue(event.target.value)}
          />
        </InputGroup>
      )}

      {filters.map((filter) => {
        const column = table.getColumn(filter.column);
        if (!column) return null;

        return (
          <Select
            key={filter.column}
            value={(column.getFilterValue() as string) ?? ALL}
            onValueChange={(value) =>
              column.setFilterValue(value === ALL ? undefined : value)
            }
          >
            <SelectTrigger size="sm" className="w-auto min-w-36">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{filter.label}: todos</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}

      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.resetColumnFilters()}
        >
          <X />
          Limpiar
        </Button>
      )}
    </div>
  );
}
