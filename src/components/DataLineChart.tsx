
"use client";

import type { DataPoint, GameMarker } from "@/lib/types";
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
  ReferenceLine,
  Label as RechartsLabel, // Renamed to avoid conflict if shadcn Label is used
} from "recharts";
import { useMemo } from "react";

interface DataLineChartProps {
  data: DataPoint[];
  gameMarkers?: GameMarker[];
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

export function DataLineChart({ data, gameMarkers }: DataLineChartProps) {
  const yDomain: [number | 'auto', number | 'auto'] = useMemo(() => {
    if (data.length === 0) return ['auto', 'auto'];
    const values = data.map(p => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    
    // Ensure yDomain always has a spread of at least 2, even if all values are same or only one point.
    // Or if minVal and maxVal are too close.
    const padding = 1; // Minimum padding above and below
    let finalMin = minVal;
    let finalMax = maxVal;

    if (minVal === maxVal) {
        finalMin = minVal - padding;
        finalMax = maxVal + padding;
    } else {
        // If data range is very small, expand it a bit
        if (maxVal - minVal < 2 * padding && data.length > 1) {
             const mid = (minVal + maxVal) / 2;
             finalMin = mid - padding;
             finalMax = mid + padding;
        } else {
             // Default 'auto' behavior might be better if range is sufficient.
             // However, to ensure consistent padding, we can set it manually.
             // For now, let's use 'auto' if the range is decent.
             return ['auto', 'auto'];
        }
    }
    return [finalMin, finalMax];
  }, [data]);

  const xTicks = useMemo(() => {
    if (data.length < 2) return undefined; // No ticks if not enough data
    const allXValues = data.map(p => p.pointSequence);
    if (gameMarkers) {
      gameMarkers.forEach(marker => allXValues.push(marker.pointSequence));
    }
    const maxPoint = Math.max(...allXValues, 0); // Ensure maxPoint is at least 0

    if (maxPoint <= 10) { // For few points, show all integer ticks
        const ticks = Array.from({length: Math.floor(maxPoint) + 1}, (_, i) => i);
        if (!ticks.includes(maxPoint) && maxPoint > 0 && Number.isInteger(maxPoint)) ticks.push(maxPoint);
        return ticks.filter(tick => tick >=0 );
    }
    // For more points, generate about 10-12 ticks
    const interval = Math.max(1, Math.floor(maxPoint / 10));
    const ticks = [];
    for (let i = 0; i <= maxPoint; i += interval) {
      ticks.push(i);
    }
    if (!ticks.includes(maxPoint) && maxPoint > 0) { // Ensure last point is a tick if it's not already covered
        // Check if last tick is close to maxPoint, if so, replace it
        if (ticks.length > 0 && maxPoint - ticks[ticks.length-1] < interval / 2) {
            ticks[ticks.length-1] = Math.ceil(maxPoint); // Make it integer if it's a data point
        } else {
            ticks.push(Math.ceil(maxPoint));
        }
    }
    return [...new Set(ticks.map(t => Math.round(t)))].filter(tick => tick >=0).sort((a,b) => a-b);
  }, [data, gameMarkers]);


  const chartDataForProcessing = useMemo(() => {
    // Ensure there's always at least two points for line drawing if data starts at 0,0
    // This creates a tiny segment at the start if only {0,0} exists, making chart visible.
    if (data.length === 1 && data[0].pointSequence === 0 && data[0].value === 0) {
        return [data[0], {...data[0], pointSequence: data[0].pointSequence + 0.001}]; // Create a micro point
    }
    return data.length > 0 ? data : [{pointSequence: 0, value: 0}, {pointSequence: 0.001, value: 0}]; // Default if no data
  }, [data]);


  const { positiveDataLine, negativeDataLine, enrichedDataLength } = useMemo(() => {
    if (chartDataForProcessing.length === 0) {
      return { positiveDataLine: [], negativeDataLine: [], enrichedDataLength: 0 };
    }

    const enrichedData: DataPoint[] = [];
    if (chartDataForProcessing.length > 0) {
      enrichedData.push(chartDataForProcessing[0]); // Start with the first point
    }

    for (let i = 0; i < chartDataForProcessing.length - 1; i++) {
      const p1 = chartDataForProcessing[i];
      const p2 = chartDataForProcessing[i + 1];

      // Check if the line segment p1-p2 crosses the x-axis (value = 0)
      if (p1.value * p2.value < 0) { // Signs are different, and neither is zero
        // Calculate the x-intercept (pointSequence where value is 0)
        // Using line equation: y = mx + c
        // x_intercept = x1 - y1 * (x2 - x1) / (y2 - y1)
        const x1 = p1.pointSequence;
        const y1 = p1.value;
        const x2 = p2.pointSequence;
        const y2 = p2.value;
        
        if (y1 !== y2 && x1 !== x2) { // Avoid division by zero or vertical lines not crossing y=0
            const xIntercept = x1 - y1 * (x2 - x1) / (y2 - y1);
            enrichedData.push({ pointSequence: xIntercept, value: 0 });
        } else if (x1 === x2 && y1 * y2 < 0) { // Vertical line that crosses zero
             enrichedData.push({ pointSequence: x1, value: 0 }); // Should not happen with pointSequence incrementing
        }
      }
      enrichedData.push(p2); // Add the second point of the pair
    }
    
    // Sort by pointSequence to ensure correct order after adding intercepts
    enrichedData.sort((a, b) => a.pointSequence - b.pointSequence);

    // Deduplicate points that might have been added if an original point was an intercept
    // or if multiple intercepts are calculated very close to each other.
    const uniqueEnrichedData = enrichedData.reduce((acc, current) => {
      const existingPoint = acc.find(item => item.pointSequence === current.pointSequence);
      if (!existingPoint) {
        return acc.concat([current]);
      } else if (current.value === 0 && existingPoint.value !== 0) {
        // If current is an intercept (value 0) and existing is not, prefer current.
        acc[acc.findIndex(item => item.pointSequence === current.pointSequence)] = current;
      }
      // Otherwise, keep the existing point (handles if original data point was already 0)
      return acc;
    }, [] as DataPoint[]);


    const finalPositive: (DataPoint | { pointSequence: number; value: null })[] = [];
    const finalNegative: (DataPoint | { pointSequence: number; value: null })[] = [];

    uniqueEnrichedData.forEach(point => {
      if (point.value >= 0) {
        finalPositive.push(point);
      } else {
        // Add a null point to break the line if it was positive
        finalPositive.push({ pointSequence: point.pointSequence, value: null });
      }

      if (point.value <= 0) {
        finalNegative.push(point);
      } else {
        // Add a null point to break the line if it was negative
        finalNegative.push({ pointSequence: point.pointSequence, value: null });
      }
    });
    
    return { positiveDataLine: finalPositive, negativeDataLine: finalNegative, enrichedDataLength: uniqueEnrichedData.length };
  }, [chartDataForProcessing]);
  
  const showNoPointsMessage = data.length === 0 || 
                             (data.length === 1 && data[0].pointSequence === 0 && data[0].value === 0 && chartDataForProcessing.length <=2 ) || // Check processed too
                             (data.length > 0 && data.every(p => p.value === 0 && p.pointSequence === 0));


  if (showNoPointsMessage && (!gameMarkers || gameMarkers.length === 0) ) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-muted-foreground/50 bg-muted/20 p-4 text-center text-muted-foreground shadow-inner">
        <p>No points recorded yet. Use the point or game buttons to track the match and see the graph update.</p>
      </div>
    );
  }

  const showDots = enrichedDataLength < 50 || data.length === 1; // Show dots for few points or single actual data point

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <LineChart
        accessibilityLayer
        // Use a combined dataset for axis calculation if necessary, or let Recharts auto-adjust
        data={chartDataForProcessing} // Base data for X/Y axis context
        margin={{
          top: 20, // Increased top margin for game score labels
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
              if (payload && payload.length > 0 && payload[0].payload && payload[0].payload.pointSequence !== undefined) {
                const ps = payload[0].payload.pointSequence;
                if (ps === 0 || (data.length === 1 && ps === chartDataForProcessing[1]?.pointSequence) ) {
                     if (chartDataForProcessing.length === 2 && chartDataForProcessing[0].pointSequence === 0 && chartDataForProcessing[1].pointSequence === 0.001 && ps === 0.001) {
                        return "Start of Match";
                     }
                     if (ps === 0) return "Start of Match";
                }
                const formattedPs = Number.isInteger(ps) ? ps : parseFloat(ps.toFixed(2));
                return `After Point ${formattedPs}`;
              }
              return typeof label === 'number' ? `Point ${label.toFixed(2)}` : String(label);
            }}
            formatter={(value, name, props) => {
                if (props.payload.value !== null) { 
                    return [props.payload.value, "Score Diff."];
                }
                return []; 
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
        {gameMarkers?.map((marker, index) => (
          <ReferenceLine
            key={`game-marker-${index}-${marker.pointSequence}-${marker.gameScore}`}
            x={marker.pointSequence}
            stroke="hsl(var(--accent))" 
            strokeDasharray="3 3"
            ifOverflow="visible" 
          >
            <RechartsLabel
              value={marker.gameScore}
              position="top" 
              fill="hsl(var(--accent-foreground))" 
              fontSize={12}
              fontWeight="bold"
              dy={10} 
              style={{ background: 'hsl(var(--accent))', padding: '2px 4px', borderRadius: '2px' }}
              // Background style here won't work directly on SVG text.
              // For background, a custom component in `label` prop or using `content` is needed.
              // Keeping it simple: text only, color from theme.
              fill="hsl(var(--accent))" // Text color same as line for consistency
            />
          </ReferenceLine>
        ))}
      </LineChart>
    </ChartContainer>
  );
}
