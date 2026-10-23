/* =============================================================
   DUIZUO · 动作竞技组渲染器
   视觉：云间糖屋（浅色毛玻璃）—— 蜜桃粉 × 薄荷绿 × 淡紫
   位置 / 碰撞 / 得分 / 胜负全部来自服务端 view，本文件只做视觉插值与特效。
   ============================================================= */

const COLORS = ['#FF7E6B', '#1FBE9C'];
const LIL = '#9A8BEE';
const INK = '#25313D';
const INK2 = '#495868';
const MUTED = '#8A97A6';
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

/* ------------------------------------------------------------------
   基础工具
   ------------------------------------------------------------------ */
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * t;
const typingTarget = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;
const terrain = x => 425 - 65 * Math.exp(-((x - 450) ** 2) / 12500);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const hexToRgb = hex => {
  let h = String(hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const n = parseInt(h, 16);
  if (!Number.isFinite(n)) return { r: 255, g: 255, b: 255 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const rgbToHex = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
/** amt>0 变亮（趋向白），amt<0 变暗（趋向黑） */
const shade = (hex, amt) => { const { r, g, b } = hexToRgb(hex); const t = amt > 0 ? 255 : 0, k = Math.abs(amt); return rgbToHex(lerp(r, t, k), lerp(g, t, k), lerp(b, t, k)); };
const alpha = (hex, a) => { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
const mix = (a, b, t) => { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(lerp(A.r, B.r, t), lerp(A.g, B.g, t), lerp(A.b, B.b, t)); };

const rounded = (c, x, y, w, h, r = 10) => { c.beginPath(); c.roundRect(Math.max(0, x), Math.max(0, y), Math.max(0, w), Math.max(0, h), r); };
const circle = (c, x, y, r, color) => { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
const ellipse = (c, x, y, rx, ry, color) => { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
const text = (c, value, x, y, size = 18, color = INK, align = 'center', weight = 800) => { c.font = `${weight} ${size}px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif`; c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(String(value), x, y); };
const grad = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => g.addColorStop(clamp(o, 0, 1), col)); return g; };
const rgrad = (c, x0, y0, r0, x1, y1, r1, stops) => { const g = c.createRadialGradient(x0, y0, r0, x1, y1, r1); stops.forEach(([o, col]) => g.addColorStop(clamp(o, 0, 1), col)); return g; };
const softShadow = (c, color, blur, dx, dy) => { c.shadowColor = color; c.shadowBlur = blur; c.shadowOffsetX = dx; c.shadowOffsetY = dy; };
const clearShadow = c => { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; };

function star(c, x, y, r, color) {
  c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * .48 : r; const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; if (!i) c.moveTo(px, py); else c.lineTo(px, py); } c.closePath(); c.fillStyle = color; c.fill();
}

/** 立体圆角块：顶面高光 + 侧面暗边 + 落地投影 */
function plate(c, x, y, w, h, r, base, opts = {}) {
  const { lift = .3, depth = 5, shadow = true, gloss = true } = opts;
  if (shadow) { c.save(); softShadow(c, 'rgba(58,76,100,.16)', 9, 0, 3); c.fillStyle = shade(base, -.2); rounded(c, x, y + depth, w, h, r); c.fill(); c.restore(); }
  c.fillStyle = grad(c, x, y, x, y + h, [[0, shade(base, lift)], [.55, base], [1, mix(base, shade(base, -.2), .6)]]);
  rounded(c, x, y, w, Math.max(2, h - depth), r); c.fill();
  if (gloss) { c.save(); c.globalAlpha = .5; c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; rounded(c, x + 1.6, y + 1.6, w - 3.2, Math.max(2, h - depth - 3.2), Math.max(2, r - 2)); c.stroke(); c.restore(); }
}

/** 圆脸小人：渐变身体 + 高光 + 眼睛 + 腮红 */
function face(c, x, y, r, color, opts = {}) {
  const { own = false, dir = [0, 0], blink = 0 } = opts;
  ellipse(c, x, y + r * .95, r * .84, r * .3, 'rgba(58,76,100,.13)');
  c.fillStyle = rgrad(c, x - r * .34, y - r * .42, r * .08, x, y, r * 1.28, [[0, shade(color, .4)], [.5, color], [1, shade(color, -.2)]]);
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.save(); c.globalAlpha = .45; ellipse(c, x - r * .32, y - r * .42, r * .3, r * .19, '#ffffff'); c.restore();
  const ex = r * .32, ey = -r * .1;
  for (const s of [-1, 1]) {
    const px = x + s * ex + dir[0] * r * .17, py = y + ey + dir[1] * r * .12;
    ellipse(c, px, py, r * .17, r * .18 * (blink ? .25 : 1), '#ffffff');
    if (!blink) circle(c, px + dir[0] * r * .07, py + dir[1] * r * .06, r * .085, '#3A4A57');
  }
  c.save(); c.globalAlpha = .45;
  ellipse(c, x - r * .6, y + r * .18, r * .19, r * .11, '#FFAFA0');
  ellipse(c, x + r * .6, y + r * .18, r * .19, r * .11, '#FFAFA0');
  c.restore();
  if (own) { c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 2.4; c.beginPath(); c.arc(x, y, r + 4, 0, Math.PI * 2); c.stroke(); }
}

/** 小爱心（装甲值） */
function heart(c, x, y, s, color, filled) {
  c.beginPath();
  c.moveTo(x, y + s * .78);
  c.bezierCurveTo(x - s * 1.15, y - s * .1, x - s * .6, y - s * .98, x, y - s * .34);
  c.bezierCurveTo(x + s * .6, y - s * .98, x + s * 1.15, y - s * .1, x, y + s * .78);
  c.closePath();
  if (filled) { c.fillStyle = color; c.fill(); c.save(); c.globalAlpha = .55; ellipse(c, x - s * .3, y - s * .36, s * .22, s * .13, '#ffffff'); c.restore(); }
  else { c.strokeStyle = 'rgba(58,76,100,.22)'; c.lineWidth = 1.3; c.stroke(); }
}

/** 渐变布旗（带飘动） */
function clothFlag(c, x, y, scale, wave, colors = ['#FFD98A', '#F2A93B']) {
  const s = scale, w = 22 * s, h = 14 * s;
  c.save(); c.translate(x, y);
  c.strokeStyle = '#B7A184'; c.lineWidth = 2.4 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 14 * s); c.lineTo(0, -18 * s); c.stroke();
  c.fillStyle = grad(c, 0, -18 * s, w, -4 * s, [[0, colors[0]], [1, colors[1]]]);
  c.beginPath(); c.moveTo(0, -18 * s);
  c.quadraticCurveTo(w * .5, -18 * s + wave * 3 * s, w, -16 * s + wave * 4 * s);
  c.quadraticCurveTo(w * .55, -8 * s + wave * 3 * s, 0, -4 * s);
  c.closePath(); c.fill();
  c.save(); c.globalAlpha = .38; c.fillStyle = '#ffffff';
  c.beginPath(); c.moveTo(0, -16 * s); c.quadraticCurveTo(w * .45, -16 * s + wave * 2 * s, w * .9, -14.5 * s + wave * 3 * s);
  c.quadraticCurveTo(w * .45, -12 * s + wave * 2 * s, 0, -10 * s); c.closePath(); c.fill(); c.restore();
  c.restore();
}

/* ---------- 离屏缓存：静态场景只画一次 ---------- */
function layer(scene, key, w, h, build) {
  const store = scene.layers;
  if (store[key]) return store[key];
  if (typeof document === 'undefined' || !document.createElement) return null;
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const oc = off.getContext && off.getContext('2d');
  if (!oc) return null;
  build(oc);
  store[key] = off;
  return off;
}

/* ---------- 粒子 ---------- */
function burst(list, x, y, color, count, speed, spread = Math.PI * 2, dir = 0) {
  for (let i = 0; i < count; i++) {
    const a = dir + (hash(i * 3.1 + x) - .5) * spread;
    const v = speed * (.45 + hash(i * 7.7 + y) * .9);
    list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .55 + hash(i * 2.3 + x + y) * .5, max: 1, r: 2 + hash(i * 5.1) * 3, color });
  }
}
function stepParticles(list, dt) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.life -= dt;
    if (p.life <= 0) list.splice(i, 1);
  }
}
function drawParticles(c, list) {
  for (const p of list) {
    const k = clamp(p.life / p.max, 0, 1);
    c.save(); c.globalAlpha = k * .85;
    circle(c, p.x, p.y, p.r * (.4 + k * .8), p.color);
    c.restore();
  }
}

/* ---------- 通用插值 ---------- */
function approach(cur, target, k, dt, snap) {
  if (!target) return cur;
  if (snap || !dt) return { x: target.x, y: target.y, ax: 0, ay: 0 };
  const t = 1 - Math.exp(-k * dt);
  const x = lerp(cur.x, target.x, t), y = lerp(cur.y, target.y, t);
  return { x, y, ax: x - cur.x, ay: y - cur.y };
}

/* ------------------------------------------------------------------
   迷你冰球
   ------------------------------------------------------------------ */
function hockeyScene(ctx) {
  const W = 720, H = 440;
  const colors = ctx.colors, own = ctx.own;
  let pads = [{ x: 90, y: 220, ax: 0, ay: 0 }, { x: 630, y: 220, ax: 0, ay: 0 }];
  let puck = { x: 360, y: 220, ax: 0, ay: 0 };
  let trail = [];
  let prevScores = [0, 0];
  let goalFx = null;
  const parts = [];

  const buildIce = oc => {
    oc.fillStyle = grad(oc, 0, 0, 0, H, [[0, '#F7FDFF'], [.42, '#E7F5FD'], [1, '#CBE6F5']]);
    oc.fillRect(0, 0, W, H);
    oc.fillStyle = rgrad(oc, W * .28, 26, 0, W * .28, 26, 330, [[0, 'rgba(255,255,255,.62)'], [1, 'rgba(255,255,255,0)']]);
    oc.fillRect(0, 0, W, H);
    /* 细霜纹 */
    oc.save(); oc.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const x = hash(i * 1.7) * (W + 120) - 60, y = hash(i * 2.9 + 4) * H, len = 18 + hash(i * 3.3) * 46;
      oc.strokeStyle = `rgba(255,255,255,${.3 + hash(i * 5.1) * .5})`;
      oc.lineWidth = .8 + hash(i * 7.3) * .9;
      oc.beginPath(); oc.moveTo(x, y); oc.lineTo(x + len, y + len * .12); oc.stroke();
    }
    oc.restore();
    for (let i = 0; i < 120; i++) {
      const x = hash(i * 4.7 + 2) * W, y = hash(i * 6.1 + 9) * H;
      ellipse(oc, x, y, .9 + hash(i * 8.3), .9 + hash(i * 9.1), 'rgba(255,255,255,.85)');
    }
    /* 双方半场淡染 */
    oc.fillStyle = 'rgba(255,126,107,.045)'; oc.fillRect(0, 0, W / 2, H);
    oc.fillStyle = 'rgba(31,190,156,.045)'; oc.fillRect(W / 2, 0, W / 2, H);
    /* 球门区 */
    const crease = (gx, dir) => {
      oc.save();
      oc.fillStyle = dir < 0 ? 'rgba(255,126,107,.07)' : 'rgba(31,190,156,.07)';
      oc.beginPath(); oc.roundRect(gx < 0 ? 8 : W - 96, 145, 88, 150, 26); oc.fill();
      oc.strokeStyle = 'rgba(154,139,238,.30)'; oc.lineWidth = 2.4;
      oc.beginPath(); oc.roundRect(gx < 0 ? 8 : W - 96, 145, 88, 150, 26); oc.stroke();
      oc.restore();
    };
    crease(0, -1); crease(W, 1);
    /* 场地线 */
    oc.strokeStyle = 'rgba(154,139,238,.34)'; oc.lineWidth = 3; oc.setLineDash([12, 12]);
    oc.beginPath(); oc.moveTo(W / 2, 16); oc.lineTo(W / 2, H - 16); oc.stroke(); oc.setLineDash([]);
    oc.strokeStyle = 'rgba(120,160,190,.34)'; oc.lineWidth = 3;
    oc.beginPath(); oc.arc(W / 2, H / 2, 62, 0, Math.PI * 2); oc.stroke();
    oc.beginPath(); oc.arc(W / 2, H / 2, 5.5, 0, Math.PI * 2); oc.strokeStyle = 'rgba(154,139,238,.5)'; oc.stroke();
    for (const fx of [148, 572]) for (const fy of [116, 324]) {
      oc.strokeStyle = 'rgba(120,160,190,.24)'; oc.lineWidth = 2;
      oc.beginPath(); oc.arc(fx, fy, 30, 0, Math.PI * 2); oc.stroke();
    }
    /* 边线 */
    oc.save(); softShadow(oc, 'rgba(58,76,100,.14)', 10, 0, 2);
    oc.strokeStyle = 'rgba(255,255,255,.96)'; oc.lineWidth = 9; oc.beginPath(); oc.roundRect(9, 9, W - 18, H - 18, 34); oc.stroke();
    oc.restore();
  };

  const drawGoal = (c, x, dir) => {
    const gx = dir < 0 ? x - 4 : x - 20, gy = 145, gw = 24, gh = 150;
    c.save();
    c.fillStyle = 'rgba(206,231,244,.85)'; rounded(c, gx, gy, gw, gh, 8); c.fill();
    c.strokeStyle = 'rgba(126,160,186,.62)'; c.lineWidth = 1.2;
    for (let y = gy + 9; y < gy + gh - 4; y += 9) { c.beginPath(); c.moveTo(gx + 2, y); c.lineTo(gx + gw - 2, y); c.stroke(); }
    for (let i = 0; i < 5; i++) { const lx = gx + 3 + i * (gw - 6) / 4; c.beginPath(); c.moveTo(lx, gy + 4); c.lineTo(lx, gy + gh - 4); c.stroke(); }
    c.strokeStyle = '#CBDCEA'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(gx + (dir < 0 ? gw : 0), gy - 3); c.lineTo(gx + (dir < 0 ? gw : 0), gy + gh + 3); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(gx + (dir < 0 ? gw : 0), gy - 3); c.lineTo(gx + (dir < 0 ? gw : 0), gy + gh + 3); c.stroke();
    c.restore();
  };

  const drawBlade = (c, p, i) => {
    c.save(); c.translate(p.x,p.y);
    ellipse(c,2,10,28,9,'rgba(58,76,100,.16)');
    const gradient=c.createRadialGradient(-8,-10,1,0,0,28);gradient.addColorStop(0,'#fff9ec');gradient.addColorStop(.18,colors[i]);gradient.addColorStop(1,i?'#239b86':'#d56657');
    ellipse(c,0,0,27,27,gradient);c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=3;c.beginPath();c.arc(0,0,25,0,Math.PI*2);c.stroke();
    ellipse(c,0,-3,12,13,'rgba(255,255,255,.45)');ellipse(c,0,-7,9,9,colors[i]);
    c.restore();
  };

  return {
    layers: {}, clock: 0, dirty: true,
    update(view, now) {
      const s = view?.scores || [0, 0];
      s.forEach((v, i) => {
        if (v > (prevScores[i] || 0)) {
          const gx = i === 0 ? W : 0;
          goalFx = { x: gx, y: 220, t0: now, color: colors[i] };
          burst(parts, gx + (i === 0 ? -8 : 8), 220, colors[i], 22, 220, Math.PI * 1.1, i === 0 ? Math.PI : 0);
          burst(parts, gx + (i === 0 ? -8 : 8), 220, '#FFFFFF', 14, 160, Math.PI * 1.2, i === 0 ? Math.PI : 0);
        }
      });
      prevScores = [s[0] || 0, s[1] || 0];
      this.dirty = true;
    },
    draw(c, env) {
      const { now, clock, dt, snap, view } = env;
      (view.paddles || []).forEach((p, i) => { pads[i] = approach(pads[i], p, 20, dt, snap); });
      if (view.puck) puck = approach(puck, view.puck, 30, dt, snap);
      if (!snap) {
        if (trail.length && Math.hypot(puck.x - trail[trail.length - 1].x, puck.y - trail[trail.length - 1].y) > 70) trail.length = 0;
        trail.push({ x: puck.x, y: puck.y });
        if (trail.length > 16) trail.shift();
      }
      stepParticles(parts, dt);

      const bg = layer(this, 'ice', W, H, buildIce);
      if (bg) c.drawImage(bg, 0, 0); else buildIce(c);

      drawGoal(c, 0, -1);
      drawGoal(c, W, 1);

      /* 进球闪光环 */
      if (goalFx) {
        const k = (now - goalFx.t0) / 1100;
        if (k < 1) {
          c.save();
          c.globalAlpha = (1 - k) * .85;
          c.strokeStyle = goalFx.color; c.lineWidth = 5 * (1 - k) + 1.5;
          c.beginPath(); c.ellipse(goalFx.x + (goalFx.x === 0 ? 10 : -10), 220, 22 + k * 86, 30 + k * 96, 0, 0, Math.PI * 2); c.stroke();
          c.globalAlpha = (1 - k) * .5;
          c.fillStyle = rgrad(c, goalFx.x, 220, 6, goalFx.x, 220, 70 + k * 60, [[0, alpha(goalFx.color, .55)], [1, alpha(goalFx.color, 0)]]);
          c.fillRect(goalFx.x - 120, 100, 240, 240);
          c.restore();
        } else goalFx = null;
      }

      /* 冰球拖尾 */
      c.save();
      for (let i = 0; i < trail.length; i++) {
        const t = i / trail.length;
        c.globalAlpha = t * .3;
        circle(c, trail[i].x, trail[i].y, 3 + t * 9, '#9ECBE4');
      }
      c.restore();

      pads.forEach((p, i) => drawBlade(c, p, i));

      /* 冰球：旋转高光 */
      const spin = clock * 5.2;
      ellipse(c, puck.x + 1, puck.y + 6, 12, 4.5, 'rgba(58,76,100,.18)');
      c.fillStyle = rgrad(c, puck.x - 3, puck.y - 4, 1, puck.x, puck.y, 12, [[0, '#5E7A8C'], [.6, '#3A5464'], [1, '#24384A']]);
      c.beginPath(); c.arc(puck.x, puck.y, 11, 0, Math.PI * 2); c.fill();
      c.save(); c.globalAlpha = .85;
      c.translate(puck.x, puck.y); c.rotate(spin);
      ellipse(c, -3, -3.5, 4.4, 2.4, 'rgba(255,255,255,.85)');
      c.restore();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.2;
      c.beginPath(); c.arc(puck.x, puck.y, 10.4, 0, Math.PI * 2); c.stroke();

      drawParticles(c, parts);
    }
  };
}

/* ------------------------------------------------------------------
   口袋坦克
   ------------------------------------------------------------------ */
function tanksScene(ctx) {
  const W = 720, H = 480;
  const colors = ctx.colors, own = ctx.own;
  let bodies = [{ x: 70, y: 240, a: 0, ax: 0, ay: 0 }, { x: 650, y: 240, a: Math.PI, ax: 0, ay: 0 }];
  let shells = [];
  let prevHp = [5, 5];
  let shake = 0;
  const parts = [], blasts = [];

  const buildGround = oc => {
    oc.fillStyle = grad(oc, 0, 0, W, H, [[0, '#FBF4E4'], [.45, '#F3EFDB'], [1, '#E1EEDA']]);
    oc.fillRect(0, 0, W, H);
    oc.fillStyle = rgrad(oc, W * .2, 60, 0, W * .2, 60, 460, [[0, 'rgba(255,255,255,.72)'], [1, 'rgba(255,255,255,0)']]);
    oc.fillRect(0, 0, W, H);
    oc.fillStyle = rgrad(oc, W * .84, H - 30, 0, W * .84, H - 30, 400, [[0, 'rgba(186,220,182,.6)'], [1, 'rgba(186,220,182,0)']]);
    oc.fillRect(0, 0, W, H);
    /* 柔和噪点 */
    for (let i = 0; i < 460; i++) {
      const x = hash(i * 1.37) * W, y = hash(i * 2.11) * H, s = .6 + hash(i * 3.91) * 1.5;
      oc.fillStyle = hash(i * 5.3) > .5 ? 'rgba(150,132,96,.13)' : 'rgba(255,255,255,.5)';
      oc.beginPath(); oc.arc(x, y, s, 0, Math.PI * 2); oc.fill();
    }
    /* 草丛 */
    for (let i = 0; i < 46; i++) {
      const x = hash(i * 7.13) * W, y = hash(i * 9.31) * H;
      if (Math.abs(x - 360) < 120 && Math.abs(y - 240) < 90) continue;
      oc.strokeStyle = 'rgba(140,180,140,.30)'; oc.lineWidth = 1.6; oc.lineCap = 'round';
      for (let k = -1; k <= 1; k++) { oc.beginPath(); oc.moveTo(x, y); oc.quadraticCurveTo(x + k * 3, y - 5, x + k * 5, y - 9); oc.stroke(); }
    }
    oc.save(); softShadow(oc, 'rgba(58,76,100,.14)', 10, 0, 2);
    oc.strokeStyle = 'rgba(255,255,255,.9)'; oc.lineWidth = 8; oc.beginPath(); oc.roundRect(8, 8, W - 16, H - 16, 28); oc.stroke();
    oc.restore();
  };

  const drawObstacle = (c, o, i) => {
    const base = i % 2 ? '#C6CFB4' : '#E2CDA2';
    ellipse(c, o.x + o.w / 2, o.y + o.h + 3, o.w * .45, 6, 'rgba(58,76,100,.12)');
    plate(c, o.x, o.y, o.w, o.h, 12, base, { lift: .3, depth: 7 });
    c.save();
    c.strokeStyle = 'rgba(150,136,104,.5)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(o.x + 7, o.y + o.h * .45); c.lineTo(o.x + o.w - 7, o.y + o.h * .45); c.stroke();
    c.beginPath(); c.moveTo(o.x + o.w * .5, o.y + 7); c.lineTo(o.x + o.w * .5, o.y + o.h * .45); c.stroke();
    c.restore();
    c.save(); c.globalAlpha = .45; c.fillStyle = '#ffffff';
    rounded(c, o.x + 8, o.y + 4, o.w * .34, 4, 2); c.fill(); c.restore();
  };

  const drawTank = (c, t, i, hp) => {
    const color = colors[i];
    c.save(); c.translate(t.x, t.y); c.rotate(t.a);
    ellipse(c, 0, 17, 24, 6.5, 'rgba(58,76,100,.20)');
    /* 履带 */
    for (const side of [-1, 1]) {
      c.fillStyle = grad(c, 0, side * 12 - 5, 0, side * 12 + 5, [[0, '#5B6B74'], [1, '#33424B']]);
      rounded(c, -19, side * 11 - 5, 38, 10, 5); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1;
      for (let k = -16; k <= 16; k += 5) { c.beginPath(); c.moveTo(k, side * 11 - 4); c.lineTo(k, side * 11 + 4); c.stroke(); }
    }
    /* 车体 */
    c.fillStyle = grad(c, 0, -15, 0, 15, [[0, shade(color, .38)], [.5, color], [1, shade(color, -.22)]]);
    rounded(c, -20, -14, 40, 28, 7); c.fill();
    c.save(); c.globalAlpha = .45; c.fillStyle = '#ffffff'; rounded(c, -13, -11, 19, 9, 4); c.fill(); c.restore();
    c.strokeStyle = alpha(shade(color, -.4), .35); c.lineWidth = 1.4; rounded(c, -20, -14, 40, 28, 7); c.stroke();
    /* 炮塔 */
    c.fillStyle = rgrad(c, -4, -6, 2, 0, 0, 13, [[0, shade(color, .5)], [.6, shade(color, .05)], [1, shade(color, -.25)]]);
    c.beginPath(); c.arc(0, -1, 11.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(-3.5, -4.5, 3.4, 0, Math.PI * 2); c.fill();
    /* 炮管 */
    c.fillStyle = grad(c, 8, -4, 8, 4, [[0, '#7C8D98'], [.45, '#4A5B66'], [1, '#33424B']]);
    rounded(c, 6, -3.6, 26, 7.2, 3.4); c.fill();
    c.fillStyle = '#5C6E79'; rounded(c, 27, -4.6, 6, 9.2, 3); c.fill();
    c.save(); c.globalAlpha = .5; c.fillStyle = '#ffffff'; rounded(c, 9, -2.6, 16, 1.8, .9); c.fill(); c.restore();
    c.restore();
    /* 装甲爱心 */
    c.save();
    c.fillStyle = 'rgba(255,255,255,.72)';
    rounded(c, t.x - 24, t.y - 41, 48, 15, 7.5); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1; c.stroke();
    c.restore();
    for (let k = 0; k < 5; k++) heart(c, t.x - 17 + k * 8.5, t.y - 33, 5, color, k < hp);
    /* 己方标记 */
    if (i === own) {
      c.save(); c.strokeStyle = alpha(color, .55); c.lineWidth = 2; c.setLineDash([5, 6]);
      c.beginPath(); c.arc(t.x, t.y, 29, 0, Math.PI * 2); c.stroke(); c.restore();
    }
  };

  return {
    layers: {}, clock: 0, dirty: true,
    update(view, now) {
      const tanks = view?.tanks || [];
      tanks.forEach((t, i) => {
        const before = prevHp[i];
        if (Number.isFinite(t.hp) && before !== undefined && t.hp < before) {
          const b = bodies[i];
          blasts.push({ x: b.x, y: b.y, t0: now, color: colors[i] });
          burst(parts, b.x, b.y, colors[i], 18, 190);
          burst(parts, b.x, b.y, '#FFD08A', 12, 150);
          shake = Math.min(9, shake + 5);
        }
        if (Number.isFinite(t.hp)) prevHp[i] = t.hp;
      });
      this.dirty = true;
    },
    draw(c, env) {
      const { now, clock, dt, snap, view } = env;
      const tanks = view.tanks || [];
      tanks.forEach((t, i) => {
        const cur = bodies[i];
        const nx = approach(cur, t, 22, dt, snap);
        const ang = snap ? (t.angle || 0) : lerp(cur.a, t.angle || 0, 1 - Math.exp(-18 * dt));
        bodies[i] = { x: nx.x, y: nx.y, a: ang, ax: nx.ax, ay: nx.ay };
      });
      /* 炮弹插值 */
      const live = view.bullets || [];
      shells = live.map(b => {
        const prev = shells.find(s => s.id === b);
        return { id: `${b.x.toFixed(2)}:${b.y.toFixed(2)}`, x: b.x, y: b.y, vx: b.vx, vy: b.vy, px: prev ? prev.x : b.x, py: prev ? prev.y : b.y };
      });
      stepParticles(parts, dt);
      shake = Math.max(0, shake - dt * 14);
      const sx = shake ? (hash(clock * 37) - .5) * shake : 0;
      const sy = shake ? (hash(clock * 53 + 7) - .5) * shake : 0;

      c.save(); c.translate(sx, sy);
      const bg = layer(this, 'ground', W, H, buildGround);
      if (bg) c.drawImage(bg, 0, 0); else buildGround(c);
      (view.obstacles || []).forEach((o, i) => drawObstacle(c, o, i));

      /* 炮弹拖尾 */
      for (const s of shells) {
        const len = Math.hypot(s.vx, s.vy) || 1;
        c.save();
        for (let k = 1; k <= 4; k++) {
          c.globalAlpha = .16 - k * .03;
          circle(c, s.x - s.vx / len * k * 4, s.y - s.vy / len * k * 4, 5.5 - k * .7, '#C9B79B');
        }
        c.restore();
        ellipse(c, s.x + 1, s.y + 4, 5, 2.2, 'rgba(58,76,100,.18)');
        c.fillStyle = rgrad(c, s.x - 1.4, s.y - 1.6, .4, s.x, s.y, 5, [[0, '#FFE6A8'], [.55, '#E0A03C'], [1, '#B87A22']]);
        c.beginPath(); c.arc(s.x, s.y, 4.6, 0, Math.PI * 2); c.fill();
      }

      tanks.forEach((t, i) => drawTank(c, bodies[i], i, t.hp ?? 5));

      /* 爆炸光环 */
      for (let i = blasts.length - 1; i >= 0; i--) {
        const b = blasts[i], k = (now - b.t0) / 700;
        if (k >= 1) { blasts.splice(i, 1); continue; }
        c.save();
        c.globalAlpha = (1 - k) * .8;
        c.fillStyle = rgrad(c, b.x, b.y, 4, b.x, b.y, 16 + k * 52, [[0, 'rgba(255,240,205,.95)'], [.45, alpha(b.color, .5)], [1, alpha(b.color, 0)]]);
        c.fillRect(b.x - 90, b.y - 90, 180, 180);
        c.strokeStyle = alpha(b.color, (1 - k) * .6); c.lineWidth = 3 * (1 - k) + .8;
        c.beginPath(); c.arc(b.x, b.y, 12 + k * 46, 0, Math.PI * 2); c.stroke();
        c.restore();
      }
      drawParticles(c, parts);
      c.restore();
    }
  };
}

/* ------------------------------------------------------------------
   泡泡炸弹人
   ------------------------------------------------------------------ */
function bomberScene(ctx) {
  const W = 624, H = 528;
  const colors = ctx.colors, own = ctx.own;
  const flameMeta = new Map();
  let pendingDelay = 0;
  let pops = new Map();
  const parts = [];

  const buildFloor = oc => {
    const cols = 13, rows = 11, tw = W / cols, th = H / rows;
    oc.fillStyle = grad(oc, 0, 0, 0, H, [[0, '#FCFAFF'], [1, '#F2ECFA']]);
    oc.fillRect(0, 0, W, H);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const px = x * tw, py = y * th;
      const light = (x + y) % 2 === 0;
      oc.fillStyle = light ? 'rgba(255,255,255,.92)' : 'rgba(244,238,251,.85)';
      oc.beginPath(); oc.roundRect(px + 1.5, py + 1.5, tw - 3, th - 3, 10); oc.fill();
      oc.strokeStyle = 'rgba(154,139,238,.13)'; oc.lineWidth = 1;
      oc.beginPath(); oc.roundRect(px + 1.5, py + 1.5, tw - 3, th - 3, 10); oc.stroke();
    }
    oc.fillStyle = rgrad(oc, W / 2, H / 2, H * .3, W / 2, H / 2, H * .85, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(120,100,160,.08)']]);
    oc.fillRect(0, 0, W, H);
  };

  const drawBrick = (c, x, y, w, h) => {
    plate(c, x + 3, y + 3, w - 6, h - 6, 9, '#FFC7B4', { lift: .3, depth: 5 });
    c.save(); c.globalAlpha = .5; c.strokeStyle = '#ffffff'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + 8, y + 9); c.lineTo(x + w - 8, y + 9); c.stroke(); c.restore();
    c.save(); c.globalAlpha = .32; c.strokeStyle = '#E28F76'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(x + w * .38, y + 14); c.lineTo(x + w * .34, y + h - 10); c.stroke(); c.restore();
  };
  const drawWall = (c, x, y, w, h) => {
    plate(c, x + 2, y + 2, w - 4, h - 4, 8, '#D6CFEA', { lift: .26, depth: 5 });
    c.save(); c.globalAlpha = .55; c.fillStyle = '#ffffff';
    rounded(c, x + 7, y + 7, w - 14, 4.5, 2.2); c.fill(); c.restore();
    c.save(); c.globalAlpha = .35; c.fillStyle = '#A99CCB';
    circle(c, x + 11, y + h - 12, 2.2); circle(c, x + w - 11, y + h - 12, 2.2); c.fill();
    c.restore();
  };

  const drawFlame = (c, f, meta, now) => {
    const t = (now - meta.t0 - meta.delay) / 550;
    if (t < 0 || t > 1) return;
    const x = (f.x + .5) * (W / 13), y = (f.y + .5) * (H / 11);
    const grow = .35 + .65 * Math.min(1, t * 1.6);
    const fade = 1 - t;
    c.save();
    c.globalAlpha = fade;
    c.fillStyle = rgrad(c, x, y, 3, x, y, 30 * grow, [[0, 'rgba(255,246,214,.95)'], [.4, 'rgba(255,208,140,.6)'], [1, 'rgba(255,186,120,0)']]);
    c.fillRect(x - 46, y - 46, 92, 92);
    /* 四向柔光 */
    c.globalAlpha = fade * .8;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const len = 34 * grow;
      c.save(); c.translate(x, y); c.rotate(Math.atan2(dy, dx));
      c.fillStyle = grad(c, 0, 0, len, 0, [[0, 'rgba(255,231,176,.85)'], [1, 'rgba(255,214,150,0)']]);
      c.beginPath(); c.moveTo(0, -8 * grow); c.quadraticCurveTo(len * .6, -11 * grow, len, 0);
      c.quadraticCurveTo(len * .6, 11 * grow, 0, 8 * grow); c.closePath(); c.fill();
      c.restore();
    }
    /* 星屑 */
    c.globalAlpha = fade * .9;
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + meta.delay * .002;
      const d = (16 + hash(i * 4.3 + f.x * 3 + f.y) * 26) * grow;
      star(c, x + Math.cos(a) * d, y + Math.sin(a) * d, 3.2 * fade + 1.4, 'rgba(255,241,206,.95)');
    }
    c.restore();
  };

  const drawBomb = (c, b, now) => {
    const x = (b.x + .5) * (W / 13), y = (b.y + .5) * (H / 11);
    const pulse = Math.sin(now / 120) * 1.6;
    const bob = Math.sin(now / 260 + b.x) * 1.4;
    ellipse(c, x, y + 16, 15, 5, 'rgba(58,76,100,.16)');
    c.save(); c.translate(x, y + bob);
    c.fillStyle = rgrad(c, -5, -6, 1, 0, 0, 17 + pulse, [[0, '#7E6B95'], [.55, '#5B4A70'], [1, '#413352']]);
    c.beginPath(); c.arc(0, 0, 16 + pulse, 0, Math.PI * 2); c.fill();
    c.save(); c.globalAlpha = .45; ellipse(c, -5.5, -6, 5.4, 3.6, '#ffffff'); c.restore();
    /* 引信 */
    c.strokeStyle = '#9C8560'; c.lineWidth = 2.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(4, -14); c.quadraticCurveTo(2, -25, 12, -22); c.stroke();
    const spark = 1 + Math.sin(now / 90) * .3;
    c.fillStyle = 'rgba(255,190,120,.55)'; c.beginPath(); c.arc(12, -22, 6.5 * spark, 0, Math.PI * 2); c.fill();
    star(c, 12, -22, 5 * spark, '#FFC773');
    /* 表情 */
    c.fillStyle = '#ffffff';
    ellipse(c, -4.6, 2, 2.6, 3, '#ffffff'); ellipse(c, 4.6, 2, 2.6, 3, '#ffffff');
    circle(c, -4, 2.4, 1.3, '#3A3348'); circle(c, 5.2, 2.4, 1.3, '#3A3348');
    c.strokeStyle = 'rgba(58,48,72,.6)'; c.lineWidth = 1.4; c.lineCap = 'round';
    c.beginPath(); c.arc(0, 6, 3.2, .3, Math.PI - .3); c.stroke();
    c.restore();
  };

  return {
    layers: {}, clock: 0, dirty: true,
    update(view, now) {
      pendingDelay = 0;
      for (const f of view?.flames || []) {
        const key = `${f.x},${f.y}`;
        if (!flameMeta.has(key)) { flameMeta.set(key, { t0: now, delay: pendingDelay }); pendingDelay += 70; }
      }
      this.dirty = true;
    },
    draw(c, env) {
      const { now, clock, dt, snap, view } = env;
      const cols = view.cols || 13, rows = view.rows || 11, tw = W / cols, th = H / rows;
      const bg = layer(this, 'floor', W, H, buildFloor);
      if (bg) c.drawImage(bg, 0, 0); else buildFloor(c);

      (view.grid || []).forEach((row, y) => row.forEach((cell, x) => {
        if (cell === 1) drawWall(c, x * tw, y * th, tw, th);
        else if (cell === 2) drawBrick(c, x * tw, y * th, tw, th);
      }));

      for (const f of view.flames || []) {
        const meta = flameMeta.get(`${f.x},${f.y}`);
        if (meta) drawFlame(c, f, meta, now);
      }

      (view.bombs || []).forEach(b => drawBomb(c, b, now));

      (view.players || []).forEach((p, i) => {
        if (p.alive === false) return;
        const key = `${i}`;
        const pop = pops.get(key);
        let scale = 1;
        if (pop) { const k = (now - pop.t0) / 320; if (k < 1) { const e = 1 - Math.pow(1 - k, 3); scale = .35 + .65 * e; } else pops.delete(key); }
        const x = (p.x + .5) * tw, y = (p.y + .5) * th;
        c.save(); c.translate(x, y); c.scale(scale, scale);
        face(c, 0, 0, 14.5, colors[i], { own: own === i });
        c.restore();
      });
      stepParticles(parts, dt);
      drawParticles(c, parts);
    }
  };
}

/* ------------------------------------------------------------------
   贪吃蛇竞技场
   ------------------------------------------------------------------ */
function snakeScene(ctx) {
  const W = 720, H = 600;
  const colors = ctx.colors, own = ctx.own;
  let heads = [{ x: 5.5, y: 5.5, ax: 0 }, { x: 18.5, y: 14.5, ax: 0 }];
  let prevLen = [3, 3];
  let pops = [];
  let died = [];
  const parts = [];

  const buildArena = oc => {
    const cols = 24, rows = 20, cw = W / cols, ch = H / rows;
    oc.fillStyle = grad(oc, 0, 0, 0, H, [[0, '#F7FBF5'], [1, '#EAF3E7']]);
    oc.fillRect(0, 0, W, H);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if ((x + y) % 2) { oc.fillStyle = 'rgba(206,231,205,.42)'; oc.fillRect(x * cw, y * ch, cw, ch); }
    }
    for (let i = 0; i < 200; i++) {
      const x = hash(i * 2.7) * W, y = hash(i * 5.9) * H;
      ellipse(oc, x, y, 1.1, .9, 'rgba(255,255,255,.5)');
    }
    oc.fillStyle = rgrad(oc, W / 2, H / 2, H * .35, W / 2, H / 2, H * .9, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(96,124,96,.10)']]);
    oc.fillRect(0, 0, W, H);
    oc.save(); softShadow(oc, 'rgba(58,76,100,.13)', 10, 0, 2);
    oc.strokeStyle = 'rgba(255,255,255,.92)'; oc.lineWidth = 8; oc.beginPath(); oc.roundRect(8, 8, W - 16, H - 16, 26); oc.stroke();
    oc.restore();
  };

  const drawFood = (c, f, cw, ch, now) => {
    const x = (f.x + .5) * cw, y = (f.y + .5) * ch;
    const pulse = 1 + Math.sin(now / 420 + f.x) * .06;
    c.save();
    c.fillStyle = rgrad(c, x, y, 2, x, y, 22 * pulse, [[0, 'rgba(255,214,120,.42)'], [1, 'rgba(255,214,120,0)']]);
    c.fillRect(x - 30, y - 30, 60, 60);
    c.restore();
    const r = cw * .3 * pulse;
    c.fillStyle = rgrad(c, x - r * .3, y - r * .4, r * .1, x, y, r * 1.25, [[0, '#FFE7A8'], [.55, '#F6B75C'], [1, '#DE8A3C']]);
    c.beginPath(); c.arc(x, y + r * .06, r, 0, Math.PI * 2); c.fill();
    c.save(); c.globalAlpha = .6; ellipse(c, x - r * .34, y - r * .36, r * .3, r * .2, '#ffffff'); c.restore();
    c.fillStyle = '#9CC49B';
    c.beginPath(); c.ellipse(x + r * .42, y - r * .74, r * .42, r * .22, -.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#7FA97F'; c.lineWidth = 1.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y - r * .6); c.lineTo(x + r * .3, y - r * .82); c.stroke();
  };

  const drawSnake = (c, s, i, cw, ch, now) => {
    const color = colors[i];
    const body = s.body || [];
    /* 连续的脊线：让相邻方块连成一条身体 */
    if (body.length > 1) {
      c.save();
      c.strokeStyle = shade(color, -.1); c.lineWidth = ch - 2; c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath();
      body.forEach((p, n) => { const x = p.x * cw + cw / 2, y = p.y * ch + ch / 2; if (!n) c.moveTo(x, y); else c.lineTo(x, y); });
      c.stroke();
      c.restore();
    }
    for (let n = body.length - 1; n >= 0; n--) {
      const p = body[n];
      let scale = 1;
      const pop = pops.find(q => q.i === i && q.n === n);
      if (pop) {
        const k = (now - pop.t0) / 340;
        if (k < 1) { const e = 1 - Math.pow(1 - k, 3); scale = .35 + .65 * e + Math.sin(k * Math.PI) * .18; }
        else pops = pops.filter(q => q !== pop);
      }
      const x = p.x * cw, y = p.y * ch;
      c.save();
      c.translate(x + cw / 2, y + ch / 2); c.scale(scale, scale);
      const isHead = n === 0;
      const g = isHead
        ? grad(c, 0, -ch / 2, 0, ch / 2, [[0, shade(color, .5)], [.5, color], [1, shade(color, -.16)]])
        : grad(c, 0, -ch / 2, 0, ch / 2, [[0, shade(color, .34)], [.5, color], [1, shade(color, -.2)]]);
      c.fillStyle = g;
      rounded(c, -cw / 2 - 1, -ch / 2 - 1, cw + 2, ch + 2, isHead ? 12 : 9); c.fill();
      c.save(); c.globalAlpha = .38; c.fillStyle = '#ffffff';
      rounded(c, -cw / 2 + 5, -ch / 2 + 3.5, cw * .34, 3, 1.5); c.fill(); c.restore();
      c.strokeStyle = alpha(shade(color, -.35), .28); c.lineWidth = 1.2;
      rounded(c, -cw / 2 - 1, -ch / 2 - 1, cw + 2, ch + 2, isHead ? 12 : 9); c.stroke();
      c.restore();
    }
    const head = body[0];
    if (!head) return;
    const dir = DIRECTIONS[s.dir] || [1, 0];
    const hx = head.x * cw + cw / 2, hy = head.y * ch + ch / 2;
    const ex = cw * .2, ey = ch * .22;
    for (const sign of [-1, 1]) {
      const px = hx + dir[0] * cw * .16 - dir[1] * sign * ex;
      const py = hy + dir[1] * ch * .16 + dir[0] * sign * ey;
      circle(c, px, py, 4, '#ffffff');
      circle(c, px + dir[0] * 1.4, py + dir[1] * 1.4, 2.1, '#3A4A57');
    }
    if (own === i) { c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 2.2; rounded(c, head.x * cw + 2.6, head.y * ch + 2.6, cw - 5.2, ch - 5.2, 9); c.stroke(); }
  };

  return {
    layers: {}, clock: 0, dirty: true,
    update(view, now) {
      (view?.snakes || []).forEach((s, i) => {
        const len = (s.body || []).length;
        if (len > (prevLen[i] || 0)) pops.push({ i, n: len - 1, t0: now });
        prevLen[i] = len;
        if (s.alive === false && !died.some(d => d.i === i)) { died.push({ i, t0: now }); burst(parts, heads[i].x, heads[i].y, colors[i], 16, 170); }
      });
      this.dirty = true;
    },
    draw(c, env) {
      const { now, clock, dt, snap, view } = env;
      const cols = view.cols || 24, rows = view.rows || 20, cw = W / cols, ch = H / rows;
      const bg = layer(this, 'arena', W, H, buildArena);
      if (bg) c.drawImage(bg, 0, 0); else buildArena(c);

      (view.food || []).forEach(f => drawFood(c, f, cw, ch, now));

      (view.snakes || []).forEach((s, i) => {
        const head = (s.body || [])[0];
        if (head) {
          const t = snap ? 1 : 1 - Math.exp(-26 * dt);
          heads[i] = { x: lerp(heads[i].x, head.x + .5, t), y: lerp(heads[i].y, head.y + .5, t) };
        }
        drawSnake(c, s, i, cw, ch, now);
      });

      /* 撞击局部光晕（无血腥） */
      for (let i = died.length - 1; i >= 0; i--) {
        const d = died[i], k = (now - d.t0) / 900;
        if (k >= 1) { died.splice(i, 1); continue; }
        const x = heads[d.i].x * cw, y = heads[d.i].y * ch;
        c.save();
        c.globalAlpha = (1 - k) * .8;
        c.fillStyle = rgrad(c, x, y, 4, x, y, 34 + k * 46, [[0, alpha(colors[d.i], .6)], [1, alpha(colors[d.i], 0)]]);
        c.fillRect(x - 90, y - 90, 180, 180);
        c.strokeStyle = alpha('#ffffff', (1 - k) * .7); c.lineWidth = 2.4;
        c.beginPath(); c.arc(x, y, 14 + k * 40, 0, Math.PI * 2); c.stroke();
        c.restore();
      }
      stepParticles(parts, dt);
      drawParticles(c, parts);
    }
  };
}

/* ------------------------------------------------------------------
   弹弓城堡
   ------------------------------------------------------------------ */
function slingScene(ctx) {
  const W = 900, H = 500;
  const colors = ctx.colors, own = ctx.own;
  let shotPos = null;
  let prevHp = [100, 100];
  let impactFx = null;
  const parts = [], debris = [];

  const buildSky = oc => {
    oc.fillStyle = grad(oc, 0, 0, 0, H, [[0, '#E4DDFA'], [.3, '#F1E4F6'], [.62, '#FDE9D6'], [1, '#FFF4E3']]);
    oc.fillRect(0, 0, W, H);
    /* 太阳 */
    oc.fillStyle = rgrad(oc, 742, 118, 6, 742, 118, 96, [[0, 'rgba(255,240,200,.85)'], [1, 'rgba(255,240,200,0)']]);
    oc.fillRect(600, 0, 290, 260);
    circle(oc, 742, 118, 26, 'rgba(255,238,186,.9)');
    /* 云 */
    for (const [x, y, s, o] of [[120, 74, 1, .8], [470, 52, 1.1, .65], [640, 148, .7, .55], [330, 118, .6, .45]]) {
      oc.save(); oc.globalAlpha = o;
      for (const [dx, dy, r] of [[0, 0, 22], [24, -7, 26], [50, 2, 20]]) {
        oc.fillStyle = 'rgba(255,255,255,.92)';
        oc.beginPath(); oc.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); oc.fill();
      }
      oc.restore();
    }
    /* 远山（低饱和淡紫） */
    const ridge = (yBase, amp, seed, color) => {
      oc.fillStyle = color; oc.beginPath(); oc.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) {
        const y = yBase - Math.sin(x * .006 + seed) * amp - Math.sin(x * .017 + seed * 2) * amp * .35;
        oc.lineTo(x, y);
      }
      oc.lineTo(W, H); oc.closePath(); oc.fill();
    };
    ridge(268, 26, 1.2, 'rgba(154,139,238,.16)');
    ridge(302, 20, 3.4, 'rgba(154,139,238,.24)');
    ridge(330, 14, 5.1, 'rgba(133,118,214,.20)');
    /* 草坡 */
    const g = grad(oc, 0, 320, 0, H, [[0, '#DCEFD9'], [.5, '#CBE5C7'], [1, '#B8DCB6']]);
    oc.fillStyle = g; oc.beginPath(); oc.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) oc.lineTo(x, terrain(x));
    oc.lineTo(W, H); oc.closePath(); oc.fill();
    oc.strokeStyle = 'rgba(255,255,255,.55)'; oc.lineWidth = 3.5;
    oc.beginPath(); for (let x = 0; x <= W; x += 6) { if (!x) oc.moveTo(x, terrain(x)); else oc.lineTo(x, terrain(x)); } oc.stroke();
    /* 草地纹理 */
    for (let i = 0; i < 240; i++) {
      const x = hash(i * 1.9) * W, y = terrain(x) + 8 + hash(i * 4.3) * (H - terrain(x) - 10);
      if (y > H - 6) continue;
      oc.fillStyle = hash(i * 6.7) > .5 ? 'rgba(255,255,255,.4)' : 'rgba(120,164,118,.22)';
      oc.beginPath(); oc.arc(x, y, .9 + hash(i * 3.1), 0, Math.PI * 2); oc.fill();
    }
    for (let i = 0; i < 40; i++) {
      const x = hash(i * 8.1) * W, y = terrain(x) + 6 + hash(i * 2.3) * 40;
      if (y > H - 8) continue;
      oc.strokeStyle = 'rgba(112,156,112,.45)'; oc.lineWidth = 1.6; oc.lineCap = 'round';
      for (let k = -1; k <= 1; k++) { oc.beginPath(); oc.moveTo(x, y); oc.quadraticCurveTo(x + k * 2.5, y - 4, x + k * 4, y - 7); oc.stroke(); }
    }
  };

  const drawCatapult = (c, x, y, dir, tint) => {
    c.save(); c.translate(x, y); c.scale(dir, 1);
    ellipse(c, 0, 2, 24, 6, 'rgba(58,76,100,.16)');
    c.fillStyle = grad(c, 0, -12, 0, 2, [[0, '#D8B489'], [1, '#B08F63']]);
    rounded(c, -20, -12, 40, 12, 5); c.fill();
    c.strokeStyle = '#A9865C'; c.lineWidth = 6.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-7, -10); c.lineTo(3, -38); c.stroke();
    c.beginPath(); c.moveTo(7, -10); c.lineTo(3, -38); c.stroke();
    c.fillStyle = tint; c.beginPath(); c.ellipse(3, -40, 8, 5, -.25, 0, Math.PI * 2); c.fill();
    c.restore();
  };

  const drawCastle = (c, castle, i) => {
    const x = castle.x, y = terrain(x), tint = colors[i];
    const bw = 84, bh = 74;
    ellipse(c, x, y + 4, bw * .62, 9, 'rgba(58,76,100,.18)');
    plate(c, x - bw / 2, y - bh, bw, bh, 8, '#EFE5D3', { lift: .2, depth: 6 });
    c.save(); c.strokeStyle = 'rgba(184,168,140,.5)'; c.lineWidth = 1.4;
    for (let yy = y - bh + 16; yy < y - 6; yy += 15) { c.beginPath(); c.moveTo(x - bw / 2 + 4, yy); c.lineTo(x + bw / 2 - 4, yy); c.stroke(); }
    c.restore();
    for (let k = 0; k < 4; k++) {
      const bx = x - bw / 2 + 3 + k * (bw - 6) / 4;
      plate(c, bx, y - bh - 15, (bw - 6) / 4 - 4, 17, 4, '#F5ECDC', { lift: .16, depth: 4, shadow: false });
    }
    /* 门 */
    c.fillStyle = grad(c, 0, y - 32, 0, y, [[0, tint], [1, shade(tint, -.3)]]);
    rounded(c, x - 11, y - 32, 22, 32, [9, 9, 0, 0]); c.fill();
    c.save(); c.globalAlpha = .4; c.fillStyle = '#ffffff'; rounded(c, x - 8, y - 29, 5, 22, 2.5); c.fill(); c.restore();
    /* 窗 */
    c.fillStyle = 'rgba(120,140,170,.35)'; rounded(c, x - 30, y - 58, 13, 15, 6); c.fill();
    rounded(c, x + 17, y - 58, 13, 15, 6); c.fill();
    /* 旗 */
    c.strokeStyle = '#B7A184'; c.lineWidth = 2.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y - bh - 14); c.lineTo(x, y - bh - 44); c.stroke();
    c.fillStyle = tint; c.beginPath(); c.moveTo(x, y - bh - 44); c.lineTo(x + (i ? -26 : 26), y - bh - 36); c.lineTo(x, y - bh - 27); c.closePath(); c.fill();
    c.save(); c.globalAlpha = .35; c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(x, y - bh - 42); c.lineTo(x + (i ? -22 : 22), y - bh - 35.5); c.lineTo(x, y - bh - 33); c.closePath(); c.fill(); c.restore();
    /* 血条 */
    plate(c, x - 46, y - bh - 74, 92, 17, 8, '#FFFFFF', { lift: .1, depth: 3, gloss: false });
    const ratio = clamp((castle.hp ?? 0) / 100, 0, 1);
    if (ratio > 0) { c.fillStyle = grad(c, 0, y - bh - 72, 0, y - bh - 59, [[0, shade(tint, .25)], [1, tint]]); rounded(c, x - 43, y - bh - 71, 86 * ratio, 11, 5.5); c.fill(); }
    text(c, `${castle.hp ?? 0} HP`, x, y - bh - 90, 13, INK2);
    /* 投石机 */
    drawCatapult(c, x + (i ? -58 : 58), y - 2, i ? 1 : -1, tint);
  };

  const preview = (c, v) => {
    const s = ctx.shot;
    if (!s || v.turn !== own || v.projectile) return;
    const castle = (v.castles || [])[own];
    if (!castle) return;
    const dir = own ? -1 : 1;
    const x0 = castle.x + dir * 28, y0 = terrain(castle.x) - 78;
    const rad = s.angle * Math.PI / 180;
    let vx = Math.cos(rad) * s.power * 5 * dir, vy = -Math.sin(rad) * s.power * 5;
    const wind = v.wind || 0, dt = 1 / 40;
    let x = x0, y = y0;
    const pts = [{ x, y }];
    for (let i = 0; i < 200; i++) {
      vx += wind * dt; vy += 280 * dt; x += vx * dt; y += vy * dt;
      pts.push({ x, y });
      if (y >= terrain(x) || x < -60 || x > W + 60) break;
    }
    c.save();
    c.setLineDash([9, 9]); c.lineWidth = 3; c.lineCap = 'round';
    for (let i = 1; i < pts.length; i++) {
      const k = 1 - i / pts.length;
      c.strokeStyle = alpha(LIL, .1 + .5 * k);
      c.beginPath(); c.moveTo(pts[i - 1].x, pts[i - 1].y); c.lineTo(pts[i].x, pts[i].y); c.stroke();
    }
    c.restore();
    const last = pts[pts.length - 1];
    c.save();
    c.strokeStyle = alpha(LIL, .55); c.lineWidth = 2.2;
    c.setLineDash([5, 6]);
    c.beginPath(); c.ellipse(last.x, last.y, 24, 9, 0, 0, Math.PI * 2); c.stroke();
    c.setLineDash([]);
    c.fillStyle = alpha(LIL, .12); c.beginPath(); c.ellipse(last.x, last.y, 24, 9, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  };

  return {
    layers: {}, clock: 0, dirty: true,
    update(view, now) {
      (view?.castles || []).forEach((c, i) => {
        if (Number.isFinite(c.hp) && prevHp[i] !== undefined && c.hp < prevHp[i]) {
          const x = c.x, y = terrain(c.x) - 40;
          burst(parts, x, y, '#E7D8BC', 16, 190);
          burst(parts, x, y, colors[i], 10, 150);
          for (let k = 0; k < 10; k++) debris.push({ x: x + (hash(k * 3.1) - .5) * 60, y, vx: (hash(k * 5.7) - .5) * 190, vy: -hash(k * 7.1) * 170, life: 1.1, max: 1.1, r: 4 + hash(k * 2.3) * 4, color: k % 2 ? '#E7D8BC' : '#CBBBA0' });
        }
        if (Number.isFinite(c.hp)) prevHp[i] = c.hp;
      });
      if (view?.impact && this.impactKey !== (view.impact.id??[view.impact.x,view.impact.y].join(':'))) { this.impactKey=view.impact.id??[view.impact.x,view.impact.y].join(':'); impactFx = { x: view.impact.x, y: view.impact.y, t0: now }; }
      this.dirty = true;
    },
    draw(c, env) {
      const { now, clock, dt, snap, view } = env;
      const bg = layer(this, 'sky', W, H, buildSky);
      if (bg) c.drawImage(bg, 0, 0); else buildSky(c);

      preview(c, view);

      (view.castles || []).forEach((castle, i) => drawCastle(c, castle, i));

      /* 炮弹 */
      const pr = view.projectile;
      if (pr) {
        const t = snap ? 1 : 1 - Math.exp(-24 * dt);
        if (!shotPos) shotPos = { x: pr.x, y: pr.y };
        shotPos = { x: lerp(shotPos.x, pr.x, t), y: lerp(shotPos.y, pr.y, t) };
        const len = Math.hypot(pr.vx, pr.vy) || 1;
        c.save();
        for (let k = 1; k <= 5; k++) {
          c.globalAlpha = .2 - k * .035;
          circle(c, shotPos.x - pr.vx / len * k * 5, shotPos.y - pr.vy / len * k * 5, 7 - k, '#D9C3A4');
        }
        c.restore();
        ellipse(c, shotPos.x + 1, shotPos.y + 5, 8, 3, 'rgba(58,76,100,.18)');
        c.fillStyle = rgrad(c, shotPos.x - 2.5, shotPos.y - 3, 1, shotPos.x, shotPos.y, 8, [[0, '#8FA3B2'], [.55, '#5B7183'], [1, '#3C4E5E']]);
        c.beginPath(); c.arc(shotPos.x, shotPos.y, 7.6, 0, Math.PI * 2); c.fill();
        c.save(); c.globalAlpha = .7; ellipse(c, shotPos.x - 2.4, shotPos.y - 2.8, 3, 1.8, '#ffffff'); c.restore();
      } else shotPos = null;

      /* 命中光环 */
      if (impactFx) {
        const k = (now - impactFx.t0) / 850;
        if (k < 1) {
          c.save();
          c.globalAlpha = (1 - k) * .85;
          c.fillStyle = rgrad(c, impactFx.x, impactFx.y, 4, impactFx.x, impactFx.y, 30 + k * 58, [[0, 'rgba(255,240,205,.9)'], [.5, 'rgba(255,196,120,.42)'], [1, 'rgba(255,196,120,0)']]);
          c.fillRect(impactFx.x - 100, impactFx.y - 100, 200, 200);
          c.strokeStyle = `rgba(255,206,140,${(1 - k) * .7})`; c.lineWidth = 3.4 * (1 - k) + 1;
          c.beginPath(); c.arc(impactFx.x, impactFx.y, 14 + k * 48, 0, Math.PI * 2); c.stroke();
          c.restore();
        } else impactFx = null;
      }

      /* 碎砖 */
      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 460 * dt; d.life -= dt;
        if (d.life <= 0) { debris.splice(i, 1); continue; }
        c.save(); c.globalAlpha = clamp(d.life / d.max, 0, 1);
        c.translate(d.x, d.y); c.rotate(d.life * 5);
        c.fillStyle = d.color; rounded(c, -d.r, -d.r * .7, d.r * 2, d.r * 1.4, 2); c.fill();
        c.restore();
      }
      stepParticles(parts, dt);
      drawParticles(c, parts);

      /* 风向指示 */
      const wind = view.wind || 0;
      const wx = W / 2, wy = 40;
      c.save();
      c.fillStyle = 'rgba(255,255,255,.72)'; rounded(c, wx - 86, wy - 21, 172, 42, 21); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.2; rounded(c, wx - 86, wy - 21, 172, 42, 21); c.stroke();
      /* 风袋 */
      const dir = wind > 0 ? 1 : wind < 0 ? -1 : 0;
      if (dir) {
        c.save(); c.translate(wx - 64, wy);
        c.fillStyle = 'rgba(154,139,238,.30)';
        c.beginPath(); c.moveTo(0, -8); c.quadraticCurveTo(dir * 16, -12, dir * 26, -2); c.quadraticCurveTo(dir * 16, 8, 0, 8); c.closePath(); c.fill();
        c.strokeStyle = '#8E7DD8'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -9); c.lineTo(0, 9); c.stroke();
        c.restore();
      }
      c.strokeStyle = wind ? '#7E8FD8' : '#B3BDC8'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(wx - 36, wy); c.lineTo(wx - 10, wy); c.stroke();
      if (dir) { c.fillStyle = '#7E8FD8'; c.beginPath(); c.moveTo(wx - 4, wy); c.lineTo(wx - 14, wy - 6); c.lineTo(wx - 14, wy + 6); c.closePath(); c.fill(); }
      text(c, `风 ${wind > 0 ? '→' : wind < 0 ? '←' : '·'} ${Math.abs(wind)}`, wx + 38, wy, 17, INK2);
      c.restore();

      /* 回合提示 */
      if (view.turn !== undefined && !view.projectile) {
        const castle = (view.castles || [])[view.turn];
        if (castle) text(c, view.turn === own ? '你的回合' : '对方回合', castle.x, terrain(castle.x) - 196, 18, colors[view.turn]);
      }
    }
  };
}

/* ------------------------------------------------------------------
   迷宫夺旗
   ------------------------------------------------------------------ */
function mazeScene(ctx) {
  const W = 680, H = 520;
  const colors = ctx.colors, own = ctx.own;
  let pos = [{ x: 1.5, y: 6.5 }, { x: 15.5, y: 6.5 }];
  const parts = [];

  const buildMaze = oc => {
    const cols = 17, rows = 13, cw = W / cols, ch = H / rows;
    oc.fillStyle = grad(oc, 0, 0, 0, H, [[0, '#F6F4EC'], [1, '#EBE8DC']]);
    oc.fillRect(0, 0, W, H);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      oc.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,.34)' : 'rgba(214,208,190,.28)';
      oc.fillRect(x * cw, y * ch, cw, ch);
    }
    const grid = ctx.grid || [];
    const wallAt = (x, y) => (x < 0 || y < 0 || x >= cols || y >= rows) ? 1 : (grid[y]?.[x] ? 1 : 0);
    /* 墙体形状 */
    const wallPath = o => {
      o.beginPath();
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (wallAt(x, y)) o.rect(x * cw, y * ch, cw, ch);
    };
    /* 墙体投影 */
    oc.save();
    oc.fillStyle = 'rgba(58,76,100,.13)';
    oc.translate(3, 5); wallPath(oc); oc.fill(); oc.restore();
    /* 石砖墙体：整体裁剪后统一上色，砖缝对齐 */
    oc.save();
    wallPath(oc); oc.clip();
    oc.fillStyle = grad(oc, 0, 0, 0, H, [[0, '#FDFBF6'], [.55, '#EEE9DC'], [1, '#DCD5C3']]);
    oc.fillRect(0, 0, W, H);
    oc.strokeStyle = 'rgba(160,147,123,.42)'; oc.lineWidth = 1.2;
    for (let y = 0; y <= H; y += 20) { oc.beginPath(); oc.moveTo(0, y); oc.lineTo(W, y); oc.stroke(); }
    for (let row = 0; row * 20 <= H; row++) {
      const off = row % 2 ? 0 : 20, top = row * 20;
      for (let x = -1; x * 40 <= W; x++) {
        const lx = x * 40 + off;
        oc.beginPath(); oc.moveTo(lx, top); oc.lineTo(lx, top + 20); oc.stroke();
      }
    }
    oc.strokeStyle = 'rgba(255,255,255,.5)'; oc.lineWidth = 1;
    for (let y = 0; y <= H; y += 20) { const ly = y + 1.2; oc.beginPath(); oc.moveTo(0, ly); oc.lineTo(W, ly); oc.stroke(); }
    oc.restore();
    /* 墙缘高光与暗边 */
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (!wallAt(x, y)) continue;
      const px = x * cw, py = y * ch;
      if (!wallAt(x, y - 1)) {
        oc.save(); oc.fillStyle = 'rgba(255,255,255,.92)'; oc.fillRect(px, py, cw, 3);
        oc.fillStyle = 'rgba(255,255,255,.35)'; oc.fillRect(px, py + 3, cw, 4); oc.restore();
      }
      if (!wallAt(x, y + 1)) { oc.fillStyle = 'rgba(120,106,84,.28)'; oc.fillRect(px, py + ch - 2.5, cw, 2.5); }
      if (!wallAt(x - 1, y)) { oc.fillStyle = 'rgba(255,255,255,.6)'; oc.fillRect(px, py, 2.5, ch); }
      if (!wallAt(x + 1, y)) { oc.fillStyle = 'rgba(120,106,84,.2)'; oc.fillRect(px + cw - 2.5, py, 2.5, ch); }
    }
    oc.save(); softShadow(oc, 'rgba(58,76,100,.12)', 10, 0, 2);
    oc.strokeStyle = 'rgba(255,255,255,.9)'; oc.lineWidth = 7; oc.beginPath(); oc.roundRect(6, 6, W - 12, H - 12, 22); oc.stroke();
    oc.restore();
  };

  const drawBase = (c, b, i, clock) => {
    const x = (b.x + .5) * (W / 17), y = (b.y + .5) * (H / 13);
    const pulse = .5 + .5 * Math.sin(clock * 2.2);
    c.save();
    c.fillStyle = rgrad(c, x, y, 4, x, y, 34 + pulse * 5, [[0, alpha(colors[i], .38)], [1, alpha(colors[i], 0)]]);
    c.fillRect(x - 50, y - 50, 100, 100);
    c.strokeStyle = alpha(colors[i], .85); c.lineWidth = 3;
    c.beginPath(); c.arc(x, y, 17, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = alpha('#ffffff', .9); c.lineWidth = 2; c.setLineDash([5, 6]);
    c.beginPath(); c.arc(x, y, 12.5, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    c.restore();
    /* 小屋标记 */
    c.save(); c.translate(x, y - 1);
    c.fillStyle = alpha(colors[i], .9);
    c.beginPath(); c.moveTo(-8, -1); c.lineTo(0, -9); c.lineTo(8, -1); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(-5.5, -1, 11, 8);
    c.restore();
  };

  const drawFlag = (c, x, y, clock, scale = 1) => {
    const wave = Math.sin(clock * 3.2) * (ctx.reducedMotion ? 0 : 1);
    c.save();
    c.fillStyle = 'rgba(255,255,255,.6)';
    c.beginPath(); c.ellipse(x, y + 10 * scale, 12 * scale, 4 * scale, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    clothFlag(c, x, y, scale, wave);
  };

  return {
    layers: {}, clock: 0, dirty: true, grid: null,
    update(view, now) { this.grid = view?.grid || this.grid; this.dirty = true; },
    draw(c, env) {
      const { now, clock, dt, snap, view } = env;
      const cols = view.cols || 17, rows = view.rows || 13, cw = W / cols, ch = H / rows;
      ctx.grid = view.grid;
      const key = (view.grid || []).map(r => r.join('')).join('|');
      const bg = layer(this, `maze:${key}`, W, H, buildMaze);
      if (bg) c.drawImage(bg, 0, 0); else buildMaze(c);

      (view.bases || [{ x: 1, y: 6 }, { x: 15, y: 6 }]).forEach((b, i) => drawBase(c, b, i, clock));

      (view.players || []).forEach((p, i) => {
        const t = snap ? 1 : 1 - Math.exp(-24 * dt);
        pos[i] = { x: lerp(pos[i].x, p.x + .5, t), y: lerp(pos[i].y, p.y + .5, t) };
      });

      const flag = view.flag;
      if (flag && flag.carrier === null) {
        const x = (flag.x + .5) * cw, y = (flag.y + .5) * ch;
        c.save();
        c.fillStyle = rgrad(c, x, y, 3, x, y, 30, [[0, 'rgba(255,214,120,.35)'], [1, 'rgba(255,214,120,0)']]);
        c.fillRect(x - 40, y - 40, 80, 80);
        c.restore();
        drawFlag(c, x, y, clock, 1.15);
      }

      (view.players || []).forEach((p, i) => {
        const x = pos[i].x * cw, y = pos[i].y * ch;
        const dir = [Math.sign(p.x - (pos[i].x - .5)), 0];
        face(c, x, y, 13.5, colors[i], { own: own === i, dir: [0, 0] });
        if (flag && flag.carrier === i) drawFlag(c, x + 15, y - 6, clock, .78);
      });
      stepParticles(parts, dt);
      drawParticles(c, parts);
    }
  };
}

/* ------------------------------------------------------------------
   场景注册
   ------------------------------------------------------------------ */
const SCENES = { hockey: hockeyScene, tanks: tanksScene, bomber: bomberScene, snake: snakeScene, slingshot: slingScene, maze: mazeScene };

function mount(kind, root, send, context = {}) {
  const config = DETAILS[kind], own = context.player === 1 ? 1 : 0, colors = context.colors || COLORS;
  const reduced = !!context.reducedMotion;
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
  const shotState = { angle: 45, power: 80 };
  const scene = SCENES[kind]({ own, colors, reducedMotion: reduced, config, shot: shotState });
  let angle, power, shot, angleValue, powerValue;
  if (kind === 'slingshot') {
    const panel = el('div', 'arcade-shot-panel');
    const makeSlider = (name, min, max, value) => {
      const label = el('label', 'arcade-slider'), top = el('span'), title = el('span', '', name), output = el('output', '', String(value));
      top.append(title, output); const input = el('input'); input.type = 'range'; input.min = String(min); input.max = String(max); input.value = String(value); input.setAttribute('aria-label', name); label.append(top, input); panel.append(label); listeners(input, 'input', () => { output.value = name === '角度' ? `${input.value}°` : input.value; shotState.angle = Number(angle.value); shotState.power = Number(power.value); }); return [input, output];
    };
    [angle, angleValue] = makeSlider('角度', 10, 80, 45); [power, powerValue] = makeSlider('力度', 20, 100, 80); angleValue.value = '45°';
    shot = el('button', 'game-button primary arcade-fire', '↗ 发射'); shot.type = 'button'; panel.append(shot); listeners(shot, 'click', () => fire()); shell.append(panel);
  }
  const controls = el('div', 'touch-controls arcade-controls'), dpad = el('div', 'dpad arcade-dpad');
  const paused=()=>!!context.isPaused?.()||document.hidden;
  const emit = a => { if (!destroyed && latest?.status === 'playing' && !paused()) send(a); };
  const direction = dir => {
    if (kind === 'snake') emit({ type: 'direction', dir });
    else if (kind === 'bomber' || kind === 'maze') emit({ type: 'move', dir });
  };
  function fire() {
    if (kind === 'tanks') emit({ type: 'fire' });
    else if (kind === 'bomber') emit({ type: 'bomb' });
    else if (kind === 'slingshot') emit({ type: 'shoot', angle: Number(angle.value), power: Number(power.value) });

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
  let lastFrame = 0, presentationTime = 0;
  const paint = now => {
    if (destroyed) return;
    const dt = lastFrame ? Math.min(.05, (now - lastFrame) / 1000) : 0;
    lastFrame = now;
    if(paused()){pressed.clear();shell.querySelectorAll('.arcade-direction.active').forEach(b=>b.classList.remove('active'));frame=requestAnimationFrame(paint);return;}presentationTime += dt*1000;
    if (!reduced) scene.clock += dt;
    if (latest && c) {
      if (pressed.size && now - lastMove > (kind === 'bomber' || kind === 'maze' ? 150 : 90)) { move(); lastMove = now; }
      if (!reduced || scene.dirty) {
        scene.dirty = false;
        c.clearRect(0, 0, config.width, config.height);
        scene.draw(c, { now:presentationTime, clock: scene.clock, dt, snap: reduced, view: latest });
        if (latest.status === 'finished') {
          c.fillStyle = 'rgba(255,255,255,.58)'; c.fillRect(0, 0, config.width, config.height);
          const label = latest.winner === -1 ? '势均力敌 · 平局' : latest.winner === own ? '你赢下这一局！' : '这局惜败';
          c.save();
          c.fillStyle = 'rgba(255,255,255,.9)'; c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.4;
          softShadow(c, 'rgba(58,76,100,.20)', 22, 0, 8);
          c.beginPath(); c.roundRect(config.width / 2 - 150, config.height / 2 - 52, 300, 104, 26); c.fill(); c.stroke();
          clearShadow(c);
          text(c, label, config.width / 2, config.height / 2 - 14, 26, INK);
          text(c, latest.message || '', config.width / 2, config.height / 2 + 22, 16, MUTED, 'center', 600);
          c.restore();
        }
        const seconds = Math.max(0, Math.ceil((latest.endsAt - Date.now()) / 1000)); const clockText = latest.status === 'finished' ? '本局已结束' : Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '进行中'; if (time.textContent !== clockText) time.textContent = clockText;
      }
    } else if (c) {
      c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(0, 0, config.width, config.height);
      text(c, '准备好一起开玩了吗？', config.width / 2, config.height / 2, 24, INK2);
    }
    frame = requestAnimationFrame(paint);
  };
  frame = requestAnimationFrame(paint);
  return {
    update(view) {
      if (destroyed || !view || typeof view !== 'object') return;
      const old = latest; latest = view;
      scene.update(view, presentationTime);
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
