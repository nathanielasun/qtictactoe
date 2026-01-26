/**
 * Preset Selector Component
 * Provides preset circuit configurations for beginners.
 */

import { useCallback, useMemo } from 'react';
import { GateInstance, generateGateId, GateType } from '@/types/quantum';
import { TicTacToeGame } from '@/types';
import { Wand2, Target, Shuffle, Link2, Atom } from 'lucide-react';

interface PresetSelectorProps {
  numQubits: number;
  games: TicTacToeGame[];
  onSelectPreset: (gates: GateInstance[]) => void;
  disabled?: boolean;
}

interface PresetDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  buildGates: (n: number, targetIndex?: number) => GateInstance[];
  requiresTarget?: boolean;
}

/** Available preset circuits */
const PRESETS: PresetDefinition[] = [
  {
    id: 'select-zero',
    name: 'Game 0',
    description: 'Select |00...0⟩ (no gates needed)',
    icon: <Target size={16} />,
    buildGates: () => [],
  },
  {
    id: 'select-max',
    name: 'Last Game',
    description: 'Select |11...1⟩ with X gates',
    icon: <Target size={16} />,
    buildGates: (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        id: generateGateId(),
        type: 'X' as GateType,
        target: i,
        column: 0,
      })),
  },
  {
    id: 'uniform',
    name: 'Equal Chance',
    description: 'All games equally likely (H gates)',
    icon: <Shuffle size={16} />,
    buildGates: (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        id: generateGateId(),
        type: 'H' as GateType,
        target: i,
        column: 0,
      })),
  },
  {
    id: 'bell',
    name: 'Bell State',
    description: '50% game 0, 50% last game (entangled)',
    icon: <Link2 size={16} />,
    buildGates: (n: number) => {
      const gates: GateInstance[] = [
        { id: generateGateId(), type: 'H', target: 0, column: 0 },
      ];
      for (let i = 1; i < n; i++) {
        gates.push({
          id: generateGateId(),
          type: 'CNOT',
          control: i - 1,
          target: i,
          column: i,
        });
      }
      return gates;
    },
  },
  {
    id: 'select-best',
    name: 'Best Game',
    description: 'Auto-select your best scoring game',
    icon: <Wand2 size={16} />,
    buildGates: (n: number, targetIndex?: number) => {
      if (targetIndex === undefined) return [];
      const binary = targetIndex.toString(2).padStart(n, '0');
      return binary
        .split('')
        .map((_bit, i) => ({
          id: generateGateId(),
          type: 'X' as GateType,
          target: i,
          column: 0,
        }))
        .filter((_, i) => binary[i] === '1');
    },
    requiresTarget: true,
  },
];

/**
 * Preset Selector - provides quick circuit templates
 */
export function PresetSelector({
  numQubits,
  games,
  onSelectPreset,
  disabled,
}: PresetSelectorProps) {
  // Find best game for "select-best" preset
  const bestGame = useMemo(() => {
    let bestIdx = 0;
    let bestPoints = -Infinity;

    games.forEach((game, idx) => {
      const points = game.status === 'won' ? 2 : game.status === 'lost' ? -2 : -1;
      if (points > bestPoints) {
        bestPoints = points;
        bestIdx = idx;
      }
    });

    return { index: bestIdx, points: bestPoints };
  }, [games]);

  const handlePresetClick = useCallback(
    (preset: PresetDefinition) => {
      if (disabled) return;

      let gates: GateInstance[];
      if (preset.requiresTarget) {
        gates = preset.buildGates(numQubits, bestGame.index);
      } else {
        gates = preset.buildGates(numQubits);
      }

      onSelectPreset(gates);
    },
    [numQubits, bestGame.index, onSelectPreset, disabled]
  );

  return (
    <div className={`preset-selector ${disabled ? 'disabled' : ''}`}>
      <h4 className="preset-title">
        <Atom size={16} />
        Quick Presets
      </h4>

      <div className="preset-grid">
        {PRESETS.map((preset) => {
          let description = preset.description;
          if (preset.id === 'select-best') {
            description = `Select Game ${bestGame.index} (${bestGame.points > 0 ? '+' : ''}${bestGame.points} points)`;
          }
          if (preset.id === 'select-max') {
            const maxIndex = Math.pow(2, numQubits) - 1;
            const maxGame = games[maxIndex];
            const points = maxGame?.status === 'won' ? 2 : maxGame?.status === 'lost' ? -2 : -1;
            description = `Select Game ${maxIndex} (${points > 0 ? '+' : ''}${points} points)`;
          }

          return (
            <button
              key={preset.id}
              className="preset-button"
              onClick={() => handlePresetClick(preset)}
              disabled={disabled}
              title={description}
            >
              {preset.icon}
              <span className="preset-name">{preset.name}</span>
            </button>
          );
        })}
      </div>

      <div className="strategy-hint">
        <strong>Tip:</strong> Your best game is Game {bestGame.index} (
        |{bestGame.index.toString(2).padStart(numQubits, '0')}⟩) worth{' '}
        {bestGame.points > 0 ? '+' : ''}
        {bestGame.points} points.
      </div>
    </div>
  );
}

export default PresetSelector;
