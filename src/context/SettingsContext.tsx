/**
 * Settings Context - Manages game configuration state.
 */

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { N_RANGE, LENIENCY_RANGE, CollapseMode } from '@/types';

/** Settings state interface */
interface SettingsState {
  /** Number of qubits (1-6) */
  n: number;
  /** Bot leniency (0-100) */
  botLeniency: number;
  /** Collapse mode for scoring (easy or hard) */
  collapseMode: CollapseMode;
  /** Sound effects enabled */
  soundEnabled: boolean;
  /** Animations enabled */
  animationsEnabled: boolean;
  /** Show strategy hints */
  showHints: boolean;
}

/** Settings action types */
type SettingsAction =
  | { type: 'SET_N'; payload: number }
  | { type: 'SET_BOT_LENIENCY'; payload: number }
  | { type: 'SET_COLLAPSE_MODE'; payload: CollapseMode }
  | { type: 'SET_SOUND_ENABLED'; payload: boolean }
  | { type: 'SET_ANIMATIONS_ENABLED'; payload: boolean }
  | { type: 'SET_SHOW_HINTS'; payload: boolean }
  | { type: 'RESET_TO_DEFAULTS' };

/** Default settings */
const DEFAULT_SETTINGS: SettingsState = {
  n: 2,
  botLeniency: LENIENCY_RANGE.default,
  collapseMode: 'easy',
  soundEnabled: false,
  animationsEnabled: true,
  showHints: true,
};

/** Settings reducer */
function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_N':
      return {
        ...state,
        n: Math.max(N_RANGE.min, Math.min(N_RANGE.max, action.payload)),
      };

    case 'SET_BOT_LENIENCY':
      return {
        ...state,
        botLeniency: Math.max(LENIENCY_RANGE.min, Math.min(LENIENCY_RANGE.max, action.payload)),
      };

    case 'SET_COLLAPSE_MODE':
      return { ...state, collapseMode: action.payload };

    case 'SET_SOUND_ENABLED':
      return { ...state, soundEnabled: action.payload };

    case 'SET_ANIMATIONS_ENABLED':
      return { ...state, animationsEnabled: action.payload };

    case 'SET_SHOW_HINTS':
      return { ...state, showHints: action.payload };

    case 'RESET_TO_DEFAULTS':
      return { ...DEFAULT_SETTINGS };

    default:
      return state;
  }
}

/** Context value interface */
interface SettingsContextValue {
  settings: SettingsState;
  setN: (n: number) => void;
  setBotLeniency: (leniency: number) => void;
  setCollapseMode: (mode: CollapseMode) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setShowHints: (show: boolean) => void;
  resetToDefaults: () => void;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  numGames: number;
  numSurvivors: number;
}

/** Create context */
const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

/** Settings provider component */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, DEFAULT_SETTINGS);

  const setN = useCallback((n: number) => {
    dispatch({ type: 'SET_N', payload: n });
  }, []);

  const setBotLeniency = useCallback((leniency: number) => {
    dispatch({ type: 'SET_BOT_LENIENCY', payload: leniency });
  }, []);

  const setCollapseMode = useCallback((mode: CollapseMode) => {
    dispatch({ type: 'SET_COLLAPSE_MODE', payload: mode });
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_SOUND_ENABLED', payload: enabled });
  }, []);

  const setAnimationsEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_ANIMATIONS_ENABLED', payload: enabled });
  }, []);

  const setShowHints = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_HINTS', payload: show });
  }, []);

  const resetToDefaults = useCallback(() => {
    dispatch({ type: 'RESET_TO_DEFAULTS' });
  }, []);

  const updateSetting = useCallback(<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    switch (key) {
      case 'n':
        dispatch({ type: 'SET_N', payload: value as number });
        break;
      case 'botLeniency':
        dispatch({ type: 'SET_BOT_LENIENCY', payload: value as number });
        break;
      case 'collapseMode':
        dispatch({ type: 'SET_COLLAPSE_MODE', payload: value as CollapseMode });
        break;
      case 'soundEnabled':
        dispatch({ type: 'SET_SOUND_ENABLED', payload: value as boolean });
        break;
      case 'animationsEnabled':
        dispatch({ type: 'SET_ANIMATIONS_ENABLED', payload: value as boolean });
        break;
      case 'showHints':
        dispatch({ type: 'SET_SHOW_HINTS', payload: value as boolean });
        break;
    }
  }, []);

  const numGames = Math.pow(2, settings.n);
  const numSurvivors = Math.pow(2, settings.n - 1);

  const value: SettingsContextValue = {
    settings,
    setN,
    setBotLeniency,
    setCollapseMode,
    setSoundEnabled,
    setAnimationsEnabled,
    setShowHints,
    resetToDefaults,
    updateSetting,
    numGames,
    numSurvivors,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

/** Hook to use settings context */
export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export default SettingsContext;
