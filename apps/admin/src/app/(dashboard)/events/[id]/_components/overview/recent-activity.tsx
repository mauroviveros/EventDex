import { ScanLine } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EventOverview } from "@/types";
import { formatRelativeTime } from "@/utils";

type RecentActivityProps = Readonly<{ recent: EventOverview["recent"] }>;

/**
 * Últimos escaneos. Es una foto del momento de la carga: no se actualiza solo,
 * se refresca al recargar la página.
 */
export function RecentActivity({ recent }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad reciente</CardTitle>
        <CardDescription>Al momento de cargar la página.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin escaneos todavía.</p>
        ) : (
          recent.map((scan) => (
            <div key={scan.id} className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <ScanLine className="size-4 text-muted-foreground" />
              </div>

              <div className="grid min-w-0 leading-tight">
                <p className="text-sm">
                  <span className="font-medium">{scan.user}</span> escaneó{" "}
                  <span className="font-medium">{scan.spot}</span>
                </p>
                <span className="text-muted-foreground text-xs">
                  {formatRelativeTime(scan.collectedAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
