/**
 * Angle Input Component
 * Input for rotation gate angles with preset options.
 */

import { useCallback, useState } from 'react';
import { ANGLE_PRESETS, formatAngle } from '@/types/quantum';
import { RotateCcw } from 'lucide-react';

interface AngleInputProps {
  value: number;
  onChange: (angle: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  gateName: string;
}

/**
 * Angle Input - modal for setting rotation gate angles
 */
export function AngleInput({
  value,
  onChange,
  onConfirm,
  onCancel,
  gateName,
}: AngleInputProps) {
  const [customValue, setCustomValue] = useState(value.toString());

  const handlePresetClick = useCallback(
    (presetValue: number) => {
      onChange(presetValue);
      setCustomValue(presetValue.toString());
    },
    [onChange]
  );

  const handleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setCustomValue(text);

      const parsed = parseFloat(text);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        onConfirm();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onConfirm, onCancel]
  );

  return (
    <div className="angle-input-overlay" onClick={onCancel}>
      <div className="angle-input-modal" onClick={(e) => e.stopPropagation()}>
        <div className="angle-input-header">
          <RotateCcw size={18} />
          <span>Set {gateName} Angle</span>
        </div>

        <div className="angle-presets">
          {ANGLE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              className={`angle-preset ${Math.abs(value - preset.value) < 0.001 ? 'active' : ''}`}
              onClick={() => handlePresetClick(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="angle-custom">
          <label>Custom (radians):</label>
          <input
            type="number"
            step="0.1"
            value={customValue}
            onChange={handleCustomChange}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <span className="angle-display">= {formatAngle(value)}</span>
        </div>

        <div className="angle-actions">
          <button className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-button" onClick={onConfirm}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default AngleInput;
