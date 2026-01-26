/**
 * State Mapping Utilities
 * Map quantum states to game indices for elimination.
 */

import { TicTacToeGame } from '@/types';

/**
 * Convert a game index to its corresponding quantum state string.
 * @param gameIndex - Game index (0 to 2^n - 1)
 * @param n - Number of qubits
 * @returns Binary state string (big-endian)
 */
export function gameIndexToState(gameIndex: number, n: number): string {
  return gameIndex.toString(2).padStart(n, '0');
}

/**
 * Convert a quantum state string to game index.
 * @param state - Binary state string (big-endian)
 * @returns Game index
 */
export function stateToGameIndex(state: string): number {
  return parseInt(state, 2);
}

/**
 * Determine which games to eliminate based on the winning state.
 * In this implementation, the winning state selects ONE survivor game;
 * all other games are eliminated.
 *
 * @param winningState - The state with highest measurement count
 * @param numGames - Total number of games
 * @returns Object with eliminated game indices and survivor index
 */
export function determineEliminations(
  winningState: string,
  numGames: number
): { eliminated: number[]; survivor: number } {
  const survivorIndex = stateToGameIndex(winningState);

  // Validate survivor index
  if (survivorIndex < 0 || survivorIndex >= numGames) {
    throw new Error(
      `Invalid survivor index ${survivorIndex} for ${numGames} games`
    );
  }

  const eliminated: number[] = [];
  for (let i = 0; i < numGames; i++) {
    if (i !== survivorIndex) {
      eliminated.push(i);
    }
  }

  return { eliminated, survivor: survivorIndex };
}

/**
 * Find the best state to target based on game outcomes.
 * Returns the state corresponding to the best-scoring game.
 *
 * @param games - Array of completed games
 * @param n - Number of qubits
 * @returns Best state to target and its game info
 */
export function findBestTargetState(
  games: TicTacToeGame[],
  n: number
): { state: string; gameIndex: number; points: number } | null {
  if (games.length === 0) return null;

  let bestGame: TicTacToeGame | null = null;
  let bestPoints = -Infinity;

  for (const game of games) {
    if (game.status === 'playing') continue;

    const points =
      game.status === 'won' ? 2 : game.status === 'lost' ? -2 : -1;

    if (points > bestPoints) {
      bestPoints = points;
      bestGame = game;
    }
  }

  if (!bestGame) return null;

  return {
    state: gameIndexToState(bestGame.id, n),
    gameIndex: bestGame.id,
    points: bestPoints,
  };
}

/**
 * Calculate expected score based on probability distribution.
 * @param counts - Measurement counts for each state
 * @param games - Array of games
 * @param shots - Total number of shots
 * @returns Expected score value
 */
export function calculateExpectedScore(
  counts: Record<string, number>,
  games: TicTacToeGame[],
  shots: number
): number {
  let expectedValue = 0;

  for (const [state, count] of Object.entries(counts)) {
    const gameIndex = stateToGameIndex(state);

    if (gameIndex >= 0 && gameIndex < games.length) {
      const game = games[gameIndex];
      const points =
        game.status === 'won' ? 2 : game.status === 'lost' ? -2 : -1;
      const probability = count / shots;

      expectedValue += points * probability;
    }
  }

  return expectedValue;
}

/**
 * Get state labels for all games.
 * @param n - Number of qubits
 * @returns Map of game index to state label
 */
export function getStateLabels(n: number): Map<number, string> {
  const numGames = Math.pow(2, n);
  const labels = new Map<number, string>();

  for (let i = 0; i < numGames; i++) {
    labels.set(i, `|${gameIndexToState(i, n)}⟩`);
  }

  return labels;
}

/**
 * Get strategy hint based on game outcomes.
 * @param games - Array of completed games
 * @param n - Number of qubits
 * @returns Strategy hint message
 */
export function getStrategyHint(games: TicTacToeGame[], n: number): string {
  const bestTarget = findBestTargetState(games, n);

  if (!bestTarget) {
    return 'Complete all games to see strategy hints.';
  }

  const { state, gameIndex, points } = bestTarget;
  const pointsStr = points > 0 ? `+${points}` : points.toString();

  // Generate hint about which gates to apply
  const xGates: string[] = [];
  for (let i = 0; i < state.length; i++) {
    if (state[state.length - 1 - i] === '1') {
      xGates.push(`X on qubit ${i}`);
    }
  }

  if (xGates.length === 0) {
    return `Your best game is Game ${gameIndex} (${pointsStr} points). ` +
      `The circuit already outputs |${state}⟩ by default - no gates needed!`;
  }

  return `Your best game is Game ${gameIndex} (${pointsStr} points). ` +
    `Apply ${xGates.join(' and ')} to select state |${state}⟩.`;
}

/** Histogram bar data for visualization */
export interface HistogramBar {
  state: string;
  gameIndex: number;
  count: number;
  probability: number;
  gameOutcome: 'won' | 'lost' | 'draw';
  gamePoints: number;
  isWinningState: boolean;
}

/**
 * Build histogram data from measurement counts.
 * @param counts - Measurement counts for each state
 * @param games - Array of games
 * @param shots - Total number of shots
 * @param winningState - The winning state
 * @returns Array of histogram bar data
 */
export function buildHistogramData(
  counts: Record<string, number>,
  games: TicTacToeGame[],
  shots: number,
  winningState: string
): HistogramBar[] {
  return Object.entries(counts)
    .map(([state, count]) => {
      const gameIndex = stateToGameIndex(state);
      const game = games[gameIndex];
      const outcome = game?.status as 'won' | 'lost' | 'draw';
      const points =
        outcome === 'won' ? 2 : outcome === 'lost' ? -2 : -1;

      return {
        state,
        gameIndex,
        count,
        probability: count / shots,
        gameOutcome: outcome,
        gamePoints: points,
        isWinningState: state === winningState,
      };
    })
    .sort((a, b) => b.count - a.count);
}
