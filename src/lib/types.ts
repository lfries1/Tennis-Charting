
export interface DataPoint {
  pointSequence: number; // Sequential number of the point (e.g., 1st point, 2nd point)
  value: number;         // Cumulative score difference (Player's points - Opponent's points)
}

export interface GameMarker {
  pointSequence: number;
  gameScore: string; // e.g., "1:0"
}

export interface SetMarker {
  pointSequence: number;
  setNumber: number;
  setScore: string; // e.g., "6:2"
}
