// DOM mounts are retained across snapshots, including focused board cells.
// All artwork is inline SVG / CSS so the board group ships no binary assets and
// never paints information the server has not revealed.
const faceNames = ['草莓', '柠檬', '葡萄', '猕猴桃', '蜜桃', '樱桃', '向日葵', '月亮', '星星', '贝壳', '蝴蝶', '四叶草'];
const faceGlyphs = ['disc', 'triangle', 'square', 'diamond', 'star', 'hexagon', 'ring', 'heart', 'flower', 'moon', 'leaf', 'wave'];
const faceColors = ['#FF7E6B', '#1FBE9C', '#9A8BEE', '#E2553F', '#0E9576', '#7462DE', '#FFAE9C', '#7FE0C6', '#B7ABF5', '#FF7E6B', '#1FBE9C', '#9A8BEE'];
const handNames = { rock: '石头', paper: '布', scissors: '剪刀' };
const handOrder = ['rock', 'paper', 'scissors'];
const SVG_NS = 'http://www.w3.org/2000/svg';

function element(tag, className = '', text) {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = String(text); return node;
}
function write(node, text) { text = String(text); if (node.textContent !== text) node.textContent = text; }
function locked(node, value) { node.setAttribute('aria-disabled', value ? 'true' : 'false'); node.classList.toggle('board-disabled', Boolean(value)); }
function playerClass(button, owner) { button.classList.toggle('player-0', owner === 0); button.classList.toggle('player-1', owner === 1); }

/* —— 矢量图形：一次性注入的 <symbol> 精灵，页面内共用 —— */
function icon(id, className, viewBox = '0 0 24 24') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', className || '');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#${id}`);
  svg.appendChild(use);
  return {
    node: svg,
    set(next) { const href = `#${next}`; if (use.getAttribute('href') !== href) use.setAttribute('href', href); },
    clear() { if (use.hasAttribute('href')) use.removeAttribute('href'); }
  };
}
let spriteSeq = 0;
function buildSprite() {
  const uid = `bds${++spriteSeq}`;
  const sym = (id, body) => `<symbol id="${uid}-${id}" viewBox="0 0 24 24">${body}</symbol>`;
  const sym48 = (id, body) => `<symbol id="${uid}-${id}" viewBox="0 0 48 48">${body}</symbol>`;
  const glyphs = {
    disc: '<circle cx="12" cy="12" r="7.6" fill="currentColor"/>',
    triangle: '<path d="M12 4 20.4 19.4H3.6Z" fill="currentColor"/>',
    square: '<rect x="4.8" y="4.8" width="14.4" height="14.4" rx="4.2" fill="currentColor"/>',
    diamond: '<path d="M12 2.8 21.2 12 12 21.2 2.8 12Z" fill="currentColor"/>',
    star: '<path d="M12 2.6 14.7 9.1 21.7 9.5 16.3 13.8 18.1 20.6 12 16.7 5.9 20.6 7.7 13.8 2.3 9.5 9.3 9.1Z" fill="currentColor"/>',
    hexagon: '<path d="M12 3.2 19.3 7.6v8.8L12 20.8 4.7 16.4V7.6Z" fill="currentColor"/>',
    ring: '<circle cx="12" cy="12" r="7.6" fill="none" stroke="currentColor" stroke-width="3.6"/>',
    heart: '<path d="M12 20.4C6.4 16.4 3.4 13.2 3.4 9.8A4.8 4.8 0 0 1 12 6.9a4.8 4.8 0 0 1 8.6 2.9c0 3.4-3 6.6-8.6 10.6Z" fill="currentColor"/>',
    flower: '<g fill="currentColor"><circle cx="12" cy="6.6" r="3.4"/><circle cx="12" cy="17.4" r="3.4"/><circle cx="6.6" cy="12" r="3.4"/><circle cx="17.4" cy="12" r="3.4"/><circle cx="8.4" cy="8.4" r="3.1"/><circle cx="15.6" cy="15.6" r="3.1"/><circle cx="15.6" cy="8.4" r="3.1"/><circle cx="8.4" cy="15.6" r="3.1"/></g><circle cx="12" cy="12" r="2.7" fill="#fff" opacity=".85"/>',
    moon: '<path d="M16.2 3.4a8.8 8.8 0 1 0 4.4 11.2A7 7 0 0 1 16.2 3.4Z" fill="currentColor"/>',
    leaf: '<path d="M19.4 4.6C9.8 4.6 4.6 9.2 4.6 15.4c0 1.6.4 3 1.1 4.1C7.4 14 12 10.2 18 8.8c-4.7 2.7-8.1 6.5-9.9 11.6 1 .3 2 .4 3.2.4 5.8 0 9.8-4.8 9.8-11.4 0-2-.7-3.6-2.1-4.8Z" fill="currentColor"/>',
    wave: '<path d="M2.8 15c2.7-4.8 5.4-4.8 8.1 0s5.4 4.8 8.1 0 2.6-3.2 2.6-3.2" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>'
  };
  const symbols = [
    sym('hit', '<circle cx="12" cy="12" r="9" fill="none" stroke="#1FBE9C" stroke-width="1.5" opacity=".45"/><path d="M12 3.4 14.6 9.4 20.6 12 14.6 14.6 12 20.6 9.4 14.6 3.4 12 9.4 9.4Z" fill="#1FBE9C"/><circle cx="12" cy="12" r="2" fill="#fff" opacity=".9"/>'),
    sym('sunk', '<path d="M2.8 13.6c2.5 0 3.5 1.5 5.1 1.5s2.6-1.5 5.1-1.5 3.5 1.5 5.1 1.5 2.6-1.5 5.1-1.5" fill="none" stroke="#9AD9C8" stroke-width="1.5" opacity=".85" stroke-linecap="round"/><path d="M3.8 17.4c2.5 0 3.5 1.4 5.1 1.4s2.6-1.4 5.1-1.4 3.5 1.4 5.1 1.4" fill="none" stroke="#BFE7DC" stroke-width="1.3" opacity=".7" stroke-linecap="round"/><path d="M5.6 12.6 9 8h10.6l-2.2 4.6Z" fill="#FF7E6B" opacity=".9"/><path d="M11.6 8V4.4l4.4 1.8-4.4 1.4Z" fill="#E2553F" opacity=".85"/>'),
    sym('splash', '<circle cx="12" cy="12" r="7.2" fill="none" stroke="#8FB8C6" stroke-width="1.4" opacity=".55"/><circle cx="12" cy="12" r="3.4" fill="none" stroke="#A9CBD6" stroke-width="1.2" opacity=".5"/><path d="M8.4 8.4c.9-1.7 2.1-2.7 3.5-3.1" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" opacity=".85"/>'),
    sym('flag', '<path d="M6.6 21V3.4" stroke="#8B8074" stroke-width="2" stroke-linecap="round"/><path d="M6.6 4.6h11l-2.6 4.1 2.6 4.1h-11Z" fill="#FF7E6B"/>'),
    sym('mine', '<circle cx="12" cy="13.6" r="6.2" fill="#FF7E6B" opacity=".5"/><circle cx="9.9" cy="11.6" r="1.9" fill="#fff" opacity=".7"/><path d="M12 7.4V3.6M8.6 8.6 5.8 5.8M15.4 8.6l2.8-2.8M6.4 13.6H2.8M17.6 13.6h3.6" stroke="#E2553F" stroke-width="1.7" stroke-linecap="round" opacity=".72"/>'),
    sym('lock', '<rect x="5.6" y="10.4" width="12.8" height="10" rx="3" fill="currentColor" opacity=".85"/><path d="M8.6 10.2V8a3.4 3.4 0 0 1 6.8 0v2.2" fill="none" stroke="currentColor" stroke-width="2"/>'),
    sym48('rock', '<g fill="currentColor"><rect x="12" y="13" width="5.3" height="11" rx="2.65"/><rect x="18.9" y="9.5" width="5.3" height="14.5" rx="2.65"/><rect x="25.8" y="10.5" width="5.3" height="13.5" rx="2.65"/><rect x="32.7" y="13.5" width="5.3" height="10.5" rx="2.65"/><rect x="12" y="18.4" width="26" height="21.2" rx="8.6"/><rect x="8.8" y="24.6" width="12.4" height="7.6" rx="3.8"/></g><path d="M15.2 21.4c2.6-2.6 6.4-3.4 9.8-2.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".42"/>'),
    sym48('paper', '<g fill="currentColor"><rect x="16.6" y="9.4" width="4.4" height="19" rx="2.2"/><rect x="21.8" y="6" width="4.4" height="22.4" rx="2.2"/><rect x="27" y="7.4" width="4.4" height="21" rx="2.2"/><rect x="32.2" y="10.4" width="4.4" height="18" rx="2.2"/><path d="M16.8 25c-3.6-1.4-7.4-.6-9 2.2-1.5 2.7-.5 6.1 2.2 7.6l5 2.7Z"/><rect x="15.6" y="22.6" width="21.8" height="19.4" rx="7"/></g><g fill="#fff" opacity=".38"><rect x="17.9" y="10.9" width="1.5" height="14" rx=".75"/><rect x="23.1" y="7.5" width="1.5" height="17" rx=".75"/><rect x="28.3" y="9" width="1.5" height="15" rx=".75"/></g>'),
    sym48('scissors', '<g fill="currentColor"><path d="M23.4 22.4 41.6 6.8c1.5-1.3 3.7.8 2.6 2.4L26 25.6Z"/><path d="M23.4 25.6 41.6 41.2c1.5 1.3 1.1 4.1-1 3.5-1-.3-1.7-.9-2.2-1.7L26 22.4Z"/></g><g fill="none" stroke="currentColor" stroke-width="3.1"><circle cx="14.6" cy="15.4" r="6.2"/><circle cx="14.6" cy="32.6" r="6.2"/></g><g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18.6 19.6 23.6 24"/><path d="M18.6 28.4 23.6 24"/></g><circle cx="24.6" cy="24" r="2.4" fill="#fff" opacity=".85"/>')
  ];
  faceGlyphs.forEach((name, i) => symbols.push(sym(name, glyphs[name])));
  const host = element('span', 'board-sprite');
  host.setAttribute('aria-hidden', 'true');
  host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">${symbols.join('')}</svg>`;
  return { node: host, uid };
}

function ui(root, send, context, id, rules, scoreLabel) {
  const disposers = [], p = context.player === 1 ? 1 : 0;
  const surface = element('section', `game-surface board-game board-${id}`);
  surface.setAttribute('aria-label', { gomoku: '五子棋', fleet: '隐藏海战', dots: '点格夺地', memory: '翻牌记忆', reversi: '黑白棋', rps: '石头剪刀布', mines: '扫雷竞速' }[id]);
  surface.style.setProperty('--board-p0', context.colors?.[0] || '#FF7E6B');
  surface.style.setProperty('--board-p1', context.colors?.[1] || '#1FBE9C');
  const reduced = Boolean(context.reducedMotion);
  if (reduced) surface.classList.add('board-reduced-motion');
  const sprite = buildSprite();
  const header = element('div', 'board-header'), pill = element('span', 'board-pill'), clock = element('span', 'board-clock');
  header.append(pill, clock);
  const scores = element('div', 'board-scores');
  const values = [0, 1].map(i => {
    const card = element('div', `board-score-card player-${i}`), label = element('span', 'board-score-label', `${i === p ? '我方' : '对方'} · 玩家 ${i + 1}`), value = element('strong', 'board-score-value', 0), unit = element('span', 'board-score-unit', scoreLabel);
    card.append(label, value, unit); scores.append(card); return value;
  });
  const status = element('p', 'board-message'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const body = element('div', 'board-body');
  const details = element('details', 'board-rules'), summary = element('summary', '', '玩法与操作'), ruleText = element('p', 'game-note', rules);
  details.append(summary, ruleText); surface.append(sprite.node, header, scores, status, body, details); root.append(surface);
  const api = {
    p, surface, body, sprite, reduced, view: null,
    listen(node, event, listener, options) { node.addEventListener(event, listener, options); disposers.push(() => node.removeEventListener(event, listener, options)); },
    timeout(fn, ms) { const timer = setTimeout(fn, ms); disposers.push(() => clearTimeout(timer)); return timer; },
    button(label, action, primary = false) {
      const b = element('button', `game-button ${primary ? 'primary' : 'secondary'} board-control`, label); b.type = 'button';
      api.listen(b, 'click', () => { if (b.getAttribute('aria-disabled') !== 'true') action(); }); return b;
    },
    send(action) { if (!api.view || api.view.status !== 'playing') return; send(action); },
    update(view) {
      api.view = view;
      values.forEach((node, i) => write(node, view.scores?.[i] ?? 0)); write(status, view.message || '等待对局同步…');
      const active = view.status === 'playing';
      write(pill, !active ? view.winner === -1 ? '本局平局' : view.winner === p ? '你赢了！' : '本局结束' : view.phase === 'setup' ? '独立布阵' : Number.isInteger(view.turn) ? view.turn === p ? '轮到你了' : '等待对方' : '双方同时进行');
      pill.className = `board-pill ${active && view.turn === p ? 'board-my-turn' : ''}`;
      write(clock, active && Number.isFinite(view.endsAt) ? `${Math.max(0, Math.ceil((view.endsAt - Date.now()) / 1000))} 秒` : '已结算');
      surface.classList.toggle('board-finished', !active);
    },
    destroy() { disposers.forEach(dispose => dispose()); surface.remove(); }
  };
  return api;
}
function toolbar(...nodes) { const node = element('div', 'game-toolbar board-toolbar'); node.append(...nodes); return node; }
function coord(index, size) { return `${String.fromCharCode(65 + index % size)}${Math.floor(index / size) + 1}`; }
function grid(api, count, cols, name, onSelect, onActivate, cellBuilder) {
  const node = element('div', 'game-grid board-grid'); node.style.setProperty('--board-cols', cols);
  node.setAttribute('role', 'grid'); node.setAttribute('aria-label', name);
  const buttons = [];
  let selected = 0;
  function select(index, focus = false) {
    if (index < 0 || index >= count) return;
    buttons[selected].tabIndex = -1; buttons[selected].classList.remove('board-selected');
    selected = index; buttons[selected].tabIndex = 0; buttons[selected].classList.add('board-selected');
    if (focus) buttons[selected].focus({ preventScroll: true });
    onSelect?.(selected);
  }
  for (let i = 0; i < count; i++) {
    const b = element('button', 'game-cell board-cell'); b.type = 'button'; b.tabIndex = i === 0 ? 0 : -1;
    b.setAttribute('role', 'gridcell'); b.setAttribute('aria-label', coord(i, cols));
    cellBuilder?.(b, i);
    api.listen(b, 'click', () => { select(i); onActivate?.(i); });
    api.listen(b, 'focus', () => { if (selected !== i) select(i); });
    api.listen(b, 'keydown', e => {
      let next = selected;
      if (e.key === 'ArrowLeft') next = Math.max(Math.floor(selected / cols) * cols, selected - 1);
      else if (e.key === 'ArrowRight') next = Math.min(Math.floor(selected / cols) * cols + cols - 1, selected + 1, count - 1);
      else if (e.key === 'ArrowUp') next = Math.max(0, selected - cols);
      else if (e.key === 'ArrowDown') next = Math.min(count - 1, selected + cols);
      else if (e.key === 'Home') next = e.ctrlKey ? 0 : Math.floor(selected / cols) * cols;
      else if (e.key === 'End') next = e.ctrlKey ? count - 1 : Math.min(count - 1, Math.floor(selected / cols) * cols + cols - 1);
      else return;
      e.preventDefault(); select(next, true);
    });
    buttons.push(b); node.append(b);
  }
  buttons[0].classList.add('board-selected');
  return { node, buttons, select, get selected() { return selected; } };
}
function precision(api, board, label, activate) {
  const area = element('div', 'board-precision'), location = element('span', 'board-location');
  const dpad = element('div', 'board-dpad'); dpad.setAttribute('aria-label', '精确选格');
  const columns = Number(board.node.style.getPropertyValue('--board-cols'));
  const directions = [['↑', -columns, '向上选格'], ['←', -1, '向左选格'], ['↓', columns, '向下选格'], ['→', 1, '向右选格']];
  for (const [symbol, offset, name] of directions) {
    const b = api.button(symbol, () => {
      const next = board.selected + offset;
      if (next < 0 || next >= board.buttons.length || (Math.abs(offset) === 1 && Math.floor(next / columns) !== Math.floor(board.selected / columns))) return;
      board.select(next);
    }); b.setAttribute('aria-label', name); dpad.append(b);
  }
  const confirm = api.button(label, activate, true);
  api.listen(board.node, 'keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (confirm.getAttribute('aria-disabled') !== 'true') activate(); } });
  area.append(location, dpad, confirm);
  return { node: area, confirm, update(index, can, text = label) { write(location, `已选 ${coord(index, columns)}`); write(confirm, text); locked(confirm, !can); } };
}

/* —— 五子棋：浅木纹棋盘 + 立体棋子 —— */
function mountGomoku(root, send, context) {
  const a = ui(root, send, context, 'gomoku', '15×15 自由规则，玩家 1 执先手（蜜桃粉棋子），玩家 2 执后手（薄荷绿棋子）。横、竖或斜线连成五子获胜；长连也算。每步 60 秒，超时落败。轻点选格后确认落子；方向键移动，Enter 或空格落子。', '枚棋子');
  const stars = new Set([48, 56, 112, 168, 176]);
  const board = grid(a, 225, 15, '五子棋棋盘，先选格再确认落子', () => refresh(), null, (cell, i) => {
    if (stars.has(i)) cell.append(element('span', 'board-star'));
  });
  const hint = element('p', 'game-note board-hint', '轻点棋盘选格，再点「落子」。蜜桃粉是玩家 1，薄荷绿是玩家 2。小屏可用下方方向键精确移动。');
  const controls = precision(a, board, '落子', () => a.send({ type: 'place', index: board.selected }));
  board.node.classList.add('board-gomoku-grid'); a.body.append(hint, board.node, controls.node);
  function refresh() {
    const v = a.view; if (!v) return;
    controls.update(board.selected, v.status === 'playing' && v.turn === a.p && v.board[board.selected] === -1, `落子 ${coord(board.selected, 15)}`);
  }
  return { update(v) {
    a.update(v);
    const over = v.status !== 'playing', winner = Number.isInteger(v.winner) ? v.winner : -1;
    board.buttons.forEach((b, i) => {
      const value = v.board[i];
      b.classList.toggle('board-stone-p0', value === 0); b.classList.toggle('board-stone-p1', value === 1);
      b.classList.toggle('board-last', i === v.lastMove); b.classList.toggle('board-winning', v.winningLine?.includes(i));
      b.classList.toggle('board-dimmed', over && winner >= 0 && value !== -1 && value !== winner);
      b.setAttribute('aria-label', `${coord(i, 15)}，${value === -1 ? '空位' : value === 0 ? '蜜桃粉棋子，玩家 1' : '薄荷绿棋子，玩家 2'}${i === v.lastMove ? '，最新落子' : ''}`);
    }); refresh();
  }, suggest(action){board.select(action.index,true);}, destroy: a.destroy };
}

/* —— 隐藏海战：浅色海域 + 精致舰船 —— */
function mountFleet(root, send, context) {
  const a = ui(root, send, context, 'fleet', '三艘舰船占 4、3、2 格。选择舰船和方向，再轻点我方海域并确认移动；也可重新随机布阵。双方准备后轮流轰炸，每次一发，先命中全部 9 格获胜。布阵 90 秒自动确认，每步 45 秒；超时落败。方向键选格，Enter 确认。', '格命中');
  const uid = a.sprite.uid;
  let chosenShip = 0, vertical = false;
  const ownArt = [], targetArt = [];
  const sunkSeen = new Set();
  const shipBar = element('div', 'board-shipbar'), ownTitle = element('h3', 'board-subtitle', '我方海域 · 对方看不到你的布阵'), targetTitle = element('h3', 'board-subtitle', '对方海域 · 选格轰炸');
  const shipButtons = [4, 3, 2].map((length, i) => { const b = a.button(`${length} 格舰船`, () => { chosenShip = i; refresh(); }); shipBar.append(b); return b; });
  const orientation = a.button('横向 →', () => { vertical = !vertical; refresh(); });
  const random = a.button('重新随机', () => a.send({ type: 'randomize' }));
  const ready = a.button('布阵完成', () => a.send({ type: 'ready' }), true);
  const setupToolbar = toolbar(orientation, random, ready);
  const artCell = (bucket, initial) => (cell) => {
    const handle = icon(`${uid}-${initial}`, 'board-sea-icon');
    const art = element('span', 'board-sea-art'); art.append(handle.node); cell.append(art); bucket.push(handle);
  };
  const ownGrid = grid(a, 64, 8, '我方舰船海域', () => refresh(), null, artCell(ownArt, 'flag'));
  ownGrid.node.classList.add('board-sea-grid');
  const targetGrid = grid(a, 64, 8, '对方海域，未命中舰船位置隐藏', () => refresh(), null, artCell(targetArt, 'hit'));
  targetGrid.node.classList.add('board-sea-grid');
  const place = precision(a, ownGrid, '移动所选舰船', () => a.send({ type: 'placeShip', ship: chosenShip, index: ownGrid.selected, vertical }));
  const fire = precision(a, targetGrid, '轰炸', () => a.send({ type: 'fire', index: targetGrid.selected }));
  const own = element('div', 'game-panel board-sea-panel'), target = element('div', 'game-panel board-sea-panel'), layout = element('div', 'board-seas');
  const sunk = element('p', 'game-note board-fleet-sunk'), legend = element('p', 'game-note', '图例：薄荷星芒＝命中舰船，蜜桃沉船＝敌舰已被击沉，浅色水花＝落空。对方海域只显示你已轰炸过的格子，未发现的舰船不会暴露。');
  own.append(ownTitle, shipBar, setupToolbar, ownGrid.node, place.node); target.append(targetTitle, targetGrid.node, fire.node, sunk); layout.append(own, target); a.body.append(layout, legend);
  function refresh() {
    const v = a.view; if (!v) return;
    const setup = v.status === 'playing' && v.phase === 'setup', editable = setup && !v.ready[a.p];
    shipBar.hidden = !setup; setupToolbar.hidden = !setup; place.node.hidden = !setup; target.hidden = v.phase === 'setup';
    write(ownTitle, setup ? '我方海域 · 调整舰船位置' : '我方海域 · 防守情况');
    shipButtons.forEach((b, i) => { b.classList.toggle('active', i === chosenShip); b.setAttribute('aria-pressed', String(i === chosenShip)); locked(b, !editable); });
    write(orientation, vertical ? '纵向 ↓' : '横向 →'); locked(orientation, !editable); locked(random, !editable); locked(ready, !editable); write(ready, v.ready[a.p] ? '已准备，等待对方' : '布阵完成');
    // Preview is local only; the server still checks bounds and overlaps.
    const length = [4, 3, 2][chosenShip], x = ownGrid.selected % 8, y = Math.floor(ownGrid.selected / 8);
    const cells = Array.from({ length }, (_, i) => ownGrid.selected + i * (vertical ? 8 : 1));
    const canPlace = editable && (vertical ? y + length <= 8 : x + length <= 8) && !v.ownShips.some((ship, i) => i !== chosenShip && ship.cells.some(c => cells.includes(c)));
    ownGrid.buttons.forEach((b, i) => { b.classList.toggle('board-preview', editable && cells.includes(i)); b.classList.toggle('board-invalid-preview', editable && !canPlace && cells.includes(i)); });
    place.update(ownGrid.selected, canPlace, `移动 ${length} 格舰船至 ${coord(ownGrid.selected, 8)}`);
    fire.update(targetGrid.selected, v.status === 'playing' && v.phase === 'battle' && v.turn === a.p && v.targetBoard[targetGrid.selected] === -1, `轰炸 ${coord(targetGrid.selected, 8)}`);
    write(sunk, `敌舰：${v.enemyShips.map(s => `${s.length} 格${s.sunk ? '已沉没' : '未击沉'}`).join(' · ')}`);
  }
  function paintSea(board, values, own, ships, art) {
    const shipAt = new Map();
    if (own && ships) ships.forEach(ship => ship.cells.forEach((cell, index) => shipAt.set(cell, { ship, index })));
    board.buttons.forEach((b, i) => {
      const value = values[i], info = shipAt.get(i);
      const hit = own ? value === 2 : value > 0, miss = own ? value === 3 : value === 0, sunk = !own && value === 2;
      b.classList.toggle('board-ship', Boolean(info));
      b.classList.remove('board-ship-h-bow', 'board-ship-h-stern', 'board-ship-v-bow', 'board-ship-v-stern', 'board-ship-mid');
      if (info) {
        const axis = info.ship.vertical ? 'v' : 'h';
        const position = info.index === 0 ? 'bow' : info.index === info.ship.cells.length - 1 ? 'stern' : 'mid';
        if (position === 'mid') b.classList.add('board-ship-mid');
        else b.classList.add(`board-ship-${axis}-${position}`);
      }
      b.classList.toggle('board-hit', hit); b.classList.toggle('board-miss', miss); b.classList.toggle('board-sunk', sunk);
      const flagHere = Boolean(info) && info.index === 0 && !hit;
      b.classList.toggle('board-art-flag-h', flagHere && !info.ship.vertical);
      b.classList.toggle('board-art-flag-v', flagHere && info.ship.vertical);
      if (hit) art[i].set(sunk ? `${uid}-sunk` : `${uid}-hit`);
      else if (miss) art[i].set(`${uid}-splash`);
      else if (flagHere) art[i].set(`${uid}-flag`);
      else art[i].clear();
      if (sunk && !sunkSeen.has(i)) {
        sunkSeen.add(i);
        if (!a.reduced) { b.classList.add('board-sinking'); a.timeout(() => b.classList.remove('board-sinking'), 950); }
      }
      b.setAttribute('aria-label', `${coord(i, 8)}，${hit ? sunk ? '舰船沉没' : '命中' : miss ? '落空' : info ? '我方舰船' : own ? '海水' : '未轰炸'}`);
    });
  }
  return { update(v) {
    a.update(v);
    paintSea(ownGrid, v.ownBoard, true, v.ownShips, ownArt);
    paintSea(targetGrid, v.targetBoard, false, null, targetArt);
    refresh();
  }, destroy: a.destroy };
}

/* —— 点格夺地：墨迹边线 + 双色领地 —— */
function mountDots(root, send, context) {
  const a = ui(root, send, context, 'dots', '点击两个相邻圆点之间的虚线，画完方格最后一条边即可占领它，并继续行动。一条边可能同时获得两格；16 格全部占领后结算。每步 45 秒，超时落败。Tab 选线、方向键移动，Enter 或空格画线。', '格领地');
  const board = element('div', 'board-dots-board'); board.setAttribute('role', 'grid'); board.setAttribute('aria-label', '5×5 圆点，连接边线争夺 16 格');
  const boxNodes = [], edgeButtons = [];
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const b = element('span', 'board-dots-box'); b.style.left = `${x * 25 + 1}%`; b.style.top = `${y * 25 + 1}%`; boxNodes.push(b); board.append(b);
  }
  for (let i = 0; i < 40; i++) {
    const horizontal = i < 20, local = horizontal ? i : i - 20, x = local % (horizontal ? 4 : 5), y = Math.floor(local / (horizontal ? 4 : 5));
    const b = element('button', `board-edge ${horizontal ? 'board-edge-h' : 'board-edge-v'}`); b.type = 'button'; b.tabIndex = i === 0 ? 0 : -1;
    b.style.left = `${x * 25 + (horizontal ? 12.5 : 0)}%`; b.style.top = `${y * 25 + (horizontal ? 0 : 12.5)}%`;
    b.setAttribute('aria-label', `${horizontal ? '横' : '竖'}线，第 ${y + 1} 行，第 ${x + 1} 列`);
    a.listen(b, 'click', () => { if (a.view?.turn === a.p && a.view.edges[i] === -1) a.send({ type: 'line', index: i }); });
    a.listen(b, 'focus', () => { edgeButtons.forEach((node, n) => { node.tabIndex = i === n ? 0 : -1; }); });
    a.listen(b, 'keydown', e => {
      const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[e.key];
      if (offset) { e.preventDefault(); edgeButtons[(i + offset + 40) % 40].focus({ preventScroll: true }); }
    }); edgeButtons.push(b); board.append(b);
  }
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
    const dot = element('span', 'board-dot'); dot.style.left = `${x * 25}%`; dot.style.top = `${y * 25}%`; board.append(dot);
  }
  a.body.append(element('p', 'game-note board-hint', '轻点虚线画边；围出一格后还能再走一步。'), board);
  return { update(v) {
    a.update(v);
    boxNodes.forEach((b, i) => { const owner = v.boxes[i]; playerClass(b, owner); write(b, owner < 0 ? '' : owner === a.p ? '我' : '对方'); });
    edgeButtons.forEach((b, i) => {
      playerClass(b, v.edges[i]); b.classList.toggle('board-edge-taken', v.edges[i] >= 0); b.classList.toggle('board-edge-last', v.lastLine === i);
      locked(b, v.status !== 'playing' || v.turn !== a.p || v.edges[i] >= 0);
    });
  }, destroy: a.destroy };
}

/* —— 翻牌记忆：3D 翻卡 —— */
function mountMemory(root, send, context) {
  const a = ui(root, send, context, 'memory', '24 张卡牌组成 12 对。轮到你时翻两张，相同得 1 分并继续翻，不同会展示 1.4 秒后换人。已配对的牌保留在桌面。每回合 30 秒，超时落败。点击翻牌，方向键选牌，Enter 或空格翻开。', '对卡牌');
  const uid = a.sprite.uid;
  const cards = [];
  const board = grid(a, 24, 4, '24 张记忆牌', null, index => {
    const v = a.view;
    if (v && v.status === 'playing' && v.turn === a.p && v.phase === 'choose' && v.faces[index] === null) a.send({ type: 'flip', index });
  }, (cell) => {
    const inner = element('span', 'board-card-inner');
    const back = element('span', 'board-card-face board-card-back');
    const front = element('span', 'board-card-face board-card-front');
    const glyph = icon(`${uid}-disc`, 'board-card-glyph');
    front.append(glyph.node); inner.append(back, front); cell.append(inner);
    cards.push({ front, glyph });
  });
  a.body.append(board.node); board.node.classList.add('board-memory-grid');
  // grid's normal button activation already supplies click for Enter/Space.
  return { update(v) {
    a.update(v);
    board.buttons.forEach((b, i) => {
      const face = v.faces[i], owner = v.owners[i], open = face !== null;
      const card = cards[i];
      b.classList.toggle('board-card-open', open);
      b.classList.toggle('board-card-paired', owner >= 0);
      b.classList.toggle('board-card-mismatch', open && owner < 0 && v.phase === 'reveal');
      playerClass(b, owner >= 0 ? owner : -1);
      if (open) { card.glyph.set(`${uid}-${faceGlyphs[face]}`); card.front.style.color = faceColors[face]; }
      else { card.glyph.clear(); card.front.style.color = ''; }
      b.setAttribute('aria-label', `第 ${i + 1} 张，${open ? faceNames[face] : '未翻开'}${owner >= 0 ? `，玩家 ${owner + 1} 已配对` : ''}`);
      locked(b, v.status !== 'playing' || v.turn !== a.p || v.phase !== 'choose' || open);
    });
  }, destroy: a.destroy };
}

/* —— 黑白棋：浅木纹 + 立体棋子 + 翻转动效 —— */
function mountReversi(root, send, context) {
  const a = ui(root, send, context, 'reversi', '玩家 1 执先手（深板岩棋子）。只能落在能夹住对方棋子的位置，横竖斜线均可翻转。淡紫圆点标出当前合法落点。无棋可下自动跳过，双方均无法落子时按棋子数结算。每步 45 秒，超时落败。轻点选格后确认；方向键移动，Enter 或空格落子。', '枚棋子');
  const board = grid(a, 8 * 8, 8, '黑白棋棋盘，圆点为合法落点', () => refresh()); board.node.classList.add('board-reversi-grid');
  const controls = precision(a, board, '落子并翻转', () => a.send({ type: 'place', index: board.selected }));
  const hint = element('p', 'game-note board-hint', '选中带淡紫圆点的空格，再确认落子。深板岩是玩家 1，暖白是玩家 2。'); a.body.append(hint, board.node, controls.node);
  let previous = null;
  function refresh() {
    const v = a.view; if (!v) return;
    controls.update(board.selected, v.status === 'playing' && v.turn === a.p && v.legalMoves.includes(board.selected), `落子 ${coord(board.selected, 8)} 并翻转`);
  }
  return { update(v) {
    a.update(v);
    const flipped = [];
    if (previous) board.buttons.forEach((b, i) => { if (previous[i] !== v.board[i] && v.board[i] !== -1 && i !== v.lastMove) flipped.push(i); });
    previous = v.board.slice();
    board.buttons.forEach((b, i) => {
      const value = v.board[i], legal = v.legalMoves.includes(i);
      b.classList.toggle('board-stone-dark', value === 0); b.classList.toggle('board-stone-light', value === 1);
      b.classList.toggle('board-legal', legal); b.classList.toggle('board-last', i === v.lastMove);
      b.setAttribute('aria-label', `${coord(i, 8)}，${value === -1 ? legal ? '合法落点' : '空位，暂不可落子' : value === 0 ? '深板岩棋子，玩家 1' : '暖白棋子，玩家 2'}`);
    });
    if (flipped.length && !a.reduced) flipped.forEach(i => {
      const b = board.buttons[i];
      b.classList.remove('board-flip'); void b.offsetWidth; b.classList.add('board-flip');
      a.timeout(() => b.classList.remove('board-flip'), 700);
    });
    refresh();
  }, destroy: a.destroy };
}

/* —— 石头剪刀布：手绘手势 —— */
function mountRps(root, send, context) {
  const a = ui(root, send, context, 'rps', '双方暗选，锁定后不能改；齐选后一起揭晓。石头胜剪刀，剪刀胜布，布胜石头。先得 3 分获胜，平局重赛。每轮限时 20 秒，未出拳者失去该轮；双方都超时则按当前比分结束。点击大按钮或按 1 / 2 / 3。', '分 / 3');
  const uid = a.sprite.uid;
  const round = element('p', 'board-rps-round'), arena = element('div', 'board-rps-arena');
  const mine = element('div', 'board-rps-hand board-rps-hand-self'), theirs = element('div', 'board-rps-hand board-rps-hand-other');
  const versus = element('span', 'board-versus', 'VS');
  const mineGlyph = icon(`${uid}-paper`, 'board-rps-glyph', '0 0 48 48'), theirGlyph = icon(`${uid}-paper`, 'board-rps-glyph', '0 0 48 48');
  const mineMark = element('span', 'board-rps-mark', '?'), theirMark = element('span', 'board-rps-mark', '?');
  mine.append(mineGlyph.node, mineMark); theirs.append(theirGlyph.node, theirMark);
  mine.setAttribute('aria-label', '我方出拳'); theirs.setAttribute('aria-label', '对方出拳');
  arena.append(mine, versus, theirs);
  const state = element('p', 'board-rps-state'), choices = element('div', 'board-rps-choices');
  mine.style.setProperty('--board-hand-color', context.colors?.[a.p] || '#FF7E6B');
  theirs.style.setProperty('--board-hand-color', context.colors?.[1 - a.p] || '#1FBE9C');
  const buttons = handOrder.map((choice, i) => {
    const b = a.button('', () => a.send({ type: 'choose', choice }), true);
    const glyph = icon(`${uid}-${choice}`, 'board-hand-icon', '0 0 48 48');
    b.append(glyph.node, element('span', 'board-hand-name', handNames[choice]), element('kbd', '', i + 1));
    b.setAttribute('aria-label', `${handNames[choice]}，快捷键 ${i + 1}`); choices.append(b); return b;
  });
  a.listen(a.surface, 'keydown', e => {
    if (!['1', '2', '3'].includes(e.key) || e.target.matches('input, textarea, select, [contenteditable="true"]')) return;
    const v = a.view; if (v?.phase === 'choose' && !v.ownChoice && v.status === 'playing') { e.preventDefault(); a.send({ type: 'choose', choice: handOrder[Number(e.key) - 1] }); }
  });
  a.surface.tabIndex = 0; a.body.append(round, arena, state, choices);
  let lastChoice = null, lastReveal = false;
  function paint(box, glyph, mark, choice, fallback) {
    if (choice) { glyph.set(`${uid}-${choice}`); mark.textContent = ''; }
    else { glyph.clear(); mark.textContent = fallback; }
    box.dataset.hand = choice || '';
  }
  return { update(v) {
    a.update(v); write(round, `第 ${v.round} 轮`);
    const revealed = v.reveal !== null, myChoice = revealed ? v.reveal[a.p] : v.ownChoice, otherChoice = revealed ? v.reveal[1 - a.p] : null;
    paint(mine, mineGlyph, mineMark, myChoice, revealed ? '—' : '?');
    paint(theirs, theirGlyph, theirMark, otherChoice, revealed ? '—' : v.chosen[1 - a.p] ? 'locked' : '?');
    if (!otherChoice && !revealed && v.chosen[1 - a.p]) { theirGlyph.set(`${uid}-lock`); theirMark.textContent = ''; theirs.dataset.hand = 'lock'; }
    mine.setAttribute('aria-label', `我方${myChoice ? handNames[myChoice] : revealed ? '超时未出拳' : '尚未选择'}`);
    theirs.setAttribute('aria-label', `对方${otherChoice ? handNames[otherChoice] : revealed ? '超时未出拳' : v.chosen[1 - a.p] ? '已锁定' : '尚未选择'}`);
    write(state, revealed ? v.roundWinner === -1 ? '平局，准备下一轮' : v.roundWinner === a.p ? '这轮你赢了' : '这轮对方获胜' : v.ownChoice ? '已秘密锁定，等待对方…' : '选择你的手势，双方齐选后揭晓');
    buttons.forEach((b, i) => { const selected = v.ownChoice === handOrder[i]; b.classList.toggle('active', selected); b.setAttribute('aria-pressed', String(selected)); locked(b, v.status !== 'playing' || v.phase !== 'choose' || Boolean(v.ownChoice)); });
    mine.classList.toggle('board-rps-win', revealed && v.roundWinner === a.p);
    theirs.classList.toggle('board-rps-win', revealed && v.roundWinner === 1 - a.p);
    mine.classList.toggle('board-rps-lose', revealed && v.roundWinner === 1 - a.p);
    theirs.classList.toggle('board-rps-lose', revealed && v.roundWinner === a.p);
    if (v.ownChoice && v.ownChoice !== lastChoice) {
      const index = handOrder.indexOf(v.ownChoice);
      if (index >= 0 && !a.reduced) { const b = buttons[index]; b.classList.add('board-stamp'); a.timeout(() => b.classList.remove('board-stamp'), 640); }
    }
    lastChoice = v.ownChoice;
    if (revealed && !lastReveal && !a.reduced) { arena.classList.add('board-rps-reveal'); a.timeout(() => arena.classList.remove('board-rps-reveal'), 760); }
    lastReveal = revealed;
  }, destroy: a.destroy };
}

/* —— 扫雷竞速：立体方块 + 波纹扩散 —— */
function mountMines(root, send, context) {
  const a = ui(root, send, context, 'mines', '双方使用相同 9×9 雷图，共 12 枚雷，独立开格。数字是周围八格雷数，空白会自动展开。安全格 +1，踩雷 −5 并可继续。先完成全部 69 个安全格或 180 秒到时按总分结算。轻点选格后点开格 / 插旗；方向键移动，Enter 开格，F 插旗；数字格周围旗数相等时可快速展开。', '分');
  const uid = a.sprite.uid;
  let flagMode = false, lastOpen = -1, previous = null;
  const tiles = [];
  const board = grid(a, 81, 9, '扫雷棋盘，先选格再开格或插旗', () => refresh(), null, (cell) => {
    const num = element('span', 'board-mine-num');
    const art = element('span', 'board-mine-art');
    const glyph = icon(`${uid}-flag`, 'board-mine-glyph');
    art.append(glyph.node); cell.append(num, art); tiles.push({ num, glyph });
  });
  board.node.classList.add('board-mines-grid');
  const controls = precision(a, board, '打开所选格', () => activate());
  const mode = a.button('标记模式：关', () => { flagMode = !flagMode; refresh(); });
  const flag = a.button('插旗 / 取消旗', () => sendFlag());
  const chord = a.button('展开数字周围', () => { lastOpen = board.selected; a.send({ type: 'chord', index: board.selected }); });
  const progress = element('p', 'board-mines-progress'), flags = element('p', 'game-note board-mines-flags');
  a.listen(board.node, 'keydown', e => { if (e.key.toLowerCase() === 'f') { e.preventDefault(); if (a.view?.board[board.selected] === null) sendFlag(); } });
  a.listen(board.node, 'contextmenu', e => { const index = board.buttons.indexOf(e.target.closest('button')); if (index >= 0) { e.preventDefault(); board.select(index); sendFlag(); } });
  a.body.append(progress, board.node, controls.node, toolbar(mode, flag, chord), flags);
  function activate() { lastOpen = board.selected; a.send({ type: flagMode ? 'flag' : 'open', index: board.selected }); }
  function sendFlag() { a.send({ type: 'flag', index: board.selected }); }
  function refresh() {
    const v = a.view; if (!v) return;
    const i = board.selected, unopened = v.board[i] === null, can = v.status === 'playing' && unopened && (flagMode || !v.flags[i]);
    controls.update(i, can, flagMode ? `${v.flags[i] ? '取消旗' : '插旗'} ${coord(i, 9)}` : `打开 ${coord(i, 9)}`);
    write(mode, `标记模式：${flagMode ? '开' : '关'}`); mode.classList.toggle('active', flagMode); mode.setAttribute('aria-pressed', String(flagMode));
    locked(mode, v.status !== 'playing'); locked(flag, v.status !== 'playing' || !unopened); locked(chord, v.status !== 'playing' || !Number.isInteger(v.board[i]) || v.board[i] <= 0);
    write(progress, `我方 ${v.safeOpened[a.p]} / 69　·　对方 ${v.safeOpened[1 - a.p]} / 69`);
    write(flags, `已插 ${v.flags.filter(Boolean).length} / 12 面旗　·　我方踩雷 ${v.hits[a.p]} 次。数字表示相邻雷数。`);
  }
  return { update(v) {
    a.update(v);
    const fresh = [];
    if (previous) board.buttons.forEach((b, i) => { if (previous[i] === null && v.board[i] !== null) fresh.push(i); });
    previous = v.board.slice();
    board.buttons.forEach((b, i) => {
      const value = v.board[i], flagged = v.flags[i], tile = tiles[i];
      write(tile.num, value !== null && value > 0 ? String(value) : '');
      b.classList.toggle('board-mine-open', value !== null); b.classList.toggle('board-mine-hit', value === -1); b.classList.toggle('board-mine-flag', flagged);
      b.dataset.number = value === null ? '' : String(value);
      if (flagged) tile.glyph.set(`${uid}-flag`); else if (value === -1) tile.glyph.set(`${uid}-mine`); else tile.glyph.clear();
      b.setAttribute('aria-label', `${coord(i, 9)}，${flagged ? '已插旗' : value === null ? '未打开' : value === -1 ? '踩到地雷，已扣分' : value === 0 ? '安全空白' : `周围 ${value} 枚雷`}`);
    });
    if (fresh.length && !a.reduced) {
      const marked = fresh.map(i => {
        const b = board.buttons[i];
        const distance = lastOpen >= 0 ? Math.max(Math.abs((i % 9) - (lastOpen % 9)), Math.abs(Math.floor(i / 9) - Math.floor(lastOpen / 9))) : 0;
        b.style.setProperty('--board-reveal-delay', `${Math.min(distance, 8) * 26}ms`);
        b.classList.add('board-reveal');
        return b;
      });
      a.timeout(() => marked.forEach(b => { b.classList.remove('board-reveal'); b.style.removeProperty('--board-reveal-delay'); }), 1200);
    }
    refresh();
  }, destroy: a.destroy };
}

export const renderers = { gomoku: mountGomoku, fleet: mountFleet, dots: mountDots, memory: mountMemory, reversi: mountReversi, rps: mountRps, mines: mountMines };
