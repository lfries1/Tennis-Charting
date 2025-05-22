
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataLineChart } from "@/components/DataLineChart";
import type { DataPoint, GameMarker, SetMarker } from "@/lib/types";
import { exportDataToSheetsAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, MinusCircle, SheetIcon, Loader2, TrendingUp, Award, ShieldX } from "lucide-react";

const MAX_SETS = 3;
const SETS_TO_WIN_MATCH = 2;

export default function Home() {
  const [playerName, setPlayerName] = useState<string>("Player 1");
  const [opponentName, setOpponentName] = useState<string>("Player 2");

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

  const matchOver = playerSets >= SETS_TO_WIN_MATCH || opponentSets >= SETS_TO_WIN_MATCH || (currentSetNumber > MAX_SETS && playerSets !== opponentSets);

  const processSetWin = (winner: 'player' | 'opponent') => {
    const setScore = `${playerGames}:${opponentGames}`;
    let newPlayerSets = playerSets;
    let newOpponentSets = opponentSets;

    if (winner === 'player') {
      newPlayerSets++;
      setPlayerSets(newPlayerSets);
    } else {
      newOpponentSets++;
      setOpponentSets(newOpponentSets);
    }

    setSetMarkers(prevMarkers => [
      ...prevMarkers,
      { pointSequence: currentPointNumber, setNumber: currentSetNumber, setScore, winner }
    ]);

    const winnerName = winner === 'player' ? playerName : opponentName;
    const nextSetNumber = currentSetNumber + 1;

    if ((winner === 'player' && newPlayerSets >= SETS_TO_WIN_MATCH) || (winner === 'opponent' && newOpponentSets >= SETS_TO_WIN_MATCH) || (nextSetNumber > MAX_SETS && newPlayerSets !== newOpponentSets)) {
      toast({
        title: `${winnerName} Wins the Match!`,
        description: `Final set score (Set ${currentSetNumber}): ${setScore}. Overall sets: ${newPlayerSets}-${newOpponentSets}.`,
        variant: winner === 'opponent' ? "destructive" : undefined,
        duration: 5000,
      });
      setCurrentSetNumber(MAX_SETS + 1); // Mark match as over
    } else if (nextSetNumber > MAX_SETS && newPlayerSets === newOpponentSets) {
       toast({
        title: "Match Ends - Max Sets Reached!",
        description: `Set ${currentSetNumber} score: ${setScore}. Overall sets: ${newPlayerSets}-${newOpponentSets}. It's a draw based on sets!`,
        variant: winner === 'opponent' ? "destructive" : undefined,
        duration: 5000,
      });
      setCurrentSetNumber(nextSetNumber);
    } else {
      toast({
        title: `Set ${currentSetNumber} to ${winnerName}!`,
        description: `Set score: ${setScore}. Starting Set ${nextSetNumber}.`,
        variant: winner === 'opponent' ? "destructive" : undefined,
      });
      setCurrentSetNumber(nextSetNumber);
      setPlayerGames(0);
      setOpponentGames(0);
    }
  };


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
      title: `Game to ${playerName}!`,
      description: `Set ${currentSetNumber} game score: ${newPlayerGames}:${opponentGames} (${playerName} : ${opponentName}).`,
    });

    const playerWinsSetCondition = (newPlayerGames >= 6 && newPlayerGames - opponentGames >= 2) || (newPlayerGames === 7 && (opponentGames === 5 || opponentGames === 6));
    if (playerWinsSetCondition && currentSetNumber <= MAX_SETS) {
      processSetWin('player');
    }
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
      title: `Game to ${opponentName}.`,
      description: `Set ${currentSetNumber} game score: ${playerGames}:${newOpponentGames} (${playerName} : ${opponentName}).`,
      variant: "destructive",
    });

    const opponentWinsSetCondition = (newOpponentGames >= 6 && newOpponentGames - playerGames >= 2) || (newOpponentGames === 7 && (playerGames === 5 || playerGames === 6));
    if (opponentWinsSetCondition && currentSetNumber <= MAX_SETS) {
      processSetWin('opponent');
    }
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

  let finalMatchStatusMessage = "";
  if (playerSets >= SETS_TO_WIN_MATCH) {
    finalMatchStatusMessage = `${playerName} Wins the Match!`;
  } else if (opponentSets >= SETS_TO_WIN_MATCH) {
    finalMatchStatusMessage = `${opponentName} Wins the Match!`;
  } else if (currentSetNumber > MAX_SETS) {
     if (playerSets > opponentSets) {
        finalMatchStatusMessage = `${playerName} Wins the Match!`;
     } else if (opponentSets > playerSets) {
        finalMatchStatusMessage = `${opponentName} Wins the Match!`;
     } else {
        finalMatchStatusMessage = "Match ended (Max sets reached). It's a draw based on sets!"; 
     }
  }

  const disablePlayerWinsGameButton = matchOver || !((playerGames >= 5 && playerGames - opponentGames >= 1) || (playerGames === 6 && opponentGames === 5) || (playerGames === 6 && opponentGames === 6));
  const disableOpponentWinsGameButton = matchOver || !((opponentGames >= 5 && opponentGames - playerGames >= 1) || (opponentGames === 6 && playerGames === 5) || (opponentGames === 6 && playerGames === 6));


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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b">
              <div>
                <Label htmlFor="playerName" className="text-sm font-medium text-muted-foreground">Player 1 Name</Label>
                <Input 
                  id="playerName" 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value)} 
                  placeholder="Enter Player 1 Name"
                  className="mt-1 shadow-sm" 
                  disabled={matchOver || currentPointNumber > 0}
                />
              </div>
              <div>
                <Label htmlFor="opponentName" className="text-sm font-medium text-muted-foreground">Player 2 Name</Label>
                <Input 
                  id="opponentName" 
                  value={opponentName} 
                  onChange={(e) => setOpponentName(e.target.value)} 
                  placeholder="Enter Player 2 Name" 
                  className="mt-1 shadow-sm"
                  disabled={matchOver || currentPointNumber > 0}
                />
              </div>
            </div>

            <div className="text-center py-6 bg-muted/30 rounded-md shadow-inner space-y-2">
              <p className="text-xl text-muted-foreground mb-1">Current Score Difference</p>
              <p className="text-7xl font-extrabold text-primary tracking-tighter">{scoreDifference}</p>
              <p className="text-sm text-muted-foreground mt-1">After {currentPointNumber} {currentPointNumber === 1 ? 'point' : 'points'} in total</p>
              <p className="text-2xl font-semibold text-foreground mt-3">Sets: {playerSets} - {opponentSets} <span className="text-base font-normal">({playerName} vs {opponentName})</span></p>
              {!matchOver && currentSetNumber <= MAX_SETS && (
                <p className="text-xl font-medium text-foreground">Set {currentSetNumber} Games: {playerGames} - {opponentGames}</p>
              )}
              {finalMatchStatusMessage && (
                <div className="mt-4">
                  <p className="text-2xl font-bold text-primary">{finalMatchStatusMessage}</p>
                  {finalMatchStatusMessage.includes("Wins the Match!") && setMarkers.length > 0 && (
                    <div className="mt-2 text-base">
                      <p className="font-medium text-muted-foreground mb-1">Set Scores:</p>
                      {setMarkers.map((set, index) => (
                        <p key={index} className="my-0.5 text-foreground">
                          Set {set.setNumber}: {set.setScore} ({set.winner === 'player' ? playerName : opponentName})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="h-[350px] md:h-[400px] w-full rounded-lg border border-border p-2 shadow-sm">
              <DataLineChart 
                data={history} 
                gameMarkers={gameMarkers} 
                setMarkers={setMarkers} 
                playerName={playerName} 
                opponentName={opponentName} 
              />
            </div>
          </CardContent>
          <CardFooter className="grid grid-cols-2 gap-3 p-6 border-t bg-card/50">
            <Button 
              onClick={handlePlayerWin} 
              size="lg" 
              className="w-full shadow-md hover:shadow-lg transition-shadow bg-orange-500 hover:bg-orange-600 text-white" 
              disabled={matchOver}
            >
              <PlusCircle className="mr-2 h-5 w-5" /> {playerName} Wins Point
            </Button>
            <Button 
              onClick={handleOpponentWin} 
              variant="destructive" 
              size="lg" 
              className="w-full shadow-md hover:shadow-lg transition-shadow" 
              disabled={matchOver}
            >
              <MinusCircle className="mr-2 h-5 w-5" /> {opponentName} Wins Point
            </Button>
            <Button 
              onClick={handlePlayerWinsGame} 
              size="lg" 
              className="w-full shadow-md hover:shadow-lg transition-shadow bg-orange-500 hover:bg-orange-600 text-white" 
              disabled={matchOver}
            >
              <Award className="mr-2 h-5 w-5" /> {playerName} Wins Game
            </Button>
            <Button 
              onClick={handleOpponentWinsGame} 
              variant="destructive" 
              size="lg" 
              className="w-full shadow-md hover:shadow-lg transition-shadow" 
              disabled={matchOver}
            >
              <ShieldX className="mr-2 h-5 w-5" /> {opponentName} Wins Game
            </Button>
            <Button 
              onClick={handleExport} 
              variant="secondary" 
              size="lg" 
              disabled={isExporting || history.length <= 1}
              className="w-full col-span-2 shadow-md hover:shadow-lg transition-shadow" 
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

