
export type TurtleState = "active" | "hidden" | "safe" | "dead";

export interface Turtle {
  id: number;
  col: number;
  row: number;
  state: TurtleState;
  isInShell: boolean;
  pathIndex: number; // Index of the path in TURTLE_PATHS
  pathStep: number; // Current step in the assigned path
}

export interface Leaf {
  id: number;
  row: number;
  col: number;
}

export interface Predator {
  type: "seagull" | "crab";
  row: number;
  col: number;
  pathIndex: number;
}

export interface GameState {
  level: number;
  turtles: Turtle[];
  leaves: Leaf[];
  leafCount: number;
  nextEggIndex: number;
  seagull: Predator;
  crab: Predator;
  isGameOver: boolean;
  isWin: boolean;
  turnCount: number;
  lastAction: string | null;
  isShellModeActive: boolean;
}

export const SEAGULL_PATH = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1];
export const CRAB_PATH = [4, 3, 2, 1, 0, 1, 2, 3];

// 5 Curved paths that intersect
export const TURTLE_PATHS = [
  [[5,0], [4,0], [3,1], [2,2], [1,1], [0,0]], // Path 0
  [[5,1], [4,2], [3,3], [2,2], [1,1], [0,1]], // Path 1
  [[5,2], [4,1], [3,0], [2,1], [1,2], [0,2]], // Path 2
  [[5,3], [4,4], [3,3], [2,2], [1,3], [0,3]], // Path 3
  [[5,4], [4,3], [3,2], [2,3], [1,4], [0,4]], // Path 4
];

export const GRID_ROWS = 6;
export const GRID_COLS = 5;
export const MAX_TURTLES = 5;
export const INITIAL_LEAF_COUNT = 2;
export const LEAF_CAPACITY = 3;
