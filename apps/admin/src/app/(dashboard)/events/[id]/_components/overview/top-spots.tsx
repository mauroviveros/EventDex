import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { EventOverview } from "@/types";

type TopSpotsProps = Readonly<{
  spots: EventOverview["topSpots"];
  total: number;
}>;

export function TopSpots({ spots, total }: TopSpotsProps) {
  // Las barras son relativas al más escaneado: comparan entre sí, no contra
  // un máximo teórico.
  const max = spots[0]?.scans ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stands más escaneados</CardTitle>
        <CardAction className="text-muted-foreground text-sm tabular-nums">
          {spots.length} de {total}
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {spots.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin escaneos todavía.</p>
        ) : (
          spots.map((spot) => (
            <div key={spot.id} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-sm">
                  {spot.name}
                </span>
                <span className="text-sm tabular-nums">{spot.scans}</span>
              </div>

              <Progress
                value={max ? (spot.scans * 100) / max : 0}
                className="h-1.5"
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
