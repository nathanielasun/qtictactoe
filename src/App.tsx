/**
 * Main Application Component
 * Quantum Tic-Tac-Toe game root component.
 */

import { useState, useCallback } from 'react';
import { GameProvider, useGameContext } from '@/context/GameContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { Button, Card, CardHeader, CardTitle, CardContent, Slider, Modal, Input } from '@/components/shared';
import { Play, Zap, Trophy, HelpCircle, RotateCcw } from 'lucide-react';
import { getBotMoveRealistic } from '@/utils/botLogic';
import { applyMoveToGame } from '@/utils/gameLogic';
import { simulateRandomCollapses } from '@/utils/collapseLogic';
import type { TicTacToeGame, CollapseMode } from '@/types';
import './styles/index.css';

/**
 * Setup Screen Component
 * Player enters name and configures game settings.
 */
function SetupScreen() {
  const { startGame, setPlayerName } = useGameContext();
  const { settings, updateSetting, numSurvivors } = useSettings();
  const [playerName, setPlayerNameLocal] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleStartGame = useCallback(() => {
    const name = playerName.trim() || 'Player';
    setPlayerName(name);
    startGame(settings.n, settings.botLeniency, settings.collapseMode);
  }, [startGame, setPlayerName, playerName, settings.n, settings.botLeniency, settings.collapseMode]);

  const numGames = Math.pow(2, settings.n);

  return (
    <div className="setup-screen">
      <div className="setup-container">
        <header className="setup-header">
          <h1 className="setup-title">
            <Zap className="title-icon" />
            Quantum Tic-Tac-Toe
          </h1>
          <p className="setup-subtitle">
            Play multiple games simultaneously, then use quantum mechanics to collapse your fate!
          </p>
        </header>

        <Card variant="elevated" padding="lg" className="setup-card">
          <CardHeader>
            <CardTitle>Game Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="setup-form">
              <Input
                label="Player Name"
                value={playerName}
                onChange={(e) => setPlayerNameLocal(e.target.value)}
                placeholder="Enter your name"
                helperText="This will appear on the leaderboard"
              />

              <div className="setup-divider" />

              <Slider
                label="Number of Qubits (n)"
                value={settings.n}
                min={1}
                max={6}
                step={1}
                onChange={(value) => updateSetting('n', value)}
                valueFormatter={(v) => `${v} (${Math.pow(2, v)} games)`}
                marks={[
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                  { value: 4, label: '4' },
                  { value: 5, label: '5' },
                  { value: 6, label: '6' },
                ]}
              />

              <div className="game-count-preview">
                <span className="preview-label">Games to play:</span>
                <span className="preview-value">{numGames}</span>
              </div>

              <Slider
                label="Bot Leniency"
                value={settings.botLeniency}
                min={0}
                max={100}
                step={5}
                onChange={(value) => updateSetting('botLeniency', value)}
                valueFormatter={(v) => `${v}%`}
              />

              <p className="leniency-hint">
                {settings.botLeniency === 0
                  ? 'Perfect play - the bot will never make mistakes'
                  : settings.botLeniency < 30
                  ? 'Hard difficulty - occasional suboptimal moves'
                  : settings.botLeniency < 60
                  ? 'Medium difficulty - balanced gameplay'
                  : settings.botLeniency < 90
                  ? 'Easy difficulty - frequent mistakes'
                  : 'Very easy - almost random play'}
              </p>

              <div className="setup-divider" />

              <div className="collapse-mode-selector">
                <label className="selector-label">Collapse Mode</label>
                <div className="mode-buttons">
                  <button
                    className={`mode-button ${settings.collapseMode === 'easy' ? 'active' : ''}`}
                    onClick={() => updateSetting('collapseMode', 'easy' as CollapseMode)}
                  >
                    <strong>Easy</strong>
                    <span>{numSurvivors} separate collapses</span>
                  </button>
                  <button
                    className={`mode-button ${settings.collapseMode === 'hard' ? 'active' : ''}`}
                    onClick={() => updateSetting('collapseMode', 'hard' as CollapseMode)}
                  >
                    <strong>Hard</strong>
                    <span>Top {numSurvivors} states survive</span>
                  </button>
                </div>
                <p className="mode-hint">
                  {settings.collapseMode === 'easy'
                    ? `Each collapse selects one survivor, removed from the pool. Total ${numSurvivors} survivors.`
                    : `Single measurement - the ${numSurvivors} states with highest counts survive.`}
                </p>
              </div>

              <div className="score-range-preview">
                <span className="preview-label">Score range:</span>
                <span className="preview-value">
                  {-numSurvivors * 2} to +{numSurvivors * 2}
                </span>
              </div>

              <div className="setup-actions">
                <Button
                  variant="ghost"
                  onClick={() => setShowHelp(true)}
                  icon={<HelpCircle size={18} />}
                >
                  How to Play
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartGame}
                  icon={<Play size={20} />}
                >
                  Start Game
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Play"
        size="lg"
      >
        <div className="help-content">
          <section className="help-section">
            <h3>Game Overview</h3>
            <p>
              Quantum Tic-Tac-Toe combines classic tic-tac-toe with quantum computing concepts.
              You play multiple games simultaneously against a bot, then use a quantum circuit
              to determine which game outcome counts!
            </p>
          </section>

          <section className="help-section">
            <h3>Phase 1: Playing Games</h3>
            <p>
              Play 2<sup>n</sup> tic-tac-toe games. Each game has its own score:
            </p>
            <ul>
              <li><strong>Win:</strong> +2 points</li>
              <li><strong>Loss:</strong> -2 points</li>
              <li><strong>Draw:</strong> -1 point</li>
            </ul>
          </section>

          <section className="help-section">
            <h3>Phase 2: Quantum Circuit</h3>
            <p>
              After completing all games, you build a quantum circuit. Each game corresponds
              to a quantum state |0...0⟩ through |1...1⟩. Build your circuit to maximize
              the probability of measuring your best game's state!
            </p>
          </section>

          <section className="help-section">
            <h3>Phase 3: Measurement & Collapse</h3>
            <p>
              The circuit is measured multiple times. Half of your games survive the collapse!
            </p>
            <ul>
              <li><strong>Easy Mode:</strong> Multiple collapses, each selecting one survivor. Previously selected games are removed from the pool.</li>
              <li><strong>Hard Mode:</strong> Single measurement - the top half of states by count survive simultaneously.</li>
            </ul>
            <p>
              Create superpositions over your best games to maximize your chances of favorable outcomes!
            </p>
          </section>
        </div>
      </Modal>
    </div>
  );
}

/**
 * Game Phase Component
 * Displays the tic-tac-toe boards and game progress.
 */
function GamePhase() {
  const { state, setPhase, allGamesComplete } = useGameContext();

  const handleProceedToQuantum = useCallback(() => {
    setPhase('quantum');
  }, [setPhase]);

  return (
    <div className="game-phase">
      <header className="phase-header">
        <h2>Phase 1: Play Games</h2>
        <div className="phase-progress">
          <span className="progress-text">
            {state.games.filter((g: TicTacToeGame) => g.status !== 'playing').length} / {state.games.length} complete
          </span>
        </div>
      </header>

      <div className="games-grid">
        {state.games.map((game: TicTacToeGame) => (
          <GameBoard key={game.id} game={game} />
        ))}
      </div>

      {allGamesComplete && (
        <div className="phase-complete">
          <Card variant="elevated" padding="md">
            <div className="complete-content">
              <h3>All Games Complete!</h3>
              <p>
                Now build your quantum circuit to select which game outcome counts.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={handleProceedToQuantum}
                icon={<Zap size={20} />}
              >
                Build Quantum Circuit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Game Board Component
 */
function GameBoard({ game }: { game: TicTacToeGame }) {
  const { updateGame } = useGameContext();
  const { settings } = useSettings();

  const handleCellClick = useCallback((cellIndex: number) => {
    if (game.status !== 'playing' || game.currentPlayer !== 'X' || game.board[cellIndex]) {
      return;
    }

    // Player move
    let updatedGame = applyMoveToGame(game, cellIndex, 'X');
    updateGame(game.id, updatedGame);

    // Bot move (if game still ongoing)
    if (updatedGame.status === 'playing') {
      setTimeout(() => {
        const botMove = getBotMoveRealistic(
          updatedGame.board,
          { leniency: settings.botLeniency },
          'O'
        );
        updatedGame = applyMoveToGame(updatedGame, botMove, 'O');
        updateGame(game.id, updatedGame);
      }, 300);
    }
  }, [game, updateGame, settings.botLeniency]);

  const statusClass = game.status === 'won' ? 'game-won' : game.status === 'lost' ? 'game-lost' : game.status === 'draw' ? 'game-draw' : '';

  return (
    <div className={`game-board-container ${statusClass}`}>
      <div className="game-board-header">
        <span className="game-id">Game {game.id}</span>
        <span className={`game-status status-${game.status}`}>
          {game.status === 'playing' ? 'In Progress' :
           game.status === 'won' ? 'Won (+2)' :
           game.status === 'lost' ? 'Lost (-2)' : 'Draw (-1)'}
        </span>
      </div>
      <div className="game-board">
        {game.board.map((cell, index) => (
          <button
            key={index}
            className={`cell ${cell ? `cell-${cell.toLowerCase()}` : ''} ${
              game.winningCells?.includes(index) ? 'cell-winner' : ''
            }`}
            onClick={() => handleCellClick(index)}
            disabled={game.status !== 'playing' || game.currentPlayer !== 'X' || !!cell}
          >
            {cell}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Circuit Building Phase Component
 * Placeholder for the quantum circuit builder.
 */
function QuantumPhase() {
  const { state, applyCollapseResults } = useGameContext();
  const { settings, numSurvivors } = useSettings();

  const handleExecuteCircuit = useCallback(() => {
    // For now, simulate random collapses
    // In the full implementation, this would use the actual quantum circuit
    const results = simulateRandomCollapses(state.games, state.n, state.collapseMode);
    applyCollapseResults(results);
  }, [state.games, state.n, state.collapseMode, applyCollapseResults]);

  return (
    <div className="circuit-phase">
      <header className="phase-header">
        <h2>Phase 2: Build Quantum Circuit</h2>
        <p>
          Add gates to your circuit to maximize the probability of your best outcomes.
          <br />
          <strong>{numSurvivors} games</strong> will survive the collapse in <strong>{state.collapseMode}</strong> mode.
        </p>
      </header>

      <Card variant="elevated" padding="lg" className="circuit-placeholder">
        <div className="placeholder-content">
          <Zap size={64} className="placeholder-icon" />
          <h3>Circuit Builder Coming Soon</h3>
          <p>
            The full quantum circuit builder with drag-and-drop gates is under development.
            For now, click below to run a random measurement simulation.
          </p>
          <div className="mode-info">
            <strong>{state.collapseMode === 'easy' ? 'Easy Mode' : 'Hard Mode'}:</strong>{' '}
            {state.collapseMode === 'easy'
              ? `${numSurvivors} iterative collapses, each removing the selected game from the pool.`
              : `Single measurement - top ${numSurvivors} states by count survive.`}
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleExecuteCircuit}
            icon={<Play size={20} />}
          >
            Execute {state.collapseMode === 'easy' ? `${numSurvivors} Collapses` : 'Measurement'}
          </Button>
        </div>
      </Card>

      <div className="games-summary">
        <h3>Your Games Summary</h3>
        <p className="summary-hint">
          Build a circuit targeting your {numSurvivors} best games to maximize your score!
        </p>
        <div className="summary-grid">
          {state.games
            .map((game: TicTacToeGame) => ({
              game,
              points: game.status === 'won' ? 2 : game.status === 'lost' ? -2 : -1,
            }))
            .sort((a, b) => b.points - a.points)
            .map(({ game, points }) => (
              <div key={game.id} className={`summary-item status-${game.status}`}>
                <span className="summary-label">Game {game.id}</span>
                <span className="summary-state">|{game.id.toString(2).padStart(settings.n, '0')}⟩</span>
                <span className="summary-score">
                  {points > 0 ? '+' : ''}{points}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Results Phase Component
 * Shows the measurement outcome and final score.
 */
function ResultsPhase() {
  const { state, resetGame } = useGameContext();
  const { settings, numSurvivors } = useSettings();

  const handlePlayAgain = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const collapseResults = state.collapseResults;
  const finalScore = collapseResults?.finalScore ?? 0;
  const breakdown = collapseResults?.breakdown;

  return (
    <div className="results-phase">
      <header className="phase-header">
        <h2>Phase 3: Results</h2>
      </header>

      <Card variant="elevated" padding="lg" className="results-card">
        <div className="results-content">
          <Trophy size={80} className="results-icon" />

          <h3 className="results-title">Quantum Collapse Complete!</h3>

          <div className="collapse-mode-badge">
            {state.collapseMode === 'easy' ? 'Easy Mode' : 'Hard Mode'}
          </div>

          <div className="survivors-announcement">
            <span className="survivors-label">{numSurvivors} Surviving Games:</span>
            <div className="survivors-list">
              {state.survivorGames.map((id) => {
                const game = state.games.find((g: TicTacToeGame) => g.id === id);
                const points = game?.status === 'won' ? 2 : game?.status === 'lost' ? -2 : -1;
                return (
                  <span key={id} className={`survivor-chip status-${game?.status}`}>
                    Game {id} (|{id.toString(2).padStart(settings.n, '0')}⟩)
                    <span className="chip-score">{points > 0 ? '+' : ''}{points}</span>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="final-score">
            <span className="score-label">Final Score:</span>
            <span className={`score-value ${finalScore > 0 ? 'positive' : finalScore < 0 ? 'negative' : ''}`}>
              {finalScore > 0 ? '+' : ''}{finalScore}
            </span>
          </div>

          {breakdown && (
            <div className="score-breakdown">
              <h4>Score Breakdown</h4>
              <div className="breakdown-stats">
                {breakdown.wins.count > 0 && (
                  <div className="breakdown-stat positive">
                    <span className="stat-count">{breakdown.wins.count}× Wins</span>
                    <span className="stat-points">+{breakdown.wins.points}</span>
                  </div>
                )}
                {breakdown.losses.count > 0 && (
                  <div className="breakdown-stat negative">
                    <span className="stat-count">{breakdown.losses.count}× Losses</span>
                    <span className="stat-points">{breakdown.losses.points}</span>
                  </div>
                )}
                {breakdown.draws.count > 0 && (
                  <div className="breakdown-stat">
                    <span className="stat-count">{breakdown.draws.count}× Draws</span>
                    <span className="stat-points">{breakdown.draws.points}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="results-breakdown">
            <h4>All Games</h4>
            <div className="breakdown-grid">
              {state.games.map((game: TicTacToeGame) => {
                const isSurvivor = state.survivorGames.includes(game.id);
                return (
                  <div
                    key={game.id}
                    className={`breakdown-item ${isSurvivor ? 'survivor' : 'eliminated'}`}
                  >
                    <span className="item-label">Game {game.id}</span>
                    <span className="item-state">|{game.id.toString(2).padStart(settings.n, '0')}⟩</span>
                    <span className={`item-status status-${game.status}`}>
                      {game.status === 'won' ? 'Won' : game.status === 'lost' ? 'Lost' : 'Draw'}
                    </span>
                    <span className="item-score">
                      {game.status === 'won' ? '+2' : game.status === 'lost' ? '-2' : '-1'}
                    </span>
                    {isSurvivor && <span className="survivor-badge">SURVIVOR</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handlePlayAgain}
            icon={<RotateCcw size={20} />}
          >
            Play Again
          </Button>
        </div>
      </Card>
    </div>
  );
}

/**
 * Main Game Router
 * Renders the appropriate phase based on game state.
 */
function GameRouter() {
  const { state } = useGameContext();

  switch (state.phase) {
    case 'setup':
      return <SetupScreen />;
    case 'playing':
      return <GamePhase />;
    case 'quantum':
      return <QuantumPhase />;
    case 'results':
      return <ResultsPhase />;
    default:
      return <SetupScreen />;
  }
}

/**
 * Main App Component
 */
export default function App() {
  return (
    <SettingsProvider>
      <GameProvider>
        <div className="app">
          <GameRouter />
        </div>
      </GameProvider>
    </SettingsProvider>
  );
}
