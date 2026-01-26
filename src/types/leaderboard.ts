/**
 * Leaderboard TypeScript type definitions.
 */

/** Collapse mode for scoring */
import type { CollapseMode } from './game';

/** A single leaderboard entry */
export interface LeaderboardEntry {
  /** Unique ID */
  id: string;
  /** Player's name */
  name: string;
  /** Final score after quantum collapse */
  score: number;
  /** Number of qubits used */
  numQubits: number;
  /** Number of games played (2^n) */
  numGames: number;
  /** Number of survivors (2^(n-1)) */
  numSurvivors: number;
  /** Bot leniency setting (0-100) */
  botLeniency: number;
  /** Collapse mode used */
  collapseMode: CollapseMode;
  /** Games won (among survivors) */
  gamesWon: number;
  /** Games lost (among survivors) */
  gamesLost: number;
  /** Games drawn (among survivors) */
  gamesDrawn: number;
  /** Raw score before quantum collapse (all games) */
  rawScore: number;
  /** Survivor game indices */
  survivorGames: number[];
  /** Date of score submission */
  date: string;
  /** Game duration in seconds */
  duration: number;
}

/** Leaderboard state */
export interface LeaderboardState {
  /** All entries sorted by score (descending) */
  entries: LeaderboardEntry[];
  /** Maximum entries to keep */
  maxEntries: number;
}

/** Sort options for leaderboard */
export type LeaderboardSortKey = 'score' | 'date' | 'numQubits' | 'duration';
export type LeaderboardSortOrder = 'asc' | 'desc';

/** Default leaderboard configuration */
export const LEADERBOARD_CONFIG = {
  maxEntries: 100,
  storageKey: 'quantum-tictactoe-leaderboard',
};

/** Generate unique ID for leaderboard entry */
export function generateEntryId(): string {
  return `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Create a new leaderboard entry */
export function createLeaderboardEntry(
  name: string,
  score: number,
  numQubits: number,
  botLeniency: number,
  collapseMode: CollapseMode,
  gamesWon: number,
  gamesLost: number,
  gamesDrawn: number,
  rawScore: number,
  survivorGames: number[],
  duration: number
): LeaderboardEntry {
  return {
    id: generateEntryId(),
    name: name.trim().slice(0, 50), // Limit name length
    score,
    numQubits,
    numGames: Math.pow(2, numQubits),
    numSurvivors: Math.pow(2, numQubits - 1),
    botLeniency,
    collapseMode,
    gamesWon,
    gamesLost,
    gamesDrawn,
    rawScore,
    survivorGames,
    date: new Date().toISOString(),
    duration,
  };
}

/** Sort leaderboard entries */
export function sortLeaderboard(
  entries: LeaderboardEntry[],
  sortKey: LeaderboardSortKey = 'score',
  sortOrder: LeaderboardSortOrder = 'desc'
): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => {
    let comparison = 0;

    switch (sortKey) {
      case 'score':
        comparison = a.score - b.score;
        break;
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'numQubits':
        comparison = a.numQubits - b.numQubits;
        break;
      case 'duration':
        comparison = a.duration - b.duration;
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/** Create initial leaderboard state */
export function createInitialLeaderboardState(): LeaderboardState {
  return {
    entries: [],
    maxEntries: LEADERBOARD_CONFIG.maxEntries,
  };
}

/** Format duration for display */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  if (mins === 0) {
    return `${secs}s`;
  }

  return `${mins}m ${secs}s`;
}

/** Format date for display */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
