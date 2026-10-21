// Portable, deterministic, server-authoritative rules. No clocks or DOM here.
const DIR = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const finite = Number.isFinite;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const clone = value => JSON.parse(JSON.stringify(value, (key, item) => key.startsWith('_') ? undefined : item));
const random = s => {
  let x = s._rng >>> 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  s._rng = x >>> 0; return s._rng / 4294967296;
};
const base = (kind, seed, now, seconds) => ({ kind, status: 'playing', winner: null, scores: [0, 0], message: '', startedAt: now, endsAt: now + seconds * 1000, _rng: (seed >>> 0) || 1 });
const finish = (s, winner, message = '') => { s.status = 'finished'; s.winner = winner; s.message = message || (winner === -1 ? '势均力敌，平局！' : `${winner === 0 ? '蜜桃' : '薄荷'}玩家获胜！`); };
const compare = scores => scores[0] === scores[1] ? -1 : scores[0] > scores[1] ? 0 : 1;
const expired = (s, now) => {
  if (s.status !== 'playing' || !finite(now)) return true;
  if (now >= s.endsAt) { finish(s, compare(s.scores), '时间到，按得分结算'); return true; }
  return false;
};
const accepts = (s, p, a, now) => (p === 0 || p === 1) && a !== null && typeof a === 'object' && !Array.isArray(a) && typeof a.type === 'string' && !expired(s, now);
const duration = dt => finite(dt) ? clamp(dt, 0, .25) : 0;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const sameCell = (a, b) => a.x === b.x && a.y === b.y;

function hockeyServe(s, toward) {
  s.puck = { x: 360, y: 220, vx: toward * 190, vy: (random(s) - .5) * 150 };
  s.paddles.forEach((p, i) => Object.assign(p, { x: i ? 630 : 90, y: 220, tx: i ? 630 : 90, ty: 220, vx: 0, vy: 0 }));
}
const hockey = {
  create(seed, now) {
    const s = { ...base('hockey', seed, now, 180), width: 720, height: 440, goalTop: 145, goalBottom: 295, paddles: [{}, {}], serveUntil: now };
    hockeyServe(s, random(s) < .5 ? -1 : 1); s.message = '拖动自己的球拍，先得 7 分获胜'; return s;
  },
  action(s, p, a, now) {
    if (!accepts(s, p, a, now) || a.type !== 'move' || !finite(a.x) || !finite(a.y) || a.x < 0 || a.x > 720 || a.y < 0 || a.y > 440) return false;
    s.paddles[p].tx = clamp(a.x, p ? 390 : 28, p ? 692 : 330);
    s.paddles[p].ty = clamp(a.y, 28, 412); return true;
  },
  tick(s, dt, now) {
    if (expired(s, now)) return;
    const total = duration(dt), count = Math.max(1, Math.ceil(total * 120)), h = total / count;
    for (let i = 0; i < count; i++) {
      for (const p of s.paddles) {
        const dx = p.tx - p.x, dy = p.ty - p.y, len = Math.hypot(dx, dy), step = Math.min(len, h * 840);
        p.vx = len && h ? dx / len * step / h : 0; p.vy = len && h ? dy / len * step / h : 0;
        p.x += p.vx * h; p.y += p.vy * h;
      }
      if (now < s.serveUntil) continue;
      const b = s.puck; b.x += b.vx * h; b.y += b.vy * h;
      if (b.y < 11) { b.y = 11; b.vy = Math.abs(b.vy); }
      if (b.y > 429) { b.y = 429; b.vy = -Math.abs(b.vy); }
      const inGoal = b.y > s.goalTop + 11 && b.y < s.goalBottom - 11;
      if (!inGoal && b.x < 11) { b.x = 11; b.vx = Math.abs(b.vx); }
      if (!inGoal && b.x > 709) { b.x = 709; b.vx = -Math.abs(b.vx); }
      for (let j = 0; j < 2; j++) {
        const p = s.paddles[j], d = distance(b, p);
        if (d < 37) {
          const nx = d ? (b.x - p.x) / d : j ? -1 : 1, ny = d ? (b.y - p.y) / d : 0;
          b.x = p.x + nx * 37.1; b.y = p.y + ny * 37.1;
          const toward = (b.vx - p.vx) * nx + (b.vy - p.vy) * ny;
          if (toward < 0) { b.vx -= 1.94 * toward * nx; b.vy -= 1.94 * toward * ny; }
          const speed = Math.hypot(b.vx, b.vy);
          if (speed > 750) { b.vx *= 750 / speed; b.vy *= 750 / speed; }
        }
      }
      if (b.x < -11 || b.x > 731) {
        const scorer = b.x > 731 ? 0 : 1; s.scores[scorer]++;
        if (s.scores[scorer] >= 7) { finish(s, scorer); return; }
        s.message = `${scorer === 0 ? '蜜桃' : '薄荷'}进球！`; hockeyServe(s, scorer === 0 ? -1 : 1); s.serveUntil = now + 650; return;
      }
    }
  }, view: clone
};

const tankObstacles = () => [{ x: 220, y: 100, w: 70, h: 90 }, { x: 430, y: 290, w: 70, h: 90 }, { x: 330, y: 195, w: 60, h: 90 }];
const circleRect = (x, y, r, b) => Math.hypot(x - clamp(x, b.x, b.x + b.w), y - clamp(y, b.y, b.y + b.h)) < r;
function tankCanMove(s, p, x, y) {
  return x >= 18 && x <= 702 && y >= 18 && y <= 462 && !s.obstacles.some(b => circleRect(x, y, 18, b)) && Math.hypot(x - s.tanks[1 - p].x, y - s.tanks[1 - p].y) >= 36;
}
const tanks = {
  create(seed, now) {
    return { ...base('tanks', seed, now, 150), width: 720, height: 480, tanks: [0, 1].map(i => ({ x: i ? 650 : 70, y: 240, angle: i ? Math.PI : 0, hp: 5, dx: 0, dy: 0, lastControl: now - 1000, nextShot: now })), obstacles: tankObstacles(), bullets: [], message: '方向键移动，点击战场瞄准，空格开火；每人 5 点装甲' };
  },
  action(s, p, a, now) {
    if (!accepts(s, p, a, now)) return false;
    const t = s.tanks[p];
    if (a.type === 'control') {
      if (!finite(a.dx) || !finite(a.dy) || Math.abs(a.dx) > 1 || Math.abs(a.dy) > 1) return false;
      t.dx = a.dx; t.dy = a.dy; t.lastControl = now; return true;
    }
    if (a.type === 'aim') {
      if (!finite(a.x) || !finite(a.y) || a.x < 0 || a.x > 720 || a.y < 0 || a.y > 480 || Math.hypot(a.x - t.x, a.y - t.y) < 1) return false;
      t.angle = Math.atan2(a.y - t.y, a.x - t.x); return true;
    }
    if (a.type === 'fire' && now >= t.nextShot && s.bullets.filter(b => b.owner === p).length < 6) {
      const vx = Math.cos(t.angle), vy = Math.sin(t.angle);
      s.bullets.push({ x: t.x + vx * 25, y: t.y + vy * 25, vx: vx * 350, vy: vy * 350, owner: p, life: 2.6 }); t.nextShot = now + 450; return true;
    }
    return false;
  },
  tick(s, dt, now) {
    if (expired(s, now)) return;
    const total = duration(dt), count = Math.max(1, Math.ceil(total * 120)), h = total / count;
    for (let n = 0; n < count; n++) {
      s.tanks.forEach((t, p) => {
        if (now - t.lastControl > 350) { t.dx = 0; t.dy = 0; }
        const len = Math.max(1, Math.hypot(t.dx, t.dy)), dx = t.dx / len * 128 * h, dy = t.dy / len * 128 * h;
        if (tankCanMove(s, p, t.x + dx, t.y)) t.x += dx;
        if (tankCanMove(s, p, t.x, t.y + dy)) t.y += dy;
      });
      const alive = [];
      for (const b of s.bullets) {
        b.x += b.vx * h; b.y += b.vy * h; b.life -= h;
        if (b.life <= 0 || b.x < 0 || b.x > 720 || b.y < 0 || b.y > 480 || s.obstacles.some(o => circleRect(b.x, b.y, 4, o))) continue;
        const target = s.tanks[1 - b.owner];
        if (distance(b, target) < 22) { target.hp = Math.max(0, target.hp - 1); s.scores[b.owner]++; s.message = '命中装甲！'; }
        else alive.push(b);
      }
      s.bullets = alive;
      if (s.tanks.some(t => t.hp <= 0)) { finish(s, s.tanks.every(t => t.hp <= 0) ? -1 : s.tanks[0].hp <= 0 ? 1 : 0); return; }
    }
  }, view: clone
};

function bomberDamage(s, now) {
  for (const p of s.players) if (p.alive && s.flames.some(f => f.until > now && sameCell(f, p))) p.alive = false;
  if (s.players.some(p => !p.alive)) {
    s.scores = [s.players[1].alive ? 0 : 1, s.players[0].alive ? 0 : 1];
    finish(s, s.players.every(p => !p.alive) ? -1 : s.players[0].alive ? 0 : 1);
  }
}
const bomber = {
  create(seed, now) {
    const s = { ...base('bomber', seed, now, 120), cols: 13, rows: 11, players: [{ x: 1, y: 1, alive: true, nextMove: now }, { x: 11, y: 9, alive: true, nextMove: now }], grid: [], bombs: [], flames: [], message: '炸弹 1.8 秒后十字爆炸，躲开火焰；可同时放 2 颗' };
    for (let y = 0; y < 11; y++) {
      s.grid[y] = [];
      for (let x = 0; x < 13; x++) {
        s.grid[y][x] = !x || x === 12 || !y || y === 10 || (x % 2 === 0 && y % 2 === 0) ? 1 : 0;
      }
    }
    for (let y = 1; y <= 9; y++) for (let x = 1; x <= 11; x++) {
      if (y * 13 + x > (10 - y) * 13 + (12 - x)) continue;
      const protectedSpawn = (x <= 3 && y === 1) || (x === 1 && y <= 3) || (x >= 9 && y === 9) || (x === 11 && y >= 7);
      if (!s.grid[y][x] && !protectedSpawn && random(s) < .58) { s.grid[y][x] = 2; s.grid[10 - y][12 - x] = 2; }
    }
    return s;
  },
  action(s, p, a, now) {
    if (!accepts(s, p, a, now) || !s.players[p].alive) return false;
    const t = s.players[p];
    if (a.type === 'move' && Object.hasOwn(DIR, a.dir) && now >= t.nextMove) {
      const [dx, dy] = DIR[a.dir], x = t.x + dx, y = t.y + dy;
      if (s.grid[y]?.[x] !== 0 || s.bombs.some(b => b.x === x && b.y === y) || sameCell({ x, y }, s.players[1 - p])) return false;
      t.x = x; t.y = y; t.nextMove = now + 140; bomberDamage(s, now); return true;
    }
    if (a.type === 'bomb' && !s.bombs.some(b => sameCell(b, t)) && s.bombs.filter(b => b.owner === p).length < 2) {
      s.bombs.push({ x: t.x, y: t.y, owner: p, explodeAt: now + 1800 }); return true;
    }
    return false;
  },
  tick(s, dt, now) {
    if (expired(s, now)) return;
    s.flames = s.flames.filter(f => f.until > now);
    const queue = s.bombs.filter(b => b.explodeAt <= now), detonated = new Set();
    const flame = (x, y) => { s.flames.push({ x, y, until: now + 550 }); };
    while (queue.length) {
      const b = queue.shift(); if (detonated.has(b)) continue; detonated.add(b); flame(b.x, b.y);
      for (const [dx, dy] of Object.values(DIR)) for (let i = 1; i <= 2; i++) {
        const x = b.x + dx * i, y = b.y + dy * i, cell = s.grid[y]?.[x];
        if (cell === undefined || cell === 1) break;
        flame(x, y);
        if (cell === 2) { s.grid[y][x] = 0; break; }
        const other = s.bombs.find(q => q !== b && q.x === x && q.y === y);
        if (other) { queue.push(other); break; }
      }
    }
    s.bombs = s.bombs.filter(b => !detonated.has(b)); bomberDamage(s, now);
  }, view: clone
};

function snakeFood(s) {
  const free = [];
  for (let y = 0; y < s.rows; y++) for (let x = 0; x < s.cols; x++) {
    const cell = { x, y };
    if (!s.snakes.some(t => t.body.some(b => sameCell(b, cell))) && !s.food.some(f => sameCell(f, cell))) free.push(cell);
  }
  if (free.length) s.food.push(free[Math.floor(random(s) * free.length)]);
}
function snakeStep(s) {
  const next = s.snakes.map(t => { t.dir = t.pending; const [dx, dy] = DIR[t.dir]; return { x: t.body[0].x + dx, y: t.body[0].y + dy }; });
  const eats = next.map(p => s.food.some(f => sameCell(f, p)));
  const solids = s.snakes.map((t, i) => eats[i] ? t.body : t.body.slice(0, -1));
  const dead = next.map(p => p.x < 0 || p.x >= s.cols || p.y < 0 || p.y >= s.rows || solids.some(body => body.some(b => sameCell(b, p))));
  if (sameCell(next[0], next[1])) dead[0] = dead[1] = true;
  s.snakes.forEach((t, i) => {
    t.alive = !dead[i]; if (dead[i]) return;
    t.body.unshift(next[i]);
    if (!eats[i]) t.body.pop(); else { s.scores[i]++; s.food = s.food.filter(f => !sameCell(f, next[i])); }
  });
  if (dead.some(Boolean)) { finish(s, dead.every(Boolean) ? -1 : dead[0] ? 1 : 0); return; }
  while (s.food.length < 3 && s.food.length + s.snakes.reduce((n, t) => n + t.body.length, 0) < s.cols * s.rows) snakeFood(s);
  if (s.snakes.reduce((n, t) => n + t.body.length, 0) >= s.cols * s.rows - 1) finish(s, compare(s.scores));
}
const snake = {
  create(seed, now) {
    const s = { ...base('snake', seed, now, 120), cols: 24, rows: 20, snakes: [{ body: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], dir: 'right', pending: 'right', alive: true }, { body: [{ x: 18, y: 14 }, { x: 19, y: 14 }, { x: 20, y: 14 }], dir: 'left', pending: 'left', alive: true }], food: [], stepSeconds: .13, accumulator: 0, message: '吃星果增长，撞墙或蛇身出局；双方同时碰撞为平局' };
    while (s.food.length < 3) snakeFood(s); return s;
  },
  action(s, p, a, now) {
    if (!accepts(s, p, a, now) || a.type !== 'direction' || !Object.hasOwn(DIR, a.dir)) return false;
    const t = s.snakes[p], current = DIR[t.dir], requested = DIR[a.dir];
    if (requested[0] === -current[0] && requested[1] === -current[1]) return false;
    if (t.pending !== t.dir && a.dir !== t.pending) return false;
    t.pending = a.dir; return true;
  },
  tick(s, dt, now) {
    if (expired(s, now)) return; s.accumulator += duration(dt);
    while (s.accumulator >= s.stepSeconds && s.status === 'playing') { s.accumulator -= s.stepSeconds; snakeStep(s); }
  }, view: clone
};

const terrain = x => 425 - 65 * Math.exp(-((x - 450) ** 2) / 12500);
function slingShoot(s, p, angle, power) {
  const radians = angle * Math.PI / 180, direction = p ? -1 : 1;
  s.projectile = { x: s.castles[p].x + direction * 28, y: terrain(s.castles[p].x) - 78, vx: Math.cos(radians) * power * 5 * direction, vy: -Math.sin(radians) * power * 5, owner: p, age: 0 };
  s.message = '炮弹飞行中…';
}
function slingImpact(s, x, y, direct, now) {
  const owner = s.projectile.owner, target = s.castles[1 - owner];
  const d = Math.hypot(x - target.x, y - (terrain(target.x) - 28));
  const damage = direct ? 55 : d < 100 ? Math.max(8, Math.round(55 * (1 - d / 100))) : 0;
  target.hp = Math.max(0, target.hp - damage); s.scores[owner] += damage;
  s.impact = { x, y, until: now + 850 }; s.projectile = null;
  if (target.hp <= 0) { finish(s, owner); return; }
  s.turn = 1 - owner; s.turnEndsAt = now + 20000; s.wind = Math.round((random(s) * 2 - 1) * 25);
  s.message = damage ? `命中！造成 ${damage} 点伤害，交换回合` : '没有命中，交换回合';
}
const slingshot = {
  create(seed, now) {
    const s = { ...base('slingshot', seed, now, 180), width: 900, height: 500, turn: 0, turnEndsAt: now + 20000, wind: 0, castles: [{ x: 105, hp: 100 }, { x: 795, hp: 100 }], projectile: null, impact: null, message: '轮流调整角度与力度；摧毁对面城堡获胜，20 秒未出手自动发射' };
    s.wind = Math.round((random(s) * 2 - 1) * 25); return s;
  },
  action(s, p, a, now) {
    if (!accepts(s, p, a, now) || s.turn !== p || s.projectile || a.type !== 'shoot' || !finite(a.angle) || !finite(a.power) || a.angle < 10 || a.angle > 80 || a.power < 20 || a.power > 100 || now > s.turnEndsAt) return false;
    slingShoot(s, p, a.angle, a.power); return true;
  },
  tick(s, dt, now) {
    if (expired(s, now)) return;
    if (!s.projectile) { if (now >= s.turnEndsAt) slingShoot(s, s.turn, 45, 65); else return; }
    const total = duration(dt), count = Math.max(1, Math.ceil(total * 120)), h = total / count;
    for (let n = 0; n < count && s.projectile; n++) {
      const b = s.projectile; b.vx += s.wind * h; b.vy += 280 * h; b.x += b.vx * h; b.y += b.vy * h; b.age += h;
      const target = s.castles[1 - b.owner], ground = terrain(target.x);
      if (Math.abs(b.x - target.x) < 32 && b.y > ground - 78 && b.y < ground) slingImpact(s, b.x, b.y, true, now);
      else if (b.x < -50 || b.x > 950 || b.age > 6 || b.y >= terrain(b.x)) slingImpact(s, b.x, b.y, false, now);
    }
  }, view: clone
};

const mazeBases = [{ x: 1, y: 6 }, { x: 15, y: 6 }];
function mazeReset(s, now) {
  s.players = mazeBases.map(b => ({ ...b, nextMove: now + 600 })); s.flag = { x: 8, y: 6, carrier: null };
}
const maze = {
  create(seed, now) {
    const grid = Array.from({ length: 13 }, (_, y) => Array.from({ length: 17 }, (_, x) => x === 0 || x === 16 || y === 0 || y === 12 ? 1 : 0));
    for (const y of [2, 4, 8, 10]) for (let x = 2; x <= 14; x++) if (![4, 8, 12].includes(x)) grid[y][x] = 1;
    for (const x of [4, 12]) for (const y of [5, 7]) grid[y][x] = 1;
    return { ...base('maze', seed, now, 150), cols: 17, rows: 13, grid, bases: mazeBases.map(b => ({ ...b })), players: mazeBases.map(b => ({ ...b, nextMove: now })), flag: { x: 8, y: 6, carrier: null }, message: '夺取中央金旗并带回自己的圆形基地，先夺 3 旗获胜；碰到持旗者可截旗' };
  },
  action(s, p, a, now) {
    if (!accepts(s, p, a, now) || a.type !== 'move' || !Object.hasOwn(DIR, a.dir)) return false;
    const t = s.players[p]; if (now < t.nextMove) return false;
    const [dx, dy] = DIR[a.dir], next = { x: t.x + dx, y: t.y + dy };
    if (s.grid[next.y]?.[next.x] !== 0) return false;
    if (sameCell(next, s.players[1 - p])) {
      if (s.flag.carrier === null) return false;
      mazeReset(s, now); s.message = '成功截旗！金旗回到中央'; return true;
    }
    t.x = next.x; t.y = next.y; t.nextMove = now + 135;
    if (s.flag.carrier === null && sameCell(t, s.flag)) { s.flag.carrier = p; s.message = `${p === 0 ? '蜜桃' : '薄荷'}拿到金旗，快回基地！`; }
    if (s.flag.carrier === p) {
      s.flag.x = t.x; s.flag.y = t.y;
      if (sameCell(t, s.bases[p])) {
        s.scores[p]++; if (s.scores[p] >= 3) finish(s, p); else { mazeReset(s, now); s.message = '夺旗得分！准备下一旗'; }
      }
    }
    return true;
  },
  tick(s, dt, now) { expired(s, now); }, view: clone
};

export const games = { hockey, tanks, bomber, snake, slingshot, maze };
