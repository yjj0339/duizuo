import test from 'node:test';
import assert from 'node:assert/strict';

let games = {};
try { ({ games } = await import('../games/puzzle-engines.js')); }
catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; }
const ids = ['g2048', 'sudoku', 'quiz', 'reaction', 'typing', 'simon', 'tetris'];
const game = id => { assert.ok(games[id], `${id} engine must exist`); return games[id]; };
const start = id => game(id).create(137, 1000);

for (const id of ids) {
  test(`${id}: implements deterministic state and rejects malformed actions`, () => {
    const engine = game(id), state = start(id);
    assert.deepEqual(state, engine.create(137, 1000));
    for (const player of [-1, 2, NaN, '0']) assert.equal(engine.action(state, player, { type: 'drop' }, 1001), false);
    for (const action of [null, {}, { type: 'unknown' }, { type: 7 }]) assert.equal(engine.action(state, 0, action, 1001), false);
    assert.equal(engine.action(state, 0, { type: 'drop' }, NaN), false);
    const view = engine.view(state, 0);
    assert.equal(view.status, 'playing');
    assert.deepEqual(view.scores, [0, 0]);
    assert.equal(view.winner, null);
    assert.equal(typeof view.message, 'string');
    assert.doesNotMatch(JSON.stringify(view), /"_(?:rng|solution|questions|sequence|signalAt|bag)"/);
    assert.doesNotThrow(() => JSON.stringify(state));
  });
  test(`${id}: times out to a stable result and rejects later input`, () => {
    const engine = game(id), state = start(id);
    engine.tick(state, 999, state.endsAt + 1);
    assert.equal(state.status, 'finished');
    assert.ok([-1, 0, 1].includes(state.winner));
    const snapshot = JSON.stringify(state);
    engine.tick(state, 1, state.endsAt + 1000);
    assert.equal(JSON.stringify(state), snapshot);
    assert.equal(engine.action(state, 0, { type: 'drop' }, state.endsAt + 1000), false);
  });
}

test('2048: a tile merges only once, score is authoritative, identical moves spawn identically', () => {
  const engine = game('g2048'), state = start('g2048');
  assert.deepEqual(state.players[0].cells, state.players[1].cells);
  for (const p of state.players) p.cells = [2, 2, 2, 2, ...Array(12).fill(0)];
  assert.equal(engine.action(state, 0, { type: 'move', direction: 'left', score: 99999 }, 1001), true);
  assert.deepEqual(state.players[0].cells.slice(0, 2), [4, 4]);
  assert.equal(state.scores[0], 8);
  assert.equal(engine.action(state, 1, { type: 'move', direction: 'left' }, 1002), true);
  assert.deepEqual(state.players[0].cells, state.players[1].cells);
  assert.equal(engine.action(state, 0, { type: 'move', direction: 'sideways' }, 1003), false);
});

test('2048: ineffective moves do not spawn or score and two stuck boards finish', () => {
  const engine = game('g2048'), state = start('g2048');
  state.players[0].cells = [2, 0, 0, 0, ...Array(12).fill(0)];
  const before = [...state.players[0].cells];
  assert.equal(engine.action(state, 0, { type: 'move', direction: 'left' }, 1001), false);
  assert.deepEqual(state.players[0].cells, before);
  for (const p of state.players) p.cells = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  engine.tick(state, 0.1, 1100);
  assert.equal(state.status, 'finished');
  assert.equal(state.winner, -1);
});

function solutionCount(board) {
  const cells = [...board];
  let count = 0;
  function walk() {
    if (count > 1) return;
    let selected = -1, options = [];
    for (let i = 0; i < 81; i++) if (!cells[i]) {
      const row = Math.floor(i / 9), col = i % 9;
      const possible = Array.from({ length: 9 }, (_, n) => n + 1).filter(n => !cells.some((v, j) => v === n && (Math.floor(j / 9) === row || j % 9 === col || (Math.floor(j / 27) === Math.floor(row / 3) && Math.floor((j % 9) / 3) === Math.floor(col / 3)))));
      if (!possible.length) return;
      if (selected < 0 || possible.length < options.length) { selected = i; options = possible; }
    }
    if (selected < 0) { count++; return; }
    for (const n of options) { cells[selected] = n; walk(); }
    cells[selected] = 0;
  }
  walk();
  return count;
}

test('sudoku: transformed puzzle has one solution, givens are immutable and solutions are private', () => {
  const engine = game('sudoku'), state = start('sudoku');
  assert.equal(solutionCount(state.givens), 1);
  const clue = state.givens.findIndex(Boolean), blank = state.givens.indexOf(0);
  assert.equal(engine.action(state, 0, { type: 'set', index: clue, value: 0 }, 1001), false);
  for (const value of [NaN, 10, -1, 1.5]) assert.equal(engine.action(state, 0, { type: 'set', index: blank, value }, 1002), false);
  const view = engine.view(state, 0);
  assert.equal(view.solution, undefined);
  assert.equal(view._solution, undefined);
  assert.equal(view.players[1].cells, undefined);
});

test('sudoku: wrong entries incur a penalty, correction counts and correct completion wins', () => {
  const engine = game('sudoku'), state = start('sudoku');
  const blank = state.givens.indexOf(0), correct = state._solution[blank];
  assert.equal(engine.action(state, 0, { type: 'set', index: blank, value: correct % 9 + 1 }, 1001), true);
  assert.equal(state.players[0].mistakes, 1);
  engine.action(state, 0, { type: 'set', index: blank, value: correct }, 1002);
  assert.equal(state.players[0].correct, 1);
  let now = 1003;
  for (let i = 0; i < 81; i++) if (!state.givens[i]) engine.action(state, 0, { type: 'set', index: i, value: state._solution[i] }, now++);
  assert.equal(state.status, 'finished');
  assert.equal(state.winner, 0);
});

test('quiz: no answers before reveal, no double answers, same question and automatic round progression', () => {
  const engine = game('quiz'), state = start('quiz');
  const before = engine.view(state, 0);
  assert.equal(before.question.correct, undefined);
  assert.equal(before.answer, undefined);
  assert.deepEqual(before.question, engine.view(state, 1).question);
  assert.equal(engine.action(state, 0, { type: 'answer', round: 0, choice: NaN }, 1001), false);
  const answer = state._questions[0].correct;
  assert.equal(engine.action(state, 0, { type: 'answer', round: 0, choice: answer }, 1002), true);
  assert.equal(engine.action(state, 0, { type: 'answer', round: 0, choice: answer }, 1003), false);
  assert.equal(engine.view(state, 1).choices[0], null);
  engine.action(state, 1, { type: 'answer', round: 0, choice: (answer + 1) % 4 }, 1004);
  assert.equal(state.phase, 'reveal');
  assert.equal(engine.view(state, 0).question.correct, answer);
  assert.equal(state.scores[0], 100);
  engine.tick(state, 2, state.phaseEndsAt + 1);
  assert.equal(state.round, 1);
  assert.equal(engine.action(state, 0, { type: 'answer', round: 0, choice: 0 }, state._now + 1), false);
  engine.tick(state, 1000, state.endsAt + 1);
  assert.equal(state.status, 'finished');
  assert.equal(state.winner, 0);
});

test('reaction: signal time is private, false starts penalized and server measures response', () => {
  const engine = game('reaction'), state = start('reaction');
  assert.equal(engine.view(state, 0).signalAt, undefined);
  assert.equal(engine.view(state, 0)._signalAt, undefined);
  engine.action(state, 0, { type: 'tap', round: 0, elapsed: 1 }, 1001);
  assert.equal(state.responses[0], -1);
  assert.ok(state.scores[0] < 0);
  const signal = state._signalAt;
  engine.tick(state, 1, signal + 123);
  assert.equal(engine.action(state, 1, { type: 'tap', round: 0, elapsed: 1 }, signal + 123), true);
  assert.equal(state.responses[1], 123);
  assert.equal(state.scores[1], 877);
  assert.equal(engine.action(state, 1, { type: 'tap', round: 0 }, signal + 124), false);
});

test('typing: same text, prefix progress, private input, bounded input and correct completion', () => {
  const engine = game('typing'), state = start('typing'), target = state.text;
  const prefix = Array.from(target).slice(0, 3).join('');
  engine.action(state, 0, { type: 'input', text: prefix }, 1001);
  assert.ok(state.scores[0] > 0 && state.scores[0] < 1000);
  assert.equal(engine.view(state, 1).input, '');
  assert.equal(engine.view(state, 1).players[0].input, undefined);
  assert.equal(engine.action(state, 0, { type: 'input', text: 'a'.repeat(301) }, 1002), false);
  engine.action(state, 1, { type: 'input', text: target }, 1003);
  assert.equal(state.status, 'finished');
  assert.equal(state.winner, 1);
  assert.equal(state.scores[1], 1000);
});

test('simon: input is gated during playback, sequence stays private and correct repeat scores', () => {
  const engine = game('simon'), state = start('simon');
  assert.equal(engine.action(state, 0, { type: 'note', round: 0, note: 0 }, 1001), false);
  assert.equal(engine.view(state, 0).sequence, undefined);
  assert.equal(engine.view(state, 0)._sequence, undefined);
  engine.tick(state, 5, state.phaseEndsAt + 1);
  assert.equal(state.phase, 'input');
  let now = state._now;
  for (const note of state._sequence) engine.action(state, 0, { type: 'note', round: 0, note }, ++now);
  assert.equal(state.players[0].done, true);
  assert.equal(state.players[0].success, true);
  assert.ok(state.scores[0] > 0);
  const wrong = (state._sequence[0] + 1) % 4;
  engine.action(state, 1, { type: 'note', round: 0, note: wrong }, ++now);
  assert.equal(state.phase, 'reveal');
  engine.tick(state, 2, state.phaseEndsAt + 1);
  assert.equal(state.round, 1);
  assert.equal(state._sequence.length, 4);
});

test('tetris: equal piece streams, legal moves and wall rotation, hard drop locks authoritative cells', () => {
  const engine = game('tetris'), state = start('tetris');
  assert.equal(state.players[0].active.kind, state.players[1].active.kind);
  assert.deepEqual(state.players[0].queue, state.players[1].queue);
  assert.equal(engine.action(state, 0, { type: 'move', direction: 'banana' }, 1001), false);
  const before = state.players[0].active.x;
  assert.equal(engine.action(state, 0, { type: 'move', direction: 'left' }, 1002), true);
  assert.equal(state.players[0].active.x, before - 1);
  assert.equal(engine.action(state, 0, { type: 'rotate', direction: 1 }, 1003), true);
  assert.equal(engine.action(state, 0, { type: 'drop', score: 9999 }, 1004), true);
  assert.equal(state.players[0].board.filter(Boolean).length, 4);
  assert.ok(state.scores[0] < 100);
  engine.action(state, 1, { type: 'drop' }, 1005);
  assert.equal(state.players[0].active.kind, state.players[1].active.kind);
});

test('tetris: two cleared lines send garbage and garbage is applied at opponent lock', () => {
  const engine = game('tetris'), state = start('tetris');
  const p = state.players[0];
  p.board = Array(200).fill(0);
  for (const y of [18, 19]) for (let x = 0; x < 10; x++) if (x !== 4 && x !== 5) p.board[y * 10 + x] = 1;
  p.active = { kind: 'O', rotation: 0, x: 3, y: 0 };
  engine.action(state, 0, { type: 'drop' }, 1001);
  assert.equal(p.lines, 2);
  assert.equal(state.players[1].pending, 1);
  engine.action(state, 1, { type: 'drop' }, 1002);
  assert.equal(state.players[1].pending, 0);
  assert.equal(state.players[1].board.slice(-10).filter(Boolean).length, 9);
  assert.equal(state.players[1].board.slice(-10).filter(x => x === 8).length, 9);
});

test('tetris: spawn collision loses and timeout can finish an inactive match', () => {
  const engine = game('tetris'), state = start('tetris'), p = state.players[0];
  p.board = Array(200).fill(1);
  p.board.fill(0, 190, 200);
  p.active = { kind: 'O', rotation: 0, x: 3, y: 18 };
  engine.action(state, 0, { type: 'drop' }, 1001);
  assert.equal(state.status, 'finished');
  assert.equal(state.winner, 1);
});

let renderers = {};
try { ({ renderers } = await import('../games/puzzle-views.js')); }
catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; }
class TestElement extends EventTarget {
  constructor(tag, doc) {
    super(); this.tagName = tag.toUpperCase(); this.ownerDocument = doc; this.children = []; this.dataset = {}; this.attributes = {}; this.value = ''; this.className = ''; this.replacements = 0; this.listeners = 0;
    this.style = { setProperty() {} };
    this.classList = { add: (...names) => { this.className += ` ${names.join(' ')}`; }, remove() {}, toggle() {} };
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; this.replacements++; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  removeAttribute(key) { delete this.attributes[key]; }
  addEventListener(...args) { super.addEventListener(...args); this.listeners++; }
  removeEventListener(...args) { super.removeEventListener(...args); this.listeners--; }
  focus() { this.ownerDocument.activeElement = this; }
  contains(node) { return node === this || this.children.some(c => c?.contains?.(node)); }
  setPointerCapture() {}
  releasePointerCapture() {}
}
function fixture() {
  const doc = { createElement(tag) { const node = new TestElement(tag, doc); doc.nodes.push(node); return node; }, nodes: [], activeElement: null };
  const root = doc.createElement('main');
  return { root, doc };
}
for (const id of ids) test(`${id}: renderer keeps DOM stable across snapshots and removes listeners`, () => {
  assert.equal(typeof renderers[id], 'function', `${id} renderer must exist`);
  const { root, doc } = fixture(), state = start(id);
  const renderer = renderers[id](root, () => {}, { player: 0, colors: ['pink', 'green'], feedback() {}, reducedMotion: true });
  renderer.update(game(id).view(state, 0));
  const children = [...root.children], replacements = root.replacements;
  game(id).tick(state, 0.01, 1010);
  renderer.update(game(id).view(state, 0));
  assert.deepEqual(root.children, children);
  assert.equal(root.replacements, replacements);
  renderer.destroy();
  assert.equal(doc.nodes.reduce((n, el) => n + el.listeners, 0), 0);
});
test('typing renderer preserves active IME composition and sends only composed input', () => {
  assert.equal(typeof renderers.typing, 'function', 'typing renderer must exist');
  const { root, doc } = fixture(), sent = [], state = start('typing');
  const renderer = renderers.typing(root, a => sent.push(a), { player: 0, feedback() {} });
  renderer.update(game('typing').view(state, 0));
  const input = doc.nodes.find(el => el.tagName === 'TEXTAREA');
  assert.ok(input); input.focus(); input.dispatchEvent(new Event('compositionstart')); input.value = '正在输入'; input.dispatchEvent(new Event('input'));
  renderer.update(game('typing').view(state, 0));
  assert.equal(input.value, '正在输入');
  assert.equal(sent.length, 0);
  input.dispatchEvent(new Event('compositionend'));
  assert.deepEqual(sent, [{ type: 'input', text: '正在输入' }]);
  input.dispatchEvent(new Event('input'));
  assert.equal(sent.length, 1);
  renderer.destroy();
});
