/**
 * Scoring Utilities
 * Score calculation and statistics.
 */

import { TicTacToeGame, GameScore, SCORE_VALUES } from '@/types';

/**
 * Calculate score for a single game.
 * @param status - Game outcome status
 * @returns Points earned
 */
export function getPointsForStatus(status: 'won' | 'lost' | 'draw'): number {
  return SCORE_VALUES[status];
}

/**
 * Calculate scores for all completed games.
 * @param games - Array of games
 * @returns Array of game scores
 */
export function calculateScores(games: TicTacToeGame[]): GameScore[] {
  return games
    .filter((game) => game.status !== 'playing')
    .map((game) => ({
      gameId: game.id,
      status: game.status as 'won' | 'lost' | 'draw',
      points: getPointsForStatus(game.status as 'won' | 'lost' | 'draw'),
      eliminated: false,
    }));
}

/**
 * Calculate raw total score (before quantum elimination).
 * @param scores - Array of game scores
 * @returns Total points
 */
export function calculateRawScore(scores: GameScore[]): number {
  return scores.reduce((sum, s) => sum + s.points, 0);
}

/**
 * Calculate final score (after quantum elimination).
 * @param scores - Array of game scores
 * @returns Total points for non-eliminated games
 */
export function calculateFinalScore(scores: GameScore[]): number {
  return scores
    .filter((s) => !s.eliminated)
    .reduce((sum, s) => sum + s.points, 0);
}

/**
 * Apply elimination to scores.
 * @param scores - Array of game scores
 * @param eliminatedGames - Array of eliminated game IDs
 * @returns Updated scores with elimination flags
 */
export function applyElimination(
  scores: GameScore[],
  eliminatedGames: number[]
): GameScore[] {
  const eliminatedSet = new Set(eliminatedGames);

  return scores.map((s) => ({
    ...s,
    eliminated: eliminatedSet.has(s.gameId),
  }));
}

/**
 * Get game statistics.
 * @param games - Array of games
 * @returns Statistics object
 */
export function getGameStats(games: TicTacToeGame[]): {
  total: number;
  won: number;
  lost: number;
  drawn: number;
  playing: number;
  completed: number;
  winRate: number;
} {
  const total = games.length;
  const won = games.filter((g) => g.status === 'won').length;
  const lost = games.filter((g) => g.status === 'lost').length;
  const drawn = games.filter((g) => g.status === 'draw').length;
  const playing = games.filter((g) => g.status === 'playing').length;
  const completed = won + lost + drawn;
  const winRate = completed > 0 ? (won / completed) * 100 : 0;

  return { total, won, lost, drawn, playing, completed, winRate };
}

/**
 * Get score breakdown.
 * @param scores - Array of game scores
 * @returns Score breakdown by category
 */
export function getScoreBreakdown(scores: GameScore[]): {
  wins: { count: number; points: number };
  losses: { count: number; points: number };
  draws: { count: number; points: number };
  eliminated: { count: number; pointsSaved: number };
  raw: number;
  final: number;
} {
  const wins = scores.filter((s) => s.status === 'won');
  const losses = scores.filter((s) => s.status === 'lost');
  const draws = scores.filter((s) => s.status === 'draw');
  const eliminated = scores.filter((s) => s.eliminated);

  const pointsSaved = eliminated.reduce((sum, s) => {
    // Points "saved" are negative points that were eliminated
    return sum + (s.points < 0 ? Math.abs(s.points) : 0);
  }, 0);

  return {
    wins: {
      count: wins.length,
      points: wins.reduce((sum, s) => sum + s.points, 0),
    },
    losses: {
      count: losses.length,
      points: losses.reduce((sum, s) => sum + s.points, 0),
    },
    draws: {
      count: draws.length,
      points: draws.reduce((sum, s) => sum + s.points, 0),
    },
    eliminated: {
      count: eliminated.length,
      pointsSaved,
    },
    raw: calculateRawScore(scores),
    final: calculateFinalScore(scores),
  };
}

/**
 * Format score for display.
 * @param score - Score value
 * @param showPlus - Whether to show + for positive numbers
 * @returns Formatted score string
 */
export function formatScore(score: number, showPlus: boolean = true): string {
  if (score > 0 && showPlus) {
    return `+${score}`;
  }
  return score.toString();
}

/**
 * Get best possible score (all wins).
 * @param numGames - Number of games
 * @returns Maximum possible score
 */
export function getBestPossibleScore(numGames: number): number {
  return numGames * SCORE_VALUES.won;
}

/**
 * Get worst possible score (all losses).
 * @param numGames - Number of games
 * @returns Minimum possible score
 */
export function getWorstPossibleScore(numGames: number): number {
  return numGames * SCORE_VALUES.lost;
}
