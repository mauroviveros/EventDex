import { MapPin, QrCode, Trophy, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { EventOverview } from "@/types";

type StatsProps = Readonly<{ totals: EventOverview["totals"] }>;

export function OverviewStats({ totals }: StatsProps) {
  const perVisitor = totals.visitors
    ? (totals.scans / totals.visitors).toFixed(1)
    : "0";
  const completedShare = totals.visitors
    ? Math.round((totals.completed * 100) / totals.visitors)
    : 0;

  const stats = [
    {
      label: "Visitantes",
      Icon: Users,
      value: totals.visitors,
      detail: "únicos con al menos un escaneo",
    },
    {
      label: "Escaneos",
      Icon: QrCode,
      value: totals.scans,
      detail: `${perVisitor} por visitante`,
    },
    {
      label: "Stands activos",
      Icon: MapPin,
      value: totals.activeSpots,
      detail: `de ${totals.spots} cargados`,
    },
    {
      label: "Recorrido completo",
      Icon: Trophy,
      value: totals.completed,
      detail: `${completedShare}% de los visitantes`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, Icon, value, detail }) => (
        <Card key={label} size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-5 text-muted-foreground" />
            </div>

            <div className="grid min-w-0 leading-tight">
              <span className="font-semibold text-2xl tabular-nums">
                {value}
              </span>
              <span className="font-medium text-sm">{label}</span>
              <span className="truncate text-muted-foreground text-xs">
                {detail}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
