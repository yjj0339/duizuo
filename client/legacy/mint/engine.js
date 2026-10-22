export const DIRECTIONS = ['up', 'right', 'down', 'left'];
export function move(board, size, direction) {
  if (!DIRECTIONS.includes(direction)) throw new Error('Invalid direction');
  const next = Array(size * size).fill(0), transitions = [], merged = [];
  let score = 0;
  for (let line = 0; line < size; line++) {
    const indices = Array.from({ length: size }, (_, offset) =>
      direction === 'left' ? line * size + offset : direction === 'right' ? line * size + size - 1 - offset :
      direction === 'up' ? offset * size + line : (size - 1 - offset) * size + line);
    const filled = indices.filter(i => board[i]);
    let destination = 0;
    for (let j = 0; j < filled.length; j++) {
      const from = filled[j], to = indices[destination++];
      if (j + 1 < filled.length && board[from] === board[filled[j + 1]]) {
        next[to] = board[from] * 2; score += next[to]; merged.push(to);
        transitions.push({ from, to, value: board[from], merged: true });
        transitions.push({ from: filled[++j], to, value: board[from], ghost: true });
      } else {
        next[to] = board[from]; transitions.push({ from, to, value: board[from] });
      }
    }
  }
  return { board: next, score, merged, transitions, changed: next.some((v, i) => v !== board[i]) };
}
export function random(seed) {
  let x = seed >>> 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return { seed: x >>> 0, value: (x >>> 0) / 4294967296 };
}
export function spawn(board, seed) {
  const empty = board.flatMap((v, i) => v === 0 ? [i] : []);
  if (!empty.length) return { board: [...board], seed, index: -1 };
  const a = random(seed || 1), b = random(a.seed);
  const index = empty[Math.floor(a.value * empty.length)], next = [...board];
  next[index] = b.value < 0.9 ? 2 : 4;
  return { board: next, seed: b.seed, index };
}
export function canMove(board, size) {
  return board.some((v, i) => !v || (i % size < size - 1 && v === board[i + 1]) || (i + size < board.length && v === board[i + size]));
}
export function hash(text) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0 || 1;
}
export function newGame(size = 4, seed = 1, mode = 'classic') {
  let result = spawn(Array(size * size).fill(0), seed);
  result = spawn(result.board, result.seed);
  return { size, mode, board: result.board, seed: result.seed, initialSeed: seed, score: 0, moves: 0, elapsed: 0,
    highest: Math.max(...result.board), merges: 0, combo: 0, bestCombo: 0, won: false, continued: false, assisted: false, ended: false, history: [] };
}
export function validGame(game) {
  return game && [4, 5, 6].includes(game.size) && ['classic', 'daily', 'zen'].includes(game.mode) && Array.isArray(game.board) &&
    game.board.length === game.size ** 2 && game.board.every(v => Number.isInteger(v) && (v === 0 || (v >= 2 && Number.isInteger(Math.log2(v))))) &&
    ['score', 'moves', 'elapsed', 'merges', 'combo', 'bestCombo'].every(k => Number.isFinite(game[k]) && game[k] >= 0) &&
    Number.isInteger(game.seed) && game.seed > 0 && Number.isFinite(game.highest);
}
