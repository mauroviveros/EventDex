"use client";

import { useEffect, useState } from "react";
import { DataTableSkeleton } from "@/components/data-table/skeleton";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TABS, type TabValue, tabFromHash } from "./tabs";

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: tarjetas de un placeholder, sin identidad propia.
          <Card key={index} size="sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-64 w-full" />
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-4">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 3 }, (_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: barras de un placeholder, sin identidad propia.
              <div key={index} className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: tarjetas de un placeholder, sin identidad propia.
          <Card key={index}>
            <CardHeader className="flex flex-col gap-2">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-3 w-72 max-w-full" />
              <Skeleton className="h-64 w-full" />
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-56 w-full" />
        </CardHeader>
      </Card>
    </div>
  );
}

const SKELETONS: Record<TabValue, React.ReactNode> = {
  overview: <OverviewSkeleton />,
  spots: <DataTableSkeleton rows={5} columns={4} />,
  participants: <DataTableSkeleton rows={5} columns={3} />,
  analytics: <AnalyticsSkeleton />,
};

/**
 * Placeholder de los tabs, ajustado al tab del hash.
 *
 * Es un componente cliente porque el hash no viaja al servidor: en una
 * navegación desde el listado, React renderiza este loading en el cliente y el
 * hash ya está disponible. En una recarga dura el HTML llega del servidor con
 * el placeholder del resumen y se corrige al hidratar —el mismo compromiso que
 * tienen los tabs reales.
 */
export function EventTabsSkeleton() {
  const [tab, setTab] = useState<TabValue>("overview");

  useEffect(() => setTab(tabFromHash()), []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-9 w-fit items-center gap-1 rounded-lg bg-muted p-[3px]">
        {TABS.map(({ value, label }) => (
          <Skeleton
            key={value}
            className="h-full rounded-md"
            style={{ width: `${label.length * 0.55 + 1}rem` }}
          />
        ))}
      </div>

      <div className="pt-2">{SKELETONS[tab]}</div>
    </div>
  );
}
