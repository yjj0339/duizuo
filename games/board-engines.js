// Pure authoritative rules. Hidden maps and PRNG state never leave view().
const copy = value => JSON.parse(JSON.stringify(value));
const int = (n, max) => Number.isInteger(n) && n >= 0 && n < max;
const isPlayer = p => p === 0 || p === 1;
const valid = (s, p, a, now) => s.status === 'playing' && isPlayer(p) &&
  a !== null && typeof a === 'object' && !Array.isArray(a) && typeof a.type === 'string' && Number.isFinite(now);
const within = (s, now) => !Number.isFinite(s.endsAt) || now < s.endsAt;
function base(seed, now, message) {
  return { status: 'playing', winner: null, scores: [0, 0], message,
    _rng: (Number.isInteger(seed) ? seed >>> 0 : 1) || 1, startedAt: Number.isFinite(now) ? now : 0 };
}
function random(s) { s._rng = (Math.imul(s._rng, 1664525) + 1013904223) >>> 0; return s._rng / 4294967296; }
function shuffle(s, list) {
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(random(s) * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list;
}
function common(s, fields = {}) {
  return copy({ status: s.status, winner: s.winner, scores: s.scores, message: s.message,
    ...(isPlayer(s.turn) ? { turn: s.turn } : {}), ...(Number.isFinite(s.endsAt) ? { endsAt: s.endsAt } : {}), ...fields });
}
function finish(s, winner, message) { s.status = 'finished'; s.winner = winner; s.message = message; }
function leader(s) { return s.scores[0] === s.scores[1] ? -1 : s.scores[0] > s.scores[1] ? 0 : 1; }
function expireTurn(s, _dt, now) {
  if (s.status === 'playing' && Number.isFinite(now) && now >= s.endsAt)
    finish(s, 1 - s.turn, `玩家 ${s.turn + 1} 回合超时，对方获胜。`);
}
function setTurn(s, player, now, seconds = 45) { s.turn = player; s.endsAt = now + seconds * 1000; }
const around = (index, size) => {
  const x = index % size, y = Math.floor(index / size), out = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
    if ((dx || dy) && x + dx >= 0 && x + dx < size && y + dy >= 0 && y + dy < size) out.push((y + dy) * size + x + dx);
  return out;
};

const gomoku = {
  create(seed, now) {
    const s = { ...base(seed, now, '玩家 1 执黑先行。连成五子即可获胜。'), size: 15, board: Array(225).fill(-1), lastMove: null, winningLine: [] };
    setTurn(s, 0, now, 60); return s;
  },
  action(s, p, a, now) {
    if (!valid(s, p, a, now) || !within(s, now) || a.type !== 'place' || s.turn !== p || !int(a.index, 225) || s.board[a.index] !== -1) return false;
    s.board[a.index] = p; s.scores[p]++; s.lastMove = a.index;
    const x = a.index % 15, y = Math.floor(a.index / 15);
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const line = [a.index];
      for (const sign of [-1, 1]) {
        let xx = x + dx * sign, yy = y + dy * sign;
        while (xx >= 0 && xx < 15 && yy >= 0 && yy < 15 && s.board[yy * 15 + xx] === p) {
          if (sign < 0) line.unshift(yy * 15 + xx); else line.push(yy * 15 + xx);
          xx += dx * sign; yy += dy * sign;
        }
      }
      if (line.length >= 5) { s.winningLine = line; finish(s, p, `玩家 ${p + 1} 五子连珠！`); return true; }
    }
    if (!s.board.includes(-1)) finish(s, -1, '棋盘已满，双方和棋。');
    else { setTurn(s, 1 - p, now, 60); s.message = `轮到玩家 ${s.turn + 1} 落子。每步 60 秒。`; }
    return true;
  },
  tick: expireTurn,
  view: s => common(s, { size: 15, board: s.board, lastMove: s.lastMove, winningLine: s.winningLine })
};

const SHIP_LENGTHS = [4, 3, 2];
function shipCells(index, length, vertical) {
  const x = index % 8, y = Math.floor(index / 8);
  if ((vertical && y + length > 8) || (!vertical && x + length > 8)) return null;
  return Array.from({ length }, (_, i) => index + i * (vertical ? 8 : 1));
}
function makeFleet(s) {
  const occupied = new Set(), ships = [];
  for (const length of SHIP_LENGTHS) {
    const candidates = [];
    for (let index = 0; index < 64; index++) for (const vertical of [false, true]) {
      const cells = shipCells(index, length, vertical);
      if (cells && cells.every(i => !occupied.has(i))) candidates.push({ length, index, vertical, cells, hits: 0 });
    }
    const ship = candidates[Math.floor(random(s) * candidates.length)];
    ship.cells.forEach(i => occupied.add(i)); ships.push(ship);
  }
  return ships;
}
function beginFleet(s, now) { s.phase = 'battle'; s.ready = [true, true]; setTurn(s, 0, now); s.message = '布阵完成！玩家 1 先轰炸。每回合一发。'; }
const fleet = {
  create(seed, now) {
    const s = { ...base(seed, now, '调整自己的三艘舰船，确认后点击布阵完成。'), phase: 'setup', ready: [false, false], shots: [Array(64).fill(-1), Array(64).fill(-1)], endsAt: now + 90000, turn: 0, lastShot: null };
    s.fleets = [makeFleet(s), makeFleet(s)]; return s;
  },
  action(s, p, a, now) {
    if (!valid(s, p, a, now) || !within(s, now)) return false;
    if (s.phase === 'setup') {
      if (s.ready[p]) return false;
      if (a.type === 'randomize') { s.fleets[p] = makeFleet(s); return true; }
      if (a.type === 'placeShip') {
        if (!int(a.ship, 3) || !int(a.index, 64) || typeof a.vertical !== 'boolean') return false;
        const cells = shipCells(a.index, SHIP_LENGTHS[a.ship], a.vertical);
        if (!cells || s.fleets[p].some((ship, i) => i !== a.ship && ship.cells.some(c => cells.includes(c)))) return false;
        s.fleets[p][a.ship] = { length: SHIP_LENGTHS[a.ship], index: a.index, vertical: a.vertical, cells, hits: 0 }; return true;
      }
      if (a.type === 'ready') {
        s.ready[p] = true;
        if (s.ready.every(Boolean)) beginFleet(s, now); else s.message = `玩家 ${p + 1} 已准备，等待另一方布阵。`;
        return true;
      }
      return false;
    }
    if (a.type !== 'fire' || s.turn !== p || !int(a.index, 64) || s.shots[p][a.index] !== -1) return false;
    const ship = s.fleets[1 - p].find(v => v.cells.includes(a.index));
    s.shots[p][a.index] = ship ? 1 : 0; s.lastShot = { player: p, index: a.index, hit: Boolean(ship) };
    if (ship) {
      ship.hits++; s.scores[p]++;
      if (ship.hits === ship.length) ship.cells.forEach(i => { s.shots[p][i] = 2; });
    }
    if (s.scores[p] === 9) finish(s, p, `玩家 ${p + 1} 击沉全部敌舰！`);
    else { setTurn(s, 1 - p, now); s.message = `${ship ? ship.hits === ship.length ? '敌舰沉没！' : '命中！' : '落空。'}轮到玩家 ${s.turn + 1} 轰炸。`; }
    return true;
  },
  tick(s, dt, now) {
    if (s.status !== 'playing' || !Number.isFinite(now)) return;
    if (s.phase === 'setup' && now >= s.endsAt) beginFleet(s, now);
    else if (s.phase === 'battle') expireTurn(s, dt, now);
  },
  view(s, p) {
    p = isPlayer(p) ? p : 0;
    const ownBoard = Array(64).fill(0);
    s.fleets[p].forEach(ship => ship.cells.forEach(i => { ownBoard[i] = 1; }));
    s.shots[1 - p].forEach((value, i) => { if (value >= 0) ownBoard[i] = value === 0 ? 3 : 2; });
    return common(s, { size: 8, phase: s.phase, ready: s.ready, ownBoard, ownShips: s.fleets[p], targetBoard: s.shots[p],
      enemyShips: s.fleets[1 - p].map(v => ({ length: v.length, sunk: v.hits === v.length })), lastShot: s.lastShot });
  }
};

function boxEdges(box) {
  const x = box % 4, y = Math.floor(box / 4);
  return [y * 4 + x, (y + 1) * 4 + x, 20 + y * 5 + x, 20 + y * 5 + x + 1];
}
const dots = {
  create(seed, now) {
    const s = { ...base(seed, now, '连接相邻圆点，围出方格可以继续画线。'), edges: Array(40).fill(-1), boxes: Array(16).fill(-1), lastLine: null };
    setTurn(s, 0, now); return s;
  },
  action(s, p, a, now) {
    if (!valid(s, p, a, now) || !within(s, now) || a.type !== 'line' || s.turn !== p || !int(a.index, 40) || s.edges[a.index] !== -1) return false;
    s.edges[a.index] = p; s.lastLine = a.index; let taken = 0;
    for (let b = 0; b < 16; b++) if (s.boxes[b] === -1 && boxEdges(b).every(i => s.edges[i] !== -1)) { s.boxes[b] = p; s.scores[p]++; taken++; }
    if (!s.boxes.includes(-1)) finish(s, leader(s), '所有方格已归属，按领地数量结算。');
    else { setTurn(s, taken ? p : 1 - p, now); s.message = taken ? `玩家 ${p + 1} 围出 ${taken} 格，继续行动！` : `轮到玩家 ${s.turn + 1} 连接圆点。`; }
    return true;
  },
  tick: expireTurn,
  view: s => common(s, { size: 4, edges: s.edges, boxes: s.boxes, lastLine: s.lastLine })
};

const memory = {
  create(seed, now) {
    const s = { ...base(seed, now, '每次翻两张；配对得 1 分并继续翻牌。'), cards: [], owners: Array(24).fill(-1), open: [], phase: 'choose', revealUntil: 0 };
    s.cards = shuffle(s, Array.from({ length: 24 }, (_, i) => i % 12)); setTurn(s, 0, now, 30); return s;
  },
  action(s, p, a, now) {
    if (!valid(s, p, a, now) || !within(s, now) || a.type !== 'flip' || s.turn !== p || s.phase !== 'choose' || !int(a.index, 24) || s.owners[a.index] !== -1 || s.open.includes(a.index)) return false;
    s.open.push(a.index);
    if (s.open.length === 1) s.message = `玩家 ${p + 1} 再翻一张，找出相同图案。`;
    else if (s.cards[s.open[0]] === s.cards[s.open[1]]) {
      s.open.forEach(i => { s.owners[i] = p; }); s.open = []; s.scores[p]++;
      if (s.scores[0] + s.scores[1] === 12) finish(s, leader(s), '全部配对完成，按配对数量结算。');
      else { setTurn(s, p, now, 30); s.message = `配对成功！玩家 ${p + 1} 继续。`; }
    } else { s.phase = 'reveal'; s.revealUntil = now + 1400; s.endsAt = s.revealUntil; s.message = '记住这两张！稍后轮到另一位玩家。'; }
    return true;
  },
  tick(s, dt, now) {
    if (s.status !== 'playing' || !Number.isFinite(now)) return;
    if (s.phase === 'reveal' && now >= s.revealUntil) {
      s.open = []; s.phase = 'choose'; setTurn(s, 1 - s.turn, now, 30); s.message = `轮到玩家 ${s.turn + 1} 翻牌。`;
    } else if (s.phase === 'choose') expireTurn(s, dt, now);
  },
  view: s => common(s, { faces: s.cards.map((face, i) => s.owners[i] !== -1 || s.open.includes(i) ? face : null), owners: s.owners, open: s.open, phase: s.phase, revealUntil: s.revealUntil })
};

const DIR8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function reversiFlips(board, player, index) {
  if (board[index] !== -1) return [];
  const x = index % 8, y = Math.floor(index / 8), out = [];
  for (const [dx, dy] of DIR8) {
    let xx = x + dx, yy = y + dy; const line = [];
    while (xx >= 0 && xx < 8 && yy >= 0 && yy < 8 && board[yy * 8 + xx] === 1 - player) {
      line.push(yy * 8 + xx); xx += dx; yy += dy;
    }
    if (line.length && xx >= 0 && xx < 8 && yy >= 0 && yy < 8 && board[yy * 8 + xx] === player) out.push(...line);
  }
  return out;
}
function reversiMoves(s, p) { return s.board.flatMap((cell, i) => cell === -1 && reversiFlips(s.board, p, i).length ? [i] : []); }
function countReversi(s) { s.scores = [s.board.filter(c => c === 0).length, s.board.filter(c => c === 1).length]; }
const reversi = {
  create(seed, now) {
    const s = { ...base(seed, now, '玩家 1 执黑。落子夹住对方棋子即可翻转。'), board: Array(64).fill(-1), lastMove: null, passed: null };
    s.board[27] = 1; s.board[28] = 0; s.board[35] = 0; s.board[36] = 1; countReversi(s); setTurn(s, 0, now); return s;
  },
  action(s, p, a, now) {
    if (!valid(s, p, a, now) || !within(s, now) || a.type !== 'place' || s.turn !== p || !int(a.index, 64)) return false;
    const flips = reversiFlips(s.board, p, a.index); if (!flips.length) return false;
    s.board[a.index] = p; flips.forEach(i => { s.board[i] = p; }); s.lastMove = a.index; s.passed = null; countReversi(s);
    if (reversiMoves(s, 1 - p).length) { setTurn(s, 1 - p, now); s.message = `翻转 ${flips.length} 枚，轮到玩家 ${s.turn + 1}。`; }
    else if (reversiMoves(s, p).length) { s.passed = 1 - p; setTurn(s, p, now); s.message = `玩家 ${2 - p} 无合法落子，自动跳过。玩家 ${p + 1} 继续。`; }
    else finish(s, leader(s), '双方均无法落子，按棋子数量结算。');
    return true;
  },
  tick: expireTurn,
  view: s => common(s, { size: 8, board: s.board, lastMove: s.lastMove, passed: s.passed, legalMoves: s.status === 'playing' ? reversiMoves(s, s.turn) : [] })
};

const CHOICES = ['rock', 'paper', 'scissors'];
function resolveRps(s, now, timeout = false) {
  const [a, b] = s.choices; let win = -1;
  if (a && !b) win = 0;
  else if (!a && b) win = 1;
  else if (a !== b) win = ((CHOICES.indexOf(a) - CHOICES.indexOf(b) + 3) % 3 === 1) ? 0 : 1;
  s.reveal = [a, b]; s.phase = 'reveal'; s.roundWinner = win; s.revealUntil = now + 2200; s.endsAt = s.revealUntil;
  if (win >= 0) s.scores[win]++;
  s.message = win < 0 ? '平局！下一轮重新出拳。' : `${timeout ? '对方超时，' : ''}玩家 ${win + 1} 赢得本轮。`;
  if (win >= 0 && s.scores[win] >= 3) finish(s, win, `玩家 ${win + 1} 先得 3 分，赢得擂台！`);
}
const rps = {
  create(seed, now) { return { ...base(seed, now, '双方暗选，齐选后揭晓。先得 3 分获胜。'), choices: [null, null], phase: 'choose', round: 1, reveal: null, roundWinner: null, revealUntil: 0, endsAt: now + 20000 }; },
  action(s, p, a, now) {
    if (!valid(s, p, a, now) || !within(s, now) || a.type !== 'choose' || s.phase !== 'choose' || s.choices[p] !== null || !CHOICES.includes(a.choice)) return false;
    s.choices[p] = a.choice;
    if (s.choices.every(Boolean)) resolveRps(s, now); else s.message = '一位玩家已锁定，等待另一位出拳。';
    return true;
  },
  tick(s, _dt, now) {
    if (s.status !== 'playing' || !Number.isFinite(now) || now < s.endsAt) return;
    if (s.phase === 'reveal') {
      s.phase = 'choose'; s.round++; s.choices = [null, null]; s.reveal = null; s.roundWinner = null; s.endsAt = now + 20000; s.message = `第 ${s.round} 轮，请暗选出拳。`;
    } else if (s.choices.every(v => v === null)) finish(s, leader(s), '双方均未出拳，按当前比分结束对局。');
    else resolveRps(s, now, true);
  },
  view(s, p) { return common(s, { phase: s.phase, round: s.round, ownChoice: s.choices[isPlayer(p) ? p : 0], chosen: s.choices.map(Boolean), reveal: s.reveal, roundWinner: s.roundWinner, revealUntil: s.revealUntil }); }
};

const mines = {
  create(seed, now) {
    const s = { ...base(seed, now, '相同雷图，独立开格。安全格 +1，踩雷 −5；率先开完或 180 秒后结算。'), mineMap: Array(81).fill(0), opened: [Array(81).fill(false), Array(81).fill(false)], flags: [Array(81).fill(false), Array(81).fill(false)], safeOpened: [0, 0], hits: [0, 0], endsAt: now + 180000 };
    shuffle(s, Array.from({ length: 81 }, (_, i) => i)).slice(0, 12).forEach(i => { s.mineMap[i] = 1; }); return s;
  },
  action(s, p, a, now) {
    if (!valid(s, p, a, now) || !within(s, now) || !int(a.index, 81) || !['flag', 'open', 'chord'].includes(a.type)) return false;
    const index = a.index;
    if (a.type === 'flag') {
      if (s.opened[p][index]) return false;
      if (!s.flags[p][index] && s.flags[p].filter(Boolean).length >= 12) return false;
      s.flags[p][index] = !s.flags[p][index]; return true;
    }
    let queue;
    if (a.type === 'chord') {
      if (!s.opened[p][index] || s.mineMap[index]) return false;
      const adjacent = around(index, 9), number = adjacent.filter(i => s.mineMap[i]).length;
      if (!number || adjacent.filter(i => s.flags[p][i]).length !== number) return false;
      queue = adjacent.filter(i => !s.opened[p][i] && !s.flags[p][i]);
      if (!queue.length) return false;
    } else {
      if (s.opened[p][index] || s.flags[p][index]) return false;
      queue = [index];
    }
    let penalty = 0, added = 0;
    while (queue.length) {
      const i = queue.pop();
      if (s.opened[p][i] || s.flags[p][i]) continue;
      s.opened[p][i] = true;
      if (s.mineMap[i]) { s.hits[p]++; s.scores[p] -= 5; penalty++; }
      else {
        s.safeOpened[p]++; s.scores[p]++; added++;
        const adjacent = around(i, 9);
        if (adjacent.every(n => !s.mineMap[n])) queue.push(...adjacent.filter(n => !s.opened[p][n] && !s.flags[p][n]));
      }
    }
    s.message = penalty ? `玩家 ${p + 1} 踩雷扣 ${penalty * 5} 分，还可以继续。` : `玩家 ${p + 1} 打开 ${added} 个安全格。`;
    if (s.safeOpened[p] === 69) finish(s, leader(s), `玩家 ${p + 1} 完成安全格，按总分结算。`);
    return true;
  },
  tick(s, _dt, now) { if (s.status === 'playing' && Number.isFinite(now) && now >= s.endsAt) finish(s, leader(s), '180 秒结束，按安全格得分减踩雷罚分结算。'); },
  view(s, p) {
    p = isPlayer(p) ? p : 0;
    return common(s, { size: 9, mineCount: 12, board: s.opened[p].map((open, i) => open ? s.mineMap[i] ? -1 : around(i, 9).filter(n => s.mineMap[n]).length : null),
      flags: s.flags[p], safeOpened: s.safeOpened, hits: s.hits });
  }
};

export const games = { gomoku, fleet, dots, memory, reversi, rps, mines };
