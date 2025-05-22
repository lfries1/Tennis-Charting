
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataLineChart } from "@/components/DataLineChart";
import type { DataPoint, GameMarker, SetMarker } from "@/lib/types";
// Removed import for exportDataToSheetsAction as it's no longer directly used by the email button
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, MinusCircle, TrendingUp, Award, ShieldX, Printer, LogOut, Mail } from "lucide-react";

const MAX_SETS = 3;
const SETS_TO_WIN_MATCH = 2;

export default function Home() {
  const [playerName, setPlayerName] = useState<string>("Player 1");
  const [opponentName, setOpponentName] = useState<string>("Player 2");
  const [email, setEmail] = useState<string>("");

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
  // const [isExporting, setIsExporting] = useState(false); // Removed isExporting state
  const { toast } = useToast();
  const [withdrawnPlayer, setWithdrawnPlayer] = useState<'player' | 'opponent' | null>(null);


  useEffect(() => {
    setIsClient(true);
    if (history.length === 0) {
       setHistory([{ pointSequence: 0, value: 0 }]);
    }
  }, []);

  const matchEffectivelyOver = playerSets >= SETS_TO_WIN_MATCH || opponentSets >= SETS_TO_WIN_MATCH || (currentSetNumber > MAX_SETS && playerSets !== opponentSets) || !!withdrawnPlayer;


  const processSetWin = (winner: 'player' | 'opponent', finalPlayerGames: number, finalOpponentGames: number) => {
    if (matchEffectivelyOver && !withdrawnPlayer) return; 

    const setScore = `${finalPlayerGames}:${finalOpponentGames}`;
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
    
    const matchNowWonBySets = (winner === 'player' && newPlayerSets >= SETS_TO_WIN_MATCH) || (winner === 'opponent' && newOpponentSets >= SETS_TO_WIN_MATCH);
    const matchEndsMaxSets = (nextSetNumber > MAX_SETS && newPlayerSets !== newOpponentSets);


    if (matchNowWonBySets || matchEndsMaxSets) {
      toast({
        title: `${winnerName} Wins the Match!`,
        description: `Final set score (Set ${currentSetNumber}): ${setScore}. Overall sets: ${newPlayerSets}-${newOpponentSets}.`,
        variant: winner === 'opponent' && winnerName === opponentName ? "destructive" : undefined, 
        duration: 5000,
      });
      setCurrentSetNumber(MAX_SETS + 1); 
    } else if (nextSetNumber > MAX_SETS && newPlayerSets === newOpponentSets) {
       toast({
        title: "Match Ends - Max Sets Reached!",
        description: `Set ${currentSetNumber} score: ${setScore}. Overall sets: ${newPlayerSets}-${newOpponentSets}. It's a draw based on sets!`,
         variant: winner === 'opponent' && winnerName === opponentName ? "destructive" : undefined,
        duration: 5000,
      });
      setCurrentSetNumber(nextSetNumber);
    } else {
      toast({
        title: `Set ${currentSetNumber} to ${winnerName}!`,
        description: `Set score: ${setScore}. Starting Set ${nextSetNumber}.`,
        variant: winner === 'opponent' && winnerName === opponentName ? "destructive" : undefined,
      });
      setCurrentSetNumber(nextSetNumber);
      setPlayerGames(0);
      setOpponentGames(0);
    }
  };


  const handlePlayerWin = () => {
    if (matchEffectivelyOver) return;
    const newPointNumber = currentPointNumber + 1;
    const newScoreDifference = scoreDifference + 1;
    
    setCurrentPointNumber(newPointNumber);
    setScoreDifference(newScoreDifference);
    setHistory((prevHistory) => [...prevHistory, { pointSequence: newPointNumber, value: newScoreDifference }]);
  };

  const handleOpponentWin = () => {
    if (matchEffectivelyOver) return;
    const newPointNumber = currentPointNumber + 1;
    const newScoreDifference = scoreDifference - 1;

    setCurrentPointNumber(newPointNumber);
    setScoreDifference(newScoreDifference);
    setHistory((prevHistory) => [...prevHistory, { pointSequence: newPointNumber, value: newScoreDifference }]);
  };

  const handlePlayerWinsGame = () => {
    if (matchEffectivelyOver) return;
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
    if (playerWinsSetCondition && currentSetNumber <= MAX_SETS && !withdrawnPlayer) {
      processSetWin('player', newPlayerGames, opponentGames);
    }
  };

  const handleOpponentWinsGame = () => {
    if (matchEffectivelyOver) return;
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
    if (opponentWinsSetCondition && currentSetNumber <= MAX_SETS && !withdrawnPlayer) {
      processSetWin('opponent', playerGames, newOpponentGames);
    }
  };

  const handlePlayerWithdraws = () => {
    if (matchEffectivelyOver) return;
    setWithdrawnPlayer('player');
    const currentOpponentSets = opponentSets;
    setOpponentSets(SETS_TO_WIN_MATCH); 
    setCurrentSetNumber(MAX_SETS + 1); 
    toast({
      title: `${opponentName} Wins by Withdrawal!`,
      description: `${playerName} withdrew from the match. Final sets determine by sets won before withdrawal. Current standing was Player: ${playerSets} - Opponent: ${currentOpponentSets}. Recorded as ${playerSets}-${SETS_TO_WIN_MATCH}.`,
      variant: "destructive",
      duration: 5000,
    });
  };

  const handleOpponentWithdraws = () => {
    if (matchEffectivelyOver) return;
    setWithdrawnPlayer('opponent');
    const currentPlayerSets = playerSets;
    setPlayerSets(SETS_TO_WIN_MATCH); 
    setCurrentSetNumber(MAX_SETS + 1); 
    toast({
      title: `${playerName} Wins by Withdrawal!`,
      description: `${opponentName} withdrew from the match. Final sets determine by sets won before withdrawal. Current standing was Player: ${currentPlayerSets} - Opponent: ${opponentSets}. Recorded as ${SETS_TO_WIN_MATCH}-${opponentSets}.`,
      duration: 5000,
    });
  };

  let finalMatchStatusMessage = "";
  if (withdrawnPlayer === 'player') {
    finalMatchStatusMessage = `${opponentName} wins! ${playerName} withdrew from the match.`;
  } else if (withdrawnPlayer === 'opponent') {
    finalMatchStatusMessage = `${playerName} wins! ${opponentName} withdrew from the match.`;
  } else if (playerSets >= SETS_TO_WIN_MATCH) {
    finalMatchStatusMessage = `${playerName} Wins the Match!`;
  } else if (opponentSets >= SETS_TO_WIN_MATCH) {
    finalMatchStatusMessage = `${opponentName} Wins the Match!`;
  } else if (currentSetNumber > MAX_SETS && playerSets !== opponentSets) {
     if (playerSets > opponentSets) {
        finalMatchStatusMessage = `${playerName} Wins the Match!`;
     } else if (opponentSets > playerSets) {
        finalMatchStatusMessage = `${opponentName} Wins the Match!`;
     }
  } else if (currentSetNumber > MAX_SETS && playerSets === opponentSets && !withdrawnPlayer) {
     finalMatchStatusMessage = "Match ended (Max sets reached). It's a draw based on sets!"; 
  }


  const handleExport = () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter a valid email address to open an email draft.",
        variant: "destructive",
      });
      return;
    }
    const exportableHistory = history.filter(p => p.pointSequence > 0);
    if (exportableHistory.length === 0 && !matchEffectivelyOver) {
      toast({
        title: "Cannot Create Email Draft",
        description: "No match points recorded yet to include in an email.",
        variant: "destructive",
      });
      return;
    }
     if (exportableHistory.length === 0 && matchEffectivelyOver && !withdrawnPlayer) {
      toast({
        title: "Cannot Create Email Draft",
        description: "No actual match points were recorded to include in an email.",
        variant: "destructive",
      });
      return;
    }


    const matchDate = new Date().toLocaleDateString("en-US", {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const subject = `Tennis Match Report: ${playerName} vs ${opponentName} - ${new Date().toLocaleDateString()}`;
    
    let body = `Match Report\n`;
    body += `Date: ${matchDate}\n\n`;
    body += `Players: ${playerName} vs ${opponentName}\n`;
    if (finalMatchStatusMessage) {
      body += `Outcome: ${finalMatchStatusMessage}\n`;
    }
    body += `Overall Sets: ${playerSets} - ${opponentSets}\n\n`;

    if (setMarkers.length > 0) {
      body += "Set Scores:\n";
      setMarkers.forEach(set => {
        body += `  Set ${set.setNumber}: ${set.setScore} (${set.winner === 'player' ? playerName : opponentName})\n`;
      });
      body += "\n";
    } else if (matchEffectivelyOver) {
        body += "Set Scores: No full sets completed or recorded before match conclusion.\n\n"
    }


    if (exportableHistory.length > 0) {
      body += "Point History (Point: ScoreDifference):\n";
      exportableHistory.forEach(p => {
        body += `  Point ${p.pointSequence}: ${p.value}\n`;
      });
       body += "\n";
    } else {
        body += "Point History: No points recorded.\n\n";
    }

    body += "Note: The visual momentum chart can be exported separately as a PDF using the 'Export Chart to PDF' button in the app.\n";

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
        window.location.href = mailtoLink;
        toast({
            title: "Opening Email Client",
            description: "Your default email client should open with a pre-filled draft.",
        });
    } catch (error) {
        console.error("Failed to open mailto link:", error);
        toast({
            title: "Failed to Open Email Client",
            description: "Could not automatically open your email client. Please copy the data manually if needed.",
            variant: "destructive",
        });
    }
  };

  const handlePrintChart = () => {
    window.print();
  };
  
  if (!isClient) {
    return null; 
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <div className="w-full max-w-4xl space-y-8"> 
        <Card className="shadow-xl rounded-lg overflow-hidden printable-card">
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
          <CardContent className="p-6 space-y-8 printable-card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b">
              <div>
                <Label htmlFor="playerName" className="text-sm font-medium text-muted-foreground">Player 1 Name</Label>
                <Input 
                  id="playerName" 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value)} 
                  placeholder="Enter Player 1 Name"
                  className="mt-1 shadow-sm" 
                  disabled={matchEffectivelyOver || currentPointNumber > 0}
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
                  disabled={matchEffectivelyOver || currentPointNumber > 0}
                />
              </div>
            </div>

            <div className="text-center py-6 bg-muted/30 rounded-md shadow-inner space-y-2" id="score-display-area">
              <p className="text-xl text-muted-foreground mb-1">Current Score Difference</p>
              <p className="text-7xl font-extrabold text-primary tracking-tighter">{scoreDifference}</p>
              <p className="text-sm text-muted-foreground mt-1">After {currentPointNumber} {currentPointNumber === 1 ? 'point' : 'points'} in total</p>
              <p className="text-2xl font-semibold text-foreground mt-3">Sets: {playerSets} - {opponentSets} <span className="text-base font-normal">({playerName} vs {opponentName})</span></p>
              {!matchEffectivelyOver && currentSetNumber <= MAX_SETS && (
                <p className="text-xl font-medium text-foreground">Set {currentSetNumber} Games: {playerGames} - {opponentGames}</p>
              )}
              {finalMatchStatusMessage && (
                <div className="mt-4" id="final-match-score-summary-print">
                  <p className="text-2xl font-bold text-primary">{finalMatchStatusMessage}</p>
                  {(finalMatchStatusMessage.includes("Wins the Match!") || finalMatchStatusMessage.includes("wins!")) && (
                    <div className="mt-2 text-base">
                      <p className="font-medium text-muted-foreground mb-1">Set Scores:</p>
                      {setMarkers.length > 0 ? setMarkers.map((set, index) => (
                        <p key={index} className="my-0.5 text-foreground">
                          Set {set.setNumber}: {set.setScore} ({set.winner === 'player' ? playerName : opponentName})
                        </p>
                      )) : <p className="my-0.5 text-foreground">No full sets completed.</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div id="chart-to-print" className="h-[350px] md:h-[400px] w-full rounded-lg border border-border p-2 shadow-sm bg-background">
              <DataLineChart 
                data={history} 
                gameMarkers={gameMarkers} 
                setMarkers={setMarkers} 
                playerName={playerName} 
                opponentName={opponentName} 
              />
            </div>
          </CardContent>
          <CardFooter className="grid grid-cols-1 gap-3 p-6 border-t bg-card/50">
            {!matchEffectivelyOver ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={handlePlayerWin} 
                      size="lg" 
                      className="w-full shadow-md hover:shadow-lg transition-shadow bg-orange-500 hover:bg-orange-600 text-white" 
                      disabled={matchEffectivelyOver}
                    >
                      <PlusCircle className="mr-2 h-5 w-5" /> {playerName} Wins Point
                    </Button>
                    <Button 
                      onClick={handleOpponentWin} 
                      variant="destructive" 
                      size="lg" 
                      className="w-full shadow-md hover:shadow-lg transition-shadow" 
                      disabled={matchEffectivelyOver}
                    >
                      <MinusCircle className="mr-2 h-5 w-5" /> {opponentName} Wins Point
                    </Button>
                    <Button 
                      onClick={handlePlayerWinsGame} 
                      size="lg" 
                      className="w-full shadow-md hover:shadow-lg transition-shadow bg-orange-500 hover:bg-orange-600 text-white" 
                      disabled={matchEffectivelyOver}
                    >
                      <Award className="mr-2 h-5 w-5" /> {playerName} Wins Game
                    </Button>
                    <Button 
                      onClick={handleOpponentWinsGame} 
                      variant="destructive" 
                      size="lg" 
                      className="w-full shadow-md hover:shadow-lg transition-shadow" 
                      disabled={matchEffectivelyOver}
                    >
                      <ShieldX className="mr-2 h-5 w-5" /> {opponentName} Wins Game
                    </Button>

                    <Button
                      onClick={handlePlayerWithdraws}
                      variant="outline"
                      size="lg"
                      className="w-full shadow-md hover:shadow-lg transition-shadow border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                      disabled={matchEffectivelyOver}
                    >
                      <LogOut className="mr-2 h-5 w-5" /> {playerName} Withdraws
                    </Button>
                    <Button
                      onClick={handleOpponentWithdraws}
                      variant="outline"
                      size="lg"
                      className="w-full shadow-md hover:shadow-lg transition-shadow border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                      disabled={matchEffectivelyOver}
                    >
                      <LogOut className="mr-2 h-5 w-5" /> {opponentName} Withdraws
                    </Button>
                </div>
                
                <Button 
                  onClick={handleExport} 
                  variant="secondary" 
                  size="lg" 
                  disabled={currentPointNumber === 0 || !email.trim()}
                  className="w-full shadow-md hover:shadow-lg transition-shadow mt-3"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Email Match Report (Requires Email Below)
                </Button>
                 <Input 
                  type="email" 
                  id="exportEmailDuringMatch" 
                  placeholder="Enter email for report" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="mt-1 shadow-sm w-full"
                />
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <Input 
                    type="email" 
                    id="exportEmail" 
                    placeholder="Enter email for match report" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="flex-grow shadow-sm"
                  />
                  <Button 
                    onClick={handleExport} 
                    variant="secondary" 
                    size="lg" 
                    disabled={(history.length <= 1 && !withdrawnPlayer) || !email.trim()}
                    className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow" 
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Email Match Report
                  </Button>
                </div>
                <Button 
                  onClick={handlePrintChart} 
                  variant="outline" 
                  size="lg" 
                  disabled={history.length <= 1}
                  className="w-full shadow-md hover:shadow-lg transition-shadow" 
                >
                  <Printer className="mr-2 h-5 w-5" />
                  Export Chart to PDF
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
        <p className="text-center text-sm text-muted-foreground print-hide-tip">
          Tip: Use your browser's "Print" (Ctrl/Cmd + P) and select "Save as PDF" to export the chart.
        </p>
      </div>
    </main>
  );
}
