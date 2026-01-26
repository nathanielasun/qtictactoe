/**
 * Circuit Canvas Component
 * Displays quantum circuit with qubit wires and placed gates.
 */

import { useCallback, useMemo } from 'react';
import {
  GateInstance,
  GateType,
  GATE_DEFINITIONS,
  CircuitState,
  formatAngle,
} from '@/types/quantum';
import { Trash2, X } from 'lucide-react';

interface CircuitCanvasProps {
  circuit: CircuitState;
  selectedGate: GateType | null;
  pendingControl: number | null;
  onQubitClick: (qubitIndex: number) => void;
  onGateRemove: (gateId: string) => void;
  onClearCircuit: () => void;
  disabled?: boolean;
}

/** Gate block displayed on the circuit */
interface GateBlockProps {
  gate: GateInstance;
  onRemove: () => void;
  disabled?: boolean;
}

function GateBlock({ gate, onRemove, disabled }: GateBlockProps) {
  const definition = GATE_DEFINITIONS[gate.type];
  const isTwoQubit = definition.numQubits === 2;

  // Calculate positioning for two-qubit gates
  const controlY = gate.control !== undefined ? gate.control : 0;
  const targetY = gate.target;
  const minY = Math.min(controlY, targetY);
  const maxY = Math.max(controlY, targetY);
  const span = maxY - minY;

  return (
    <div
      className={`gate-block ${isTwoQubit ? 'two-qubit' : ''}`}
      style={{
        '--gate-color': definition.color,
        '--gate-col': gate.column ?? 0,
        '--gate-y': gate.target,
        '--control-y': gate.control ?? 0,
        '--span': span,
        '--min-y': minY,
      } as React.CSSProperties}
    >
      {/* Control-target line for two-qubit gates */}
      {isTwoQubit && gate.control !== undefined && (
        <div
          className="gate-connection"
          style={{
            '--span': span,
            // If control is above target, offset line upward; if below, offset downward
            '--conn-offset': gate.control < gate.target
              ? -(span * 44 - 18) // Line goes up from center
              : -18, // Line goes down from center
          } as React.CSSProperties}
        />
      )}

      {/* Control dot for controlled gates */}
      {gate.control !== undefined && gate.type !== 'SWAP' && (
        <div
          className="control-dot"
          style={{
            '--offset': (gate.control - gate.target) * 44,
          } as React.CSSProperties}
        />
      )}

      {/* SWAP symbol for control qubit */}
      {gate.type === 'SWAP' && gate.control !== undefined && (
        <div
          className="swap-x control-swap"
          style={{
            '--offset': (gate.control - gate.target) * 44,
          } as React.CSSProperties}
        >
          <X size={16} />
        </div>
      )}

      {/* Gate symbol */}
      <div className="gate-body">
        <span className="gate-symbol">{definition.symbol}</span>
        {gate.angle !== undefined && (
          <span className="gate-angle">{formatAngle(gate.angle)}</span>
        )}
      </div>

      {/* SWAP symbol for target */}
      {gate.type === 'SWAP' && (
        <div className="swap-x target-swap">
          <X size={16} />
        </div>
      )}

      {/* Remove button */}
      {!disabled && (
        <button
          className="gate-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove gate"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

/**
 * Circuit Canvas - displays qubit wires and gates
 */
export function CircuitCanvas({
  circuit,
  selectedGate,
  pendingControl,
  onQubitClick,
  onGateRemove,
  onClearCircuit,
  disabled,
}: CircuitCanvasProps) {
  // Calculate circuit columns needed
  const maxColumn = useMemo(() => {
    if (circuit.gates.length === 0) return 3;
    return Math.max(
      ...circuit.gates.map((g) => (g.column ?? 0) + 1),
      4
    );
  }, [circuit.gates]);

  const handleQubitClick = useCallback(
    (qubitIndex: number) => {
      if (!disabled && selectedGate) {
        onQubitClick(qubitIndex);
      }
    },
    [disabled, selectedGate, onQubitClick]
  );

  // Get placement hint text
  const getHintText = () => {
    if (disabled) return '';
    if (!selectedGate) return 'Select a gate from the palette';
    const def = GATE_DEFINITIONS[selectedGate];
    if (def.numQubits === 2) {
      if (pendingControl === null) {
        return `Click to place ${def.name} control`;
      }
      return `Click target qubit for ${def.name}`;
    }
    return `Click to place ${def.name}`;
  };

  return (
    <div className={`circuit-canvas ${disabled ? 'disabled' : ''}`}>
      <div className="canvas-header">
        <h3 className="canvas-title">Circuit</h3>
        <div className="canvas-info">
          <span className="gate-count">{circuit.gates.length} gates</span>
          {circuit.gates.length > 0 && !disabled && (
            <button className="clear-button" onClick={onClearCircuit}>
              <Trash2 size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="placement-hint">{getHintText()}</div>

      <div
        className="circuit-grid"
        style={{
          '--num-qubits': circuit.numQubits,
          '--num-columns': maxColumn + 1,
        } as React.CSSProperties}
      >
        {/* Qubit labels */}
        <div className="qubit-labels">
          {Array.from({ length: circuit.numQubits }, (_, i) => (
            <div key={i} className="qubit-label">
              q<sub>{i}</sub>
            </div>
          ))}
        </div>

        {/* Circuit wires and gates */}
        <div className="circuit-wires">
          {Array.from({ length: circuit.numQubits }, (_, qubitIndex) => (
            <div
              key={qubitIndex}
              className={`qubit-wire ${selectedGate ? 'clickable' : ''} ${
                pendingControl === qubitIndex ? 'control-selected' : ''
              }`}
              onClick={() => handleQubitClick(qubitIndex)}
            >
              {/* Initial state */}
              <span className="initial-state">|0⟩</span>

              {/* Wire line */}
              <div className="wire-line" />

              {/* Gate slots */}
              {Array.from({ length: maxColumn }, (_, col) => (
                <div key={col} className="gate-slot" data-col={col} />
              ))}
            </div>
          ))}

          {/* Placed gates */}
          {circuit.gates.map((gate) => (
            <GateBlock
              key={gate.id}
              gate={gate}
              onRemove={() => onGateRemove(gate.id)}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Measurement symbols */}
        <div className="measurement-column">
          {Array.from({ length: circuit.numQubits }, (_, i) => (
            <div key={i} className="measurement-symbol">
              <svg viewBox="0 0 32 32" width="28" height="28">
                <path
                  d="M4 24 L16 8 L28 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="16" cy="24" r="3" fill="currentColor" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CircuitCanvas;
