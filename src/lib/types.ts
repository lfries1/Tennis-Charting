export interface DataPoint {
  pointSequence: number; // Sequential number of the point (e.g., 1st point, 2nd point)
  value: number;         // Cumulative score difference (Player's points - Opponent's points)
}
