/**
 * Game Context - Manages main game state across phases.
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  GameState,
  GamePhase,
  TicTacToeGame,
  createGame,
  createInitialGameState,
  SCORE_VALUES,
  MultiCollapseResults,
  CollapseMode,
} from '@/types';

/** Game action types */
type GameAction =
  | { type: 'START_GAME'; payload: { n: number; botLeniency: number; collapseMode: CollapseMode } }
  | { type: 'MAKE_MOVE'; payload: { gameId: number; cellIndex: number; player: 'X' | 'O' } }
  | { type: 'UPDATE_GAME'; payload: { gameId: number; game: Partial<TicTacToeGame> } }
  | { type: 'SET_PHASE'; payload: GamePhase }
  | { type: 'APPLY_COLLAPSE_RESULTS'; payload: MultiCollapseResults }
  | { type: 'SET_PLAYER_NAME'; payload: string }
  | { type: 'RESET_GAME' };

/** Game reducer */
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const { n, botLeniency, collapseMode } = action.payload;
      const numGames = Math.pow(2, n);
      const games: TicTacToeGame[] = [];

      for (let i = 0; i < numGames; i++) {
        games.push(createGame(i));
      }

      return {
        ...state,
        n,
        numGames,
        botLeniency,
        collapseMode,
        phase: 'playing',
        games,
        scores: [],
        rawScore: 0,
        finalScore: 0,
        eliminatedGames: [],
        survivorGames: [],
        collapseResults: null,
        startTime: new Date(),
        endTime: null,
      };
    }

    case 'MAKE_MOVE': {
      const { gameId, cellIndex, player } = action.payload;
      const games = state.games.map((game) => {
        if (game.id !== gameId) return game;

        const newBoard = [...game.board];
        newBoard[cellIndex] = player;

        return {
          ...game,
          board: newBoard,
          moveHistory: [
            ...game.moveHistory,
            { player, cell: cellIndex, timestamp: Date.now() },
          ],
        };
      });

      return { ...state, games };
    }

    case 'UPDATE_GAME': {
      const { gameId, game: updates } = action.payload;
      const games = state.games.map((game) => {
        if (game.id !== gameId) return game;
        return { ...game, ...updates };
      });

      // Recalculate scores if game status changed
      let scores = state.scores;
      let rawScore = state.rawScore;

      const updatedGame = games.find((g) => g.id === gameId);
      if (updatedGame && updates.status && updates.status !== 'playing') {
        // Remove old score entry if exists
        scores = scores.filter((s) => s.gameId !== gameId);

        // Add new score entry
        const status = updates.status as 'won' | 'lost' | 'draw';
        const points = SCORE_VALUES[status];
        scores = [...scores, { gameId, status, points, eliminated: false }];

        // Recalculate raw score
        rawScore = scores.reduce((sum, s) => sum + s.points, 0);
      }

      return { ...state, games, scores, rawScore };
    }

    case 'SET_PHASE': {
      const newState = { ...state, phase: action.payload };

      // Set end time when entering quantum phase
      if (action.payload === 'quantum' && state.phase === 'playing') {
        newState.endTime = new Date();
      }

      return newState;
    }

    case 'APPLY_COLLAPSE_RESULTS': {
      const collapseResults = action.payload;
      const { survivors, eliminated, finalScore } = collapseResults;

      // Update scores with elimination info
      const scores = state.scores.map((s) => ({
        ...s,
        eliminated: eliminated.includes(s.gameId),
      }));

      return {
        ...state,
        scores,
        eliminatedGames: eliminated,
        survivorGames: survivors,
        collapseResults,
        finalScore,
        phase: 'results',
      };
    }

    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.payload };

    case 'RESET_GAME':
      return createInitialGameState();

    default:
      return state;
  }
}

/** Context value interface */
interface GameContextValue {
  state: GameState;

  // Game actions
  startGame: (n: number, botLeniency: number, collapseMode: CollapseMode) => void;
  makeMove: (gameId: number, cellIndex: number, player: 'X' | 'O') => void;
  updateGame: (gameId: number, updates: Partial<TicTacToeGame>) => void;
  setPhase: (phase: GamePhase) => void;
  applyCollapseResults: (results: MultiCollapseResults) => void;
  setPlayerName: (name: string) => void;
  resetGame: () => void;

  // Computed values
  activeGames: TicTacToeGame[];
  completedGames: TicTacToeGame[];
  allGamesComplete: boolean;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  gameDuration: number;
}

/** Create context */
const GameContext = createContext<GameContextValue | undefined>(undefined);

/** Game provider component */
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, createInitialGameState());

  // Actions
  const startGame = useCallback((n: number, botLeniency: number, collapseMode: CollapseMode) => {
    dispatch({ type: 'START_GAME', payload: { n, botLeniency, collapseMode } });
  }, []);

  const makeMove = useCallback(
    (gameId: number, cellIndex: number, player: 'X' | 'O') => {
      dispatch({ type: 'MAKE_MOVE', payload: { gameId, cellIndex, player } });
    },
    []
  );

  const updateGame = useCallback(
    (gameId: number, updates: Partial<TicTacToeGame>) => {
      dispatch({ type: 'UPDATE_GAME', payload: { gameId, game: updates } });
    },
    []
  );

  const setPhase = useCallback((phase: GamePhase) => {
    dispatch({ type: 'SET_PHASE', payload: phase });
  }, []);

  const applyCollapseResults = useCallback((results: MultiCollapseResults) => {
    dispatch({ type: 'APPLY_COLLAPSE_RESULTS', payload: results });
  }, []);

  const setPlayerName = useCallback((name: string) => {
    dispatch({ type: 'SET_PLAYER_NAME', payload: name });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  // Computed values
  const activeGames = useMemo(
    () => state.games.filter((g) => g.status === 'playing'),
    [state.games]
  );

  const completedGames = useMemo(
    () => state.games.filter((g) => g.status !== 'playing'),
    [state.games]
  );

  const allGamesComplete = useMemo(
    () => state.games.length > 0 && activeGames.length === 0,
    [state.games.length, activeGames.length]
  );

  const gamesWon = useMemo(
    () => state.games.filter((g) => g.status === 'won').length,
    [state.games]
  );

  const gamesLost = useMemo(
    () => state.games.filter((g) => g.status === 'lost').length,
    [state.games]
  );

  const gamesDrawn = useMemo(
    () => state.games.filter((g) => g.status === 'draw').length,
    [state.games]
  );

  const gameDuration = useMemo(() => {
    if (!state.startTime) return 0;
    const endTime = state.endTime || new Date();
    return Math.floor((endTime.getTime() - state.startTime.getTime()) / 1000);
  }, [state.startTime, state.endTime]);

  const value: GameContextValue = {
    state,
    startGame,
    makeMove,
    updateGame,
    setPhase,
    applyCollapseResults,
    setPlayerName,
    resetGame,
    activeGames,
    completedGames,
    allGamesComplete,
    gamesWon,
    gamesLost,
    gamesDrawn,
    gameDuration,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/** Hook to use game context */
export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Alias for useGame
export const useGameContext = useGame;

export default GameContext;
