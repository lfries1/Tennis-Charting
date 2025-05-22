
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DataLineChart } from "@/components/DataLineChart";
import type { DataPoint, GameMarker, SetMarker } from "@/lib/types";
import { exportDataToSheetsAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, MinusCircle, SheetIcon, Loader2, TrendingUp, Award, ShieldX, Trophy, Skull } from "lucide-react";

const MAX_SETS = 3;
const SETS_TO_WIN_MATCH = 2;

export default function Home() {
  const [scoreDifference, setScoreDifference] = useState<number>(0);
  const [currentPointNumber, setCurrentPointNumber] = useState<number>(0);
  const [history, setHistory] = useState<DataPoint[]>([]);

  const [playerGames, setPlayerGames] = useState<number>(0);
  const [opponentGames, setOpponentGames] = useState<number>(0);
  const [gameMarkers, setGameMarkers] = useState<GameMarker[]>([]);

  const [playerSets, setPlayerSets] = useState<number>(0);
  const [opponentSets, setOpponentSets] = useState<number>(0);
  const [currentSetNumber, setCurrentSetNumber] = useState<number>(1);
  const [setMarkers, setSetMarkers] = useState<SetMarker[]>([]);
  
  const [isClient, setIsClient] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    if (history.length === 0) {
       setHistory([{ pointSequence: 0, value: 0 }]);
    }
  }, []);

  const matchOver = playerSets >= SETS_TO_WIN_MATCH || opponentSets >= SETS_TO_WIN_MATCH || currentSetNumber > MAX_SETS;

  const handlePlayerWin = () => {
    if (matchOver) return;
    const newPointNumber = currentPointNumber + 1;
    const newScoreDifference = scoreDifference + 1;
    
    setCurrentPointNumber(newPointNumber);
    setScoreDifference(newScoreDifference);
    setHistory((prevHistory) => [...prevHistory, { pointSequence: newPointNumber, value: newScoreDifference }]);
  };

  const handleOpponentWin = () => {
    if (matchOver) return;
    const newPointNumber = currentPointNumber + 1;
    const newScoreDifference = scoreDifference - 1;

    setCurrentPointNumber(newPointNumber);
    setScoreDifference(newScoreDifference);
    setHistory((prevHistory) => [...prevHistory, { pointSequence: newPointNumber, value: newScoreDifference }]);
  };

  const handlePlayerWinsGame = () => {
    if (matchOver) return;
    const newPlayerGames = playerGames + 1;
    setPlayerGames(newPlayerGames);
    const newGameScore = `${newPlayerGames}:${opponentGames}`;
    setGameMarkers(prevMarkers => [
      ...prevMarkers,
      { pointSequence: currentPointNumber, gameScore: newGameScore }
    ]);
    toast({
      title: "Game to Player!",
      description: `Set ${currentSetNumber} game score: ${newGameScore} (Player : Opponent).`,
    });
  };

  const handleOpponentWinsGame = () => {
    if (matchOver) return;
    const newOpponentGames = opponentGames + 1;
    setOpponentGames(newOpponentGames);
    const newGameScore = `${playerGames}:${newOpponentGames}`;
    setGameMarkers(prevMarkers => [
      ...prevMarkers,
      { pointSequence: currentPointNumber, gameScore: newGameScore }
    ]);
    toast({
      title: "Game to Opponent.",
      description: `Set ${currentSetNumber} game score: ${newGameScore} (Player : Opponent).`,
      variant: "destructive",
    });
  };

  const handlePlayerWinsSet = () => {
    if (matchOver) return;
    const newPlayerSets = playerSets + 1;
    setPlayerSets(newPlayerSets);
    const setScore = `${playerGames}:${opponentGames}`;
    setSetMarkers(prevMarkers => [
      ...prevMarkers,
      { pointSequence: currentPointNumber, setNumber: currentSetNumber, setScore, winner: 'player' }
    ]);
    
    const nextSetNumber = currentSetNumber + 1;
    if (newPlayerSets >= SETS_TO_WIN_MATCH || nextSetNumber > MAX_SETS) {
      toast({
        title: "Player Wins the Match!",
        description: `Final set score (Set ${currentSetNumber}): ${setScore}. Overall sets: ${newPlayerSets}-${opponentSets}.`,
        duration: 5000,
      });
      setCurrentSetNumber(nextSetNumber); 
    } else {
      toast({
        title: `Set ${currentSetNumber} to Player!`,
        description: `Set score: ${setScore}. Starting Set ${nextSetNumber}.`,
      });
      setCurrentSetNumber(nextSetNumber);
    }
    
    setPlayerGames(0);
    setOpponentGames(0);
  };

  const handleOpponentWinsSet = () => {
    if (matchOver) return;
    const newOpponentSets = opponentSets + 1;
    setOpponentSets(newOpponentSets);
    const setScore = `${playerGames}:${opponentGames}`;
    setSetMarkers(prevMarkers => [
      ...prevMarkers,
      { pointSequence: currentPointNumber, setNumber: currentSetNumber, setScore, winner: 'opponent' }
    ]);

    const nextSetNumber = currentSetNumber + 1;
    if (newOpponentSets >= SETS_TO_WIN_MATCH || nextSetNumber > MAX_SETS) {
      toast({
        title: "Opponent Wins the Match.",
        description: `Final set score (Set ${currentSetNumber}): ${setScore}. Overall sets: ${playerSets}-${newOpponentSets}.`,
        variant: "destructive",
        duration: 5000,
      });
       setCurrentSetNumber(nextSetNumber);
    } else {
      toast({
        title: `Set ${currentSetNumber} to Opponent.`,
        description: `Set score: ${setScore}. Starting Set ${nextSetNumber}.`,
        variant: "destructive",
      });
      setCurrentSetNumber(nextSetNumber);
    }

    setPlayerGames(0);
    setOpponentGames(0);
  };


  const handleExport = async () => {
    if (history.length <= 1 && history[0]?.pointSequence === 0) { 
      toast({
        title: "Export Failed",
        description: "No match data available to export.",
        variant: "destructive",
      });
      return;
    }
    setIsExporting(true);
    try {
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

  let matchStatusMessage = "";
  if (playerSets >= SETS_TO_WIN_MATCH) {
    matchStatusMessage = "Player Wins the Match!";
  } else if (opponentSets >= SETS_TO_WIN_MATCH) {
    matchStatusMessage = "Opponent Wins the Match!";
  } else if (currentSetNumber > MAX_SETS && playerSets !== opponentSets) { 
     matchStatusMessage = playerSets > opponentSets ? "Player Wins the Match!" : "Opponent Wins the Match!";
  } else if (currentSetNumber > MAX_SETS && playerSets === opponentSets) {
     matchStatusMessage = "Match ended (Max sets reached). It's a draw based on sets!"; 
  }


  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <div className="w-full max-w-4xl space-y-8"> 
        <Card className="shadow-xl rounded-lg overflow-hidden">
          <CardHeader className="bg-card/50 p-6">
            <div className="flex items-center justify-center space-x-3">
              <TrendingUp className="h-10 w-10 text-primary" />
              <CardTitle className="text-center text-4xl font-bold tracking-tight text-primary">
                Tennis Momentum
              </CardTitle>
            </div>
            <CardDescription className="text-center text-lg text-muted-foreground pt-2">
              Track points, games, and sets to visualize momentum swings.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="text-center py-6 bg-muted/30 rounded-md shadow-inner space-y-2">
              <p className="text-xl text-muted-foreground mb-1">Current Score Difference</p>
              <p className="text-7xl font-extrabold text-primary tracking-tighter">{scoreDifference}</p>
              <p className="text-sm text-muted-foreground mt-1">After {currentPointNumber} {currentPointNumber === 1 ? 'point' : 'points'} in total</p>
              <p className="text-2xl font-semibold text-foreground mt-3">Sets: {playerSets} - {opponentSets}</p>
              {!matchOver && currentSetNumber <= MAX_SETS && (
                <p className="text-xl font-medium text-foreground">Set {currentSetNumber} Games: {playerGames} - {opponentGames}</p>
              )}
              {matchStatusMessage && (
                <p className="text-2xl font-bold text-primary mt-2">{matchStatusMessage}</p>
              )}
            </div>
            
            <div className="h-[350px] md:h-[400px] w-full rounded-lg border border-border p-2 shadow-sm">
              <DataLineChart data={history} gameMarkers={gameMarkers} setMarkers={setMarkers} />
            </div>
          </CardContent>
          <CardFooter className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-6 border-t bg-card/50">
            <Button onClick={handlePlayerWin} size="lg" className="w-full shadow-md hover:shadow-lg transition-shadow" disabled={matchOver}>
              <PlusCircle className="mr-2 h-5 w-5" /> Player Wins Point
            </Button>
            <Button onClick={handleOpponentWin} variant="outline" size="lg" className="w-full shadow-md hover:shadow-lg transition-shadow" disabled={matchOver}>
              <MinusCircle className="mr-2 h-5 w-5" /> Opponent Wins Point
            </Button>
            <Button onClick={handlePlayerWinsGame} size="lg" className="w-full shadow-md hover:shadow-lg transition-shadow" disabled={matchOver}>
              <Award className="mr-2 h-5 w-5" /> Player Wins Game
            </Button>
            <Button onClick={handleOpponentWinsGame} variant="destructive" size="lg" className="w-full shadow-md hover:shadow-lg transition-shadow" disabled={matchOver}>
              <ShieldX className="mr-2 h-5 w-5" /> Opponent Wins Game
            </Button>
             <Button 
              onClick={handlePlayerWinsSet} 
              size="lg" 
              className="w-full shadow-md hover:shadow-lg transition-shadow bg-green-500 hover:bg-green-600 text-white" 
              disabled={matchOver || currentSetNumber > MAX_SETS}
            >
              <Trophy className="mr-2 h-5 w-5" /> Player Wins Set
            </Button>
            <Button 
              onClick={handleOpponentWinsSet} 
              variant="destructive" 
              size="lg" 
              className="w-full shadow-md hover:shadow-lg transition-shadow border-red-700 bg-red-700 hover:bg-red-800 text-white" 
              disabled={matchOver || currentSetNumber > MAX_SETS}
            >
              <Skull className="mr-2 h-5 w-5" /> Opponent Wins Set
            </Button>
            <Button 
              onClick={handleExport} 
              variant="secondary" 
              size="lg" 
              disabled={isExporting || history.length <= 1}
              className="w-full col-span-2 sm:col-span-3 shadow-md hover:shadow-lg transition-shadow" 
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
