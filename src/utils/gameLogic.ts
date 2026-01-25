/**
 * Game Logic Utilities
 * Core tic-tac-toe rules, win detection, and game state management.
 */

import { CellValue, Player, WIN_PATTERNS, TicTacToeGame } from '@/types';

/**
 * Check if a player has won the game.
 * @param board - The current board state
 * @returns The winning player or null if no winner
 */
export function checkWinner(board: CellValue[]): Player | null {
  for (const pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a] as Player;
    }
  }
  return null;
}

/**
 * Get the winning cells if there's a winner.
 * @param board - The current board state
 * @returns Array of winning cell indices or null
 */
export function getWinningCells(board: CellValue[]): number[] | null {
  for (const pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return pattern as unknown as number[];
    }
  }
  return null;
}

/**
 * Check if the game is a draw (board full, no winner).
 * @param board - The current board state
 * @returns True if the game is a draw
 */
export function isDraw(board: CellValue[]): boolean {
  return board.every((cell) => cell !== null) && checkWinner(board) === null;
}

/**
 * Check if a move is valid.
 * @param board - The current board state
 * @param cellIndex - The cell to check
 * @returns True if the move is valid
 */
export function isValidMove(board: CellValue[], cellIndex: number): boolean {
  return cellIndex >= 0 && cellIndex < 9 && board[cellIndex] === null;
}

/**
 * Get all empty cell indices.
 * @param board - The current board state
 * @returns Array of empty cell indices
 */
export function getEmptyCells(board: CellValue[]): number[] {
  return board
    .map((cell, index) => (cell === null ? index : -1))
    .filter((index) => index !== -1);
}

/**
 * Make a move on the board (returns new board, doesn't mutate).
 * @param board - The current board state
 * @param cellIndex - The cell to mark
 * @param player - The player making the move
 * @returns New board state
 */
export function makeMove(
  board: CellValue[],
  cellIndex: number,
  player: Player
): CellValue[] {
  if (!isValidMove(board, cellIndex)) {
    throw new Error(`Invalid move at cell ${cellIndex}`);
  }

  const newBoard = [...board];
  newBoard[cellIndex] = player;
  return newBoard;
}

/**
 * Get the opponent player.
 * @param player - Current player
 * @returns Opponent player
 */
export function getOpponent(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

/**
 * Check if a player can win on their next move.
 * @param board - The current board state
 * @param player - The player to check
 * @returns The winning cell index or null
 */
export function findWinningMove(board: CellValue[], player: Player): number | null {
  for (const pattern of WIN_PATTERNS) {
    const values = pattern.map((i) => board[i]);
    const playerCount = values.filter((v) => v === player).length;
    const emptyCount = values.filter((v) => v === null).length;

    if (playerCount === 2 && emptyCount === 1) {
      // Find the empty cell in this pattern
      for (const i of pattern) {
        if (board[i] === null) {
          return i;
        }
      }
    }
  }
  return null;
}

/**
 * Check if a player needs to block the opponent.
 * @param board - The current board state
 * @param player - The player to check for
 * @returns The blocking cell index or null
 */
export function findBlockingMove(board: CellValue[], player: Player): number | null {
  return findWinningMove(board, getOpponent(player));
}

/**
 * Evaluate the board from a player's perspective.
 * Used for minimax algorithm.
 * @param board - The current board state
 * @param player - The player to evaluate for
 * @returns Score: 10 for win, -10 for loss, 0 for draw/ongoing
 */
export function evaluateBoard(board: CellValue[], player: Player): number {
  const winner = checkWinner(board);

  if (winner === player) return 10;
  if (winner === getOpponent(player)) return -10;
  return 0;
}

/**
 * Count the number of potential winning lines for a player.
 * @param board - The current board state
 * @param player - The player to count for
 * @returns Number of open winning lines
 */
export function countOpenLines(board: CellValue[], player: Player): number {
  const opponent = getOpponent(player);
  let count = 0;

  for (const pattern of WIN_PATTERNS) {
    const values = pattern.map((i) => board[i]);
    // Line is open if no opponent pieces
    if (!values.includes(opponent)) {
      count++;
    }
  }

  return count;
}

/**
 * Get game status based on board state.
 * @param board - The current board state
 * @param humanPlayer - The human player marker (X)
 * @returns Game status
 */
export function getGameStatus(
  board: CellValue[],
  humanPlayer: Player = 'X'
): 'playing' | 'won' | 'lost' | 'draw' {
  const winner = checkWinner(board);

  if (winner === humanPlayer) return 'won';
  if (winner === getOpponent(humanPlayer)) return 'lost';
  if (isDraw(board)) return 'draw';
  return 'playing';
}

/**
 * Create an updated game object after a move.
 * @param game - The current game state
 * @param cellIndex - The cell where the move was made
 * @param player - The player who made the move
 * @returns Updated game state
 */
export function applyMoveToGame(
  game: TicTacToeGame,
  cellIndex: number,
  player: Player
): TicTacToeGame {
  const newBoard = makeMove(game.board, cellIndex, player);
  const winner = checkWinner(newBoard);
  const winningCells = getWinningCells(newBoard);
  const status = getGameStatus(newBoard);

  return {
    ...game,
    board: newBoard,
    currentPlayer: getOpponent(player),
    status,
    winner,
    winningCells,
    moveHistory: [
      ...game.moveHistory,
      { player, cell: cellIndex, timestamp: Date.now() },
    ],
  };
}
