/**
 * Histogram Display Component
 * Visualizes quantum measurement results with game outcome indicators.
 */

import { useMemo, useState, useEffect } from 'react';
import { TicTacToeGame, MeasurementResults } from '@/types';
import { buildHistogramData, HistogramBar } from '@/utils/stateMapping';

interface HistogramDisplayProps {
  results: MeasurementResults | null;
  games: TicTacToeGame[];
  n?: number; // Optional - not currently used but kept for future
  survivors?: number[];
  animate?: boolean; // Whether to animate bars on reveal
}

/**
 * Individual histogram bar
 */
interface BarProps {
  bar: HistogramBar;
  maxProbability: number;
  isSurvivor: boolean;
  index: number;
  animate: boolean;
}

function Bar({ bar, maxProbability, isSurvivor, index, animate }: BarProps) {
  const heightPercent = (bar.probability / maxProbability) * 100;
  const probabilityPercent = (bar.probability * 100).toFixed(1);
  const animationDelay = index * 50; // Stagger animation by 50ms per bar

  return (
    <div
      className={`histogram-bar ${bar.isWinningState ? 'winner' : ''} ${
        isSurvivor ? 'survivor' : ''
      } status-${bar.gameOutcome} ${animate ? 'animate' : ''}`}
      role="img"
      aria-label={`State ${bar.state}: ${probabilityPercent}% probability, ${bar.gamePoints > 0 ? 'won' : bar.gamePoints < 0 && bar.gamePoints === -2 ? 'lost' : 'draw'} (${bar.gamePoints > 0 ? '+' : ''}${bar.gamePoints} points)`}
    >
      <div className="bar-container">
        <div
          className="bar-fill"
          style={{
            '--bar-height': `${heightPercent}%`,
            '--bar-delay': `${animationDelay}ms`,
            height: animate ? '0' : `${heightPercent}%`,
          } as React.CSSProperties}
        >
          <span className="bar-count" aria-hidden="true">{bar.count}</span>
        </div>
      </div>
      <div className="bar-label">
        <span className="state-label">|{bar.state}⟩</span>
        <span className="game-label">G{bar.gameIndex}</span>
        <span className="probability-label">{probabilityPercent}%</span>
        <span className={`points-label ${bar.gamePoints > 0 ? 'positive' : bar.gamePoints < 0 ? 'negative' : ''}`}>
          {bar.gamePoints > 0 ? '+' : ''}{bar.gamePoints}
        </span>
      </div>
    </div>
  );
}

/**
 * Histogram Display - shows measurement outcome distribution
 */
export function HistogramDisplay({ results, games, survivors = [], animate = true }: HistogramDisplayProps) {
  // Track if animation should run (only on initial render with new results)
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Trigger animation when results change
  useEffect(() => {
    if (results && animate) {
      setShouldAnimate(true);
      // Reset animation flag after animation completes
      const timeout = setTimeout(() => setShouldAnimate(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [results, animate]);

  const histogramData = useMemo(() => {
    if (!results) return [];
    return buildHistogramData(
      results.counts,
      games,
      results.shots,
      results.winningState
    );
  }, [results, games]);

  // Find max probability for scaling
  const maxProbability = useMemo(() => {
    if (histogramData.length === 0) return 1;
    return Math.max(...histogramData.map((bar) => bar.probability));
  }, [histogramData]);

  // Calculate expected value
  const expectedValue = useMemo(() => {
    if (!results) return 0;
    let ev = 0;
    for (const bar of histogramData) {
      ev += bar.gamePoints * bar.probability;
    }
    return ev;
  }, [results, histogramData]);

  if (!results) {
    return (
      <div className="histogram-display empty" role="status">
        <p>Execute the circuit to see measurement results</p>
      </div>
    );
  }

  return (
    <div
      className="histogram-display"
      role="region"
      aria-label="Measurement results histogram"
    >
      <div className="histogram-header">
        <h4 id="histogram-title">Measurement Results</h4>
        <div className="histogram-stats" role="status" aria-live="polite">
          <span className="stat">Shots: {results.shots}</span>
          <span className="stat">
            Expected Value:{' '}
            <strong className={expectedValue >= 0 ? 'positive' : 'negative'}>
              {expectedValue >= 0 ? '+' : ''}{expectedValue.toFixed(2)}
            </strong>
          </span>
        </div>
      </div>

      <div
        className="histogram-chart"
        role="list"
        aria-labelledby="histogram-title"
      >
        {histogramData.map((bar, index) => (
          <Bar
            key={bar.state}
            bar={bar}
            maxProbability={maxProbability}
            isSurvivor={survivors.includes(bar.gameIndex)}
            index={index}
            animate={shouldAnimate}
          />
        ))}
      </div>

      <div className="histogram-legend" aria-label="Legend">
        <div className="legend-item">
          <span className="legend-color status-won" aria-hidden="true" />
          <span>Win (+2)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color status-lost" aria-hidden="true" />
          <span>Loss (-2)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color status-draw" aria-hidden="true" />
          <span>Draw (-1)</span>
        </div>
        {survivors.length > 0 && (
          <div className="legend-item">
            <span className="legend-color survivor" aria-hidden="true" />
            <span>Survivor</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistogramDisplay;
