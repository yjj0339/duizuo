const COLORS = ['#ee827f', '#40ae9a'];
const DIRECTIONS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left' };
const DETAILS = {
  hockey: { width: 720, height: 440, title: '迷你冰球球场', hint: '拖动自己的球拍；也可点一下球场后用方向键 / WASD 移动。先得 7 分获胜。', score: '进球', theme: '冰上快攻' },
  tanks: { width: 720, height: 480, title: '口袋坦克战场', hint: '方向键 / WASD 移动，点击或拖动战场瞄准，空格 / 射击键开火。障碍会挡住炮弹。', score: '命中', theme: '瞄准，再出击' },
  bomber: { width: 624, height: 528, title: '泡泡炸弹人格子地图', hint: '方向键 / WASD 移动，空格放炸弹。1.8 秒后十字爆炸，可炸开桃色砖块，记得及时躲开！', score: '击败', theme: '给自己留条退路' },
  snake: { width: 720, height: 600, title: '贪吃蛇竞技场', hint: '方向键 / WASD 转向，不能直接掉头。吃金色星果增长；撞墙或蛇身出局，同时碰撞为平局。', score: '星果', theme: '一起长大，小心相撞' },
  slingshot: { width: 900, height: 500, title: '弹弓城堡抛物线战场', hint: '轮到你时调整角度与力度，点击发射或按空格。风会影响弹道；每回合 20 秒，超时自动发射。', score: '伤害', theme: '把风也算进去' },
  maze: { width: 680, height: 520, title: '迷宫夺旗对称地图', hint: '方向键 / WASD 移动，带中央金旗回自己的圆形基地，先夺 3 旗获胜。碰到持旗者即可截旗。', score: '夺旗', theme: '拿到旗，记得回家' }
};
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
const rounded = (c, x, y, w, h, r = 10) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
const circle = (c, x, y, r, color) => { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
const text = (c, value, x, y, size = 18, color = '#334b59', align = 'center') => { c.font = `700 ${size}px system-ui, sans-serif`; c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(String(value), x, y); };
const terrain = x => 425 - 65 * Math.exp(-((x - 450) ** 2) / 12500);
const typingTarget = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;

function star(c, x, y, r, color) {
  c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * .48 : r; const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; if (!i) c.moveTo(px, py); else c.lineTo(px, py); } c.closePath(); c.fillStyle = color; c.fill();
}
function avatar(c, x, y, r, color, own = false) {
  if (own) { circle(c, x, y, r + 5, '#ffffff'); circle(c, x, y, r + 3, color + '55'); }
  circle(c, x, y + 3, r, '#34505a18'); circle(c, x, y, r, color);
  circle(c, x - r * .29, y - 2, 2.3, '#fff'); circle(c, x + r * .29, y - 2, 2.3, '#fff');
  c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y + 2, r * .25, .2, Math.PI - .2); c.stroke();
}
function flag(c, x, y, scale = 1) {
  c.strokeStyle = '#956b27'; c.lineWidth = 3 * scale; c.beginPath(); c.moveTo(x, y + 13 * scale); c.lineTo(x, y - 17 * scale); c.stroke();
  c.fillStyle = '#f3bc43'; c.beginPath(); c.moveTo(x, y - 17 * scale); c.lineTo(x + 19 * scale, y - 12 * scale); c.lineTo(x, y - 5 * scale); c.closePath(); c.fill();
}

function drawHockey(c, v, own, colors) {
  const g = c.createLinearGradient(0, 0, 720, 440); g.addColorStop(0, '#edf9ff'); g.addColorStop(1, '#dceef6'); c.fillStyle = g; c.fillRect(0, 0, 720, 440);
  c.fillStyle = colors[own] + '0d'; c.fillRect(own ? 360 : 0, 0, 360, 440);
  c.strokeStyle = '#b4d5e5'; c.lineWidth = 2;
  for (let x = 35; x < 720; x += 65) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 40, 440); c.stroke(); }
  c.strokeStyle = '#99c5d8'; c.lineWidth = 3; c.setLineDash([9, 9]); c.beginPath(); c.moveTo(360, 18); c.lineTo(360, 422); c.stroke(); c.setLineDash([]);
  c.beginPath(); c.arc(360, 220, 65, 0, Math.PI * 2); c.stroke(); circle(c, 360, 220, 5, '#99c5d8');
  for (let i = 0; i < 2; i++) {
    const x = i ? 720 : 0; c.strokeStyle = colors[i]; c.lineWidth = 8; c.beginPath(); c.arc(x, 220, 78, i ? Math.PI / 2 : -Math.PI / 2, i ? Math.PI * 1.5 : Math.PI / 2); c.stroke();
    c.fillStyle = colors[i] + '33'; c.fillRect(i ? 709 : 0, 145, 11, 150);
  }
  c.strokeStyle = '#ffffff'; c.lineWidth = 10; rounded(c, 5, 5, 710, 430, 30); c.stroke();
  (v.paddles || []).forEach((p, i) => {
    circle(c, p.x, p.y + 5, 28, '#365a6420'); circle(c, p.x, p.y, 26, colors[i]); circle(c, p.x - 3, p.y - 4, 18, '#ffffff44'); circle(c, p.x, p.y, 12, colors[i]);
    text(c, i + 1, p.x, p.y, 14, '#fff');
    if (i === own) { c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, 30, 0, Math.PI * 2); c.stroke(); }
  });
  if (v.puck) { circle(c, v.puck.x, v.puck.y + 4, 12, '#263b4930'); circle(c, v.puck.x, v.puck.y, 11, '#304d62'); circle(c, v.puck.x - 3, v.puck.y - 3, 4, '#94c5d6'); }
}
function drawTanks(c, v, own, colors) {
  c.fillStyle = '#f8f1dc'; c.fillRect(0, 0, 720, 480);
  c.fillStyle = '#e7ddbd'; for (let x = 25; x < 720; x += 35) for (let y = 25; y < 480; y += 35) circle(c, x, y, 1.3, '#e4d8b6');
  c.strokeStyle = '#dcd4b5'; c.lineWidth = 7; rounded(c, 4, 4, 712, 472, 23); c.stroke();
  (v.obstacles || []).forEach(o => {
    c.fillStyle = '#556a6b22'; rounded(c, o.x + 2, o.y + 6, o.w, o.h, 12); c.fill(); c.fillStyle = '#bdcec4'; rounded(c, o.x, o.y, o.w, o.h, 12); c.fill();
    c.strokeStyle = '#e5eee5'; c.lineWidth = 3; rounded(c, o.x + 6, o.y + 6, o.w - 12, o.h - 12, 7); c.stroke();
    c.strokeStyle = '#a8bdb3'; c.lineWidth = 2; c.beginPath(); c.moveTo(o.x + 6, o.y + o.h / 2); c.lineTo(o.x + o.w - 6, o.y + o.h / 2); c.stroke();
  });
  (v.bullets || []).forEach(b => { c.strokeStyle = '#edbb4655'; c.lineWidth = 5; c.beginPath(); c.moveTo(b.x - b.vx * .035, b.y - b.vy * .035); c.lineTo(b.x, b.y); c.stroke(); circle(c, b.x, b.y, 4.5, '#d29b24'); });
  (v.tanks || []).forEach((t, i) => {
    c.save(); c.translate(t.x, t.y); c.rotate(t.angle || 0);
    c.fillStyle = '#3e535c'; rounded(c, -17, -20, 34, 10, 4); c.fill(); rounded(c, -17, 10, 34, 10, 4); c.fill();
    c.fillStyle = colors[i]; rounded(c, -19, -14, 38, 28, 6); c.fill(); c.fillStyle = '#ffffff44'; rounded(c, -10, -9, 21, 18, 4); c.fill();
    c.strokeStyle = '#35535a'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(29, 0); c.stroke(); circle(c, 0, 0, 10, colors[i]); c.restore();
    for (let k = 0; k < 5; k++) circle(c, t.x + (k - 2) * 8, t.y - 33, 3, k < t.hp ? colors[i] : '#cfcfc5');
    if (i === own) { c.strokeStyle = colors[i] + '88'; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.arc(t.x, t.y, 28, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
  });
}
function drawBomber(c, v, own, colors, now) {
  const cols = v.cols || 13, rows = v.rows || 11, tw = 624 / cols, th = 528 / rows;
  c.fillStyle = '#f8f1fb'; c.fillRect(0, 0, 624, 528);
  (v.grid || []).forEach((row, y) => row.forEach((cell, x) => {
    const px = x * tw, py = y * th;
    c.fillStyle = (x + y) % 2 ? '#f1eaf5' : '#f8f3fa'; c.fillRect(px, py, tw, th);
    if (cell === 1) { c.fillStyle = '#c2b8d6'; rounded(c, px + 3, py + 4, tw - 6, th - 6, 9); c.fill(); c.fillStyle = '#d9d2e7'; rounded(c, px + 5, py + 4, tw - 10, th - 13, 7); c.fill(); }
    if (cell === 2) { c.fillStyle = '#edae98'; rounded(c, px + 4, py + 4, tw - 8, th - 8, 6); c.fill(); c.strokeStyle = '#fbd7bb'; c.lineWidth = 3; c.beginPath(); c.moveTo(px + 7, py + th / 2); c.lineTo(px + tw - 7, py + th / 2); c.moveTo(px + tw / 2, py + 7); c.lineTo(px + tw / 2, py + th / 2); c.stroke(); }
  }));
  (v.flames || []).forEach(f => { const x = (f.x + .5) * tw, y = (f.y + .5) * th; circle(c, x, y, 23, '#f6b651aa'); star(c, x, y, 23, '#ffe680'); circle(c, x, y, 9, '#fffce7'); });
  (v.bombs || []).forEach(b => {
    const x = (b.x + .5) * tw, y = (b.y + .5) * th, pulse = Math.sin(now / 90) * 1.5;
    circle(c, x, y + 4, 18 + pulse, '#6b576422'); circle(c, x, y, 16 + pulse, '#5e4c6f'); circle(c, x - 5, y - 5, 5, '#ffffff55');
    c.strokeStyle = '#957f4d'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 5, y - 14); c.quadraticCurveTo(x + 3, y - 26, x + 13, y - 22); c.stroke(); star(c, x + 13, y - 23, 6, '#f2ad43');
  });
  (v.players || []).forEach((p, i) => { if (p.alive !== false) avatar(c, (p.x + .5) * tw, (p.y + .5) * th, 15, colors[i], own === i); });
}
function drawSnake(c, v, own, colors) {
  const cols = v.cols || 24, rows = v.rows || 20, w = 720 / cols, h = 600 / rows;
  c.fillStyle = '#eef7ef'; c.fillRect(0, 0, 720, 600);
  for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) if ((x + y) % 2) { c.fillStyle = '#e6f1e6'; c.fillRect(x * w, y * h, w, h); }
  c.strokeStyle = '#c5dcca'; c.lineWidth = 6; rounded(c, 3, 3, 714, 594, 15); c.stroke();
  (v.food || []).forEach(f => { const x = (f.x + .5) * w, y = (f.y + .5) * h; circle(c, x, y, w * .46, '#ffefb4'); star(c, x, y, w * .35, '#eab741'); });
  (v.snakes || []).forEach((t, i) => {
    [...t.body].reverse().forEach((p, n) => { c.fillStyle = n === t.body.length - 1 ? colors[i] : colors[i] + 'cc'; rounded(c, p.x * w + 1.5, p.y * h + 1.5, w - 3, h - 3, n === t.body.length - 1 ? 9 : 6); c.fill(); });
    const head = t.body[0]; if (!head) return;
    const [dx, dy] = DIRECTIONS[t.dir] || [1, 0], x = (head.x + .5) * w, y = (head.y + .5) * h;
    for (const sign of [-1, 1]) { circle(c, x + dx * 5 + dy * sign * 5, y + dy * 5 + dx * sign * 5, 3.2, '#fff'); circle(c, x + dx * 6 + dy * sign * 5, y + dy * 6 + dx * sign * 5, 1.5, '#334f57'); }
    if (own === i) { c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; rounded(c, head.x * w + 2, head.y * h + 2, w - 4, h - 4, 8); c.stroke(); }
  });
}
function drawSling(c, v, own, colors, now) {
  const sky = c.createLinearGradient(0, 0, 0, 500); sky.addColorStop(0, '#d9eff6'); sky.addColorStop(1, '#fbf7e9'); c.fillStyle = sky; c.fillRect(0, 0, 900, 500);
  circle(c, 740, 75, 32, '#ffe9a2');
  for (const [x, y, s] of [[110, 78, 1], [490, 105, 1.15], [680, 160, .7]]) { circle(c, x, y, 20 * s, '#ffffffbb'); circle(c, x + 23 * s, y - 8 * s, 25 * s, '#ffffffbb'); circle(c, x + 47 * s, y, 20 * s, '#ffffffbb'); }
  c.fillStyle = '#bad8c0'; c.beginPath(); c.moveTo(0, 500); for (let x = 0; x <= 900; x += 5) c.lineTo(x, terrain(x)); c.lineTo(900, 500); c.closePath(); c.fill();
  c.strokeStyle = '#87b599'; c.lineWidth = 5; c.beginPath(); for (let x = 0; x <= 900; x += 5) { if (!x) c.moveTo(x, terrain(x)); else c.lineTo(x, terrain(x)); } c.stroke();
  (v.castles || []).forEach((castle, i) => {
    const x = castle.x, y = terrain(x), tint = colors[i];
    c.fillStyle = '#7b826c22'; rounded(c, x - 40, y - 6, 80, 13, 8); c.fill();
    c.fillStyle = '#f5e3c6'; rounded(c, x - 32, y - 65, 64, 65, 3); c.fill();
    c.fillStyle = '#e7cfa9'; for (let k = 0; k < 3; k++) c.fillRect(x - 34 + k * 25, y - 78, 18, 22);
    c.strokeStyle = '#d8bd96'; c.lineWidth = 2; for (let yy = y - 50; yy < y; yy += 17) { c.beginPath(); c.moveTo(x - 30, yy); c.lineTo(x + 30, yy); c.stroke(); }
    c.fillStyle = tint; rounded(c, x - 10, y - 33, 20, 33, [9, 9, 0, 0]); c.fill();
    c.strokeStyle = '#697f79'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y - 76); c.lineTo(x, y - 115); c.stroke();
    c.fillStyle = tint; c.beginPath(); c.moveTo(x, y - 115); c.lineTo(x + (i ? -28 : 28), y - 106); c.lineTo(x, y - 98); c.closePath(); c.fill();
    c.fillStyle = '#ffffffcc'; rounded(c, x - 45, y - 145, 90, 17, 8); c.fill(); c.fillStyle = tint; rounded(c, x - 43, y - 143, Math.max(0, castle.hp) / 100 * 86, 13, 6); c.fill(); text(c, `${castle.hp} HP`, x, y - 163, 17);
    if (v.turn === i && !v.projectile) text(c, own === i ? '你的回合' : '对方回合', x, y - 195, 18, tint);
  });
  if (v.projectile) { const b = v.projectile; c.strokeStyle = '#5e718355'; c.lineWidth = 5; c.beginPath(); c.moveTo(b.x - b.vx * .05, b.y - b.vy * .05); c.lineTo(b.x, b.y); c.stroke(); circle(c, b.x, b.y, 8, '#40576c'); circle(c, b.x - 2, b.y - 3, 3, '#8ba6b4'); }
  if (v.impact && v.impact.until > Date.now()) { const phase = Math.max(.1, (v.impact.until - Date.now()) / 850); circle(c, v.impact.x, v.impact.y, 20 + (1 - phase) * 25, `rgba(249,191,72,${phase * .7})`); star(c, v.impact.x, v.impact.y, 30, '#fff4b9'); }
  const wind = v.wind || 0; text(c, `风 ${wind > 0 ? '→' : wind < 0 ? '←' : '·'} ${Math.abs(wind)}`, 450, 42, 22, '#527f8b');
}
function drawMaze(c, v, own, colors) {
  const cols = v.cols || 17, rows = v.rows || 13, w = 680 / cols, h = 520 / rows;
  c.fillStyle = '#f1f7f5'; c.fillRect(0, 0, 680, 520);
  (v.grid || []).forEach((row, y) => row.forEach((cell, x) => {
    c.fillStyle = (x + y) % 2 ? '#eaf2ed' : '#f4f8f1'; c.fillRect(x * w, y * h, w, h);
    if (cell) { c.fillStyle = '#b0c9c9'; rounded(c, x * w + 2, y * h + 3, w - 4, h - 4, 7); c.fill(); c.fillStyle = '#c6dada'; rounded(c, x * w + 4, y * h + 3, w - 8, h - 12, 5); c.fill(); }
  }));
  (v.bases || [{ x: 1, y: 6 }, { x: 15, y: 6 }]).forEach((b, i) => { const x = (b.x + .5) * w, y = (b.y + .5) * h; circle(c, x, y, 19, colors[i] + '44'); c.strokeStyle = colors[i]; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 17, 0, Math.PI * 2); c.stroke(); text(c, '家', x, y, 15, colors[i]); });
  if (v.flag?.carrier === null) { const x = (v.flag.x + .5) * w, y = (v.flag.y + .5) * h; circle(c, x, y, 22, '#fff2bf'); flag(c, x - 5, y, 1); }
  (v.players || []).forEach((p, i) => { const x = (p.x + .5) * w, y = (p.y + .5) * h; avatar(c, x, y, 13, colors[i], own === i); if (v.flag?.carrier === i) flag(c, x + 9, y - 17, .7); });
}
const DRAW = { hockey: drawHockey, tanks: drawTanks, bomber: drawBomber, snake: drawSnake, slingshot: drawSling, maze: drawMaze };

function mount(kind, root, send, context = {}) {
  const config = DETAILS[kind], own = context.player === 1 ? 1 : 0, colors = context.colors || COLORS;
  let latest = null, destroyed = false, frame = 0, pressed = new Set(), lastMove = 0, lastAim = 0, pointer = null;
  const off = [], listeners = (node, event, fn, options) => { node.addEventListener(event, fn, options); off.push(() => node.removeEventListener(event, fn, options)); };
  const shell = el('div', `arcade-mount arcade-${kind}`), topline = el('div', 'arcade-topline'), label = el('span', 'arcade-eyebrow', config.theme), time = el('span', 'arcade-clock', '等待开局');
  topline.append(label, time); shell.append(topline);
  const scoreboard = el('div', 'arcade-scoreboard');
  const scoreNodes = [0, 1].map(i => { const box = el('div', `arcade-scorecard player-${i}`), name = el('span', '', `${i ? '薄荷' : '蜜桃'}${i === own ? ' · 你' : ''}`), score = el('strong', '', '0'); box.append(name, score); scoreboard.append(box); return score; });
  shell.append(scoreboard);
  const wrap = el('div', 'arcade-canvas-wrap'), canvas = el('canvas', 'arcade-canvas'); canvas.width = config.width; canvas.height = config.height; canvas.tabIndex = 0; canvas.setAttribute('aria-label', `${config.title}。${config.hint}`); canvas.setAttribute('role', 'img'); wrap.append(canvas); shell.append(wrap);
  const c = canvas.getContext('2d');
  const status = el('p', 'arcade-status game-note', '等待权威开局快照…'); status.setAttribute('role', 'status'); shell.append(status);
  let angle, power, shot, angleValue, powerValue;
  if (kind === 'slingshot') {
    const panel = el('div', 'arcade-shot-panel');
    const makeSlider = (name, min, max, value) => {
      const label = el('label', 'arcade-slider'), top = el('span'), title = el('span', '', name), output = el('output', '', String(value));
      top.append(title, output); const input = el('input'); input.type = 'range'; input.min = String(min); input.max = String(max); input.value = String(value); input.setAttribute('aria-label', name); label.append(top, input); panel.append(label); listeners(input, 'input', () => { output.value = name === '角度' ? `${input.value}°` : input.value; }); return [input, output];
    };
    [angle, angleValue] = makeSlider('角度', 10, 80, 45); [power, powerValue] = makeSlider('力度', 20, 100, 80); angleValue.value = '45°';
    shot = el('button', 'game-button primary arcade-fire', '↗ 发射'); shot.type = 'button'; panel.append(shot); listeners(shot, 'click', () => fire()); shell.append(panel);
  }
  const controls = el('div', 'touch-controls arcade-controls'), dpad = el('div', 'dpad arcade-dpad');
  const emit = a => { if (!destroyed && latest?.status === 'playing') send(a); };
  const direction = dir => {
    if (kind === 'snake') emit({ type: 'direction', dir });
    else if (kind === 'bomber' || kind === 'maze') emit({ type: 'move', dir });
  };
  function fire() {
    if (kind === 'tanks') emit({ type: 'fire' });
    else if (kind === 'bomber') emit({ type: 'bomb' });
    else if (kind === 'slingshot') emit({ type: 'shoot', angle: Number(angle.value), power: Number(power.value) });
    context.feedback?.('tap');
  }
  const move = () => {
    let dx = 0, dy = 0; for (const dir of pressed) { const d = DIRECTIONS[dir]; if (d) { dx += d[0]; dy += d[1]; } }
    dx = Math.max(-1, Math.min(1, dx)); dy = Math.max(-1, Math.min(1, dy));
    if (kind === 'tanks') emit({ type: 'control', dx, dy });
    else if (kind === 'hockey' && (dx || dy)) {
      const p = latest?.paddles?.[own]; if (p) emit({ type: 'move', x: Math.max(0, Math.min(720, p.x + dx * 70)), y: Math.max(0, Math.min(440, p.y + dy * 70)) });
    } else if (pressed.size && kind !== 'snake') direction([...pressed].at(-1));
  };
  if (kind !== 'slingshot') {
    for (const [dir, symbol, chinese] of [['up', '↑', '上'], ['left', '←', '左'], ['right', '→', '右'], ['down', '↓', '下']]) {
      const button = el('button', `game-button arcade-direction arcade-dir-${dir}`, symbol); button.type = 'button'; button.setAttribute('aria-label', `向${chinese}`); dpad.append(button);
      listeners(button, 'pointerdown', e => { e.preventDefault(); canvas.focus({ preventScroll: true }); button.setPointerCapture?.(e.pointerId); pressed.add(dir); button.classList.add('active'); if (kind === 'snake') direction(dir); else move(); lastMove = performance.now(); });
      const release = () => { pressed.delete(dir); button.classList.remove('active'); if (kind === 'tanks') move(); };
      listeners(button, 'pointerup', release); listeners(button, 'pointercancel', release); listeners(button, 'lostpointercapture', release);
      listeners(button, 'click', e => { if (e.detail === 0) { direction(dir); if (kind === 'hockey' || kind === 'tanks') { pressed.add(dir); move(); pressed.delete(dir); if (kind === 'tanks') move(); } } });
    }
    controls.append(dpad);
    const aside = el('div', 'action-pad arcade-action-pad');
    if (kind === 'tanks' || kind === 'bomber') {
      const action = el('button', 'game-button primary arcade-action', kind === 'tanks' ? '◎ 射击' : '✦ 炸弹'); action.type = 'button'; listeners(action, 'click', fire); aside.append(action);
    }
    const identity = el('span', 'arcade-control-hint', kind === 'hockey' ? '直接拖动球拍更顺手' : kind === 'snake' ? '轻点方向，提前转弯' : kind === 'maze' ? '金旗 → 你的家' : kind === 'tanks' ? '触摸战场调整炮口' : '放完炸弹，快躲开'); aside.append(identity); controls.append(aside); shell.append(controls);
  }
  const hint = el('p', 'arcade-hint game-note', config.hint); shell.append(hint); root.replaceChildren(shell);
  const aim = e => {
    if (!latest || latest.status !== 'playing') return;
    const now = performance.now(); if (now - lastAim < 28 && e.type === 'pointermove') return; lastAim = now;
    const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(config.width, (e.clientX - rect.left) / rect.width * config.width)), y = Math.max(0, Math.min(config.height, (e.clientY - rect.top) / rect.height * config.height));
    if (kind === 'hockey') emit({ type: 'move', x, y }); else if (kind === 'tanks') emit({ type: 'aim', x, y });
  };
  listeners(canvas, 'pointerdown', e => { canvas.focus({ preventScroll: true }); if (kind !== 'hockey' && kind !== 'tanks') return; e.preventDefault(); pointer = e.pointerId; canvas.setPointerCapture?.(e.pointerId); aim(e); });
  listeners(canvas, 'pointermove', e => { if (pointer === e.pointerId || (kind === 'tanks' && e.pointerType === 'mouse' && document.activeElement === canvas)) aim(e); });
  const releasePointer = e => { if (pointer === e.pointerId) { pointer = null; if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId); } };
  listeners(canvas, 'pointerup', releasePointer); listeners(canvas, 'pointercancel', releasePointer); listeners(canvas, 'lostpointercapture', e => { if (pointer === e.pointerId) pointer = null; });
  listeners(root, 'keydown', e => {
    if (typingTarget(e) || latest?.status !== 'playing') return;
    const dir = KEYS[e.code];
    if (dir && kind !== 'slingshot') { e.preventDefault(); if (!pressed.has(dir)) { pressed.add(dir); if (kind === 'snake') direction(dir); else move(); lastMove = performance.now(); } }
    else if (e.code === 'Space' && ['tanks', 'bomber', 'slingshot'].includes(kind)) { e.preventDefault(); if (!e.repeat) fire(); }
  });
  const clear = () => { pressed.clear(); shell.querySelectorAll('.arcade-direction.active').forEach(b => b.classList.remove('active')); if (kind === 'tanks') move(); };
  listeners(window, 'keyup', e => { const dir = KEYS[e.code]; if (dir && pressed.has(dir)) { pressed.delete(dir); if (kind === 'tanks') move(); } });
  listeners(window, 'blur', clear); listeners(document, 'visibilitychange', () => { if (document.hidden) clear(); });
  const paint = now => {
    if (destroyed) return;
    if (latest && c) {
      c.clearRect(0, 0, config.width, config.height); DRAW[kind](c, latest, own, colors, context.reducedMotion ? 0 : now);
      if (latest.status === 'finished') { c.fillStyle = '#ffffff66'; c.fillRect(0, 0, config.width, config.height); }
      const seconds = Math.max(0, Math.ceil((latest.endsAt - Date.now()) / 1000)); const clockText = latest.status === 'finished' ? '本局已结束' : Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '进行中'; if (time.textContent !== clockText) time.textContent = clockText;
      if (pressed.size && now - lastMove > (kind === 'bomber' || kind === 'maze' ? 150 : 90)) { move(); lastMove = now; }
    } else if (c) { c.fillStyle = '#edf4f3'; c.fillRect(0, 0, config.width, config.height); text(c, '准备好一起开玩了吗？', config.width / 2, config.height / 2, 24); }
    frame = requestAnimationFrame(paint);
  };
  frame = requestAnimationFrame(paint);
  return {
    update(view) {
      if (destroyed || !view || typeof view !== 'object') return;
      const old = latest; latest = view;
      scoreNodes.forEach((n, i) => {
        const score = Number.isFinite(view.scores?.[i]) ? view.scores[i] : 0;
        let value = `${score} ${config.score}`;
        if (kind === 'tanks') value = `${view.tanks?.[i]?.hp ?? 5} / 5 装甲`;
        if (kind === 'slingshot') value = `${view.castles?.[i]?.hp ?? 100} HP`;
        n.textContent = value;
      });
      const message = typeof view.message === 'string' ? view.message : config.hint; if (status.textContent !== message) status.textContent = message;
      if (shot) { shot.disabled = view.status !== 'playing' || view.turn !== own || !!view.projectile; shot.textContent = view.projectile ? '弹道飞行中…' : view.turn === own ? '↗ 发射' : '等待对方发射'; }
      if (old && old.status !== 'finished' && view.status === 'finished') { clear(); context.feedback?.(view.winner === own ? 'win' : view.winner === -1 ? 'draw' : 'lose'); }
    },
    destroy() {
      if (destroyed) return; destroyed = true; clear(); cancelAnimationFrame(frame); off.forEach(fn => fn());
      if (pointer !== null && canvas.hasPointerCapture?.(pointer)) canvas.releasePointerCapture(pointer); pointer = null; shell.remove();
    }
  };
}
export const renderers = Object.fromEntries(Object.keys(DETAILS).map(kind => [kind, (root, send, context) => mount(kind, root, send, context)]));
