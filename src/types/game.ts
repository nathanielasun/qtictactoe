/**
 * Game-related TypeScript type definitions.
 */

/** Cell value in a tic-tac-toe board */
export type CellValue = null | 'X' | 'O';

/** Player type - X is human, O is bot */
export type Player = 'X' | 'O';

/** Game outcome status */
export type GameStatus = 'playing' | 'won' | 'lost' | 'draw';

/** Game phase in the overall flow */
export type GamePhase = 'setup' | 'playing' | 'quantum' | 'results';

/** Collapse mode for scoring */
export type CollapseMode = 'easy' | 'hard';

/** Result of a single collapse (used in easy mode) */
export interface CollapseResult {
  /** Collapse iteration number */
  iteration: number;
  /** Measurement counts for this collapse */
  counts: Record<string, number>;
  /** Selected survivor state string */
  survivorState: string;
  /** Survivor game index */
  survivorIndex: number;
  /** Points from this survivor */
  points: number;
  /** States that were available for this collapse */
  availableStates: string[];
}

/** Multi-collapse results */
export interface MultiCollapseResults {
  /** Collapse mode used */
  mode: CollapseMode;
  /** Number of survivors selected */
  numSurvivors: number;
  /** Individual collapse results (for easy mode visualization) */
  collapses: CollapseResult[];
  /** All survivor game indices */
  survivors: number[];
  /** All eliminated game indices */
  eliminated: number[];
  /** Final combined score */
  finalScore: number;
  /** Score breakdown by outcome type */
  breakdown: {
    wins: { count: number; points: number };
    losses: { count: number; points: number };
    draws: { count: number; points: number };
  };
}

/** A single move in a game */
export interface Move {
  player: Player;
  cell: number;
  timestamp: number;
}

/** A single tic-tac-toe game */
export interface TicTacToeGame {
  /** Game index (0 to 2^n - 1) */
  id: number;
  /** Board state - 9 cells */
  board: CellValue[];
  /** Current player's turn */
  currentPlayer: Player;
  /** Game outcome status */
  status: GameStatus;
  /** Winner if game is complete */
  winner: Player | null;
  /** Cells that form the winning line */
  winningCells: number[] | null;
  /** History of moves */
  moveHistory: Move[];
}

/** Score for a single game */
export interface GameScore {
  /** Game ID */
  gameId: number;
  /** Game outcome */
  status: 'won' | 'lost' | 'draw';
  /** Points earned (+2, -2, or -1) */
  points: number;
  /** Whether this game was eliminated by quantum circuit */
  eliminated: boolean;
}

/** Overall game state */
export interface GameState {
  // Configuration
  /** Number of qubits (1-6) */
  n: number;
  /** Number of games (2^n) */
  numGames: number;
  /** Bot leniency (0-100) */
  botLeniency: number;
  /** Collapse mode for scoring */
  collapseMode: CollapseMode;

  // Game Progress
  /** Current game phase */
  phase: GamePhase;
  /** All games being played */
  games: TicTacToeGame[];

  // Scoring
  /** Per-game scores (populated after games complete) */
  scores: GameScore[];
  /** Running total before quantum elimination */
  rawScore: number;
  /** Final score after quantum elimination */
  finalScore: number;

  // Quantum Phase Results
  /** Indices of games eliminated by quantum measurement */
  eliminatedGames: number[];
  /** Indices of surviving games (multiple in multi-collapse mode) */
  survivorGames: number[];
  /** Detailed collapse results */
  collapseResults: MultiCollapseResults | null;

  // Meta
  /** Player's name for leaderboard */
  playerName: string;
  /** Game start time */
  startTime: Date | null;
  /** Game end time */
  endTime: Date | null;
}

/** Win patterns - indices that form winning lines */
export const WIN_PATTERNS: readonly number[][] = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal TL-BR
  [2, 4, 6], // Diagonal TR-BL
] as const;

/** Point values for game outcomes */
export const SCORE_VALUES = {
  won: 2,
  lost: -2,
  draw: -1,
} as const;

/** Valid range for n (number of qubits) */
export const N_RANGE = {
  min: 1,
  max: 6,
} as const;

/** Bot leniency range */
export const LENIENCY_RANGE = {
  min: 0,
  max: 100,
  default: 50,
} as const;

/** Create an empty board */
export function createEmptyBoard(): CellValue[] {
  return Array(9).fill(null);
}

/** Create a new game */
export function createGame(id: number): TicTacToeGame {
  return {
    id,
    board: createEmptyBoard(),
    currentPlayer: 'X',
    status: 'playing',
    winner: null,
    winningCells: null,
    moveHistory: [],
  };
}

/** Create initial game state */
export function createInitialGameState(): GameState {
  return {
    n: 2,
    numGames: 4,
    botLeniency: LENIENCY_RANGE.default,
    collapseMode: 'easy',
    phase: 'setup',
    games: [],
    scores: [],
    rawScore: 0,
    finalScore: 0,
    eliminatedGames: [],
    survivorGames: [],
    collapseResults: null,
    playerName: '',
    startTime: null,
    endTime: null,
  };
}
