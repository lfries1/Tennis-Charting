"use client";

import type { DataPoint } from "@/lib/types";
import { format } from "date-fns";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"; // Direct import for ResponsiveContainer, LineChart etc.
import { useMemo } from "react";

interface DataLineChartProps {
  data: DataPoint[];
}

const chartConfig = {
  value: {
    label: "Counter Value",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function DataLineChart({ data }: DataLineChartProps) {
  const formattedData = useMemo(() => {
    return data.map(point => ({
      ...point,
      timeLabel: format(new Date(point.time), "HH:mm:ss"),
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-muted-foreground/50 bg-muted/20 p-4 text-center text-muted-foreground shadow-inner">
        <p>No data yet. Use the buttons to change the counter value and see the graph update in real-time.</p>
      </div>
    );
  }
  
  // Ensure domain is sensible for small datasets
  const yDomain: [number | 'auto', number | 'auto'] = useMemo(() => {
    if (data.length === 0) return ['auto', 'auto'];
    const values = data.map(p => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    if (minVal === maxVal) {
        return [minVal - 1, maxVal + 1];
    }
    return ['auto', 'auto'];
  }, [data]);


  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <LineChart
        accessibilityLayer
        data={formattedData}
        margin={{
          top: 5,
          right: 20,
          left: -10, // Adjust to show Y-axis labels if numbers are large
          bottom: 5,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
        <XAxis
          dataKey="timeLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          stroke="hsl(var(--muted-foreground))"
          domain={yDomain}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" hideLabel />}
        />
        <Legend />
        <Line
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={3}
          dot={data.length < 50} // Show dots for smaller datasets
          activeDot={{ r: 6 }}
          animationDuration={300}
        />
      </LineChart>
    </ChartContainer>
  );
}
