"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { EventAnalytics } from "@/types";

const config = {
  scans: { label: "Escaneos", color: "var(--chart-1)" },
  newVisitors: { label: "Llegadas", color: "var(--chart-2)" },
  cumulative: { label: "Escaneos acumulados", color: "var(--chart-1)" },
  cumulativeVisitors: {
    label: "Visitantes acumulados",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

/**
 * Cuándo llegó la gente: cada visitante cuenta una sola vez, en la hora de su
 * primer escaneo.
 */
export function ArrivalsChart({ data }: { data: EventAnalytics["timeline"] }) {
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="newVisitors" fill="var(--color-newVisitors)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

/**
 * Escaneos y visitantes acumulados. La distancia entre las curvas es cuánto
 * recorrió la gente: si el área crece, los que ya entraron siguen sumando
 * medallas; si van pegadas, cada visitante escanea uno y abandona.
 */
export function CumulativeChart({
  data,
}: {
  data: EventAnalytics["timeline"];
}) {
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="cumulative"
          type="monotone"
          stroke="var(--color-cumulative)"
          fill="var(--color-cumulative)"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Area
          dataKey="cumulativeVisitors"
          type="monotone"
          stroke="var(--color-cumulativeVisitors)"
          fill="var(--color-cumulativeVisitors)"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

/** Ranking de stands por escaneos. */
export function SpotsChart({ data }: { data: EventAnalytics["perSpot"] }) {
  return (
    <ChartContainer
      config={config}
      className="w-full"
      style={{ height: `${Math.max(data.length * 36, 120)}px` }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="scans" fill="var(--color-scans)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

/** Escaneos y visitantes por jornada. */
export function PerDayChart({ data }: { data: EventAnalytics["perDay"] }) {
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="scans" fill="var(--color-scans)" radius={4} />
        <Bar dataKey="visitors" fill="var(--color-visitors)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

const distributionConfig = {
  visitors: { label: "Visitantes", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Cuántos visitantes juntaron exactamente N medallas. La última barra —los que
 * completaron el recorrido— se resalta.
 */
export function DistributionChart({
  data,
  totalSpots,
}: {
  data: EventAnalytics["distribution"];
  totalSpots: number;
}) {
  return (
    <ChartContainer config={distributionConfig} className="h-56 w-full">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="medals"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="visitors" radius={4}>
          {data.map((entry) => (
            <Cell
              key={entry.medals}
              fill={
                entry.medals >= totalSpots
                  ? "var(--chart-2)"
                  : "var(--color-visitors)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
