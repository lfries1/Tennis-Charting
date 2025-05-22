
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

const chartConfig = {
  positiveMomentum: {
    label: "Player Momentum",
    color: "hsl(var(--chart-4))", 
  },
  negativeMomentum: {
    label: "Opponent Momentum",
    color: "hsl(var(--destructive))", 
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

  const chartDataForProcessing = useMemo(() => {
    if (data.length === 1 && data[0].pointSequence === 0 && data[0].value === 0) {
        return [data[0], {...data[0], pointSequence: data[0].pointSequence + 0.001}];
    }
    return data;
  }, [data]);

  const { positiveDataLine, negativeDataLine, enrichedDataLength } = useMemo(() => {
    if (chartDataForProcessing.length === 0) {
      return { positiveDataLine: [], negativeDataLine: [], enrichedDataLength: 0 };
    }

    const enrichedData: DataPoint[] = [];
    if (chartDataForProcessing.length > 0) {
      enrichedData.push(chartDataForProcessing[0]);
    }

    for (let i = 0; i < chartDataForProcessing.length - 1; i++) {
      const p1 = chartDataForProcessing[i];
      const p2 = chartDataForProcessing[i + 1];

      if (p1.value * p2.value < 0) { // Different signs, and neither is zero
        const x1 = p1.pointSequence;
        const y1 = p1.value;
        const x2 = p2.pointSequence;
        const y2 = p2.value;
        
        // Avoid division by zero if y1 equals y2 (should not happen due to p1.value * p2.value < 0)
        // or if x1 equals x2 (vertical line, intercept is x1)
        if (y1 !== y2 && x1 !== x2) {
            const xIntercept = x1 - y1 * (x2 - x1) / (y2 - y1);
            enrichedData.push({ pointSequence: xIntercept, value: 0 });
        } else if (x1 === x2 && y1 !== y2) { // Vertical line crossing zero
             enrichedData.push({ pointSequence: x1, value: 0 });
        }
      }
      enrichedData.push(p2);
    }
    
    // Sort by pointSequence to ensure correct order after adding intercepts
    enrichedData.sort((a, b) => a.pointSequence - b.pointSequence);

    // Deduplicate points that might have been added if an original point was an intercept
    const uniqueEnrichedData = enrichedData.reduce((acc, current) => {
      const x = acc.find(item => item.pointSequence === current.pointSequence);
      if (!x) {
        return acc.concat([current]);
      }
      // If duplicate pointSequence, prefer the one with value 0 if it exists (it's an intercept)
      // This handles cases where an original point might be very close to an intercept.
      if (current.value === 0) {
        acc[acc.findIndex(item => item.pointSequence === current.pointSequence)] = current;
      }
      return acc;
    }, [] as DataPoint[]);


    const finalPositive: (DataPoint | { pointSequence: number; value: null })[] = [];
    const finalNegative: (DataPoint | { pointSequence: number; value: null })[] = [];

    uniqueEnrichedData.forEach(point => {
      if (point.value >= 0) {
        finalPositive.push(point);
      } else {
        finalPositive.push({ pointSequence: point.pointSequence, value: null });
      }

      if (point.value <= 0) {
        finalNegative.push(point);
      } else {
        finalNegative.push({ pointSequence: point.pointSequence, value: null });
      }
    });
    
    return { positiveDataLine: finalPositive, negativeDataLine: finalNegative, enrichedDataLength: uniqueEnrichedData.length };
  }, [chartDataForProcessing]);
  
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

  const showDots = enrichedDataLength < 50 || enrichedDataLength === 1;

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <LineChart
        accessibilityLayer
        data={chartDataForProcessing} // Base data for XAxis, YAxis context, actual lines use processed data
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
          allowDecimals={false} // Keep as false for point numbers
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
              if (payload && payload.length > 0 && payload[0].payload && payload[0].payload.pointSequence !== undefined) {
                const ps = payload[0].payload.pointSequence;
                // Handle the 0.001 case for start of match
                if (ps === 0 || (data.length === 1 && ps === chartDataForProcessing[1]?.pointSequence) ) {
                     // Check if it's the special 0.001 point and map to "Start of Match"
                     if (chartDataForProcessing.length === 2 && chartDataForProcessing[0].pointSequence === 0 && chartDataForProcessing[1].pointSequence === 0.001 && ps === 0.001) {
                        return "Start of Match";
                     }
                     if (ps === 0) return "Start of Match";
                }
                // Format float point sequences to a reasonable precision for display if they are intercepts
                const formattedPs = Number.isInteger(ps) ? ps : parseFloat(ps.toFixed(2));
                return `After Point ${formattedPs}`;
              }
              return typeof label === 'number' ? `Point ${label.toFixed(2)}` : String(label);
            }}
            formatter={(value, name, props) => {
                // Ensure value is not null before formatting
                const displayValue = value === null ? "N/A" : value;
                // payload.value is the score diff.
                // payload.name is "Player Momentum" or "Opponent Momentum"
                // We only want to show one value: the score difference.
                if (props.payload.value !== null) { // Only show if there's an actual data value
                    return [props.payload.value, "Score Diff."];
                }
                return []; // Don't show tooltip item if value is null for this line
            }}
            />}
        />
        <Legend />
        <Line
          dataKey="value"
          type="linear"
          data={positiveDataLine}
          stroke="var(--color-positiveMomentum)"
          strokeWidth={3}
          dot={showDots}
          activeDot={{ r: 6 }}
          animationDuration={300}
          connectNulls={false} 
          name={chartConfig.positiveMomentum.label}
        />
        <Line
          dataKey="value"
          type="linear"
          data={negativeDataLine}
          stroke="var(--color-negativeMomentum)"
          strokeWidth={3}
          dot={showDots}
          activeDot={{ r: 6 }}
          animationDuration={300}
          connectNulls={false}
          name={chartConfig.negativeMomentum.label}
        />
      </LineChart>
    </ChartContainer>
  );
}
