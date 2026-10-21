import test from 'node:test';
import assert from 'node:assert/strict';

// Each case names a real rules/security failure. A missing implementation is
// converted into a clear assertion so the initial red run is readable.
const { games = {} } = await import('../games/board-engines.js').catch(() => ({}));
const ids = ['gomoku', 'fleet', 'dots', 'memory', 'reversi', 'rps', 'mines'];
function game(id) { assert.ok(games[id], `${id} engine must exist`); return games[id]; }
function play(g, s, p, action, now = 1000) { assert.equal(g.action(s, p, action, now), true, JSON.stringify(action)); }

for (const id of ids) {
  test(`${id}: malformed and unauthorized input cannot alter a match`, () => {
    const g = game(id), s = g.create(81, 1000);
    for (const bad of [null, [], {}, { type: 'unknown' }, { type: 'place', index: NaN }, { type: 'fire', index: Infinity }]) {
      const before = JSON.stringify(s);
      assert.equal(g.action(s, 0, bad, 1000), false);
      assert.equal(JSON.stringify(s), before);
    }
    assert.equal(g.action(s, 2, { type: 'ready' }, 1000), false);
    const v = g.view(s, 0);
    assert.equal(v.status, 'playing');
    assert.deepEqual(v.scores, id === 'reversi' ? [2, 2] : [0, 0]);
    assert.equal(v.winner, null);
    assert.equal(typeof v.message, 'string');
    assert.equal(v.seed, undefined);
    assert.equal(v._rng, undefined);
    const originalScores = s.scores.slice();
    v.scores[0] = 9999;
    assert.deepEqual(s.scores, originalScores, 'views may not mutate authoritative state');
    assert.doesNotThrow(() => JSON.stringify(v));
  });
}

test('gomoku: alternating placement rejects occupied cells and recognizes five in a row', () => {
  const g = game('gomoku'), s = g.create(5, 1000);
  assert.equal(g.action(s, 1, { type: 'place', index: 1 }, 1000), false);
  for (let x = 0; x < 4; x++) {
    play(g, s, 0, { type: 'place', index: x });
    play(g, s, 1, { type: 'place', index: 30 + x });
  }
  assert.equal(g.action(s, 0, { type: 'place', index: 0 }, 1000), false);
  play(g, s, 0, { type: 'place', index: 4 });
  assert.equal(s.status, 'finished'); assert.equal(s.winner, 0);
  assert.deepEqual(g.view(s, 1).winningLine, [0, 1, 2, 3, 4]);
  assert.equal(g.action(s, 1, { type: 'place', index: 100 }, 1000), false);
});

test('gomoku: diagonal five and full-board draw are resolved by the server', () => {
  const g = game('gomoku'), s = g.create(5, 1000);
  for (let x = 0; x < 4; x++) {
    play(g, s, 0, { type: 'place', index: x * 16 });
    play(g, s, 1, { type: 'place', index: 90 + x });
  }
  play(g, s, 0, { type: 'place', index: 64 }); assert.equal(s.winner, 0);
  const draw = g.create(1, 1000);
  // A hand constructed pattern with no run of five in any direction.
  draw.board = Array.from({ length: 225 }, (_, i) => (Math.floor(i / 15) + Math.floor((i % 15) / 2)) % 2);
  draw.board[224] = -1; draw.turn = 0;
  play(g, draw, 0, { type: 'place', index: 224 });
  assert.equal(draw.status, 'finished'); assert.equal(draw.winner, -1);
});

test('gomoku: an expired turn is a loss and finished ticks do not change results', () => {
  const g = game('gomoku'), s = g.create(1, 1000);
  g.tick(s, 1, s.endsAt + 1);
  assert.equal(s.winner, 1); assert.equal(s.status, 'finished');
  const before = JSON.stringify(s); g.tick(s, 100, 9999999); assert.equal(JSON.stringify(s), before);
});

test('fleet: setup is private, editable, locked by ready, and both players must be ready', () => {
  const g = game('fleet'), s = g.create(3, 1000);
  let v = g.view(s, 0);
  assert.equal(v.ownBoard.filter(x => x === 1).length, 9);
  assert.equal(v.targetBoard.every(x => x === -1), true);
  assert.equal(v.fleets, undefined); assert.equal(v.ownShips.length, 3);
  assert.equal(g.action(s, 0, { type: 'fire', index: 0 }, 1000), false);
  assert.equal(g.action(s, 0, { type: 'placeShip', ship: 0, index: 7, vertical: false }, 1000), false);
  play(g, s, 0, { type: 'randomize' });
  play(g, s, 0, { type: 'ready' });
  assert.equal(g.action(s, 0, { type: 'randomize' }, 1000), false);
  assert.equal(s.phase, 'setup');
  play(g, s, 1, { type: 'ready' }); assert.equal(s.phase, 'battle');
  v = g.view(s, 1); assert.equal(v.targetBoard.every(x => x === -1), true);
});

test('fleet: fire alternates, duplicate shots fail, sinking the last ship wins', () => {
  const g = game('fleet'), s = g.create(45, 1000);
  play(g, s, 0, { type: 'ready' }); play(g, s, 1, { type: 'ready' });
  const target = g.view(s, 1).ownBoard.map((x, i) => x === 1 ? i : -1).filter(i => i >= 0);
  const water = g.view(s, 0).ownBoard.map((x, i) => x === 0 ? i : -1).filter(i => i >= 0);
  for (let i = 0; i < target.length; i++) {
    play(g, s, 0, { type: 'fire', index: target[i] });
    assert.equal(g.action(s, 0, { type: 'fire', index: target[i] }, 1000), false);
    if (i < target.length - 1) play(g, s, 1, { type: 'fire', index: water[i] });
  }
  assert.equal(s.winner, 0); assert.equal(s.status, 'finished');
  assert.equal(g.view(s, 0).targetBoard.filter(x => x === 2).length, 9);
});

test('fleet: setup expires into a playable battle and firing timeout forfeits', () => {
  const g = game('fleet'), s = g.create(1, 1000);
  g.tick(s, 1, s.endsAt + 1); assert.equal(s.phase, 'battle');
  g.tick(s, 1, s.endsAt + 1); assert.equal(s.status, 'finished'); assert.equal(s.winner, 1);
});

test('dots: completing a box earns a point and preserves the turn', () => {
  const g = game('dots'), s = g.create(1, 1000);
  // Four sides around top-left box: horizontal 0,4; vertical 20,21.
  play(g, s, 0, { type: 'line', index: 0 }); play(g, s, 1, { type: 'line', index: 4 });
  play(g, s, 0, { type: 'line', index: 20 }); play(g, s, 1, { type: 'line', index: 21 });
  assert.deepEqual(s.scores, [0, 1]); assert.equal(s.turn, 1);
  assert.equal(g.action(s, 1, { type: 'line', index: 21 }, 1000), false);
  assert.equal(g.view(s, 0).boxes[0], 1);
});

test('dots: all forty edges finish the match using captured territory', () => {
  const g = game('dots'), s = g.create(1, 1000);
  for (let i = 0; i < 40; i++) play(g, s, s.turn, { type: 'line', index: i });
  assert.equal(s.status, 'finished'); assert.equal(s.scores[0] + s.scores[1], 16);
  assert.equal(s.winner, s.scores[0] === s.scores[1] ? -1 : s.scores[0] > s.scores[1] ? 0 : 1);
});

test('memory: unopened faces stay hidden, mismatches are visible briefly, then turn changes', () => {
  const g = game('memory'), s = g.create(77, 1000);
  assert.deepEqual(g.view(s, 0).faces, Array(24).fill(null));
  assert.equal(g.view(s, 0).cards, undefined);
  // Discover one different card using only currently revealed faces.
  play(g, s, 0, { type: 'flip', index: 0 });
  const first = g.view(s, 0).faces[0]; let second = s.cards.findIndex(x => x !== first);
  play(g, s, 0, { type: 'flip', index: second });
  assert.equal(s.phase, 'reveal'); assert.equal(g.view(s, 1).faces[second] !== null, true);
  assert.equal(g.action(s, 0, { type: 'flip', index: 2 }, 1100), false);
  g.tick(s, 2, s.revealUntil + 1);
  assert.equal(s.turn, 1); assert.deepEqual(g.view(s, 0).faces, Array(24).fill(null));
});

test('memory: a matching pair scores, keeps the turn, and twelve pairs finish', () => {
  const g = game('memory'), s = g.create(18, 1000);
  const pairs = new Map(); s.cards.forEach((face, i) => pairs.set(face, [...(pairs.get(face) || []), i]));
  for (const pair of pairs.values()) {
    play(g, s, 0, { type: 'flip', index: pair[0] }); play(g, s, 0, { type: 'flip', index: pair[1] });
    assert.equal(s.turn, 0);
  }
  assert.equal(s.status, 'finished'); assert.equal(s.winner, 0); assert.deepEqual(s.scores, [12, 0]);
});

test('reversi: legal moves flip enclosed stones and invalid moves do nothing', () => {
  const g = game('reversi'), s = g.create(1, 1000);
  assert.deepEqual(g.view(s, 0).legalMoves, [19, 26, 37, 44]);
  assert.equal(g.action(s, 0, { type: 'place', index: 0 }, 1000), false);
  play(g, s, 0, { type: 'place', index: 19 });
  assert.equal(s.board[27], 0); assert.deepEqual(s.scores, [4, 1]); assert.equal(s.turn, 1);
});

test('reversi: no legal move for either side ends with a counted result', () => {
  const g = game('reversi'), s = g.create(1, 1000);
  s.board = Array(64).fill(0); s.board[0] = -1; s.board[1] = 1; s.turn = 0;
  play(g, s, 0, { type: 'place', index: 0 });
  assert.equal(s.status, 'finished'); assert.equal(s.winner, 0); assert.deepEqual(s.scores, [64, 0]);
});

test('reversi: a full match automatically passes blocked players and reaches a result', () => {
  const g = game('reversi'), s = g.create(1, 1000);
  let steps = 0;
  while (s.status === 'playing' && steps++ < 61) {
    const v = g.view(s, s.turn); assert.ok(v.legalMoves.length > 0, 'engine must automatically pass');
    play(g, s, s.turn, { type: 'place', index: v.legalMoves[0] });
  }
  assert.equal(s.status, 'finished'); assert.ok(s.scores[0] + s.scores[1] <= 64);
});

test('rps: choices are private, locked, revealed together, and first to three wins', () => {
  const g = game('rps'), s = g.create(1, 1000);
  for (let round = 0; round < 3; round++) {
    play(g, s, 0, { type: 'choose', choice: 'rock' }, 1000 + round * 3000);
    const other = g.view(s, 1); assert.equal(other.ownChoice, null); assert.equal(other.reveal, null);
    assert.equal(other.choices, undefined); assert.deepEqual(other.chosen, [true, false]);
    assert.equal(g.action(s, 0, { type: 'choose', choice: 'paper' }, 1000 + round * 3000), false);
    play(g, s, 1, { type: 'choose', choice: 'scissors' }, 1000 + round * 3000);
    assert.deepEqual(g.view(s, 1).reveal, ['rock', 'scissors']);
    if (round < 2) g.tick(s, 3, s.revealUntil + 1);
  }
  assert.equal(s.status, 'finished'); assert.equal(s.winner, 0); assert.deepEqual(s.scores, [3, 0]);
});

test('rps: a tie replays without points; one late player loses the timed round', () => {
  const g = game('rps'), s = g.create(1, 1000);
  play(g, s, 0, { type: 'choose', choice: 'paper' }); play(g, s, 1, { type: 'choose', choice: 'paper' });
  assert.deepEqual(s.scores, [0, 0]); g.tick(s, 3, s.revealUntil + 1);
  play(g, s, 1, { type: 'choose', choice: 'scissors' }, s.endsAt - 1);
  g.tick(s, 30, s.endsAt + 1); assert.deepEqual(s.scores, [0, 1]);
  g.tick(s, 3, s.revealUntil + 1); g.tick(s, 30, s.endsAt + 1);
  assert.equal(s.status, 'finished'); assert.equal(s.winner, 1);
});

test('mines: same seeded field stays private, flags block opening, and equal inputs reveal equal cells', () => {
  const g = game('mines'), s = g.create(444, 1000);
  assert.deepEqual(g.view(s, 0).board, Array(81).fill(null));
  assert.equal(g.view(s, 0).mines, undefined); assert.equal(g.view(s, 0).mineMap, undefined);
  play(g, s, 0, { type: 'flag', index: 0 });
  assert.equal(g.action(s, 0, { type: 'open', index: 0 }, 1000), false);
  play(g, s, 0, { type: 'flag', index: 0 });
  const safe = s.mineMap.indexOf(0);
  play(g, s, 0, { type: 'open', index: safe }); play(g, s, 1, { type: 'open', index: safe });
  assert.notEqual(g.view(s, 0).board[safe], -1); assert.notEqual(g.view(s, 1).board[safe], -1);
  assert.deepEqual(g.view(s, 0).board, g.view(s, 1).board, 'same input sequence yields same fair board');
});

test('mines: empty regions expand, a later mine deducts points, safe completion wins', () => {
  const g = game('mines'), s = g.create(13, 1000);
  // Reveal a safe square first, leaving the shared seeded field unchanged.
  const first = s.mineMap.indexOf(0); play(g, s, 0, { type: 'open', index: first });
  const before = s.scores[0]; const mine = s.mineMap.indexOf(1);
  play(g, s, 0, { type: 'open', index: mine }); assert.equal(s.scores[0], before - 5);
  for (let i = 0; i < 81 && s.status === 'playing'; i++) {
    if (s.mineMap[i] === 0 && g.view(s, 0).board[i] === null) play(g, s, 0, { type: 'open', index: i });
  }
  assert.equal(s.status, 'finished'); assert.equal(s.winner, 0);
  assert.equal(g.view(s, 0).safeOpened[0], 69);
});

test('mines: server timer ends an idle match in a draw', () => {
  const g = game('mines'), s = g.create(2, 1000);
  g.tick(s, 181, s.endsAt + 1); assert.equal(s.status, 'finished'); assert.equal(s.winner, -1);
});
