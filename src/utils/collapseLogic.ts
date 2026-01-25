/**
 * Collapse Logic Utilities
 * Multi-collapse scoring system for quantum tic-tac-toe.
 */

import {
  TicTacToeGame,
  CollapseMode,
  CollapseResult,
  MultiCollapseResults,
  SCORE_VALUES,
} from '@/types';
import { gameIndexToState, stateToGameIndex } from './stateMapping';

/**
 * Get points for a game based on its status.
 */
function getGamePoints(game: TicTacToeGame): number {
  if (game.status === 'won') return SCORE_VALUES.won;
  if (game.status === 'lost') return SCORE_VALUES.lost;
  if (game.status === 'draw') return SCORE_VALUES.draw;
  return 0;
}

/**
 * Generate all possible state strings for n qubits.
 */
export function getAllStates(n: number): string[] {
  const numStates = Math.pow(2, n);
  const states: string[] = [];
  for (let i = 0; i < numStates; i++) {
    states.push(gameIndexToState(i, n));
  }
  return states;
}

/**
 * Renormalize measurement counts after removing states.
 * Redistributes probability from removed states to remaining ones.
 */
export function renormalizeCounts(
  counts: Record<string, number>,
  removedStates: Set<string>,
  n: number,
  totalShots: number
): Record<string, number> {
  const validCounts: Record<string, number> = {};
  let validTotal = 0;

  // Filter out removed states and sum valid counts
  for (const [state, count] of Object.entries(counts)) {
    if (!removedStates.has(state)) {
      validCounts[state] = count;
      validTotal += count;
    }
  }

  // If no valid states have counts, distribute uniformly among remaining
  if (validTotal === 0) {
    const allStates = getAllStates(n);
    const remainingStates = allStates.filter((s) => !removedStates.has(s));
    if (remainingStates.length === 0) {
      return {};
    }
    const countPerState = Math.floor(totalShots / remainingStates.length);
    for (const state of remainingStates) {
      validCounts[state] = countPerState;
    }
    return validCounts;
  }

  // Renormalize to maintain total shot count (for display consistency)
  const scale = totalShots / validTotal;
  for (const state in validCounts) {
    validCounts[state] = Math.round(validCounts[state] * scale);
  }

  return validCounts;
}

/**
 * Find the winning state (highest count) from measurement counts.
 */
export function findWinningState(counts: Record<string, number>): string | null {
  let maxCount = 0;
  let winningState: string | null = null;

  for (const [state, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      winningState = state;
    } else if (count === maxCount && winningState !== null) {
      // Tie-breaker: lower state index wins
      if (parseInt(state, 2) < parseInt(winningState, 2)) {
        winningState = state;
      }
    }
  }

  return winningState;
}

/**
 * Select top N survivors from measurement counts (for hard mode).
 * Uses count as primary sort, state index as tie-breaker.
 */
export function selectTopSurvivors(
  counts: Record<string, number>,
  numSurvivors: number
): string[] {
  const entries = Object.entries(counts);

  // Sort by count (descending), then by state value (ascending) for ties
  entries.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]; // Higher count first
    return parseInt(a[0], 2) - parseInt(b[0], 2); // Lower state index first
  });

  // If we don't have enough entries, we need to add states with 0 counts
  if (entries.length < numSurvivors) {
    const existingStates = new Set(entries.map(([s]) => s));
    const n = entries.length > 0 ? entries[0][0].length : 1;
    const allStates = getAllStates(n);

    for (const state of allStates) {
      if (!existingStates.has(state)) {
        entries.push([state, 0]);
      }
      if (entries.length >= numSurvivors * 2) break; // Don't need all, just enough
    }

    // Re-sort after adding zeros
    entries.sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return parseInt(a[0], 2) - parseInt(b[0], 2);
    });
  }

  return entries.slice(0, numSurvivors).map(([state]) => state);
}

/**
 * Execute Easy Mode collapses.
 * Runs multiple measurements, removing selected survivors from the pool each time.
 */
export function executeEasyModeCollapses(
  measurementFn: () => Record<string, number>,
  games: TicTacToeGame[],
  n: number,
  shots: number = 1024
): MultiCollapseResults {
  const numGames = games.length;
  const numSurvivors = Math.pow(2, n - 1);
  const collapses: CollapseResult[] = [];
  const survivors: number[] = [];
  const removedStates = new Set<string>();

  for (let i = 0; i < numSurvivors; i++) {
    // Get fresh measurement
    const rawCounts = measurementFn();

    // Get available states for this iteration
    const availableStates = getAllStates(n).filter((s) => !removedStates.has(s));

    // Renormalize counts to exclude already-selected survivors
    const counts = renormalizeCounts(rawCounts, removedStates, n, shots);

    // Find winning state
    const survivorState = findWinningState(counts);
    if (!survivorState) {
      // Fallback: pick first available state
      const fallbackState = availableStates[0] || gameIndexToState(0, n);
      const survivorIndex = stateToGameIndex(fallbackState);
      const game = games[survivorIndex];
      const points = getGamePoints(game);

      collapses.push({
        iteration: i + 1,
        counts,
        survivorState: fallbackState,
        survivorIndex,
        points,
        availableStates,
      });

      survivors.push(survivorIndex);
      removedStates.add(fallbackState);
      continue;
    }

    const survivorIndex = stateToGameIndex(survivorState);
    const game = games[survivorIndex];
    const points = getGamePoints(game);

    collapses.push({
      iteration: i + 1,
      counts,
      survivorState,
      survivorIndex,
      points,
      availableStates,
    });

    survivors.push(survivorIndex);
    removedStates.add(survivorState);
  }

  // Calculate eliminated games
  const eliminated: number[] = [];
  for (let i = 0; i < numGames; i++) {
    if (!survivors.includes(i)) {
      eliminated.push(i);
    }
  }

  // Calculate breakdown and final score
  const breakdown = calculateBreakdown(games, survivors);
  const finalScore = collapses.reduce((sum, c) => sum + c.points, 0);

  return {
    mode: 'easy',
    numSurvivors,
    collapses,
    survivors,
    eliminated,
    finalScore,
    breakdown,
  };
}

/**
 * Execute Hard Mode collapse.
 * Single measurement, top half of states survive.
 */
export function executeHardModeCollapse(
  counts: Record<string, number>,
  games: TicTacToeGame[],
  n: number,
  _shots: number = 1024
): MultiCollapseResults {
  const numGames = games.length;
  const numSurvivors = Math.pow(2, n - 1);

  // Ensure all states are represented in counts
  const allStates = getAllStates(n);
  const fullCounts: Record<string, number> = {};
  for (const state of allStates) {
    fullCounts[state] = counts[state] || 0;
  }

  // Select top survivors
  const survivorStates = selectTopSurvivors(fullCounts, numSurvivors);
  const survivors = survivorStates.map((s) => stateToGameIndex(s));

  // Build collapse results (single collapse for hard mode)
  const collapses: CollapseResult[] = survivorStates.map((state, index) => {
    const survivorIndex = stateToGameIndex(state);
    const game = games[survivorIndex];
    return {
      iteration: index + 1,
      counts: fullCounts,
      survivorState: state,
      survivorIndex,
      points: getGamePoints(game),
      availableStates: allStates,
    };
  });

  // Calculate eliminated games
  const eliminated: number[] = [];
  for (let i = 0; i < numGames; i++) {
    if (!survivors.includes(i)) {
      eliminated.push(i);
    }
  }

  // Calculate breakdown and final score
  const breakdown = calculateBreakdown(games, survivors);
  const finalScore = survivors.reduce((sum, idx) => sum + getGamePoints(games[idx]), 0);

  return {
    mode: 'hard',
    numSurvivors,
    collapses,
    survivors,
    eliminated,
    finalScore,
    breakdown,
  };
}

/**
 * Calculate score breakdown by outcome type.
 */
function calculateBreakdown(
  games: TicTacToeGame[],
  survivors: number[]
): MultiCollapseResults['breakdown'] {
  const breakdown = {
    wins: { count: 0, points: 0 },
    losses: { count: 0, points: 0 },
    draws: { count: 0, points: 0 },
  };

  for (const idx of survivors) {
    const game = games[idx];
    const points = getGamePoints(game);

    if (game.status === 'won') {
      breakdown.wins.count++;
      breakdown.wins.points += points;
    } else if (game.status === 'lost') {
      breakdown.losses.count++;
      breakdown.losses.points += points;
    } else if (game.status === 'draw') {
      breakdown.draws.count++;
      breakdown.draws.points += points;
    }
  }

  return breakdown;
}

/**
 * Get the optimal target states for a given set of games.
 * Returns states sorted by game score (best first).
 */
export function getOptimalTargetStates(
  games: TicTacToeGame[],
  n: number
): { state: string; gameIndex: number; points: number }[] {
  const targets = games.map((game) => ({
    state: gameIndexToState(game.id, n),
    gameIndex: game.id,
    points: getGamePoints(game),
  }));

  // Sort by points descending
  targets.sort((a, b) => b.points - a.points);

  return targets;
}

/**
 * Get strategy hint for the player based on game outcomes and collapse mode.
 */
export function getCollapseStrategyHint(
  games: TicTacToeGame[],
  n: number,
  mode: CollapseMode
): string {
  const numSurvivors = Math.pow(2, n - 1);
  const optimalTargets = getOptimalTargetStates(games, n);
  const topTargets = optimalTargets.slice(0, numSurvivors);

  const bestScore = topTargets.reduce((sum, t) => sum + t.points, 0);

  const targetStates = topTargets.map((t) => `|${t.state}⟩`).join(', ');

  if (mode === 'easy') {
    return `Create a superposition over your best ${numSurvivors} games: ${targetStates}. ` +
      `Each collapse will select one game, removing it from the pool. ` +
      `Best possible score: ${bestScore > 0 ? '+' : ''}${bestScore}`;
  } else {
    return `Spread probability across your best ${numSurvivors} games: ${targetStates}. ` +
      `The top ${numSurvivors} states by measurement count will survive. ` +
      `Best possible score: ${bestScore > 0 ? '+' : ''}${bestScore}`;
  }
}

/**
 * Simulate collapses using random measurements (for testing/demo).
 */
export function simulateRandomCollapses(
  games: TicTacToeGame[],
  n: number,
  mode: CollapseMode
): MultiCollapseResults {
  const numGames = games.length;
  const shots = 1024;

  // Generate random counts
  const generateRandomCounts = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    let remaining = shots;

    for (let i = 0; i < numGames - 1; i++) {
      const state = gameIndexToState(i, n);
      const count = Math.floor(Math.random() * remaining);
      counts[state] = count;
      remaining -= count;
    }
    counts[gameIndexToState(numGames - 1, n)] = remaining;

    return counts;
  };

  if (mode === 'easy') {
    return executeEasyModeCollapses(generateRandomCounts, games, n, shots);
  } else {
    const counts = generateRandomCounts();
    return executeHardModeCollapse(counts, games, n, shots);
  }
}
