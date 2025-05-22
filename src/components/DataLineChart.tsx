
"use client";

import type { DataPoint } from "@/lib/types";
// format from date-fns is no longer needed as X-axis is numeric
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
} from "recharts";
import { useMemo } from "react";

interface DataLineChartProps {
  data: DataPoint[];
}

const chartConfig = {
  value: {
    label: "Score Difference", // Updated label
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function DataLineChart({ data }: DataLineChartProps) {
  // Data can be used directly as pointSequence is numeric
  const chartData = useMemo(() => {
    // Show at least two points for the line to render, even if the second is a duplicate of the first
    // if data has only one point (initial {pointSequence: 0, value: 0})
    if (data.length === 1) {
        return [data[0], {...data[0], pointSequence: data[0].pointSequence + 0.001}]; // Add tiny offset for second point
    }
    return data;
  }, [data]);


  if (data.length === 0 || (data.length === 1 && data[0].pointSequence === 0 && data[0].value === 0 && data.every(p => p.value === data[0].value))) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-muted-foreground/50 bg-muted/20 p-4 text-center text-muted-foreground shadow-inner">
        <p>No points recorded yet. Use the 'Player Wins Point' or 'Opponent Wins Point' buttons to track the match and see the graph update.</p>
      </div>
    );
  }
  
  const yDomain: [number | 'auto', number | 'auto'] = useMemo(() => {
    if (data.length === 0) return ['auto', 'auto'];
    const values = data.map(p => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    if (minVal === maxVal) { // If all values are same (e.g. initially 0, or always 0)
        return [minVal - 1, maxVal + 1]; // Provide a small range
    }
    return ['auto', 'auto']; // Let recharts decide otherwise
  }, [data]);

  // Determine X-axis ticks dynamically or set a fixed interval
  const xTicks = useMemo(() => {
    if (data.length < 2) return undefined; // Let Recharts decide for very few points
    const maxPoint = Math.max(...data.map(p => p.pointSequence));
    if (maxPoint <= 10) return undefined; // Default ticks for up to 10 points
    // Example: show a tick every 5 points if more than 10 points
    const ticks = [];
    for (let i = 0; i <= maxPoint; i += Math.max(1, Math.floor(maxPoint / 10)) ) { // Aim for around 10 ticks
      ticks.push(i);
    }
    if (!ticks.includes(maxPoint) && maxPoint > 0) ticks.push(maxPoint); // Ensure last point is a tick
    return ticks.filter(tick => tick >=0);
  }, [data]);


  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <LineChart
        accessibilityLayer
        data={chartData} // Use chartData which might be the same as data or slightly modified
        margin={{
          top: 5,
          right: 20,
          left: -10, 
          bottom: 5,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
        <XAxis
          dataKey="pointSequence" // Use pointSequence for X-axis
          type="number"           // Explicitly set type to number
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          stroke="hsl(var(--muted-foreground))"
          domain={['dataMin', 'dataMax']} // Ensure X-axis spans all points
          allowDecimals={false}
          ticks={xTicks} // Apply dynamic ticks
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          stroke="hsl(var(--muted-foreground))"
          domain={yDomain}
          allowDecimals={false} // Score difference should be integer
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            indicator="line" 
            hideLabel={false} 
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0 && payload[0].payload.pointSequence !== undefined) {
                if (payload[0].payload.pointSequence === 0) return "Start of Match";
                return `After Point ${payload[0].payload.pointSequence}`;
              }
              return label;
            }}
            formatter={(value) => ([value, "Score Diff."])}
            />}
        />
        <Legend />
        <Line
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={3}
          dot={data.length < 50 || data.length === 1} // Show dots for smaller datasets or single point
          activeDot={{ r: 6 }}
          animationDuration={300}
          connectNulls={false} // Important if you have gaps
        />
      </LineChart>
    </ChartContainer>
  );
}
