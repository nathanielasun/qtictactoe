/**
 * Bot AI Logic
 * Minimax algorithm with alpha-beta pruning and leniency system.
 */

import { CellValue, Player } from '@/types';
import {
  checkWinner,
  isDraw,
  getEmptyCells,
  getOpponent,
  findWinningMove,
  findBlockingMove,
} from './gameLogic';

/** Bot configuration */
interface BotConfig {
  /** Leniency value (0-100). 0 = perfect play, 100 = random */
  leniency: number;
}

/**
 * Minimax algorithm with alpha-beta pruning.
 * @param board - Current board state
 * @param depth - Current depth in game tree
 * @param isMaximizing - Whether the current player is maximizing
 * @param alpha - Alpha value for pruning
 * @param beta - Beta value for pruning
 * @param botPlayer - The bot's player marker
 * @returns Score for the current position
 */
function minimax(
  board: CellValue[],
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  botPlayer: Player
): number {
  const humanPlayer = getOpponent(botPlayer);
  const winner = checkWinner(board);

  // Terminal states
  if (winner === botPlayer) return 10 - depth;
  if (winner === humanPlayer) return depth - 10;
  if (isDraw(board)) return 0;

  const emptyCells = getEmptyCells(board);

  if (isMaximizing) {
    let maxEval = -Infinity;

    for (const cell of emptyCells) {
      const newBoard = [...board];
      newBoard[cell] = botPlayer;

      const evaluation = minimax(newBoard, depth + 1, false, alpha, beta, botPlayer);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);

      if (beta <= alpha) break; // Pruning
    }

    return maxEval;
  } else {
    let minEval = Infinity;

    for (const cell of emptyCells) {
      const newBoard = [...board];
      newBoard[cell] = humanPlayer;

      const evaluation = minimax(newBoard, depth + 1, true, alpha, beta, botPlayer);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);

      if (beta <= alpha) break; // Pruning
    }

    return minEval;
  }
}

/**
 * Get the optimal move using minimax.
 * @param board - Current board state
 * @param botPlayer - The bot's player marker
 * @returns Best cell index to play
 */
export function getOptimalMove(board: CellValue[], botPlayer: Player = 'O'): number {
  const emptyCells = getEmptyCells(board);

  if (emptyCells.length === 0) {
    throw new Error('No empty cells available');
  }

  let bestMove = emptyCells[0];
  let bestScore = -Infinity;

  for (const cell of emptyCells) {
    const newBoard = [...board];
    newBoard[cell] = botPlayer;

    const score = minimax(newBoard, 0, false, -Infinity, Infinity, botPlayer);

    if (score > bestScore) {
      bestScore = score;
      bestMove = cell;
    }
  }

  return bestMove;
}

/**
 * Get a random legal move.
 * @param board - Current board state
 * @returns Random empty cell index
 */
export function getRandomMove(board: CellValue[]): number {
  const emptyCells = getEmptyCells(board);

  if (emptyCells.length === 0) {
    throw new Error('No empty cells available');
  }

  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

/**
 * Get all moves ranked by score.
 * @param board - Current board state
 * @param botPlayer - The bot's player marker
 * @returns Array of moves with scores, sorted by score descending
 */
export function getRankedMoves(
  board: CellValue[],
  botPlayer: Player = 'O'
): { cell: number; score: number }[] {
  const emptyCells = getEmptyCells(board);

  const moves = emptyCells.map((cell) => {
    const newBoard = [...board];
    newBoard[cell] = botPlayer;
    const score = minimax(newBoard, 0, false, -Infinity, Infinity, botPlayer);
    return { cell, score };
  });

  // Sort by score descending
  return moves.sort((a, b) => b.score - a.score);
}

/**
 * Get bot move with leniency.
 * @param board - Current board state
 * @param config - Bot configuration
 * @param botPlayer - The bot's player marker
 * @returns Cell index to play
 */
export function getBotMove(
  board: CellValue[],
  config: BotConfig,
  botPlayer: Player = 'O'
): number {
  const emptyCells = getEmptyCells(board);

  if (emptyCells.length === 0) {
    throw new Error('No empty cells available');
  }

  // At 0% leniency, always play optimally
  // At 100% leniency, always play randomly
  const randomChance = config.leniency / 100;

  if (Math.random() < randomChance) {
    return getRandomMove(board);
  }

  return getOptimalMove(board, botPlayer);
}

/**
 * Get bot move with weighted probability based on leniency.
 * More nuanced than simple random chance - worse moves become more likely.
 * @param board - Current board state
 * @param config - Bot configuration
 * @param botPlayer - The bot's player marker
 * @returns Cell index to play
 */
export function getBotMoveWeighted(
  board: CellValue[],
  config: BotConfig,
  botPlayer: Player = 'O'
): number {
  const rankedMoves = getRankedMoves(board, botPlayer);

  if (rankedMoves.length === 0) {
    throw new Error('No empty cells available');
  }

  if (rankedMoves.length === 1) {
    return rankedMoves[0].cell;
  }

  // Calculate weights based on leniency
  // At low leniency, heavily favor best moves
  // At high leniency, flatten the distribution
  const leniencyFactor = config.leniency / 100;

  const weights = rankedMoves.map((_, index) => {
    // Base weight: best move gets highest weight
    const baseWeight = rankedMoves.length - index;
    // Flatten based on leniency
    const flattenedWeight = baseWeight + leniencyFactor * rankedMoves.length;
    return flattenedWeight;
  });

  // Normalize weights to probabilities
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const probabilities = weights.map((w) => w / totalWeight);

  // Random selection based on probabilities
  let random = Math.random();
  for (let i = 0; i < probabilities.length; i++) {
    random -= probabilities[i];
    if (random <= 0) {
      return rankedMoves[i].cell;
    }
  }

  // Fallback to best move
  return rankedMoves[0].cell;
}

/**
 * Check if bot should "miss" a winning move (for high leniency).
 * @param board - Current board state
 * @param leniency - Leniency value (0-100)
 * @param botPlayer - The bot's player marker
 * @returns True if bot should miss the winning move
 */
export function shouldMissWin(
  board: CellValue[],
  leniency: number,
  botPlayer: Player = 'O'
): boolean {
  if (leniency < 30) return false;

  const winningMove = findWinningMove(board, botPlayer);
  if (winningMove === null) return false;

  // Chance to miss increases with leniency above 30%
  const missChance = (leniency - 30) / 100;
  return Math.random() < missChance;
}

/**
 * Check if bot should "miss" blocking the player (for high leniency).
 * @param board - Current board state
 * @param leniency - Leniency value (0-100)
 * @param botPlayer - The bot's player marker
 * @returns True if bot should miss blocking
 */
export function shouldMissBlock(
  board: CellValue[],
  leniency: number,
  botPlayer: Player = 'O'
): boolean {
  if (leniency < 40) return false;

  const blockingMove = findBlockingMove(board, botPlayer);
  if (blockingMove === null) return false;

  // Chance to miss increases with leniency above 40%
  const missChance = (leniency - 40) / 120;
  return Math.random() < missChance;
}

/**
 * Get bot move with realistic "mistake" behavior.
 * Combines weighted selection with occasional blunders.
 * @param board - Current board state
 * @param config - Bot configuration
 * @param botPlayer - The bot's player marker
 * @returns Cell index to play
 */
export function getBotMoveRealistic(
  board: CellValue[],
  config: BotConfig,
  botPlayer: Player = 'O'
): number {
  const { leniency } = config;
  const emptyCells = getEmptyCells(board);

  if (emptyCells.length === 0) {
    throw new Error('No empty cells available');
  }

  // Check for winning move (but might "miss" it at high leniency)
  const winningMove = findWinningMove(board, botPlayer);
  if (winningMove !== null && !shouldMissWin(board, leniency, botPlayer)) {
    return winningMove;
  }

  // Check for blocking move (but might "miss" it at high leniency)
  const blockingMove = findBlockingMove(board, botPlayer);
  if (blockingMove !== null && !shouldMissBlock(board, leniency, botPlayer)) {
    return blockingMove;
  }

  // Use weighted move selection for other moves
  return getBotMoveWeighted(board, config, botPlayer);
}

export type { BotConfig };
