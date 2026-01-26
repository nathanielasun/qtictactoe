/**
 * Gate Palette Component
 * Displays available quantum gates organized by category.
 */

import { useCallback } from 'react';
import { GATE_DEFINITIONS, GATE_CATEGORIES, GateType, GateDefinition } from '@/types/quantum';
import { Tooltip } from '@/components/shared';

interface GatePaletteProps {
  onGateSelect: (gateType: GateType) => void;
  selectedGate: GateType | null;
  disabled?: boolean;
}

/**
 * Individual gate button in the palette
 */
interface GateButtonProps {
  gate: GateDefinition;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function GateButton({ gate, isSelected, onClick, disabled }: GateButtonProps) {
  const tooltipContent = (
    <div className="gate-tooltip">
      <strong>{gate.name}</strong>
      <p>{gate.description}</p>
      {gate.hasAngle && <p className="tooltip-hint">Requires angle parameter</p>}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} delay={300}>
      <button
        className={`gate-button ${isSelected ? 'selected' : ''}`}
        style={{ '--gate-color': gate.color } as React.CSSProperties}
        onClick={onClick}
        disabled={disabled}
        aria-label={`${gate.name} gate`}
      >
        <span className="gate-symbol">{gate.symbol}</span>
      </button>
    </Tooltip>
  );
}

/**
 * Gate Palette - displays available gates by category
 */
export function GatePalette({ onGateSelect, selectedGate, disabled }: GatePaletteProps) {
  const handleGateClick = useCallback(
    (gateType: GateType) => {
      if (!disabled) {
        onGateSelect(gateType);
      }
    },
    [onGateSelect, disabled]
  );

  return (
    <div className={`gate-palette ${disabled ? 'disabled' : ''}`}>
      <h3 className="palette-title">Gates</h3>

      {GATE_CATEGORIES.map((category) => (
        <div key={category.id} className="gate-category">
          <h4 className="category-title">{category.name}</h4>
          <div className="gate-grid">
            {category.gates.map((gateType) => {
              const gate = GATE_DEFINITIONS[gateType];
              return (
                <GateButton
                  key={gateType}
                  gate={gate}
                  isSelected={selectedGate === gateType}
                  onClick={() => handleGateClick(gateType)}
                  disabled={disabled}
                />
              );
            })}
          </div>
        </div>
      ))}

      <div className="palette-help">
        <p>Click a gate, then click a qubit wire to place it.</p>
        <p>For 2-qubit gates, click control then target.</p>
      </div>
    </div>
  );
}

export default GatePalette;
