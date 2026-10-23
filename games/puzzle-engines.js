// All clocks, random streams, scores and answers belong to the server.
import {additionalQuestions} from '../shared/trivia.js';
const clone = value => JSON.parse(JSON.stringify(value));
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const base = (now, duration, message) => ({ status: 'playing', winner: null, scores: [0, 0], message, startedAt: now, endsAt: now + duration, _now: now });
const common = s => ({ status: s.status, winner: s.winner, scores: [...s.scores], message: s.message, startedAt: s.startedAt, endsAt: s.endsAt, now: s._now });
function random(holder, key = '_rng') {
  let x = holder[key] >>> 0 || 1;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  holder[key] = x >>> 0;
  return holder[key] / 4294967296;
}
function shuffled(values, holder) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random(holder) * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
function finish(s, message, winner) {
  if (s.status !== 'playing') return;
  s.status = 'finished';
  s.winner = winner ?? (s.scores[0] === s.scores[1] ? -1 : s.scores[0] > s.scores[1] ? 0 : 1);
  s.message = message;
}
function clock(s, now) {
  if (s.status !== 'playing' || !Number.isFinite(now) || now < s._now) return false;
  s._now = now;
  return true;
}
function valid(s, player, action, now) {
  return s.status === 'playing' && integer(player, 0, 1) && action !== null && typeof action === 'object' && !Array.isArray(action) && typeof action.type === 'string' && Number.isFinite(now) && now >= s._now;
}

const DIRECTIONS = ['up', 'right', 'down', 'left'];
function move2048(cells, direction) {
  const next = Array(16).fill(0);
  let points = 0; const slides = [], merged = [];
  for (let line = 0; line < 4; line++) {
    const indices = Array.from({ length: 4 }, (_, offset) => direction === 'left' ? line * 4 + offset : direction === 'right' ? line * 4 + 3 - offset : direction === 'up' ? offset * 4 + line : (3 - offset) * 4 + line);
    const occupied = indices.filter(i => cells[i]);
    const values = occupied.map(i => cells[i]);
    let to = 0;
    for (let j = 0; j < values.length; j++) {
      const target = indices[to++];
      slides.push({from:occupied[j],to:target,value:values[j]});
      if (values[j] === values[j + 1]) { const value = values[j] * 2; next[target] = value; points += value; merged.push(target);slides.push({from:occupied[j+1],to:target,value:values[j+1]}); j++; }
      else next[target] = values[j];
    }
  }
  return { cells: next, points, slides, merged, changed: next.some((v, i) => v !== cells[i]) };
}
function spawn2048(p) {
  const empty = p.cells.flatMap((value, i) => value === 0 ? [i] : []);
  if (!empty.length) return;
  const index = empty[Math.floor(random(p) * empty.length)];
  p.cells[index] = random(p) < 0.9 ? 2 : 4;
  return {index,value:p.cells[index]};
}
function can2048(cells) {
  return cells.some((v, i) => !v || i % 4 < 3 && v === cells[i + 1] || i + 4 < 16 && v === cells[i + 4]);
}
const g2048 = {
  create(seed, now) {
    const players = [0, 1].map(() => { const p = { cells: Array(16).fill(0), moves: 0, stuck: false, _rng: seed >>> 0 || 1 }; spawn2048(p); spawn2048(p); return p; });
    return { ...base(now, 180000, '3 分钟同种子对决：滑动合并，分数更高者获胜。'), players };
  },
  action(s, player, a, now) {
    if (!valid(s, player, a, now) || a.type !== 'move' || !DIRECTIONS.includes(a.direction)) return false;
    this.tick(s, 0, now); if (s.status !== 'playing' || s.players[player].stuck) return false;
    const p = s.players[player], result = move2048(p.cells, a.direction);
    if (!result.changed) return false;
    p.cells = result.cells; p.moves++; s.scores[player] += result.points;
    p.motion={number:p.moves,direction:a.direction,slides:result.slides,merged:result.merged,spawn:spawn2048(p)};
    p.stuck = !can2048(p.cells);
    if (s.players.every(p => p.stuck)) finish(s, '双方棋盘均已无路可走，按分数结算。');
    return true;
  },
  tick(s, dt, now) {
    if (!clock(s, now)) return;
    for (const p of s.players) p.stuck = !can2048(p.cells);
    if (now >= s.endsAt || s.players.every(p => p.stuck)) finish(s, now >= s.endsAt ? '时间到，按合并分数结算。' : '双方棋盘均已满，按分数结算。');
  },
  view(s) { return { ...common(s), players: s.players.map(p => ({ cells: [...p.cells], moves: p.moves, stuck: p.stuck, highest: Math.max(...p.cells),motion:p.motion?clone(p.motion):null })) }; }
};

const SUDOKU_PUZZLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
const SUDOKU_SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
function sudokuPuzzle(seed) {
  const rng = { _rng: seed >>> 0 || 1 };
  const digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  const rows = shuffled([0, 1, 2], rng).flatMap(band => shuffled([0, 1, 2], rng).map(row => band * 3 + row));
  const cols = shuffled([0, 1, 2], rng).flatMap(stack => shuffled([0, 1, 2], rng).map(col => stack * 3 + col));
  const transform = text => rows.flatMap(row => cols.map(col => Number(text[row * 9 + col]))).map(n => n ? digits[n - 1] : 0);
  return { givens: transform(SUDOKU_PUZZLE), _solution: transform(SUDOKU_SOLUTION) };
}
const sudoku = {
  create(seed, now) {
    const puzzle = sudokuPuzzle(seed);
    return { ...base(now, 600000, '相同唯一解数独。先正确填完获胜；10 分钟到时比较正确格数与错误惩罚。'), ...puzzle, players: [0, 1].map(() => ({ cells: [...puzzle.givens], correct: 0, mistakes: 0, lastWrong: -1 })) };
  },
  action(s, player, a, now) {
    if (!valid(s, player, a, now) || a.type !== 'set' || !integer(a.index, 0, 80) || !integer(a.value, 0, 9) || s.givens[a.index]) return false;
    this.tick(s, 0, now); if (s.status !== 'playing') return false;
    const p = s.players[player];
    if (p.cells[a.index] === a.value) return false;
    p.cells[a.index] = a.value; p.lastWrong = -1;
    if (a.value && a.value !== s._solution[a.index]) { p.mistakes++; p.lastWrong = a.index; }
    p.correct = p.cells.reduce((sum, value, index) => sum + (!s.givens[index] && value === s._solution[index] ? 1 : 0), 0);
    s.scores[player] = Math.max(0, p.correct * 10 - p.mistakes * 2);
    if (p.correct === s.givens.filter(v => !v).length) finish(s, `玩家 ${player + 1} 正确完成数独。`, player);
    return true;
  },
  tick(s, dt, now) { if (clock(s, now) && now >= s.endsAt) finish(s, '时间到：每个正确空格 10 分，每次错误填数扣 2 分。'); },
  view(s, player) {
    return { ...common(s), givens: [...s.givens], total: s.givens.filter(v => !v).length, players: s.players.map((p, i) => ({ correct: p.correct, mistakes: p.mistakes, ...(i === player ? { cells: [...p.cells], lastWrong: p.lastWrong, wrong: p.cells.map((n, j) => Boolean(n && !s.givens[j] && n !== s._solution[j])) } : {}) })) };
  }
};

// Fixed, reviewed general knowledge; correct indices are never sent before reveal.
const QUESTIONS = [
  ...additionalQuestions,
  ['太阳系中最大的行星是？', ['木星', '地球', '火星', '金星'], 0, '木星是太阳系中体积和质量最大的行星。'],
  ['标准大气压下，纯水的沸点约为？', ['100°C', '0°C', '50°C', '200°C'], 0, '标准大气压下，纯水约在 100°C 沸腾。'],
  ['中国传统节日中，农历八月十五是？', ['中秋节', '端午节', '元宵节', '重阳节'], 0, '中秋节在农历八月十五。'],
  ['一个正方形有几条对称轴？', ['4 条', '1 条', '2 条', '8 条'], 0, '两条对角线和两条对边中线都是对称轴。'],
  ['《静夜思》的作者是？', ['李白', '杜甫', '白居易', '王维'], 0, '《静夜思》是唐代诗人李白的作品。'],
  ['植物进行光合作用主要吸收哪种气体？', ['二氧化碳', '氧气', '氦气', '氢气'], 0, '光合作用利用二氧化碳和水，在光能作用下合成有机物。'],
  ['二进制数 10 对应的十进制数是？', ['2', '10', '1', '0'], 0, '二进制 10 等于一个 2 加零个 1。'],
  ['下列哪一种动物属于哺乳动物？', ['海豚', '鲨鱼', '章鱼', '企鹅'], 0, '海豚用肺呼吸，并以乳汁哺育幼崽。'],
  ['地球自转一周大约需要？', ['24 小时', '12 小时', '7 天', '365 天'], 0, '地球自转一周约为 24 小时。'],
  ['直角三角形中，一个直角等于？', ['90°', '45°', '60°', '180°'], 0, '直角是 90° 的角。'],
  ['英语单词 library 通常表示？', ['图书馆', '机场', '医院', '厨房'], 0, 'Library 通常指图书馆。'],
  ['奥运会五环图案共有几个圆环？', ['5 个', '4 个', '6 个', '7 个'], 0, '奥运五环图案由五个相扣的圆环组成。']
];
function quizReveal(s, now) {
  for (let player = 0; player < 2; player++) if (s.choices[player] === s._questions[s.round].correct) s.scores[player] += 100;
  s.phase = 'reveal'; s.phaseEndsAt = now + 1800; s.message = '答案揭晓，下一题即将开始。';
}
const quiz = {
  create(seed, now) {
    const rng = { _rng: seed >>> 0 || 1 };
    const questions = shuffled(QUESTIONS, rng).slice(0, 8).map(([text, choices, correct, explanation]) => {
      const order = shuffled([0, 1, 2, 3], rng);
      return { text, choices: order.map(i => choices[i]), correct: order.indexOf(correct), explanation };
    });
    return { ...base(now, 8 * 13800, '共 8 题，每题 12 秒。答对 100 分，不按网速加分。'), _questions: questions, round: 0, phase: 'answer', phaseEndsAt: now + 12000, choices: [null, null] };
  },
  action(s, player, a, now) {
    if (!valid(s, player, a, now) || a.type !== 'answer' || !integer(a.choice, 0, 3) || a.round !== s.round) return false;
    this.tick(s, 0, now);
    if (s.status !== 'playing' || s.phase !== 'answer' || a.round !== s.round || s.choices[player] !== null) return false;
    s.choices[player] = a.choice;
    if (s.choices.every(c => c !== null)) quizReveal(s, now);
    return true;
  },
  tick(s, dt, now) {
    if (!clock(s, now)) return;
    if (now >= s.endsAt) { if (s.phase === 'answer') quizReveal(s, now); finish(s, '知识擂台结束，按答对题数结算。'); return; }
    while (s.status === 'playing' && now >= s.phaseEndsAt) {
      const boundary = s.phaseEndsAt;
      if (s.phase === 'answer') quizReveal(s, boundary);
      else if (++s.round >= s._questions.length) finish(s, '8 道题已完成，按答对题数结算。');
      else { s.phase = 'answer'; s.choices = [null, null]; s.phaseEndsAt = boundary + 12000; s.message = '同题作答：选好后不能更改，答对 100 分。'; }
    }
  },
  view(s, player) {
    const q = s._questions[Math.min(s.round, s._questions.length - 1)], reveal = s.phase === 'reveal' || s.status === 'finished';
    return { ...common(s), round: s.round, totalRounds: 8, phase: s.phase, phaseEndsAt: s.phaseEndsAt, answered: s.choices.map(c => c !== null), choices: s.choices.map((c, i) => reveal || i === player ? c : null), question: { text: q.text, choices: [...q.choices], ...(reveal ? { correct: q.correct, explanation: q.explanation } : {}) } };
  }
};

function reactionRound(s, now) {
  s.phase = 'waiting'; s.responses = [null, null]; s._signalAt = now + 1800 + Math.floor(random(s) * 3000); s.phaseEndsAt = s._signalAt + 3000;
  s.message = '等待绿色信号；提前点击扣 50 分。网络延迟会影响成绩。';
}
function reactionReveal(s, now) { s.phase = 'reveal'; s.phaseEndsAt = now + 1200; s.message = '本轮结束：绿色信号后越快点击，得分越高。'; }
const reaction = {
  create(seed, now) { const s = { ...base(now, 60000, ''), _rng: seed >>> 0 || 1, round: 0, phase: 'waiting', responses: [null, null] }; reactionRound(s, now); return s; },
  action(s, player, a, now) {
    if (!valid(s, player, a, now) || a.type !== 'tap' || a.round !== s.round) return false;
    this.tick(s, 0, now);
    if (s.status !== 'playing' || a.round !== s.round || s.phase === 'reveal' || s.responses[player] !== null) return false;
    if (now < s._signalAt) { s.responses[player] = -1; s.scores[player] -= 50; }
    else { s.responses[player] = Math.floor(now - s._signalAt); s.scores[player] += Math.max(1, 1000 - s.responses[player]); }
    if (s.responses.every(r => r !== null)) reactionReveal(s, now);
    return true;
  },
  tick(s, dt, now) {
    if (!clock(s, now)) return;
    if (now >= s.endsAt) { finish(s, '反应力对决结束。网络延迟可能影响结果。'); return; }
    while (s.status === 'playing' && now >= s.phaseEndsAt) {
      const boundary = s.phaseEndsAt;
      if (s.phase !== 'reveal') reactionReveal(s, boundary);
      else if (++s.round >= 5) finish(s, '5 轮反应力对决完成。网络延迟可能影响结果。');
      else reactionRound(s, boundary);
    }
    if (s.phase === 'waiting' && now >= s._signalAt) { s.phase = 'ready'; s.message = '绿色信号：现在点击！'; }
  },
  view(s) { return { ...common(s), round: s.round, totalRounds: 5, phase: s.phase, responses: [...s.responses], phaseEndsAt: s.phase === 'waiting' ? null : s.phaseEndsAt }; }
};

const PHRASES = [
  '清晨的阳光穿过树叶，我们沿着小路走向湖边。微风吹过，今天也是值得认真度过的一天。',
  '周末一起去看海吧，带上相机和喜欢的零食。听浪花拍打沙滩，把快乐收藏在普通的日子里。',
  '每一颗星星都有自己的光，每一次练习都让我们更熟练。保持耐心，也记得为小小的进步鼓掌。',
  '厨房里飘来面包的香气，窗外的小鸟唱着歌。把热茶倒进杯子，和朋友聊聊最近遇见的趣事。'
];
function prefixLength(text, target) { const a = Array.from(text), b = Array.from(target); let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; }
const typing = {
  create(seed, now) { const r = { _rng: seed >>> 0 || 1 }; return { ...base(now, 90000, '相同中文短文，含标点；先完整正确输入获胜。支持中文输入法，可随时修改。'), text: PHRASES[Math.floor(random(r) * PHRASES.length)], players: [0, 1].map(() => ({ input: '', correct: 0, length: 0 })) }; },
  action(s, player, a, now) {
    if (!valid(s, player, a, now) || a.type !== 'input' || typeof a.text !== 'string' || a.text.length > 300 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(a.text)) return false;
    this.tick(s, 0, now); if (s.status !== 'playing') return false;
    const p = s.players[player];
    if (p.input === a.text) return false;
    p.input = a.text; p.correct = prefixLength(a.text, s.text); p.length = Array.from(a.text).length;
    s.scores[player] = Math.floor(1000 * p.correct / Array.from(s.text).length);
    if (a.text === s.text) finish(s, `玩家 ${player + 1} 完整正确输入了短文。`, player);
    return true;
  },
  tick(s, dt, now) { if (clock(s, now) && now >= s.endsAt) finish(s, '时间到，按从开头连续正确的字数结算。'); },
  view(s, player) { return { ...common(s), text: s.text, input: s.players[player]?.input ?? '', total: Array.from(s.text).length, players: s.players.map(p => ({ correct: p.correct, length: p.length })) }; }
};

function simonRound(s, now) {
  s.phase = 'show'; s.showStartedAt = now; s.phaseEndsAt = now + 500 + s._sequence.length * 700;
  s.players = [0, 1].map(() => ({ position: 0, done: false, success: false, lastNote: null }));
  s.message = '观看闪亮音符顺序，播放结束后再按顺序复现。';
}
function simonReveal(s, now) { s.phase = 'reveal'; s.phaseEndsAt = now + 1600; s.message = '本轮结束；每次正确输入 10 分，完整复现额外 30 分。'; }
const simon = {
  create(seed, now) {
    const s = { ...base(now, 240000, ''), _rng: seed >>> 0 || 1, _sequence: [], round: 0 };
    for (let i = 0; i < 3; i++) s._sequence.push(Math.floor(random(s) * 4));
    simonRound(s, now); return s;
  },
  action(s, player, a, now) {
    if (!valid(s, player, a, now) || a.type !== 'note' || !integer(a.note, 0, 3) || a.round !== s.round) return false;
    this.tick(s, 0, now);
    const p = s.players[player];
    if (s.status !== 'playing' || s.phase !== 'input' || a.round !== s.round || p.done) return false;
    p.lastNote = a.note;
    if (a.note === s._sequence[p.position]) {
      p.position++; s.scores[player] += 10;
      if (p.position === s._sequence.length) { p.done = true; p.success = true; s.scores[player] += 30; }
    } else p.done = true;
    if (s.players.every(p => p.done)) simonReveal(s, now);
    return true;
  },
  tick(s, dt, now) {
    if (!clock(s, now)) return;
    if (now >= s.endsAt) { finish(s, '节奏记忆结束，按正确输入与完整复现得分结算。'); return; }
    while (s.status === 'playing' && now >= s.phaseEndsAt) {
      const boundary = s.phaseEndsAt;
      if (s.phase === 'show') { s.phase = 'input'; s.phaseEndsAt = boundary + 7000 + s._sequence.length * 900; s.message = '轮到你了：按刚才的顺序点击音符。'; }
      else if (s.phase === 'input') { for (const p of s.players) p.done = true; simonReveal(s, boundary); }
      else if (++s.round >= 8) finish(s, '8 轮节奏记忆已完成。');
      else { s._sequence.push(Math.floor(random(s) * 4)); simonRound(s, boundary); }
    }
  },
  view(s) {
    const age = s._now - s.showStartedAt - 500, index = Math.floor(age / 700);
    const cue = s.phase === 'show' && age >= 0 && age % 700 < 480 && index < s._sequence.length ? s._sequence[index] : null;
    return { ...common(s), round: s.round, totalRounds: 8, phase: s.phase, phaseEndsAt: s.phaseEndsAt, length: s._sequence.length, cue, cueIndex: cue === null ? null : index, players: clone(s.players) };
  }
};

const SHAPES = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]], O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]], S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]], L: [[2, 0], [0, 1], [1, 1], [2, 1]]
};
const PIECES = Object.keys(SHAPES);
function pieceCells(piece) {
  let cells = SHAPES[piece.kind].map(c => [...c]);
  for (let i = 0; i < piece.rotation; i++) cells = cells.map(([x, y]) => piece.kind === 'O' ? [x, y] : piece.kind === 'I' ? [3 - y, x] : [2 - y, x]);
  return cells.map(([x, y]) => [x + piece.x, y + piece.y]);
}
function fits(p, piece) { return pieceCells(piece).every(([x, y]) => x >= 0 && x < 10 && y < 20 && (y < 0 || !p.board[y * 10 + x])); }
function takePiece(p) {
  if (!p._bag.length) p._bag = shuffled(PIECES, p);
  return p._bag.pop();
}
function spawnPiece(p, now) {
  while (p.queue.length < 4) p.queue.push(takePiece(p));
  p.active = { kind: p.queue.shift(), rotation: 0, x: 3, y: 0 };
  while (p.queue.length < 4) p.queue.push(takePiece(p));
  p._lastFall = now;
  if (!fits(p, p.active)) p.alive = false;
}
function settleTetris(s) {
  const alive = s.players.map(p => p.alive);
  if (!alive[0] || !alive[1]) finish(s, !alive[0] && !alive[1] ? '双方同时封顶，平局。' : `玩家 ${alive[0] ? 2 : 1} 封顶，另一方获胜。`, alive[0] === alive[1] ? -1 : alive[0] ? 0 : 1);
}
function lockPiece(s, player, now) {
  const p = s.players[player], cells = pieceCells(p.active);
  if (cells.some(([, y]) => y < 0) || cells.some(([x, y]) => p.board[y * 10 + x])) { p.alive = false; return; }
  for (const [x, y] of cells) p.board[y * 10 + x] = PIECES.indexOf(p.active.kind) + 1;
  const rows = Array.from({ length: 20 }, (_, y) => p.board.slice(y * 10, y * 10 + 10));
  const kept = rows.filter(row => row.some(n => !n)), cleared = 20 - kept.length;
  const clearedRows=rows.flatMap((row,y)=>row.every(Boolean)?[y]:[]);
  p.board = [...Array(cleared * 10).fill(0), ...kept.flat()];
  p.lines += cleared; s.scores[player] += [0, 100, 300, 500, 800][cleared] || 0;
  let attack = [0, 0, 1, 2, 4][cleared] || 0;
  const cancel = Math.min(p.pending, attack); p.pending -= cancel; attack -= cancel;
  s.players[1 - player].pending += attack;
  const garbage = Math.min(p.pending, 20); p.pending -= garbage;
  for (let i = 0; i < garbage; i++) {
    if (p.board.slice(0, 10).some(Boolean)) p.alive = false;
    p.board.splice(0, 10);
    const hole = Math.floor(random(p, '_garbageRng') * 10);
    p.board.push(...Array.from({ length: 10 }, (_, x) => x === hole ? 0 : 8));
  }
  p.pieces++;
  p.lockEvent={number:p.pieces,cells:cells.map(c=>[...c]),kind:p.active.kind,clearedRows,attack,cancel,garbage};
  spawnPiece(p, now);
}
const tetris = {
  create(seed, now) {
    const players = [0, 1].map(() => {
      const p = { board: Array(200).fill(0), active: null, queue: [], lines: 0, pieces: 0, pending: 0, alive: true, _rng: seed >>> 0 || 1, _garbageRng: (seed ^ 0x9e3779b9) >>> 0 || 1, _bag: [], _lastFall: now };
      spawnPiece(p, now); return p;
    });
    return { ...base(now, 180000, '消 2/3/4 行发送 1/2/4 行障碍；对手封顶获胜。3 分钟未封顶则比较分数。'), players };
  },
  action(s, player, a, now) {
    if (!valid(s, player, a, now)) return false;
    if (!(a.type === 'drop' || a.type === 'move' && ['left', 'right', 'down'].includes(a.direction) || a.type === 'rotate' && (a.direction === 1 || a.direction === -1))) return false;
    this.tick(s, 0, now); if (s.status !== 'playing') return false;
    const p = s.players[player];
    if (!p.alive) return false;
    if (a.type === 'drop') {
      while (fits(p, { ...p.active, y: p.active.y + 1 })) { p.active.y++; s.scores[player] += 2; }
      lockPiece(s, player, now); settleTetris(s); return true;
    }
    if (a.type === 'move') {
      const next = { ...p.active, x: p.active.x + (a.direction === 'left' ? -1 : a.direction === 'right' ? 1 : 0), y: p.active.y + (a.direction === 'down' ? 1 : 0) };
      if (fits(p, next)) { p.active = next; if (a.direction === 'down') { s.scores[player]++; p._lastFall = now; } return true; }
      if (a.direction === 'down') { lockPiece(s, player, now); settleTetris(s); return true; }
      return false;
    }
    const rotation = (p.active.rotation + a.direction + 4) % 4;
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [0, -2]]) {
      const next = { ...p.active, rotation, x: p.active.x + dx, y: p.active.y + dy };
      if (fits(p, next)) { p.active = next; return true; }
    }
    return false;
  },
  tick(s, dt, now) {
    if (!clock(s, now)) return;
    if (now >= s.endsAt) { finish(s, '3 分钟结束，按消行与落块分数结算。'); return; }
    for (let player = 0; player < 2; player++) {
      const p = s.players[player];
      let steps = 0;
      const fall = Math.max(140, 650 - Math.floor(p.lines / 5) * 45);
      while (p.alive && now - p._lastFall >= fall && steps++ < 300) {
        const boundary = p._lastFall + fall;
        p._lastFall = boundary;
        if (fits(p, { ...p.active, y: p.active.y + 1 })) p.active.y++;
        else lockPiece(s, player, boundary);
      }
    }
    settleTetris(s);
  },
  view(s) {
    return { ...common(s), width: 10, height: 20, players: s.players.map(p => {
      const ghost = { ...p.active }; while (p.alive && fits(p, { ...ghost, y: ghost.y + 1 })) ghost.y++;
      return { board: [...p.board], active: { ...p.active }, activeCells: pieceCells(p.active), ghostCells: pieceCells(ghost), next: p.queue.slice(0, 3), lines: p.lines, pending: p.pending, alive: p.alive, pieces:p.pieces, lockEvent:p.lockEvent?clone(p.lockEvent):null };
    }) };
  }
};

export const games = { g2048, sudoku, quiz, reaction, typing, simon, tetris };
