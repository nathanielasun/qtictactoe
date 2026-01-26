/**
 * Settings Modal Component
 * Global settings panel accessible from any phase.
 */

import { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { Modal, Slider, Button } from '@/components/shared';
import type { CollapseMode } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  disabled?: boolean; // Disable settings changes during active game
}

export function SettingsModal({ isOpen, onClose, disabled = false }: SettingsModalProps) {
  const { settings, updateSetting, resetToDefaults, numSurvivors } = useSettings();

  const numGames = Math.pow(2, settings.n);

  const handleResetDefaults = useCallback(() => {
    resetToDefaults();
  }, [resetToDefaults]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      size="md"
    >
      <div className="settings-content">
        {disabled && (
          <div className="settings-warning" role="alert">
            <p>Settings cannot be changed during an active game. Finish or restart the game to modify settings.</p>
          </div>
        )}

        <section className="settings-section">
          <h3 className="settings-section-title">Game Settings</h3>

          <div className="setting-item">
            <Slider
              label="Number of Qubits (n)"
              value={settings.n}
              min={1}
              max={6}
              step={1}
              onChange={(value) => updateSetting('n', value)}
              valueFormatter={(v) => `${v} (${Math.pow(2, v)} games)`}
              disabled={disabled}
              marks={[
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 5, label: '5' },
                { value: 6, label: '6' },
              ]}
            />
          </div>

          <div className="setting-item">
            <Slider
              label="Bot Leniency"
              value={settings.botLeniency}
              min={0}
              max={100}
              step={5}
              onChange={(value) => updateSetting('botLeniency', value)}
              valueFormatter={(v) => `${v}%`}
              disabled={disabled}
            />
            <p className="setting-hint">
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
          </div>
        </section>

        <section className="settings-section">
          <h3 className="settings-section-title">Collapse Mode</h3>

          <div className="mode-options">
            <label className={`mode-option ${settings.collapseMode === 'easy' ? 'active' : ''} ${disabled ? 'disabled' : ''}`}>
              <input
                type="radio"
                name="collapseMode"
                value="easy"
                checked={settings.collapseMode === 'easy'}
                onChange={() => updateSetting('collapseMode', 'easy' as CollapseMode)}
                disabled={disabled}
              />
              <div className="mode-content">
                <strong>Easy Mode</strong>
                <span>{numSurvivors} separate collapses</span>
                <p>Each collapse selects one survivor, removed from the pool.</p>
              </div>
            </label>

            <label className={`mode-option ${settings.collapseMode === 'hard' ? 'active' : ''} ${disabled ? 'disabled' : ''}`}>
              <input
                type="radio"
                name="collapseMode"
                value="hard"
                checked={settings.collapseMode === 'hard'}
                onChange={() => updateSetting('collapseMode', 'hard' as CollapseMode)}
                disabled={disabled}
              />
              <div className="mode-content">
                <strong>Hard Mode</strong>
                <span>Top {numSurvivors} states survive</span>
                <p>Single measurement - the states with highest counts survive.</p>
              </div>
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h3 className="settings-section-title">Game Preview</h3>

          <div className="settings-preview">
            <div className="preview-stat">
              <span className="preview-label">Games</span>
              <span className="preview-value">{numGames}</span>
            </div>
            <div className="preview-stat">
              <span className="preview-label">Survivors</span>
              <span className="preview-value">{numSurvivors}</span>
            </div>
            <div className="preview-stat">
              <span className="preview-label">Score Range</span>
              <span className="preview-value">
                {-numSurvivors * 2} to +{numSurvivors * 2}
              </span>
            </div>
          </div>
        </section>

        <div className="settings-actions">
          <Button
            variant="ghost"
            onClick={handleResetDefaults}
            icon={<RotateCcw size={16} />}
            disabled={disabled}
          >
            Reset Defaults
          </Button>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SettingsModal;
