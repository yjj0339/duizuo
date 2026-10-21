const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

const pick = (list, index) => list[index % list.length];
const isOpenEdge = edge => edge === -1;

function firstIndex(list, predicate) {
  for (let i = 0; i < list.length; i++) if (predicate(list[i], i)) return i;
  return -1;
}

function solveSudoku(givens) {
  const grid = givens.slice();
  function valid(index, value) {
    const x = index % 9, y = Math.floor(index / 9);
    for (let i = 0; i < 9; i++) {
      if (grid[y * 9 + i] === value) return false;
      if (grid[i * 9 + x] === value) return false;
    }
    const bx = Math.floor(x / 3) * 3, by = Math.floor(y / 3) * 3;
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) if (grid[(by + dy) * 9 + bx + dx] === value) return false;
    return true;
  }
  function search() {
    let target = -1;
    for (let i = 0; i < 81; i++) if (!grid[i]) { target = i; break; }
    if (target === -1) return true;
    for (let value = 1; value <= 9; value++) {
      if (!valid(target, value)) continue;
      grid[target] = value;
      if (search()) return true;
      grid[target] = 0;
    }
    return false;
  }
  search();
  return grid;
}

function bfsStep(grid, from, to) {
  if (from.x === to.x && from.y === to.y) return null;
  const rows = grid.length, cols = grid[0].length;
  const key = (x, y) => y * cols + x;
  const seen = new Uint8Array(rows * cols);
  const queue = [from];
  seen[key(from.x, from.y)] = 1;
  const parent = new Map();
  while (queue.length) {
    const current = queue.shift();
    if (current.x === to.x && current.y === to.y) {
      let node = current, previous = parent.get(key(node.x, node.y));
      while (previous && !(previous.x === from.x && previous.y === from.y)) { node = previous; previous = parent.get(key(node.x, node.y)); }
      return { dx: node.x - from.x, dy: node.y - from.y };
    }
    for (const [dx, dy] of Object.values(DIRS)) {
      const x = current.x + dx, y = current.y + dy;
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
      if (grid[y][x] !== 0) continue;
      if (seen[key(x, y)]) continue;
      seen[key(x, y)] = 1;
      parent.set(key(x, y), current);
      queue.push({ x, y });
    }
  }
  return null;
}

const dirName = (dx, dy) => Object.keys(DIRS).find(name => DIRS[name][0] === dx && DIRS[name][1] === dy);

export const bots = {
  gomoku(view, player) {
    if (view.turn !== player) return null;
    const index = firstIndex(view.board, cell => cell === -1);
    return index < 0 ? null : { type: 'place', index };
  },

  fleet(view, player, state) {
    if (view.phase === 'setup') {
      if (view.ready[player]) return null;
      if (!state.randomized) { state.randomized = true; return { type: 'randomize' }; }
      return { type: 'ready' };
    }
    if (view.turn !== player) return null;
    const index = firstIndex(view.targetBoard, cell => cell === -1);
    return index < 0 ? null : { type: 'fire', index };
  },

  dots(view, player) {
    if (view.turn !== player) return null;
    const index = firstIndex(view.edges, isOpenEdge);
    return index < 0 ? null : { type: 'line', index };
  },

  memory(view, player, state) {
    state.memorySeen ??= {};
    view.faces.forEach((face, index) => {
      if (face !== null && view.owners[index] === -1) state.memorySeen[index] = face;
    });
    if (view.turn !== player || view.phase !== 'choose') return null;
    const open = view.open ?? [];
    const free = index => view.owners[index] === -1 && !open.includes(index);
    const known = index => Object.hasOwn(state.memorySeen, index);
    if (open.length === 1) {
      const face = state.memorySeen[open[0]] ?? view.faces[open[0]];
      const match = firstIndex(view.faces, (value, index) => free(index) && (state.memorySeen[index] === face || (known(open[0]) && value === face)));
      if (match >= 0) return { type: 'flip', index: match };
    } else {
      const groups = {};
      for (const [index, face] of Object.entries(state.memorySeen)) {
        if (!free(Number(index))) continue;
        (groups[face] ??= []).push(Number(index));
      }
      const pair = Object.values(groups).find(list => list.length >= 2);
      if (pair) return { type: 'flip', index: pair[0] };
    }
    const unknown = view.faces.findIndex((face, index) => face === null && !known(index) && free(index));
    if (unknown >= 0) return { type: 'flip', index: unknown };
    const remembered = Object.keys(state.memorySeen).map(Number).find(index => free(index));
    if (remembered !== undefined) return { type: 'flip', index: remembered };
    const any = view.faces.findIndex((face, index) => free(index));
    return any >= 0 ? { type: 'flip', index: any } : null;
  },

  hockey(view, player) {
    const paddle = view.paddles[player];
    const inOwnHalf = player === 0 ? view.puck.x < 360 : view.puck.x > 360;
    const targetX = inOwnHalf ? view.puck.x + (player === 0 ? -42 : 42) : player === 0 ? 100 : 620;
    return {
      type: 'move',
      x: Math.max(28, Math.min(692, targetX)),
      y: Math.max(28, Math.min(412, view.puck.y + (view.puck.y > 220 ? 20 : -20))),
    };
  },

  tanks(view, player, state) {
    const own = view.tanks[player], enemy = view.tanks[1 - player];
    if (view.status !== 'playing') return null;
    if ((state.tankPhase = (state.tankPhase || 0) + 1) % 6 === 0) {
      const dx = Math.sign(enemy.x - own.x), dy = Math.sign(enemy.y - own.y);
      return { type: 'control', dx: dx || (player ? -1 : 1), dy };
    }
    return { type: 'aim', x: enemy.x, y: enemy.y };
  },

  bomber(view, player, state) {
    const own = view.players[player];
    if (!own?.alive) return null;
    const enemy = view.players[1 - player];
    state.bomberTick = (state.bomberTick || 0) + 1;
    if (state.bomberTick % 8 === 0) return { type: 'bomb' };
    const grid = view.grid;
    const target = enemy?.alive ? { x: enemy.x, y: enemy.y } : { x: own.x, y: own.y };
    const step = bfsStep(grid, own, target);
    if (!step) return { type: 'move', dir: pick(['up', 'left', 'down', 'right'], state.bomberTick) };
    const name = dirName(step.dx, step.dy);
    return name ? { type: 'move', dir: name } : null;
  },

  snake(view, player, state) {
    const own = view.snakes[player];
    if (!own?.alive) return null;
    const head = own.body[0];
    state.snakeTick = (state.snakeTick || 0) + 1;
    const candidates = Object.keys(DIRS).filter(name => name !== OPPOSITE[own.dir] && name !== own.pending);
    if (!candidates.length) return null;
    const bad = name => {
      const [dx, dy] = DIRS[name], x = head.x + dx, y = head.y + dy;
      if (x < 0 || y < 0 || x >= view.cols || y >= view.rows) return true;
      return view.snakes.some(snake => snake.body.some((cell, index) => index < snake.body.length - 1 && cell.x === x && cell.y === y));
    };
    const safe = candidates.filter(name => !bad(name));
    if (!safe.length) return { type: 'direction', dir: candidates[0] };
    const foods = view.food ?? [];
    const score = name => {
      const [dx, dy] = DIRS[name], x = head.x + dx, y = head.y + dy;
      const distance = foods.length ? Math.min(...foods.map(food => Math.abs(food.x - x) + Math.abs(food.y - y))) : 0;
      return distance;
    };
    safe.sort((a, b) => score(a) - score(b));
    const choice = safe[state.snakeTick % Math.min(2, safe.length)];
    return choice === own.pending ? null : { type: 'direction', dir: choice };
  },

  tetris(view, player) {
    const own = view.players[player];
    if (!own?.alive) return null;
    return { type: 'drop' };
  },

  slingshot(view, player, state) {
    if (view.turn !== player || view.projectile) return null;
    state.slingShot = (state.slingShot || 0) + 1;
    const angles = [24, 22, 27, 20, 30, 18, 33];
    const powers = [100, 96, 100, 92, 100, 88, 100];
    return { type: 'shoot', angle: pick(angles, state.slingShot), power: pick(powers, state.slingShot) };
  },

  maze(view, player, state) {
    const own = view.players[player];
    const goal = view.flag.carrier === player ? view.bases[player] : view.flag;
    const step = bfsStep(view.grid, own, goal);
    if (!step) {
      if (view.flag.carrier === null && view.flag.x === own.x && view.flag.y === own.y) return null;
      state.mazeTick = (state.mazeTick || 0) + 1;
      return { type: 'move', dir: pick(['up', 'right', 'down', 'left'], state.mazeTick) };
    }
    const name = dirName(step.dx, step.dy);
    return name ? { type: 'move', dir: name } : null;
  },

  quiz(view, player, state) {
    if (view.phase !== 'answer' || view.answered[player]) return null;
    state.quizAnswer = (state.quizAnswer || 0) + 1;
    return { type: 'answer', choice: state.quizAnswer % 4, round: view.round };
  },

  g2048(view, player, state) {
    state.mergeTick = (state.mergeTick || 0) + 1;
    return { type: 'move', direction: pick(['left', 'up', 'right', 'down'], state.mergeTick) };
  },

  sudoku(view, player, state) {
    if (!state.solution) state.solution = solveSudoku(view.givens);
    const own = view.players[player];
    const missing = [];
    for (let i = 0; i < 81; i++) if (!view.givens[i] && own.cells[i] !== state.solution[i]) missing.push(i);
    if (!missing.length) return null;
    return { type: 'set', index: missing[0], value: state.solution[missing[0]] };
  },

  reversi(view, player) {
    if (view.turn !== player || !view.legalMoves?.length) return null;
    return { type: 'place', index: view.legalMoves[0] };
  },

  rps(view, player, state) {
    if (view.phase !== 'choose' || view.ownChoice !== null) return null;
    state.rpsChoice = (state.rpsChoice || 0) + 1;
    return { type: 'choose', choice: pick(['rock', 'paper', 'scissors'], state.rpsChoice + player) };
  },

  reaction(view, player) {
    if (view.phase !== 'ready') return null;
    return { type: 'tap', round: view.round };
  },

  mines(view, player) {
    const index = firstIndex(view.board, (cell, i) => cell === null && !view.flags[i]);
    return index < 0 ? null : { type: 'open', index };
  },

  typing(view) {
    return view.input === view.text ? null : { type: 'input', text: view.text };
  },

  simon(view, player, state) {
    state.simonSeen ??= [];
    state.simonSent ??= 0;
    if (view.phase === 'show') {
      if (view.cue !== null && view.cue !== undefined) state.simonSeen[view.cueIndex] = view.cue;
      return null;
    }
    if (view.phase !== 'input') return null;
    const own = view.players[player];
    if (own.done) return null;
    const sequence = state.simonSeen.slice(0, view.length);
    if (sequence.length < view.length || sequence.some(note => note === undefined)) return null;
    if (own.position >= view.length) return null;
    const note = sequence[own.position];
    if (note === undefined) return null;
    return { type: 'note', note, round: view.round };
  },
};