/**
 * Main Application Component
 * Quantum Tic-Tac-Toe game root component.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameProvider, useGameContext } from '@/context/GameContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { LeaderboardProvider, useLeaderboard } from '@/context/LeaderboardContext';
import { Button, Card, CardHeader, CardTitle, CardContent, Slider, Modal, Input, ToastProvider } from '@/components/shared';
import { GatePalette, CircuitCanvas, HistogramDisplay, PresetSelector, AngleInput } from '@/components/quantum';
import { Header, SettingsModal, Leaderboard } from '@/components/layout';
import { Play, Zap, Trophy, HelpCircle, RotateCcw, Loader2, Award } from 'lucide-react';
import { getBotMoveRealistic } from '@/utils/botLogic';
import { applyMoveToGame } from '@/utils/gameLogic';
import { executeEasyModeCollapses, executeHardModeCollapse } from '@/utils/collapseLogic';
import { executeCircuit, executeMultipleMeasurements } from '@/lib/quantum';
import type { TicTacToeGame, CollapseMode, MeasurementResults, GateInstance, GateType, CircuitState } from '@/types';
import { GATE_DEFINITIONS, generateGateId, createEmptyCircuit } from '@/types/quantum';
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);

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
                  onClick={() => setShowLeaderboard(true)}
                  icon={<Trophy size={18} />}
                >
                  Leaderboard
                </Button>
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

      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
}

/**
 * Game Phase Component
 * Displays the tic-tac-toe boards and game progress.
 */
function GamePhase() {
  const { state, setPhase, allGamesComplete, updateGame, gameDuration } = useGameContext();
  const { settings } = useSettings();
  const [botThinking, setBotThinking] = useState(false);
  const [, setTick] = useState(0);

  // Update timer every second while playing
  useEffect(() => {
    if (!allGamesComplete) {
      const interval = setInterval(() => {
        setTick((t) => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [allGamesComplete]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProceedToQuantum = useCallback(() => {
    setPhase('quantum');
  }, [setPhase]);

  // Handle bot move in a specific game - takes the current game state directly
  const handleBotMoveInGame = useCallback((gameAfterPlayerMove: TicTacToeGame) => {
    if (gameAfterPlayerMove.status !== 'playing' || gameAfterPlayerMove.currentPlayer !== 'O') {
      return;
    }

    setBotThinking(true);

    setTimeout(() => {
      const botMove = getBotMoveRealistic(
        gameAfterPlayerMove.board,
        { leniency: settings.botLeniency },
        'O'
      );
      const updatedGame = applyMoveToGame(gameAfterPlayerMove, botMove, 'O');
      updateGame(gameAfterPlayerMove.id, updatedGame);
      setBotThinking(false);
    }, 300);
  }, [settings.botLeniency, updateGame]);

  // Handle player move - only updates the specific game, then triggers bot move in that game
  const handlePlayerMove = useCallback((gameId: number, cellIndex: number) => {
    const game = state.games.find((g: TicTacToeGame) => g.id === gameId);
    if (!game || game.status !== 'playing' || game.currentPlayer !== 'X' || game.board[cellIndex]) {
      return;
    }

    // Apply player move
    const gameAfterPlayerMove = applyMoveToGame(game, cellIndex, 'X');
    updateGame(gameId, gameAfterPlayerMove);

    // Only trigger bot move in this specific game if the game is still playing
    if (gameAfterPlayerMove.status === 'playing') {
      handleBotMoveInGame(gameAfterPlayerMove);
    }
  }, [state.games, updateGame, handleBotMoveInGame]);

  return (
    <div className="game-phase">
      <header className="phase-header">
        <h2>Phase 1: Play Games</h2>
        <div className="phase-progress">
          <span className="progress-text">
            {state.games.filter((g: TicTacToeGame) => g.status !== 'playing').length} / {state.games.length} complete
          </span>
          <span className="game-timer">{formatDuration(gameDuration)}</span>
          {botThinking && <span className="bot-thinking">Bot thinking...</span>}
        </div>
      </header>

      <div className="games-grid">
        {state.games.map((game: TicTacToeGame) => (
          <GameBoard
            key={game.id}
            game={game}
            onPlayerMove={handlePlayerMove}
            disabled={botThinking}
          />
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
interface GameBoardProps {
  game: TicTacToeGame;
  onPlayerMove: (gameId: number, cellIndex: number) => void;
  disabled?: boolean;
}

function GameBoard({ game, onPlayerMove, disabled = false }: GameBoardProps) {
  const handleCellClick = useCallback((cellIndex: number) => {
    if (disabled || game.status !== 'playing' || game.currentPlayer !== 'X' || game.board[cellIndex]) {
      return;
    }
    onPlayerMove(game.id, cellIndex);
  }, [game, onPlayerMove, disabled]);

  const statusClass = game.status === 'won' ? 'game-won' : game.status === 'lost' ? 'game-lost' : game.status === 'draw' ? 'game-draw' : '';
  const waitingForBot = game.status === 'playing' && game.currentPlayer === 'O';

  // Get cell position label for accessibility
  const getCellLabel = (index: number, value: string | null) => {
    const row = Math.floor(index / 3) + 1;
    const col = (index % 3) + 1;
    if (value) {
      return `Row ${row}, Column ${col}: ${value}`;
    }
    return `Row ${row}, Column ${col}: Empty`;
  };

  // Get status message for screen readers
  const statusMessage = game.status === 'playing'
    ? waitingForBot
      ? 'Waiting for bot to play'
      : 'Your turn to play'
    : game.status === 'won'
    ? 'You won! Plus 2 points'
    : game.status === 'lost'
    ? 'You lost. Minus 2 points'
    : 'Draw. Minus 1 point';

  return (
    <div
      className={`game-board-container ${statusClass} ${waitingForBot ? 'waiting-for-bot' : ''}`}
      role="region"
      aria-label={`Tic-tac-toe game ${game.id}`}
    >
      <div className="game-board-header">
        <span className="game-id" aria-hidden="true">Game {game.id}</span>
        <span
          id={`game-${game.id}-status`}
          className={`game-status status-${game.status}`}
          role="status"
          aria-live="polite"
        >
          {game.status === 'playing'
            ? waitingForBot
              ? 'Bot turn...'
              : 'Your turn'
            : game.status === 'won'
            ? 'Won (+2)'
            : game.status === 'lost'
            ? 'Lost (-2)'
            : 'Draw (-1)'}
        </span>
        {/* Hidden status for screen readers */}
        <span className="sr-only" aria-live="polite">{statusMessage}</span>
      </div>
      <div
        className="game-board"
        role="grid"
        aria-label={`Game ${game.id} board`}
        aria-describedby={`game-${game.id}-status`}
      >
        {game.board.map((cell, index) => (
          <button
            key={index}
            role="gridcell"
            className={`cell ${cell ? `cell-${cell.toLowerCase()}` : ''} ${
              game.winningCells?.includes(index) ? 'cell-winner' : ''
            }`}
            onClick={() => handleCellClick(index)}
            disabled={disabled || game.status !== 'playing' || game.currentPlayer !== 'X' || !!cell}
            aria-label={getCellLabel(index, cell)}
            aria-pressed={!!cell}
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
 * Full quantum circuit builder with gate palette and visualization.
 */
function QuantumPhase() {
  const { state, applyCollapseResults } = useGameContext();
  const { settings, numSurvivors } = useSettings();

  // Circuit state
  const [circuit, setCircuit] = useState<CircuitState>(() => createEmptyCircuit(state.n));
  const [selectedGate, setSelectedGate] = useState<GateType | null>(null);
  const [pendingControl, setPendingControl] = useState<number | null>(null);

  // Angle input state
  const [angleInputVisible, setAngleInputVisible] = useState(false);
  const [pendingAngleGate, setPendingAngleGate] = useState<{ type: GateType; target: number; control?: number } | null>(null);
  const [angleValue, setAngleValue] = useState(Math.PI / 2);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [measurementResults, setMeasurementResults] = useState<MeasurementResults | null>(null);

  // Calculate the next available column for a gate involving specific qubits
  const getNextAvailableColumn = useCallback((involvedQubits: number[]): number => {
    if (circuit.gates.length === 0) return 0;

    // For each involved qubit, find the maximum column that's occupied
    let maxOccupiedColumn = -1;
    for (const gate of circuit.gates) {
      const gateQubits = [gate.target];
      if (gate.control !== undefined) {
        gateQubits.push(gate.control);
      }

      // Check if any of the gate's qubits overlap with our involved qubits
      const hasOverlap = gateQubits.some((q) => involvedQubits.includes(q));
      if (hasOverlap) {
        maxOccupiedColumn = Math.max(maxOccupiedColumn, gate.column ?? 0);
      }
    }

    // Place at the next column after the maximum occupied column
    return maxOccupiedColumn + 1;
  }, [circuit.gates]);

  // Handle gate selection from palette
  const handleGateSelect = useCallback((gateType: GateType) => {
    setSelectedGate(gateType);
    setPendingControl(null);
  }, []);

  // Handle qubit wire click - place gate
  const handleQubitClick = useCallback(
    (qubitIndex: number) => {
      if (!selectedGate) return;

      const gateDef = GATE_DEFINITIONS[selectedGate];

      // Handle two-qubit gates
      if (gateDef.numQubits === 2) {
        if (pendingControl === null) {
          // First click sets control
          setPendingControl(qubitIndex);
          return;
        } else if (pendingControl === qubitIndex) {
          // Same qubit - cancel
          setPendingControl(null);
          return;
        }
        // Second click sets target
      }

      // Check if gate needs angle
      if (gateDef.hasAngle) {
        setPendingAngleGate({
          type: selectedGate,
          target: qubitIndex,
          control: gateDef.numQubits === 2 ? pendingControl ?? undefined : undefined,
        });
        setAngleInputVisible(true);
        setPendingControl(null);
        return;
      }

      // Determine which qubits this gate involves
      const involvedQubits = [qubitIndex];
      if (gateDef.numQubits === 2 && pendingControl !== null) {
        involvedQubits.push(pendingControl);
      }

      // Find the next available column for these qubits
      const gateColumn = getNextAvailableColumn(involvedQubits);

      // Create the gate
      const newGate: GateInstance = {
        id: generateGateId(),
        type: selectedGate,
        target: qubitIndex,
        column: gateColumn,
      };

      if (gateDef.numQubits === 2 && pendingControl !== null) {
        newGate.control = pendingControl;
      }

      setCircuit((prev) => ({
        ...prev,
        gates: [...prev.gates, newGate],
      }));

      setPendingControl(null);
      setMeasurementResults(null); // Clear previous results
    },
    [selectedGate, pendingControl, getNextAvailableColumn]
  );

  // Handle angle confirmation
  const handleAngleConfirm = useCallback(() => {
    if (!pendingAngleGate) return;

    // Determine which qubits this gate involves
    const involvedQubits = [pendingAngleGate.target];
    if (pendingAngleGate.control !== undefined) {
      involvedQubits.push(pendingAngleGate.control);
    }

    // Find the next available column for these qubits
    const gateColumn = getNextAvailableColumn(involvedQubits);

    const newGate: GateInstance = {
      id: generateGateId(),
      type: pendingAngleGate.type,
      target: pendingAngleGate.target,
      angle: angleValue,
      column: gateColumn,
    };

    if (pendingAngleGate.control !== undefined) {
      newGate.control = pendingAngleGate.control;
    }

    setCircuit((prev) => ({
      ...prev,
      gates: [...prev.gates, newGate],
    }));

    setAngleInputVisible(false);
    setPendingAngleGate(null);
    setAngleValue(Math.PI / 2);
    setMeasurementResults(null);
  }, [pendingAngleGate, angleValue, getNextAvailableColumn]);

  // Handle angle cancel
  const handleAngleCancel = useCallback(() => {
    setAngleInputVisible(false);
    setPendingAngleGate(null);
    setAngleValue(Math.PI / 2);
  }, []);

  // Handle gate removal
  const handleGateRemove = useCallback((gateId: string) => {
    setCircuit((prev) => ({
      ...prev,
      gates: prev.gates.filter((g) => g.id !== gateId),
    }));
    setMeasurementResults(null);
  }, []);

  // Handle circuit clear
  const handleClearCircuit = useCallback(() => {
    setCircuit(createEmptyCircuit(state.n));
    setMeasurementResults(null);
  }, [state.n]);

  // Handle preset selection
  const handlePresetSelect = useCallback((gates: GateInstance[]) => {
    setCircuit({
      numQubits: state.n,
      gates,
    });
    setMeasurementResults(null);
    setSelectedGate(null);
    setPendingControl(null);
  }, [state.n]);

  // Execute circuit
  const handleExecuteCircuit = useCallback(async () => {
    setIsExecuting(true);

    try {
      const shots = 1024;

      if (state.collapseMode === 'easy') {
        // Easy mode: multiple independent measurements
        // Execute all measurements first (need synchronous access for executeEasyModeCollapses)
        const numMeasurements = numSurvivors;
        const measurements = await executeMultipleMeasurements(
          circuit.gates,
          state.n,
          numMeasurements,
          shots
        );

        let measurementIndex = 0;
        const syncMeasurementFn = () => {
          const counts = measurements[measurementIndex] || {};
          measurementIndex++;
          return counts;
        };

        const results = executeEasyModeCollapses(
          syncMeasurementFn,
          state.games,
          state.n,
          shots
        );

        // Get final measurement for display
        const finalResult = await executeCircuit(circuit.gates, state.n, shots);
        setMeasurementResults(finalResult);

        applyCollapseResults(results);
      } else {
        // Hard mode: single measurement
        const result = await executeCircuit(circuit.gates, state.n, shots);
        setMeasurementResults(result);

        const collapseResults = executeHardModeCollapse(
          result.counts,
          state.games,
          state.n,
          shots
        );

        applyCollapseResults(collapseResults);
      }
    } catch (error) {
      console.error('Circuit execution failed:', error);
      // Could show error to user here
    } finally {
      setIsExecuting(false);
    }
  }, [circuit.gates, state.n, state.games, state.collapseMode, numSurvivors, applyCollapseResults]);

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

      <div className="circuit-builder">
        {/* Left: Gate Palette */}
        <aside className="circuit-sidebar">
          <GatePalette
            onGateSelect={handleGateSelect}
            selectedGate={selectedGate}
            disabled={isExecuting}
          />

          <PresetSelector
            numQubits={state.n}
            games={state.games}
            onSelectPreset={handlePresetSelect}
            disabled={isExecuting}
          />
        </aside>

        {/* Center: Circuit Canvas */}
        <main className="circuit-main">
          <CircuitCanvas
            circuit={circuit}
            selectedGate={selectedGate}
            pendingControl={pendingControl}
            onQubitClick={handleQubitClick}
            onGateRemove={handleGateRemove}
            onClearCircuit={handleClearCircuit}
            disabled={isExecuting}
          />

          <div className="execute-section">
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
              disabled={isExecuting}
              icon={isExecuting ? <Loader2 size={20} className="spin" /> : <Play size={20} />}
            >
              {isExecuting
                ? 'Executing...'
                : `Execute ${state.collapseMode === 'easy' ? `${numSurvivors} Collapses` : 'Measurement'}`}
            </Button>
          </div>

          {measurementResults && (
            <HistogramDisplay
              results={measurementResults}
              games={state.games}
              n={state.n}
            />
          )}
        </main>

        {/* Right: Game Summary */}
        <aside className="games-sidebar">
          <div className="games-summary-compact">
            <h3>Games Summary</h3>
            <div className="summary-list">
              {state.games
                .map((game: TicTacToeGame) => ({
                  game,
                  points: game.status === 'won' ? 2 : game.status === 'lost' ? -2 : -1,
                }))
                .sort((a, b) => b.points - a.points)
                .map(({ game, points }) => (
                  <div key={game.id} className={`summary-item status-${game.status}`}>
                    <span className="summary-label">G{game.id}</span>
                    <span className="summary-state">|{game.id.toString(2).padStart(settings.n, '0')}⟩</span>
                    <span className="summary-score">
                      {points > 0 ? '+' : ''}{points}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Angle Input Modal */}
      {angleInputVisible && pendingAngleGate && (
        <AngleInput
          value={angleValue}
          onChange={setAngleValue}
          onConfirm={handleAngleConfirm}
          onCancel={handleAngleCancel}
          gateName={GATE_DEFINITIONS[pendingAngleGate.type].name}
        />
      )}
    </div>
  );
}

/**
 * Results Phase Component
 * Shows the measurement outcome and final score.
 */
function ResultsPhase() {
  const { state, resetGame, gameDuration } = useGameContext();
  const { addEntry, getRankForScore } = useLeaderboard();
  const hasSubmittedRef = useRef(false);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const { settings, numSurvivors } = useSettings();

  // Submit score to leaderboard on mount
  useEffect(() => {
    if (hasSubmittedRef.current || !state.collapseResults) return;
    hasSubmittedRef.current = true;

    const finalScore = state.collapseResults.finalScore;
    const breakdown = state.collapseResults.breakdown;

    // Calculate raw score from all games (before collapse)
    const rawScore = state.games.reduce((sum: number, game: TicTacToeGame) => {
      if (game.status === 'won') return sum + 2;
      if (game.status === 'lost') return sum - 2;
      if (game.status === 'draw') return sum - 1;
      return sum;
    }, 0);

    // Submit to leaderboard
    addEntry(
      state.playerName || 'Player',
      finalScore,
      state.n,
      settings.botLeniency,
      state.collapseMode,
      breakdown?.wins.count ?? 0,
      breakdown?.losses.count ?? 0,
      breakdown?.draws.count ?? 0,
      rawScore,
      state.survivorGames,
      gameDuration
    );

    // Get rank for display
    const rank = getRankForScore(finalScore);
    setSubmittedRank(rank);
  }, [state.collapseResults, state.games, state.playerName, state.n, state.collapseMode, state.survivorGames, settings.botLeniency, gameDuration, addEntry, getRankForScore]);

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

          <div className="results-stats">
            <div className="final-score">
              <span className="score-label">Final Score:</span>
              <span className={`score-value ${finalScore > 0 ? 'positive' : finalScore < 0 ? 'negative' : ''}`}>
                {finalScore > 0 ? '+' : ''}{finalScore}
              </span>
            </div>
            <div className="game-duration-stat">
              <span className="score-label">Time:</span>
              <span className="duration-value">{formatDuration(gameDuration)}</span>
            </div>
            {submittedRank !== null && (
              <div className={`leaderboard-rank ${submittedRank <= 3 ? `rank-${submittedRank}` : ''}`}>
                <Award size={20} />
                <span>Rank #{submittedRank}</span>
              </div>
            )}
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
 * Help Modal Content Component
 * Reusable help content for the game.
 */
function HelpModalContent() {
  return (
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

      <section className="help-section">
        <h3>Keyboard Shortcuts</h3>
        <ul>
          <li><strong>Tab/Shift+Tab:</strong> Navigate between games and cells</li>
          <li><strong>Enter/Space:</strong> Place marker or confirm action</li>
          <li><strong>Escape:</strong> Cancel current operation</li>
        </ul>
      </section>
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
 * App Content with Header and Modals
 */
function AppContent() {
  const { state } = useGameContext();
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const isInGame = state.phase !== 'setup';

  return (
    <>
      {/* Skip link for keyboard accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Global Header - shown when in game */}
      {isInGame && (
        <Header
          onSettingsClick={() => setShowSettings(true)}
          onHelpClick={() => setShowHelp(true)}
          onLeaderboardClick={() => setShowLeaderboard(true)}
        />
      )}

      {/* Main content */}
      <main id="main-content" className="app-main">
        <GameRouter />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        disabled={isInGame}
      />

      {/* Help Modal */}
      <Modal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Play"
        size="lg"
      >
        <HelpModalContent />
      </Modal>

      {/* Leaderboard Modal */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </>
  );
}

/**
 * Main App Component
 */
export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <LeaderboardProvider>
          <GameProvider>
            <div className="app">
              <AppContent />
            </div>
          </GameProvider>
        </LeaderboardProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
