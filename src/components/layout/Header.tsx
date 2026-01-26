/**
 * Header Component
 * Global header with score display, phase indicator, settings, and help.
 */

import { useCallback } from 'react';
import { Zap, Settings, HelpCircle, Trophy } from 'lucide-react';
import { useGameContext } from '@/context/GameContext';
import { Button } from '@/components/shared';
import type { TicTacToeGame, GamePhase } from '@/types';

interface HeaderProps {
  onSettingsClick: () => void;
  onHelpClick: () => void;
  onLeaderboardClick: () => void;
}

const PHASE_LABELS: Record<GamePhase, string> = {
  setup: 'Setup',
  playing: 'Playing Games',
  quantum: 'Building Circuit',
  results: 'Results',
};

export function Header({ onSettingsClick, onHelpClick, onLeaderboardClick }: HeaderProps) {
  const { state, resetGame } = useGameContext();

  // Calculate current score from games
  const currentScore = state.games.reduce((sum: number, game: TicTacToeGame) => {
    if (game.status === 'won') return sum + 2;
    if (game.status === 'lost') return sum - 2;
    if (game.status === 'draw') return sum - 1;
    return sum;
  }, 0);

  // Calculate games progress
  const completedGames = state.games.filter((g: TicTacToeGame) => g.status !== 'playing').length;
  const totalGames = state.games.length;

  const handleHomeClick = useCallback(() => {
    if (state.phase !== 'setup') {
      if (window.confirm('Are you sure you want to quit the current game?')) {
        resetGame();
      }
    }
  }, [state.phase, resetGame]);

  const isInGame = state.phase !== 'setup';

  return (
    <header className="app-header" role="banner">
      <div className="header-content">
        {/* Logo and title */}
        <div className="header-brand">
          <button
            className="brand-button"
            onClick={handleHomeClick}
            aria-label={isInGame ? 'Return to setup (will end current game)' : 'Quantum Tic-Tac-Toe'}
          >
            <Zap className="brand-icon" aria-hidden="true" />
            <span className="brand-title">Quantum Tic-Tac-Toe</span>
          </button>
        </div>

        {/* Phase indicator and progress */}
        {isInGame && (
          <div className="header-center" role="status" aria-live="polite">
            <span className="phase-indicator">{PHASE_LABELS[state.phase]}</span>
            {state.phase === 'playing' && (
              <span className="progress-indicator">
                {completedGames} / {totalGames} games
              </span>
            )}
          </div>
        )}

        {/* Score and actions */}
        <div className="header-actions">
          {isInGame && (
            <div
              className={`score-display-compact ${
                currentScore > 0 ? 'positive' : currentScore < 0 ? 'negative' : 'neutral'
              }`}
              role="status"
              aria-label={`Current raw score: ${currentScore} points`}
            >
              <span className="score-label">Score</span>
              <span className="score-value">{currentScore > 0 ? '+' : ''}{currentScore}</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onLeaderboardClick}
            icon={<Trophy size={18} />}
            aria-label="View leaderboard"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onHelpClick}
            icon={<HelpCircle size={18} />}
            aria-label="How to play"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            icon={<Settings size={18} />}
            aria-label="Open settings"
          />
        </div>
      </div>
    </header>
  );
}

export default Header;
