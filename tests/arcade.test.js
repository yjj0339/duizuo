import test from 'node:test';
import assert from 'node:assert/strict';

// Before implementation, an absent module becomes an empty registry so RED is
// an assertion about the missing game behavior rather than an import failure.
const { games = {} } = await import('../games/arcade-engines.js').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});
const ids = ['hockey', 'tanks', 'bomber', 'snake', 'slingshot', 'maze'];
const engine = id => {
  assert.equal(typeof games[id]?.create, 'function', `${id} must expose a real engine`);
  return games[id];
};

for (const id of ids) {
  test(`${id}: rejects malformed input without accepting client scores`, () => {
    const g = engine(id), s = g.create(91, 1000);
    for (const player of [-1, 2, NaN, null]) assert.equal(g.action(s, player, { type: 'move', x: 4, y: 4 }, 1001), false);
    for (const action of [null, [], 1, {}, { type: 'winner', winner: 0 }, { type: 'move', x: Infinity, y: NaN }, { type: 'move', dir: 'teleport' }]) {
      assert.equal(g.action(s, 0, action, 1001), false);
    }
    assert.deepEqual(s.scores, [0, 0]);
    assert.equal(s.status, 'playing');
  });
  test(`${id}: deterministic snapshots are isolated and an idle match finishes`, () => {
    const g = engine(id), s = g.create(123, 1000), same = g.create(123, 1000);
    g.tick(s, 1 / 30, 1034); g.tick(same, 1 / 30, 1034);
    assert.deepEqual(g.view(s, 0), g.view(same, 1));
    const v = g.view(s, 0); v.scores[0] = 999;
    assert.equal(s.scores[0], 0);
    assert.equal('_rng' in v, false);
    assert.doesNotThrow(() => JSON.stringify(v));
    g.tick(s, 0, s.endsAt + 1);
    assert.equal(s.status, 'finished');
    assert.ok([-1, 0, 1].includes(s.winner));
    const ended = JSON.stringify(s);
    g.tick(s, 10, s.endsAt + 1000);
    assert.equal(JSON.stringify(s), ended);
    assert.equal(g.action(s, 0, { type: 'fire' }, s.endsAt + 2), false);
  });
}

test('hockey: a paddle target remains in its own half and cannot teleport', () => {
  const g = engine('hockey'), s = g.create(1, 0), x = s.paddles[0].x;
  assert.equal(g.action(s, 0, { type: 'move', x: 710, y: 220 }, 1), true);
  g.tick(s, 1 / 30, 34);
  assert.ok(s.paddles[0].x > x && s.paddles[0].x < 150);
  assert.ok(s.paddles[0].tx < 360);
  assert.equal(g.action(s, 0, { type: 'move', x: -1, y: 2 }, 35), false);
});
test('hockey: paddle and wall collisions reflect the puck; seventh goal wins', () => {
  const g = engine('hockey'), s = g.create(1, 0);
  s.puck = { x: 125, y: 220, vx: -220, vy: 0 };
  g.tick(s, 1 / 30, 34);
  assert.ok(s.puck.vx > 0, 'paddle returns an incoming puck');
  s.puck = { x: 400, y: 12, vx: 0, vy: -200 };
  g.tick(s, 1 / 30, 68);
  assert.ok(s.puck.vy > 0);
  s.scores[0] = 6; s.puck = { x: 729, y: 220, vx: 250, vy: 0 };
  g.tick(s, 1 / 30, 102);
  assert.deepEqual(s.scores, [7, 0]); assert.equal(s.winner, 0);
});
test('tanks: obstacle blocks movement and shells; fire cooldown is authoritative', () => {
  const g = engine('tanks'), s = g.create(1, 0);
  s.tanks[0].x = 190; s.tanks[0].y = 135;
  assert.equal(g.action(s, 0, { type: 'control', dx: 1, dy: 0 }, 1), true);
  g.tick(s, .25, 251);
  assert.ok(s.tanks[0].x <= 202);
  g.action(s, 0, { type: 'aim', x: 600, y: 135 }, 252);
  assert.equal(g.action(s, 0, { type: 'fire' }, 252), true);
  assert.equal(g.action(s, 0, { type: 'fire' }, 253), false);
  g.tick(s, .25, 502);
  assert.equal(s.bullets.length, 0);
  assert.equal(s.tanks[1].hp, 5);
});
test('tanks: a shell damages an enemy and zero health ends the match', () => {
  const g = engine('tanks'), s = g.create(1, 0);
  s.tanks[0].x = 100; s.tanks[0].y = 240;
  s.tanks[1].x = 180; s.tanks[1].y = 240; s.tanks[1].hp = 1;
  g.action(s, 0, { type: 'aim', x: 180, y: 240 }, 1);
  g.action(s, 0, { type: 'fire' }, 2);
  g.tick(s, .25, 252);
  assert.equal(s.tanks[1].hp, 0); assert.equal(s.winner, 0);
});
test('bomber: walls block walking, bombs consume capacity and blast breaks bricks', () => {
  const g = engine('bomber'), s = g.create(1, 0);
  assert.equal(g.action(s, 0, { type: 'move', dir: 'left' }, 1), false);
  assert.equal(g.action(s, 0, { type: 'bomb' }, 1), true);
  assert.equal(g.action(s, 0, { type: 'bomb' }, 2), false);
  s.grid[1][2] = 2;
  g.tick(s, .1, 1900);
  assert.equal(s.grid[1][2], 0);
  assert.ok(s.flames.some(f => f.x === 2 && f.y === 1));
});
test('bomber: chained explosions resolve simultaneous deaths as a draw', () => {
  const g = engine('bomber'), s = g.create(1, 0);
  s.players = [{ x: 5, y: 5, alive: true, nextMove: 0 }, { x: 7, y: 5, alive: true, nextMove: 0 }];
  for (let x = 4; x <= 8; x++) s.grid[5][x] = 0;
  s.bombs = [{ x: 5, y: 5, owner: 0, explodeAt: 10 }, { x: 7, y: 5, owner: 1, explodeAt: 9000 }];
  g.tick(s, .1, 100);
  assert.equal(s.bombs.length, 0); assert.equal(s.winner, -1);
});
test('snake: reverse input is rejected and eating grows the body', () => {
  const g = engine('snake'), s = g.create(1, 0);
  assert.equal(g.action(s, 0, { type: 'direction', dir: 'left' }, 1), false);
  s.food = [{ x: 6, y: 5 }];
  g.tick(s, .14, 140);
  assert.equal(s.snakes[0].body.length, 4); assert.equal(s.scores[0], 1);
});
test('snake: simultaneous head-on collision is a draw and a wall collision loses', () => {
  const g = engine('snake'), s = g.create(1, 0);
  s.snakes[0].body = [{ x: 10, y: 10 }, { x: 9, y: 10 }];
  s.snakes[1].body = [{ x: 12, y: 10 }, { x: 13, y: 10 }];
  g.tick(s, .14, 140);
  assert.equal(s.winner, -1);
  const t = g.create(1, 0); t.snakes[0].body[0] = { x: 23, y: 5 };
  g.tick(t, .14, 140); assert.equal(t.winner, 1);
});
test('slingshot: turns and finite angle/power are checked; a shot follows gravity', () => {
  const g = engine('slingshot'), s = g.create(1, 0);
  assert.equal(g.action(s, 1, { type: 'shoot', angle: 45, power: 60 }, 1), false);
  for (const a of [{ angle: NaN, power: 60 }, { angle: 90, power: 60 }, { angle: 45, power: Infinity }, { angle: 45, power: 101 }]) {
    assert.equal(g.action(s, 0, { type: 'shoot', ...a }, 1), false);
  }
  assert.equal(g.action(s, 0, { type: 'shoot', angle: 45, power: 80 }, 1), true);
  const vx = s.projectile.vx, vy = s.projectile.vy;
  g.tick(s, .2, 201);
  assert.ok(s.projectile.vy > vy); assert.ok(Math.abs(s.projectile.vx - vx) > 0);
  assert.equal(g.action(s, 0, { type: 'shoot', angle: 45, power: 60 }, 202), false);
});
test('slingshot: actual castle collision deals damage and destroys the castle', () => {
  const g = engine('slingshot'), s = g.create(1, 0);
  s.castles[1].hp = 50;
  s.projectile = { x: 795, y: 370, vx: 0, vy: 0, owner: 0, age: 0 };
  g.tick(s, .02, 20);
  assert.equal(s.castles[1].hp, 0); assert.equal(s.winner, 0);
});
test('slingshot: an idle turn automatically fires and eventually changes turns', () => {
  const g = engine('slingshot'), s = g.create(1, 0);
  g.tick(s, .01, s.turnEndsAt + 1);
  assert.ok(s.projectile);
  let now = s.turnEndsAt + 1;
  for (let i = 0; i < 600 && s.turn === 0; i++) { now += 16; g.tick(s, .016, now); }
  assert.equal(s.turn, 1);
});
test('maze: symmetric map is reachable from both bases and walls reject moves', () => {
  const g = engine('maze'), s = g.create(1, 0), seen = new Set(['1,6']), queue = [{ x: 1, y: 6 }];
  while (queue.length) {
    const p = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = p.x + dx, y = p.y + dy, k = `${x},${y}`;
      if (s.grid[y]?.[x] === 0 && !seen.has(k)) { seen.add(k); queue.push({ x, y }); }
    }
  }
  assert.ok(seen.has('8,6')); assert.ok(seen.has('15,6'));
  for (const row of s.grid) assert.deepEqual(row, [...row].reverse());
  assert.equal(g.action(s, 0, { type: 'move', dir: 'left' }, 1), false);
});
test('maze: carrying the flag home scores and three captures win', () => {
  const g = engine('maze'), s = g.create(1, 0);
  s.players[0] = { x: 7, y: 6, nextMove: 0 };
  assert.equal(g.action(s, 0, { type: 'move', dir: 'right' }, 1), true);
  assert.equal(s.flag.carrier, 0);
  s.players[0] = { x: 2, y: 6, nextMove: 0 }; s.scores[0] = 2;
  g.action(s, 0, { type: 'move', dir: 'left' }, 200);
  assert.deepEqual(s.scores, [3, 0]); assert.equal(s.winner, 0);
});
test('maze: touching a flag carrier drops the flag and resets the encounter', () => {
  const g = engine('maze'), s = g.create(1, 0);
  s.players = [{ x: 7, y: 6, nextMove: 0 }, { x: 8, y: 6, nextMove: 0 }]; s.flag.carrier = 1;
  assert.equal(g.action(s, 0, { type: 'move', dir: 'right' }, 1), true);
  assert.equal(s.flag.carrier, null); assert.equal(s.flag.x, 8);
  assert.equal(s.players[1].x, 15);
});

test('maze: central lane has real detours rather than a straight sprint to the flag', () => {
  const g = engine('maze'), s = g.create(1, 0);
  s.players[0] = { x: 3, y: 6, nextMove: 0 };
  assert.equal(g.action(s, 0, { type: 'move', dir: 'right' }, 1), false);
});

test('bomber: a player may leave a planted bomb but cannot step back onto it', () => {
  const g = engine('bomber'), s = g.create(1, 0);
  g.action(s, 0, { type: 'bomb' }, 1);
  assert.equal(g.action(s, 0, { type: 'move', dir: 'right' }, 2), true);
  assert.equal(g.action(s, 0, { type: 'move', dir: 'left' }, 200), false);
});

test('tanks: stale movement input expires so a disconnected player cannot keep driving', () => {
  const g = engine('tanks'), s = g.create(1, 0);
  g.action(s, 0, { type: 'control', dx: 0, dy: 1 }, 1);
  g.tick(s, .1, 100); const y = s.tanks[0].y;
  g.tick(s, .1, 500); assert.equal(s.tanks[0].y, y);
});

test('all arcade engines: invalid numeric inputs and invalid ticks never poison snapshots', () => {
  for (const id of ids) {
    const g = engine(id), s = g.create(8, 0);
    for (const n of [NaN, Infinity, -Infinity, 1e20, -1e20]) {
      for (const action of [{ type: 'move', x: n, y: 10 }, { type: 'aim', x: 10, y: n }, { type: 'control', dx: n, dy: 0 }, { type: 'shoot', angle: 45, power: n }]) assert.equal(g.action(s, 0, action, 1), false);
    }
    for (const dt of [NaN, Infinity, -3]) g.tick(s, dt, 100);
    const walk = item => {
      if (typeof item === 'number') assert.ok(Number.isFinite(item), `${id}: all state numbers must be finite`);
      else if (item && typeof item === 'object') Object.values(item).forEach(walk);
    };
    walk(g.view(s, 0));
  }
});

test('all arcade engines: timeout awards the higher authoritative score', () => {
  for (const id of ids) {
    const g = engine(id), s = g.create(9, 0); s.scores = [1, 2];
    g.tick(s, .01, s.endsAt); assert.equal(s.winner, 1, id);
  }
});
