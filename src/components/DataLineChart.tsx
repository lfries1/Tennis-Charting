
"use client";

import type { DataPoint } from "@/lib/types";
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

// Updated chartConfig for positive/negative momentum colors
const chartConfig = {
  positiveMomentum: {
    label: "Player Momentum",
    color: "hsl(var(--chart-4))", // Orange-ish color from theme
  },
  negativeMomentum: {
    label: "Opponent Momentum",
    color: "hsl(var(--destructive))", // Red color from theme
  },
} satisfies ChartConfig;

export function DataLineChart({ data }: DataLineChartProps) {
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

  const xTicks = useMemo(() => {
    if (data.length < 2) return undefined;
    const maxPoint = Math.max(...data.map(p => p.pointSequence));
    if (maxPoint <= 10) return undefined; 
    const ticks = [];
    for (let i = 0; i <= maxPoint; i += Math.max(1, Math.floor(maxPoint / 10)) ) {
      ticks.push(i);
    }
    if (!ticks.includes(maxPoint) && maxPoint > 0) ticks.push(maxPoint);
    return ticks.filter(tick => tick >=0);
  }, [data]);

  // chartDataForProcessing handles the single point case for line rendering
  const chartDataForProcessing = useMemo(() => {
    if (data.length === 1 && data[0].pointSequence === 0 && data[0].value === 0) {
        // Add a tiny offset for the second point if only the initial point exists, to make the line render
        return [data[0], {...data[0], pointSequence: data[0].pointSequence + 0.001}];
    }
    return data;
  }, [data]);

  const { positiveDataLine, negativeDataLine } = useMemo(() => {
    const positive: (DataPoint | { pointSequence: number; value: null })[] = [];
    const negative: (DataPoint | { pointSequence: number; value: null })[] = [];

    chartDataForProcessing.forEach(point => {
      if (point.value > 0) {
        positive.push(point);
        negative.push({ pointSequence: point.pointSequence, value: null });
      } else if (point.value < 0) {
        negative.push(point);
        positive.push({ pointSequence: point.pointSequence, value: null });
      } else { // value === 0, include in both for continuous lines across axis
        positive.push(point);
        negative.push(point);
      }
    });
    return { positiveDataLine: positive, negativeDataLine: negative };
  }, [chartDataForProcessing]);
  
  // Condition for showing "No points recorded" message
  const showNoPointsMessage = data.length === 0 || 
                             (data.length === 1 && data[0].pointSequence === 0 && data[0].value === 0) ||
                             (data.length > 0 && data.every(p => p.value === 0 && p.pointSequence === 0));


  if (showNoPointsMessage) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-muted-foreground/50 bg-muted/20 p-4 text-center text-muted-foreground shadow-inner">
        <p>No points recorded yet. Use the 'Player Wins Point' or 'Opponent Wins Point' buttons to track the match and see the graph update.</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <LineChart
        accessibilityLayer
        // Use the chartDataForProcessing for general chart properties if it was modified (e.g. for single point)
        // The actual line data comes from positiveDataLine and negativeDataLine
        data={chartDataForProcessing} 
        margin={{
          top: 5,
          right: 20,
          left: -10, 
          bottom: 5,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
        <XAxis
          dataKey="pointSequence"
          type="number"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          stroke="hsl(var(--muted-foreground))"
          domain={['dataMin', 'dataMax']}
          allowDecimals={false}
          ticks={xTicks}
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
          content={<ChartTooltipContent 
            indicator="line" 
            hideLabel={false} 
            labelFormatter={(label, payload) => {
              // Check payload and its structure before accessing properties
              if (payload && payload.length > 0 && payload[0].payload && payload[0].payload.pointSequence !== undefined) {
                const ps = payload[0].payload.pointSequence;
                if (ps === 0 || ps === 0.001) return "Start of Match";
                return `After Point ${ps}`;
              }
              return label; // Fallback to default label
            }}
            formatter={(value) => ([value, "Score Diff."])}
            />}
        />
        <Legend />
        <Line
          dataKey="value"
          type="linear" // Straight lines
          data={positiveDataLine}
          stroke="var(--color-positiveMomentum)"
          strokeWidth={3}
          dot={chartDataForProcessing.length < 50 || chartDataForProcessing.length === 1}
          activeDot={{ r: 6 }}
          animationDuration={300}
          connectNulls={false} // Important for segmented lines
          name={chartConfig.positiveMomentum.label}
        />
        <Line
          dataKey="value"
          type="linear" // Straight lines
          data={negativeDataLine}
          stroke="var(--color-negativeMomentum)"
          strokeWidth={3}
          dot={chartDataForProcessing.length < 50 || chartDataForProcessing.length === 1}
          activeDot={{ r: 6 }}
          animationDuration={300}
          connectNulls={false} // Important for segmented lines
          name={chartConfig.negativeMomentum.label}
        />
      </LineChart>
    </ChartContainer>
  );
}

