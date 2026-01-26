/**
 * Leaderboard Context - Manages leaderboard state with localStorage persistence.
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import {
  LeaderboardEntry,
  LeaderboardState,
  LeaderboardSortKey,
  LeaderboardSortOrder,
  LEADERBOARD_CONFIG,
  createLeaderboardEntry,
  sortLeaderboard,
  createInitialLeaderboardState,
  CollapseMode,
} from '@/types';

/** Leaderboard action types */
type LeaderboardAction =
  | { type: 'LOAD_FROM_STORAGE'; payload: LeaderboardEntry[] }
  | { type: 'ADD_ENTRY'; payload: LeaderboardEntry }
  | { type: 'REMOVE_ENTRY'; payload: string }
  | { type: 'CLEAR_ALL' };

/** Leaderboard reducer */
function leaderboardReducer(
  state: LeaderboardState,
  action: LeaderboardAction
): LeaderboardState {
  switch (action.type) {
    case 'LOAD_FROM_STORAGE': {
      return {
        ...state,
        entries: sortLeaderboard(action.payload, 'score', 'desc'),
      };
    }

    case 'ADD_ENTRY': {
      const newEntries = [...state.entries, action.payload];
      // Sort by score descending and limit to max entries
      const sorted = sortLeaderboard(newEntries, 'score', 'desc');
      return {
        ...state,
        entries: sorted.slice(0, state.maxEntries),
      };
    }

    case 'REMOVE_ENTRY': {
      return {
        ...state,
        entries: state.entries.filter((e) => e.id !== action.payload),
      };
    }

    case 'CLEAR_ALL': {
      return {
        ...state,
        entries: [],
      };
    }

    default:
      return state;
  }
}

/** Load leaderboard from localStorage */
function loadFromStorage(): LeaderboardEntry[] {
  try {
    const stored = localStorage.getItem(LEADERBOARD_CONFIG.storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Validate entries have required fields
        return parsed.filter(
          (entry: unknown) =>
            typeof entry === 'object' &&
            entry !== null &&
            'id' in entry &&
            'name' in entry &&
            'score' in entry
        ) as LeaderboardEntry[];
      }
    }
  } catch (e) {
    console.error('Failed to load leaderboard from storage:', e);
  }
  return [];
}

/** Save leaderboard to localStorage */
function saveToStorage(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_CONFIG.storageKey, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save leaderboard to storage:', e);
  }
}

/** Context value interface */
interface LeaderboardContextValue {
  /** Current leaderboard state */
  state: LeaderboardState;

  /** Add a new entry to the leaderboard */
  addEntry: (
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
  ) => LeaderboardEntry;

  /** Remove an entry by ID */
  removeEntry: (id: string) => void;

  /** Clear all entries */
  clearAll: () => void;

  /** Get sorted entries */
  getSortedEntries: (
    sortKey?: LeaderboardSortKey,
    sortOrder?: LeaderboardSortOrder
  ) => LeaderboardEntry[];

  /** Get top N entries */
  getTopEntries: (n: number) => LeaderboardEntry[];

  /** Get player's best score */
  getPlayerBest: (name: string) => LeaderboardEntry | null;

  /** Get player's rank for a given score */
  getRankForScore: (score: number) => number;

  /** Check if score would make it to leaderboard */
  wouldMakeLeaderboard: (score: number) => boolean;
}

/** Create context */
const LeaderboardContext = createContext<LeaderboardContextValue | undefined>(
  undefined
);

/** Leaderboard provider component */
export function LeaderboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    leaderboardReducer,
    createInitialLeaderboardState()
  );

  // Load from localStorage on mount
  useEffect(() => {
    const entries = loadFromStorage();
    if (entries.length > 0) {
      dispatch({ type: 'LOAD_FROM_STORAGE', payload: entries });
    }
  }, []);

  // Save to localStorage when entries change
  useEffect(() => {
    saveToStorage(state.entries);
  }, [state.entries]);

  // Add entry
  const addEntry = useCallback(
    (
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
    ): LeaderboardEntry => {
      const entry = createLeaderboardEntry(
        name,
        score,
        numQubits,
        botLeniency,
        collapseMode,
        gamesWon,
        gamesLost,
        gamesDrawn,
        rawScore,
        survivorGames,
        duration
      );
      dispatch({ type: 'ADD_ENTRY', payload: entry });
      return entry;
    },
    []
  );

  // Remove entry
  const removeEntry = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ENTRY', payload: id });
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  // Get sorted entries
  const getSortedEntries = useCallback(
    (
      sortKey: LeaderboardSortKey = 'score',
      sortOrder: LeaderboardSortOrder = 'desc'
    ): LeaderboardEntry[] => {
      return sortLeaderboard(state.entries, sortKey, sortOrder);
    },
    [state.entries]
  );

  // Get top N entries
  const getTopEntries = useCallback(
    (n: number): LeaderboardEntry[] => {
      return state.entries.slice(0, n);
    },
    [state.entries]
  );

  // Get player's best score
  const getPlayerBest = useCallback(
    (name: string): LeaderboardEntry | null => {
      const playerEntries = state.entries.filter(
        (e) => e.name.toLowerCase() === name.toLowerCase()
      );
      if (playerEntries.length === 0) return null;
      return playerEntries[0]; // Already sorted by score desc
    },
    [state.entries]
  );

  // Get rank for a given score
  const getRankForScore = useCallback(
    (score: number): number => {
      const rank = state.entries.filter((e) => e.score > score).length + 1;
      return rank;
    },
    [state.entries]
  );

  // Check if score would make leaderboard
  const wouldMakeLeaderboard = useCallback(
    (score: number): boolean => {
      if (state.entries.length < state.maxEntries) return true;
      const lowestScore = state.entries[state.entries.length - 1]?.score ?? 0;
      return score > lowestScore;
    },
    [state.entries, state.maxEntries]
  );

  const value: LeaderboardContextValue = {
    state,
    addEntry,
    removeEntry,
    clearAll,
    getSortedEntries,
    getTopEntries,
    getPlayerBest,
    getRankForScore,
    wouldMakeLeaderboard,
  };

  return (
    <LeaderboardContext.Provider value={value}>
      {children}
    </LeaderboardContext.Provider>
  );
}

/** Hook to use leaderboard context */
export function useLeaderboard(): LeaderboardContextValue {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }
  return context;
}

export default LeaderboardContext;
