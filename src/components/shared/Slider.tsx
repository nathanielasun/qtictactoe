/**
 * Slider Component
 * Range slider with labels and value display.
 */

import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  marks?: { value: number; label: string }[];
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      label,
      value,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      showValue = true,
      valueFormatter = (v) => v.toString(),
      marks,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id || autoId;

    // Calculate percentage for styling
    const percentage = ((value - min) / (max - min)) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    };

    return (
      <div className={`slider-container ${className}`}>
        {(label || showValue) && (
          <div className="slider-header">
            {label && (
              <label htmlFor={inputId} className="slider-label">
                {label}
              </label>
            )}
            {showValue && (
              <span className="slider-value">{valueFormatter(value)}</span>
            )}
          </div>
        )}
        <div className="slider-wrapper">
          <div
            className="slider-track-container"
            style={
              {
                '--slider-percentage': percentage,
              } as React.CSSProperties
            }
          >
            {/* Track background */}
            <div className="slider-track" aria-hidden="true" />
            {/* Track fill */}
            <div className="slider-fill" aria-hidden="true" />
            {/* Actual input */}
            <input
              ref={ref}
              type="range"
              id={inputId}
              value={value}
              min={min}
              max={max}
              step={step}
              onChange={handleChange}
              className="slider-input"
              {...props}
            />
          </div>
          {marks && marks.length > 0 && (
            <div className="slider-marks">
              {marks.map((mark) => {
                const markPercentage = ((mark.value - min) / (max - min)) * 100;
                // Account for thumb width (20px) - marks align with thumb center positions
                return (
                  <div
                    key={mark.value}
                    className="slider-mark"
                    style={{ left: `calc(10px + ${markPercentage} * (100% - 20px) / 100)` }}
                  >
                    <span className="slider-mark-label">{mark.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export default Slider;
