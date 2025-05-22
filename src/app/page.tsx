
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DataLineChart } from "@/components/DataLineChart";
import type { DataPoint } from "@/lib/types";
import { exportDataToSheetsAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, MinusCircle, SheetIcon, Loader2, TrendingUp } from "lucide-react";

export default function Home() {
  const [scoreDifference, setScoreDifference] = useState<number>(0);
  const [currentPointNumber, setCurrentPointNumber] = useState<number>(0);
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    // Initialize with one data point if history is empty
    if (history.length === 0) {
       setHistory([{ pointSequence: 0, value: 0 }]);
    }
  }, []);

  const handlePlayerWin = () => {
    const newPointNumber = currentPointNumber + 1;
    const newScoreDifference = scoreDifference + 1;
    
    setCurrentPointNumber(newPointNumber);
    setScoreDifference(newScoreDifference);
    setHistory((prevHistory) => [...prevHistory, { pointSequence: newPointNumber, value: newScoreDifference }]);
  };

  const handleOpponentWin = () => {
    const newPointNumber = currentPointNumber + 1;
    const newScoreDifference = scoreDifference - 1;

    setCurrentPointNumber(newPointNumber);
    setScoreDifference(newScoreDifference);
    setHistory((prevHistory) => [...prevHistory, { pointSequence: newPointNumber, value: newScoreDifference }]);
  };

  const handleExport = async () => {
    if (history.length <= 1 && history[0]?.pointSequence === 0) { // Check if only initial point exists
      toast({
        title: "Export Failed",
        description: "No match data available to export.",
        variant: "destructive",
      });
      return;
    }
    setIsExporting(true);
    try {
      // Filter out the initial point {pointSequence: 0, value: 0} if it's the only one or if you only want to export actual game points
      const exportableHistory = history.filter(p => p.pointSequence > 0);
      if (exportableHistory.length === 0) {
        toast({
          title: "Export Failed",
          description: "No actual match points recorded to export.",
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      const result = await exportDataToSheetsAction(exportableHistory);
      if (result.success) {
        toast({
          title: "Export Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Export Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export Error",
        description: "An unexpected error occurred during export.",
        variant: "destructive",
      });
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };
  
  if (!isClient) {
    return null; 
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <div className="w-full max-w-3xl space-y-8">
        <Card className="shadow-xl rounded-lg overflow-hidden">
          <CardHeader className="bg-card/50 p-6">
            <div className="flex items-center justify-center space-x-3">
              <TrendingUp className="h-10 w-10 text-primary" />
              <CardTitle className="text-center text-4xl font-bold tracking-tight text-primary">
                Tennis Momentum
              </CardTitle>
            </div>
            <CardDescription className="text-center text-lg text-muted-foreground pt-2">
              Track points to visualize momentum swings. Increment for your win, decrement for opponent's win.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="text-center py-6 bg-muted/30 rounded-md shadow-inner">
              <p className="text-xl text-muted-foreground mb-1">Current Score Difference</p>
              <p className="text-7xl font-extrabold text-primary tracking-tighter">{scoreDifference}</p>
              <p className="text-sm text-muted-foreground mt-1">After {currentPointNumber} {currentPointNumber === 1 ? 'point' : 'points'}</p>
            </div>
            
            <div className="h-[350px] md:h-[400px] w-full rounded-lg border border-border p-2 shadow-sm">
              <DataLineChart data={history} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-3 p-6 border-t bg-card/50">
            <Button onClick={handlePlayerWin} size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
              <PlusCircle className="mr-2 h-5 w-5" /> Player Wins Point
            </Button>
            <Button onClick={handleOpponentWin} variant="outline" size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
              <MinusCircle className="mr-2 h-5 w-5" /> Opponent Wins Point
            </Button>
            <Button 
              onClick={handleExport} 
              variant="secondary" 
              size="lg" 
              disabled={isExporting || history.length <= 1}
              className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <SheetIcon className="mr-2 h-5 w-5" />
              )}
              {isExporting ? "Exporting..." : "Export Match Data"}
            </Button>
          </CardFooter>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Tip: Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Ctrl/Cmd + B</kbd> to toggle sidebar (if available).
        </p>
      </div>
    </main>
  );
}
