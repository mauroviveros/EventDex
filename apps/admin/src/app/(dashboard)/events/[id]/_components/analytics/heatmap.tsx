import { Fragment } from "react";
import type { EventAnalytics } from "@/types";
import { cn } from "@/utils";

type HeatmapProps = Readonly<{ heatmap: EventAnalytics["heatmap"] }>;

/**
 * Mapa de calor stand × hora. No usa la librería de gráficos: es una grilla
 * CSS, que para esto es más liviano y accesible (cada celda lleva su título).
 *
 * La intensidad es relativa a la celda más caliente del evento.
 */
export function Heatmap({ heatmap }: HeatmapProps) {
  if (heatmap.rows.length === 0 || heatmap.hours.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Sin escaneos para cruzar.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `10rem repeat(${heatmap.hours.length}, minmax(2rem, 1fr))`,
          }}
        >
          <span />
          {heatmap.hours.map((hour) => (
            <span
              key={hour}
              className="text-center text-muted-foreground text-xs tabular-nums"
            >
              {String(hour).padStart(2, "0")}
            </span>
          ))}

          {heatmap.rows.map((row) => (
            <Fragment key={row.id}>
              <span className="truncate pr-2 text-sm" title={row.name}>
                {row.name}
              </span>

              {row.cells.map((value, index) => (
                <div
                  key={heatmap.hours[index]}
                  title={`${row.name} · ${String(heatmap.hours[index]).padStart(2, "0")}:00 · ${value} escaneos`}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-sm text-xs tabular-nums",
                    value === 0 && "bg-muted/40 text-muted-foreground/40",
                  )}
                  style={
                    value > 0
                      ? {
                          backgroundColor: `color-mix(in oklab, var(--chart-1) ${Math.round((value * 100) / heatmap.max)}%, var(--muted))`,
                        }
                      : undefined
                  }
                >
                  {value || ""}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
