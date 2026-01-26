/**
 * Leaderboard Component
 * Displays high scores with sorting and filtering options.
 */

import { useState, useMemo } from 'react';
import { Trophy, Medal, Award, Clock, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useLeaderboard } from '@/context/LeaderboardContext';
import { Modal, Button } from '@/components/shared';
import {
  LeaderboardSortKey,
  LeaderboardSortOrder,
  formatDuration,
  formatDate,
} from '@/types';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Get rank icon based on position */
function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy size={18} className="rank-icon gold" />;
  if (rank === 2) return <Medal size={18} className="rank-icon silver" />;
  if (rank === 3) return <Award size={18} className="rank-icon bronze" />;
  return <span className="rank-number">{rank}</span>;
}

export function Leaderboard({ isOpen, onClose }: LeaderboardProps) {
  const { state, getSortedEntries, clearAll, removeEntry } = useLeaderboard();
  const [sortKey, setSortKey] = useState<LeaderboardSortKey>('score');
  const [sortOrder, setSortOrder] = useState<LeaderboardSortOrder>('desc');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const entries = useMemo(
    () => getSortedEntries(sortKey, sortOrder),
    [getSortedEntries, sortKey, sortOrder]
  );

  const handleSort = (key: LeaderboardSortKey) => {
    if (sortKey === key) {
      // Toggle order if same key
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      // New key, default to desc (except date which defaults to recent first)
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const SortButton = ({
    column,
    label,
  }: {
    column: LeaderboardSortKey;
    label: string;
  }) => (
    <button
      className={`sort-button ${sortKey === column ? 'active' : ''}`}
      onClick={() => handleSort(column)}
    >
      {label}
      {sortKey === column &&
        (sortOrder === 'desc' ? (
          <ChevronDown size={14} />
        ) : (
          <ChevronUp size={14} />
        ))}
    </button>
  );

  const handleClearAll = () => {
    clearAll();
    setShowClearConfirm(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leaderboard" size="lg">
      <div className="leaderboard-content">
        {entries.length === 0 ? (
          <div className="leaderboard-empty">
            <Trophy size={48} className="empty-icon" />
            <p>No scores yet!</p>
            <p className="empty-hint">
              Complete a game to be the first on the leaderboard.
            </p>
          </div>
        ) : (
          <>
            {/* Sort controls */}
            <div className="leaderboard-controls">
              <div className="sort-controls">
                <span className="sort-label">Sort by:</span>
                <SortButton column="score" label="Score" />
                <SortButton column="date" label="Date" />
                <SortButton column="numQubits" label="Qubits" />
                <SortButton column="duration" label="Time" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                icon={<Trash2 size={14} />}
              >
                Clear All
              </Button>
            </div>

            {/* Entries list */}
            <div className="leaderboard-list">
              <div className="leaderboard-header">
                <span className="col-rank">#</span>
                <span className="col-name">Player</span>
                <span className="col-score">Score</span>
                <span className="col-details">Details</span>
                <span className="col-date">Date</span>
              </div>

              {entries.map((entry, index) => {
                const rank =
                  sortKey === 'score' && sortOrder === 'desc'
                    ? index + 1
                    : state.entries.findIndex((e) => e.id === entry.id) + 1;

                return (
                  <div
                    key={entry.id}
                    className={`leaderboard-entry ${rank <= 3 ? `rank-${rank}` : ''}`}
                  >
                    <span className="col-rank">
                      <RankIcon rank={rank} />
                    </span>
                    <span className="col-name" title={entry.name}>
                      {entry.name}
                    </span>
                    <span
                      className={`col-score ${
                        entry.score > 0
                          ? 'positive'
                          : entry.score < 0
                          ? 'negative'
                          : ''
                      }`}
                    >
                      {entry.score > 0 ? '+' : ''}
                      {entry.score}
                    </span>
                    <span className="col-details">
                      <span className="detail-item" title="Number of qubits">
                        {entry.numQubits}q
                      </span>
                      <span className="detail-item" title="Collapse mode">
                        {entry.collapseMode === 'easy' ? 'E' : 'H'}
                      </span>
                      <span className="detail-item" title="Bot leniency">
                        {entry.botLeniency}%
                      </span>
                      <span className="detail-item" title="Duration">
                        <Clock size={12} />
                        {formatDuration(entry.duration)}
                      </span>
                    </span>
                    <span className="col-date">{formatDate(entry.date)}</span>
                    <button
                      className="entry-remove"
                      onClick={() => removeEntry(entry.id)}
                      title="Remove entry"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="leaderboard-footer">
              <span className="entry-count">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          </>
        )}

        {/* Clear confirmation */}
        {showClearConfirm && (
          <div className="clear-confirm-overlay">
            <div className="clear-confirm-dialog">
              <h4>Clear Leaderboard?</h4>
              <p>
                This will permanently delete all {entries.length} entries. This
                action cannot be undone.
              </p>
              <div className="confirm-actions">
                <Button variant="ghost" onClick={() => setShowClearConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default Leaderboard;
