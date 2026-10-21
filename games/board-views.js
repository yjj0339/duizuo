// DOM mounts are retained across snapshots, including focused board cells.
const faces = ['🍓', '🍋', '🍇', '🥝', '🍑', '🍒', '🌻', '🌙', '⭐', '🐚', '🦋', '🍀'];
const faceNames = ['草莓', '柠檬', '葡萄', '猕猴桃', '蜜桃', '樱桃', '向日葵', '月亮', '星星', '贝壳', '蝴蝶', '四叶草'];
const hands = { rock: '✊', paper: '✋', scissors: '✌️' };
const handNames = { rock: '石头', paper: '布', scissors: '剪刀' };
function element(tag, className = '', text) {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = String(text); return node;
}
function write(node, text) { text = String(text); if (node.textContent !== text) node.textContent = text; }
function locked(node, value) { node.setAttribute('aria-disabled', value ? 'true' : 'false'); node.classList.toggle('board-disabled', Boolean(value)); }
function ui(root, send, context, id, rules, scoreLabel) {
  const disposers = [], p = context.player === 1 ? 1 : 0;
  const surface = element('section', `game-surface board-game board-${id}`);
  surface.setAttribute('aria-label', { gomoku: '五子棋', fleet: '隐藏海战', dots: '点格夺地', memory: '翻牌记忆', reversi: '黑白棋', rps: '石头剪刀布', mines: '扫雷竞速' }[id]);
  surface.style.setProperty('--board-p0', context.colors?.[0] || '#ee827f');
  surface.style.setProperty('--board-p1', context.colors?.[1] || '#40ae9a');
  if (context.reducedMotion) surface.classList.add('board-reduced-motion');
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
  details.append(summary, ruleText); surface.append(header, scores, status, body, details); root.append(surface);
  const api = {
    p, surface, body, view: null,
    listen(node, event, listener, options) { node.addEventListener(event, listener, options); disposers.push(() => node.removeEventListener(event, listener, options)); },
    button(label, action, primary = false) {
      const b = element('button', `game-button ${primary ? 'primary' : 'secondary'} board-control`, label); b.type = 'button';
      api.listen(b, 'click', () => { if (b.getAttribute('aria-disabled') !== 'true') action(); }); return b;
    },
    send(action) { if (!api.view || api.view.status !== 'playing') return; send(action); context.feedback?.('tap'); },
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
function grid(api, count, cols, name, onSelect, onActivate) {
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
function playerClass(button, owner) { button.classList.toggle('player-0', owner === 0); button.classList.toggle('player-1', owner === 1); }

function mountGomoku(root, send, context) {
  const a = ui(root, send, context, 'gomoku', '15×15 自由规则，玩家 1 执黑先手。横、竖或斜线连成五子获胜；长连也算。每步 60 秒，超时落败。轻点选格后确认落子；方向键移动，Enter 或空格落子。', '枚棋子');
  const board = grid(a, 225, 15, '五子棋棋盘，先选格再确认落子', () => refresh());
  const hint = element('p', 'game-note board-hint', '轻点棋盘选格，再点「落子」。小屏可用下方方向键精确移动。');
  const controls = precision(a, board, '落子', () => a.send({ type: 'place', index: board.selected }));
  board.node.classList.add('board-gomoku-grid'); a.body.append(hint, board.node, controls.node);
  function refresh() {
    const v = a.view; if (!v) return;
    controls.update(board.selected, v.status === 'playing' && v.turn === a.p && v.board[board.selected] === -1, `落子 ${coord(board.selected, 15)}`);
  }
  return { update(v) {
    a.update(v);
    board.buttons.forEach((b, i) => {
      const value = v.board[i];
      b.classList.toggle('board-stone-dark', value === 0); b.classList.toggle('board-stone-light', value === 1);
      b.classList.toggle('board-last', i === v.lastMove); b.classList.toggle('board-winning', v.winningLine?.includes(i));
      b.setAttribute('aria-label', `${coord(i, 15)}，${value === -1 ? '空位' : value === 0 ? '黑子，玩家 1' : '白子，玩家 2'}${i === v.lastMove ? '，最新落子' : ''}`);
    }); refresh();
  }, destroy: a.destroy };
}

function mountFleet(root, send, context) {
  const a = ui(root, send, context, 'fleet', '三艘舰船占 4、3、2 格。选择舰船和方向，再轻点我方海域并确认移动；也可重新随机布阵。双方准备后轮流轰炸，每次一发，先命中全部 9 格获胜。布阵 90 秒自动确认，每步 45 秒；超时落败。方向键选格，Enter 确认。', '格命中');
  let chosenShip = 0, vertical = false, ownGrid, targetGrid;
  const shipBar = element('div', 'board-shipbar'), ownTitle = element('h3', 'board-subtitle', '我方海域 · 对方看不到你的布阵'), targetTitle = element('h3', 'board-subtitle', '对方海域 · 选格轰炸');
  const shipButtons = [4, 3, 2].map((length, i) => { const b = a.button(`${length} 格舰船`, () => { chosenShip = i; refresh(); }); shipBar.append(b); return b; });
  const orientation = a.button('横向 →', () => { vertical = !vertical; refresh(); });
  const random = a.button('重新随机', () => a.send({ type: 'randomize' }));
  const ready = a.button('布阵完成', () => a.send({ type: 'ready' }), true);
  const setupToolbar = toolbar(orientation, random, ready);
  ownGrid = grid(a, 64, 8, '我方舰船海域', () => refresh()); ownGrid.node.classList.add('board-sea-grid');
  targetGrid = grid(a, 64, 8, '对方海域，未命中舰船位置隐藏', () => refresh()); targetGrid.node.classList.add('board-sea-grid');
  const place = precision(a, ownGrid, '移动所选舰船', () => a.send({ type: 'placeShip', ship: chosenShip, index: ownGrid.selected, vertical }));
  const fire = precision(a, targetGrid, '轰炸', () => a.send({ type: 'fire', index: targetGrid.selected }));
  const own = element('div', 'game-panel board-sea-panel'), target = element('div', 'game-panel board-sea-panel'), layout = element('div', 'board-seas');
  const sunk = element('p', 'game-note board-fleet-sunk'), legend = element('p', 'game-note', '🛥 舰船　✦ 命中　× 落空　沉没舰船显示深色');
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
  function updateSea(board, values, own) {
    board.buttons.forEach((b, i) => {
      const value = values[i], ship = own && value === 1, hit = own ? value === 2 : value > 0, miss = own ? value === 3 : value === 0, sunk = !own && value === 2;
      write(b, hit ? '✦' : miss ? '×' : ship ? '▰' : '');
      b.classList.toggle('board-ship', ship); b.classList.toggle('board-hit', hit); b.classList.toggle('board-miss', miss); b.classList.toggle('board-sunk', sunk);
      b.setAttribute('aria-label', `${coord(i, 8)}，${hit ? sunk ? '舰船沉没' : '命中' : miss ? '落空' : ship ? '我方舰船' : own ? '海水' : '未轰炸'}`);
    });
  }
  return { update(v) { a.update(v); updateSea(ownGrid, v.ownBoard, true); updateSea(targetGrid, v.targetBoard, false); refresh(); }, destroy: a.destroy };
}

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
    boxNodes.forEach((b, i) => { playerClass(b, v.boxes[i]); write(b, v.boxes[i] < 0 ? '' : v.boxes[i] === a.p ? '我' : '对方'); });
    edgeButtons.forEach((b, i) => {
      playerClass(b, v.edges[i]); b.classList.toggle('board-edge-taken', v.edges[i] >= 0); b.classList.toggle('board-edge-last', v.lastLine === i);
      locked(b, v.status !== 'playing' || v.turn !== a.p || v.edges[i] >= 0);
    });
  }, destroy: a.destroy };
}

function mountMemory(root, send, context) {
  const a = ui(root, send, context, 'memory', '24 张卡牌组成 12 对。轮到你时翻两张，相同得 1 分并继续翻，不同会展示 1.4 秒后换人。已配对的牌保留在桌面。每回合 30 秒，超时落败。点击翻牌，方向键选牌，Enter 或空格翻开。', '对卡牌');
  const board = grid(a, 24, 4, '24 张记忆牌', null, index => {
    const v = a.view;
    if (v && v.status === 'playing' && v.turn === a.p && v.phase === 'choose' && v.faces[index] === null) a.send({ type: 'flip', index });
  });
  a.body.append(board.node); board.node.classList.add('board-memory-grid');
  // grid's normal button activation already supplies click for Enter/Space.
  return { update(v) {
    a.update(v);
    board.buttons.forEach((b, i) => {
      const face = v.faces[i], owner = v.owners[i];
      write(b, face === null ? '✦' : faces[face]); playerClass(b, owner);
      b.classList.toggle('board-card-open', face !== null); b.classList.toggle('board-card-paired', owner >= 0);
      b.setAttribute('aria-label', `第 ${i + 1} 张，${face === null ? '未翻开' : faceNames[face]}${owner >= 0 ? `，玩家 ${owner + 1} 已配对` : ''}`);
      locked(b, v.status !== 'playing' || v.turn !== a.p || v.phase !== 'choose' || face !== null);
    });
  }, destroy: a.destroy };
}

function mountReversi(root, send, context) {
  const a = ui(root, send, context, 'reversi', '玩家 1 执黑。只能落在能夹住对方棋子的位置，横竖斜线均可翻转。圆点标出当前合法落点。无棋可下自动跳过，双方均无法落子时按棋子数结算。每步 45 秒，超时落败。轻点选格后确认；方向键移动，Enter 或空格落子。', '枚棋子');
  const board = grid(a, 64, 8, '黑白棋棋盘，圆点为合法落点', () => refresh()); board.node.classList.add('board-reversi-grid');
  const controls = precision(a, board, '落子并翻转', () => a.send({ type: 'place', index: board.selected }));
  const hint = element('p', 'game-note board-hint', '选中带圆点的空格，再确认落子。玩家 1 为黑子，玩家 2 为白子。'); a.body.append(hint, board.node, controls.node);
  function refresh() {
    const v = a.view; if (!v) return;
    controls.update(board.selected, v.status === 'playing' && v.turn === a.p && v.legalMoves.includes(board.selected), `落子 ${coord(board.selected, 8)} 并翻转`);
  }
  return { update(v) {
    a.update(v);
    board.buttons.forEach((b, i) => {
      const value = v.board[i], legal = v.legalMoves.includes(i);
      b.classList.toggle('board-stone-dark', value === 0); b.classList.toggle('board-stone-light', value === 1); b.classList.toggle('board-legal', legal); b.classList.toggle('board-last', i === v.lastMove);
      b.setAttribute('aria-label', `${coord(i, 8)}，${value === -1 ? legal ? '合法落点' : '空位，暂不可落子' : value === 0 ? '黑子，玩家 1' : '白子，玩家 2'}`);
    }); refresh();
  }, destroy: a.destroy };
}

function mountRps(root, send, context) {
  const a = ui(root, send, context, 'rps', '双方暗选，锁定后不能改；齐选后一起揭晓。石头胜剪刀，剪刀胜布，布胜石头。先得 3 分获胜，平局重赛。每轮限时 20 秒，未出拳者失去该轮；双方都超时则按当前比分结束。点击大按钮或按 1 / 2 / 3。', '分 / 3');
  const round = element('p', 'board-rps-round'), arena = element('div', 'board-rps-arena'), mine = element('div', 'board-rps-hand'), versus = element('span', 'board-versus', 'VS'), theirs = element('div', 'board-rps-hand');
  mine.setAttribute('aria-label', '我方出拳'); theirs.setAttribute('aria-label', '对方出拳'); arena.append(mine, versus, theirs);
  const state = element('p', 'board-rps-state'), choices = element('div', 'board-rps-choices');
  const buttons = Object.keys(hands).map((choice, i) => {
    const b = a.button('', () => a.send({ type: 'choose', choice }), true);
    b.append(element('span', 'board-hand-icon', hands[choice]), element('span', 'board-hand-name', handNames[choice]), element('kbd', '', i + 1));
    b.setAttribute('aria-label', `${handNames[choice]}，快捷键 ${i + 1}`); choices.append(b); return b;
  });
  a.listen(a.surface, 'keydown', e => {
    if (!['1', '2', '3'].includes(e.key) || e.target.matches('input, textarea, select, [contenteditable="true"]')) return;
    const v = a.view; if (v?.phase === 'choose' && !v.ownChoice && v.status === 'playing') { e.preventDefault(); a.send({ type: 'choose', choice: ['rock', 'paper', 'scissors'][Number(e.key) - 1] }); }
  });
  a.surface.tabIndex = 0; a.body.append(round, arena, state, choices);
  return { update(v) {
    a.update(v); write(round, `第 ${v.round} 轮`);
    const revealed = v.reveal !== null, myChoice = revealed ? v.reveal[a.p] : v.ownChoice, otherChoice = revealed ? v.reveal[1 - a.p] : null;
    write(mine, myChoice ? hands[myChoice] : revealed ? '⌛' : '?'); write(theirs, otherChoice ? hands[otherChoice] : revealed ? '⌛' : v.chosen[1 - a.p] ? '🔒' : '?');
    mine.setAttribute('aria-label', `我方${myChoice ? handNames[myChoice] : revealed ? '超时未出拳' : '尚未选择'}`); theirs.setAttribute('aria-label', `对方${otherChoice ? handNames[otherChoice] : revealed ? '超时未出拳' : v.chosen[1 - a.p] ? '已锁定' : '尚未选择'}`);
    write(state, revealed ? v.roundWinner === -1 ? '平局，准备下一轮' : v.roundWinner === a.p ? '这轮你赢了' : '这轮对方获胜' : v.ownChoice ? '已秘密锁定，等待对方…' : '选择你的手势，双方齐选后揭晓');
    buttons.forEach((b, i) => { const selected = v.ownChoice === ['rock', 'paper', 'scissors'][i]; b.classList.toggle('active', selected); b.setAttribute('aria-pressed', String(selected)); locked(b, v.status !== 'playing' || v.phase !== 'choose' || Boolean(v.ownChoice)); });
  }, destroy: a.destroy };
}

function mountMines(root, send, context) {
  const a = ui(root, send, context, 'mines', '双方使用相同 9×9 雷图，共 12 枚雷，独立开格。数字是周围八格雷数，空白会自动展开。安全格 +1，踩雷 −5 并可继续。先完成全部 69 个安全格或 180 秒到时按总分结算。轻点选格后点开格 / 插旗；方向键移动，Enter 开格，F 插旗；数字格周围旗数相等时可快速展开。', '分');
  let flagMode = false;
  const board = grid(a, 81, 9, '扫雷棋盘，先选格再开格或插旗', () => refresh()); board.node.classList.add('board-mines-grid');
  const controls = precision(a, board, '打开所选格', () => activate());
  const mode = a.button('标记模式：关', () => { flagMode = !flagMode; refresh(); });
  const flag = a.button('插旗 / 取消旗', () => a.send({ type: 'flag', index: board.selected }));
  const chord = a.button('展开数字周围', () => a.send({ type: 'chord', index: board.selected }));
  const progress = element('p', 'board-mines-progress'), flags = element('p', 'game-note board-mines-flags');
  a.listen(board.node, 'keydown', e => { if (e.key.toLowerCase() === 'f') { e.preventDefault(); if (a.view?.board[board.selected] === null) a.send({ type: 'flag', index: board.selected }); } });
  a.listen(board.node, 'contextmenu', e => { const index = board.buttons.indexOf(e.target.closest('button')); if (index >= 0) { e.preventDefault(); board.select(index); a.send({ type: 'flag', index }); } });
  a.body.append(progress, board.node, controls.node, toolbar(mode, flag, chord), flags);
  function activate() { a.send({ type: flagMode ? 'flag' : 'open', index: board.selected }); }
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
    board.buttons.forEach((b, i) => {
      const value = v.board[i], flagged = v.flags[i];
      write(b, flagged ? '⚑' : value === null ? '' : value === -1 ? '✹' : value === 0 ? '' : value);
      b.classList.toggle('board-mine-open', value !== null); b.classList.toggle('board-mine-hit', value === -1); b.classList.toggle('board-mine-flag', flagged);
      b.dataset.number = value === null ? '' : String(value);
      b.setAttribute('aria-label', `${coord(i, 9)}，${flagged ? '已插旗' : value === null ? '未打开' : value === -1 ? '踩到地雷，已扣分' : value === 0 ? '安全空白' : `周围 ${value} 枚雷`}`);
    }); refresh();
  }, destroy: a.destroy };
}

export const renderers = { gomoku: mountGomoku, fleet: mountFleet, dots: mountDots, memory: mountMemory, reversi: mountReversi, rps: mountRps, mines: mountMines };
