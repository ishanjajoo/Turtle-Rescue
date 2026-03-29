
export type TurtleState = "active" | "hidden" | "safe" | "dead";

export interface Turtle {
  id: number;
  col: number;
  row: number;
  state: TurtleState;
  isInShell: boolean;
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

export const GRID_ROWS = 6;
export const GRID_COLS = 5;
export const MAX_TURTLES = 5;
export const INITIAL_LEAF_COUNT = 2;
export const LEAF_CAPACITY = 3;
