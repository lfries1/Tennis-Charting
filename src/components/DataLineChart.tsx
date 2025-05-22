
"use client";

import type { DataPoint, GameMarker, SetMarker } from "@/lib/types";
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
  Label as RechartsLabel,
} from "recharts";
import { useMemo } from "react";

interface DataLineChartProps {
  data: DataPoint[];
  gameMarkers?: GameMarker[];
  setMarkers?: SetMarker[];
  playerName: string;
  opponentName: string;
}

export function DataLineChart({ data, gameMarkers, setMarkers, playerName, opponentName }: DataLineChartProps) {
  const chartConfig = useMemo(() => ({
    positiveMomentum: {
      label: `${playerName}'s Momentum`,
      color: "hsl(var(--chart-4))", 
    },
    negativeMomentum: {
      label: `${opponentName}'s Momentum`,
      color: "hsl(var(--destructive))", 
    },
  }), [playerName, opponentName]) satisfies ChartConfig;
  
  const chartDataForProcessing = useMemo(() => {
    if (data.length === 1 && data[0].pointSequence === 0 && data[0].value === 0) {
        return [data[0], {...data[0], pointSequence: data[0].pointSequence + 0.001}]; 
    }
    return data.length > 0 ? data : [{pointSequence: 0, value: 0}, {pointSequence: 0.001, value: 0}]; 
  }, [data]);

  const yDomain: [number | 'auto', number | 'auto'] = useMemo(() => {
    if (chartDataForProcessing.length === 0) return ['auto', 'auto'];
    const values = chartDataForProcessing.map(p => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    
    const padding = 1; 
    let finalMin = minVal;
    let finalMax = maxVal;

    if (minVal === maxVal) {
        finalMin = minVal - padding;
        finalMax = maxVal + padding;
    } else {
        if (maxVal - minVal < 2 * padding && chartDataForProcessing.length > 1) {
             const mid = (minVal + maxVal) / 2;
             finalMin = mid - padding;
             finalMax = mid + padding;
        } else {
             return ['auto', 'auto'];
        }
    }
    return [finalMin, finalMax];
  }, [chartDataForProcessing]);

  const xTicks = useMemo(() => {
    if (chartDataForProcessing.length < 2) return undefined; 
    const allXValues = chartDataForProcessing.map(p => p.pointSequence);
    if (gameMarkers) {
      gameMarkers.forEach(marker => allXValues.push(marker.pointSequence));
    }
    if (setMarkers) { 
      setMarkers.forEach(marker => allXValues.push(marker.pointSequence));
    }
    const maxPoint = Math.max(...allXValues, 0); 

    if (maxPoint <= 10) { 
        const ticks = Array.from({length: Math.floor(maxPoint) + 1}, (_, i) => i);
        if (!ticks.includes(maxPoint) && maxPoint > 0 && Number.isInteger(maxPoint)) ticks.push(maxPoint);
        return ticks.filter(tick => tick >=0 );
    }
    const interval = Math.max(1, Math.floor(maxPoint / 10));
    const ticks = [];
    for (let i = 0; i <= maxPoint; i += interval) {
      ticks.push(i);
    }
    if (!ticks.includes(maxPoint) && maxPoint > 0) { 
        if (ticks.length > 0 && maxPoint - ticks[ticks.length-1] < interval / 2) {
            ticks[ticks.length-1] = Math.ceil(maxPoint); 
        } else {
            ticks.push(Math.ceil(maxPoint));
        }
    }
    return [...new Set(ticks.map(t => Math.round(t)))].filter(tick => tick >=0).sort((a,b) => a-b);
  }, [chartDataForProcessing, gameMarkers, setMarkers]);


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

      if (p1.value * p2.value < 0) { 
        const x1 = p1.pointSequence;
        const y1 = p1.value;
        const x2 = p2.pointSequence;
        const y2 = p2.value;
        
        if (y1 !== y2 && x1 !== x2) { 
            const xIntercept = x1 - y1 * (x2 - x1) / (y2 - y1);
            enrichedData.push({ pointSequence: xIntercept, value: 0 });
        } else if (x1 === x2 && y1 * y2 < 0) { 
             enrichedData.push({ pointSequence: x1, value: 0 }); 
        }
      }
      enrichedData.push(p2); 
    }
    
    enrichedData.sort((a, b) => a.pointSequence - b.pointSequence);

    const uniqueEnrichedData = enrichedData.reduce((acc, current) => {
      const existingPoint = acc.find(item => item.pointSequence === current.pointSequence);
      if (!existingPoint) {
        return acc.concat([current]);
      } else if (current.value === 0 && existingPoint.value !== 0) {
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
                             (data.length === 1 && data[0].pointSequence === 0 && data[0].value === 0 && chartDataForProcessing.length <=2 ) || 
                             (data.length > 0 && data.every(p => p.value === 0 && p.pointSequence === 0));


  if (showNoPointsMessage && (!gameMarkers || gameMarkers.length === 0) && (!setMarkers || setMarkers.length === 0) ) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-muted-foreground/50 bg-muted/20 p-4 text-center text-muted-foreground shadow-inner">
        <p>No points recorded yet. Use the point, game, or set buttons to track the match and see the graph update.</p>
      </div>
    );
  }

  const showDots = enrichedDataLength < 50 || data.length === 1; 

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <LineChart
        accessibilityLayer
        data={chartDataForProcessing} 
        margin={{
          top: 30, 
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
                if (props.payload.value !== null && props.payload.value !== undefined) { 
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
              fill="hsl(var(--accent))" 
              fontSize={12}
              fontWeight="bold"
              dy={-15} 
              style={{ textAnchor: 'middle' }}
            />
          </ReferenceLine>
        ))}
        {setMarkers?.map((marker, index) => {
          const isPlayerWin = marker.winner === 'player';
          const labelTextFill = isPlayerWin ? 'hsl(120, 60%, 35%)' : 'hsl(var(--destructive))';
          const winnerDisplayName = isPlayerWin ? playerName : opponentName;
          const labelValue = `Set ${marker.setNumber}: ${marker.setScore} (${winnerDisplayName})`;


          return (
            <ReferenceLine
              key={`set-marker-${index}-${marker.pointSequence}-${marker.setScore}-${marker.winner}`}
              x={marker.pointSequence}
              stroke="hsl(var(--primary))" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              ifOverflow="visible"
            >
              <RechartsLabel
                value={labelValue}
                position="top"
                fill={labelTextFill}
                fontSize={12}
                fontWeight="bold"
                dy={-2} 
                style={{ 
                  textAnchor: 'middle'
                }}
              />
            </ReferenceLine>
          );
        })}
      </LineChart>
    </ChartContainer>
  );
}
