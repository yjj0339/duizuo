import Sudoku from '../client/legacy/sudoku/engine.js';
// Stable DOM renderers: snapshots update nodes without resetting focus or IME.
function mount(root, send, context, hint) {
  const doc = root.ownerDocument, cleanups = [], timers = new Set(), animations = new Set(), player = context.player;
  let current = null, destroyed = false, lastScores = null;
  const reduced = Boolean(context.reducedMotion);
  const el = (tag, className, text) => { const node = doc.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const listen = (target, name, fn, options) => { target.addEventListener(name, fn, options); cleanups.push(() => target.removeEventListener(name, fn, options)); };
  const command = action => { if (!destroyed && current?.status === 'playing' && !context.isPaused?.() && !doc.hidden) { return send(action); } return false; };
  const button = (text, action, className = '') => {
    const b = el('button', `game-button puzzle-button ${className}`, text); b.type = 'button';
    listen(b, 'click', () => command(typeof action === 'function' ? action() : action)); return b;
  };
  /* Transient visual flag: switch a data attribute on, let CSS play the keyframes, switch it off. */
  const flash = (node, key, ms = 520) => {
    if (reduced || destroyed || !node) return;
    node.dataset[key] = 'true';
    const handle = setTimeout(() => { node.dataset[key] = 'false'; timers.delete(handle); }, ms);
    if (handle && typeof handle === 'object' && handle.unref) handle.unref();
    timers.add(handle);
  };
  root.replaceChildren(); root.classList.add('puzzle-game'); root.tabIndex = 0;
  root.style.setProperty('--puzzle-p0', context.colors?.[0] || '#FF7E6B');
  root.style.setProperty('--puzzle-p1', context.colors?.[1] || '#1FBE9C');
  root.dataset.reducedMotion = String(reduced);
  const top = el('div', 'puzzle-top'), score = el('div', 'puzzle-scoreline'), clockNode = el('span', 'puzzle-timer');
  const pScores = [0, 1].map(i => el('span', `puzzle-score player-${i} puzzle-p${i}`)); score.append(...pScores); top.append(score, clockNode);
  const message = el('p', 'game-note puzzle-message'); message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite');
  const content = el('div', 'puzzle-content'), controls = el('div', 'game-toolbar puzzle-controls'), note = el('p', 'game-note puzzle-hint', hint);
  root.append(top, message, content, controls, note);
  function keyboard(handler) {
    listen(root, 'keydown', e => {
      if (e.isComposing || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (current?.status === 'playing' && handler(e.key, e)) e.preventDefault();
    });
  }
  const publicApi = {
    doc, el, listen, button, command, keyboard, flash, content, controls, player, reduced,
    cleanup(fn){cleanups.push(fn);},
    animate(node,frames,duration=220,done=()=>{}){
      if(reduced||!node?.animate){done();return null;}
      const a=node.animate(frames,{duration,easing:'cubic-bezier(.2,.8,.3,1)'});animations.add(a);
      a.finished.then(()=>{animations.delete(a);done();},()=>{animations.delete(a);done();});return a;
    },
    get view() { return current; },
    update(view) {
      current = view;
      for (let i = 0; i < 2; i++) {
        pScores[i].textContent = `${i === player ? '你' : '对方'} · ${view.scores[i]} 分`;
        if (lastScores && lastScores[i] !== view.scores[i]) flash(pScores[i], 'bump');
      }
      lastScores = [...view.scores];
      const seconds = Math.max(0, Math.ceil((view.endsAt - view.now) / 1000));
      clockNode.textContent = view.status === 'finished' ? (view.winner === -1 ? '平局' : view.winner === player ? '你获胜了' : '对方获胜') : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
      message.textContent = view.message; root.dataset.status = view.status;
    },
    destroy() {
      destroyed = true;
      for (const handle of timers) clearTimeout(handle);
      timers.clear();
      for (const a of animations) a.cancel();animations.clear();
      for (const cleanup of cleanups.splice(0)) cleanup();
      root.replaceChildren(); root.classList.remove('puzzle-game'); root.removeAttribute('tabindex');
    }
  };
  return publicApi;
}
const directionKeys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down' };
/* 面板：玻璃卡片 + 玩家色顶条 + 身份徽章 */
function panel(ui, player, extra = '') {
  const node = ui.el('section', `puzzle-player-panel puzzle-p${player} ${extra}`);
  const head = ui.el('div', 'puzzle-panel-head');
  head.append(ui.el('h3', 'puzzle-panel-title', player === ui.player ? '你的棋盘' : '对方的棋盘'));
  head.append(ui.el('span', 'puzzle-panel-badge', player === ui.player ? '你' : '对手'));
  node.append(head);
  return node;
}
/* 进度条：玩家一蜜桃、玩家二薄荷 */
function meter(ui, index) {
  const row = ui.el('div', `puzzle-meter puzzle-p${index}`);
  const label = ui.el('span', 'puzzle-meter-label', index === ui.player ? '你' : '对方');
  const track = ui.el('div', 'puzzle-meter-track'), fill = ui.el('i', 'puzzle-meter-fill');
  track.append(fill);
  const value = ui.el('span', 'puzzle-meter-value', '0');
  row.append(label, track, value);
  return { row, fill, value };
}
function directionPad(ui, sendDirection) {
  const pad = ui.el('div', `puzzle-dpad puzzle-p${ui.player}`);
  for (const [dir, symbol] of [['up', '↑'], ['left', '←'], ['down', '↓'], ['right', '→']]) {
    const b = ui.button(symbol, () => sendDirection(dir), `puzzle-dir-${dir}`); b.setAttribute('aria-label', `向${{ up: '上', left: '左', down: '下', right: '右' }[dir]}移动`); pad.append(b);
  }
  ui.controls.append(pad); return pad;
}

function render2048(root, send, context) {
  const ui = mount(root, send, context, '滑动棋盘 / 方向键 / WASD / 方向按钮。相同数字每步只合并一次，合并值计分；双方使用独立的同种子随机序列。'), race = ui.el('div', 'puzzle-race puzzle-2048-race');
  const grids = [], tiles = [], labels = [], previous = [], moves = [], flying=[[],[]];
  ui.cleanup(()=>flying.flat().forEach(n=>n.remove()));
  for (let i = 0; i < 2; i++) {
    const box = panel(ui, i, i === ui.player ? 'puzzle-own' : 'puzzle-opponent'), grid = ui.el('div', 'puzzle-2048-grid'); grid.setAttribute('role', 'img'); grid.setAttribute('aria-label', `${i === ui.player ? '你的' : '对方'} 2048 棋盘`);
    const cells = Array.from({ length: 16 }, () => ui.el('div', 'puzzle-2048-tile')); grid.append(...cells);
    const label = ui.el('p', 'game-note puzzle-board-note'); box.append(grid, label); grids[i] = grid; tiles[i] = cells; labels[i] = label; previous[i] = new Array(16).fill(0);
    race.append(box);
  }
  // Put the local board first without depending on the assigned player index.
  if (ui.player === 1) race.replaceChildren(race.children[1], race.children[0]);
  ui.content.append(race);
  const action = direction => ({ type: 'move', direction }); directionPad(ui, action);
  ui.keyboard(key => { if (!directionKeys[key]) return false; ui.command(action(directionKeys[key])); return true; });
  const grid = grids[ui.player]; let swipe = null;
  ui.listen(grid, 'pointerdown', e => { swipe = { x: e.clientX, y: e.clientY, id: e.pointerId }; grid.setPointerCapture?.(e.pointerId); root.focus({ preventScroll: true }); });
  ui.listen(grid, 'pointerup', e => {
    if (!swipe || swipe.id !== e.pointerId) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) >= 22) ui.command(action(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up'));
    swipe = null; grid.releasePointerCapture?.(e.pointerId);
  });
  ui.listen(grid, 'pointercancel', () => { swipe = null; });
  return {
    update(view) {
      ui.update(view);
      view.players.forEach((p, i) => {
        const motion=p.motion,changed=moves[i]!==undefined&&p.moves!==moves[i],consecutive=p.moves===moves[i]+1;moves[i]=p.moves;
        if(changed){flying[i].forEach(n=>n.remove());flying[i]=[];tiles[i].forEach(n=>{if(n.style)n.style.visibility='';});}
        p.cells.forEach((value, index) => {
          const node = tiles[i][index], before = previous[i][index];
          node.textContent = value || '';
          node.dataset.level = value ? String(Math.min(12, Math.log2(value))) : '0';
          previous[i][index] = value;
        });
        // Exact source/destination paths come from the accepted server move.
        // Never guess merges by inspecting the already compacted board.
        if(changed&&consecutive&&motion&&!ui.reduced&&grids[i].getBoundingClientRect){
          const bounds=grids[i].getBoundingClientRect(),version=p.moves;
          for(const step of motion.slides){const source=tiles[i][step.from].getBoundingClientRect(),target=tiles[i][step.to].getBoundingClientRect(),ghost=ui.el('div','puzzle-2048-tile puzzle-motion-tile',String(step.value));ghost.dataset.level=String(Math.min(12,Math.log2(step.value)));
            Object.assign(ghost.style,{left:`${source.left-bounds.left}px`,top:`${source.top-bounds.top}px`,width:`${source.width}px`,height:`${source.height}px`});ghost.setAttribute('aria-hidden','true');grids[i].append(ghost);flying[i].push(ghost);tiles[i][step.to].style.visibility='hidden';
            ui.animate(ghost,[{transform:'translate(0,0)'},{transform:`translate(${target.left-source.left}px,${target.top-source.top}px)`}],155,()=>{ghost.remove();if(moves[i]===version){tiles[i][step.to].style.visibility='';if(motion.merged.includes(step.to))ui.animate(tiles[i][step.to],[{transform:'scale(1.12)'},{transform:'scale(1)'}],140);}});
          }
          if(motion.spawn){const n=tiles[i][motion.spawn.index];ui.animate(n,[{opacity:0,transform:'scale(.45)'},{opacity:0,transform:'scale(.45)',offset:.65},{opacity:1,transform:'scale(1)'}],240);}
        }
        labels[i].textContent = `最高 ${p.highest} · ${p.moves} 步${p.stuck ? ' · 无可用移动' : ''}`;
        grids[i].setAttribute('aria-label', `${i === ui.player ? '你的' : '对方'}棋盘：${p.cells.map(n => n || '空').join('，')}`);
      });
    }, destroy: ui.destroy
  };
}

function renderSudoku(root, send, context) {
  const ui = mount(root, send, context, '每行、每列、每个粗线九宫内，1–9 各出现一次。点击空格后选数字；也可用数字键、方向键和退格。错误每次扣 2 分，正确格每格 10 分。');
  const progress = ui.el('div', 'puzzle-progress-pair'), grid = ui.el('div', 'puzzle-sudoku-grid'); grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', '数独棋盘');
  const stats = [0, 1].map(i => ui.el('span', `player-${i} puzzle-p${i}`)); progress.append(...stats);
  let selected = -1, notesMode=false, auto=false, suggestion=null;
  const annotations=context.annotations||{},notes=annotations['notes'+ui.player]||(annotations['notes'+ui.player]=Array.from({length:81},()=>[]));
  function select(index) { if (ui.view && !ui.view.givens[index]) { selected = index; refresh(); } }
  function set(value) { if (selected < 0)return;if(notesMode){if(value){const arr=notes[selected],i=arr.indexOf(value);if(i<0)arr.push(value);else arr.splice(i,1);}else notes[selected]=[];refresh();return;}notes[selected]=[];suggestion=null;ui.command({ type: 'set', index: selected, value }); }
  const cells = Array.from({ length: 81 }, (_, index) => { const b = ui.el('button', 'puzzle-sudoku-cell'); b.type = 'button'; b.dataset.row = String(Math.floor(index / 9)); b.dataset.col = String(index % 9); ui.listen(b, 'click', () => select(index)); return b; }); grid.append(...cells);
  const pad = ui.el('div', 'puzzle-numberpad'), digits = [];
  for (let n = 1; n <= 9; n++) {
    const b = ui.el('button', 'game-button puzzle-number');
    b.type = 'button';
    const digit = ui.el('span', 'puzzle-number-digit', String(n)), count = ui.el('span', 'puzzle-number-count', '');
    b.append(digit, count);
    ui.listen(b, 'click', () => set(n));
    digits[n] = { button: b, count };
    pad.append(b);
  }
  const erase = ui.el('button', 'game-button puzzle-number puzzle-erase', '⌫'); erase.type = 'button';
  erase.setAttribute('aria-label', '清除该格'); erase.title = '清除';
  ui.listen(erase, 'click', () => set(0)); pad.append(erase);
  const cursor = ui.el('p', 'game-note puzzle-sudoku-cursor', '选中一个空格开始填写');
  ui.content.append(progress, grid, cursor); ui.controls.append(pad);
  const tools=ui.el('div','sudoku-tools'),noteButton=ui.el('button','game-button','候选笔记 · 关闭'),autoButton=ui.el('button','game-button','自动候选 · 关闭'),explanation=ui.el('div','sudoku-explanation');
  noteButton.type=autoButton.type='button';ui.listen(noteButton,'click',()=>{notesMode=!notesMode;noteButton.textContent='候选笔记 · '+(notesMode?'开启':'关闭');noteButton.setAttribute('aria-pressed',String(notesMode));});ui.listen(autoButton,'click',()=>{auto=!auto;autoButton.textContent='自动候选 · '+(auto?'开启':'关闭');refresh();});tools.append(noteButton,autoButton);ui.content.append(tools,explanation);
  if(context.practice){const hint=ui.el('button','game-button','逻辑提示'),fill=ui.el('button','game-button','填入提示');hint.type=fill.type='button';fill.hidden=true;ui.listen(hint,'click',()=>{const board=ui.view.players[ui.player].cells;suggestion=Sudoku.next(board);if(suggestion){selected=suggestion.index;explanation.textContent=suggestion.title+'：'+suggestion.reason;fill.hidden=false;refresh();}else explanation.textContent='当前填写有冲突，先检查已填数字，或棋盘已经完成。';});ui.listen(fill,'click',()=>{if(suggestion){const step=suggestion;notesMode=false;noteButton.textContent='候选笔记 · 关闭';noteButton.setAttribute('aria-pressed','false');selected=step.index;set(step.value);fill.hidden=true;}});tools.append(hint,fill);}
  function refresh() {
    const view = ui.view; if (!view) return;
    const own = view.players[ui.player];
    const row = selected >= 0 ? Math.floor(selected / 9) : -1, col = selected >= 0 ? selected % 9 : -1;
    const masks=auto?Sudoku.candidates(own.cells):null;
    cells.forEach((node, index) => {
      const r = Math.floor(index / 9), c = index % 9;
      const value=own.cells[index],ns=value?[]:auto?Sudoku.bits(masks[index]):notes[index],signature=value+'|'+ns.join(',');
      if(node.dataset.content!==signature){node.replaceChildren();if(value)node.textContent=value;else if(ns.length){const small=ui.el('span','sudoku-notes');for(let n=1;n<=9;n++)small.append(ui.el('i','',ns.includes(n)?String(n):''));node.append(small);}node.dataset.content=signature;}
      node.disabled = Boolean(view.givens[index]) || view.status !== 'playing';
      node.dataset.given = String(Boolean(view.givens[index]));
      node.dataset.selected = String(index === selected);
      node.dataset.wrong = String(Boolean(own.wrong?.[index]));
      node.dataset.rowHint = String(selected >= 0 && r === row && index !== selected);
      node.dataset.colHint = String(selected >= 0 && c === col && index !== selected);
      node.dataset.boxHint = String(selected >= 0 && index !== selected && Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3) && r !== row && c !== col);
      node.setAttribute('aria-label', `第 ${r + 1} 行，第 ${c + 1} 列，${own.cells[index] || '空格'}${view.givens[index] ? '，已给定' : ''}`);
      node.setAttribute('aria-pressed', String(index === selected));
    });
    /* 每个数字还剩多少个：由已填内容推导，不泄露唯一解。 */
    const used = new Array(10).fill(0);
    for (const value of own.cells || []) if (value) used[value]++;
    for (let n = 1; n <= 9; n++) { const left = 9 - used[n]; digits[n].count.textContent = left > 0 ? String(left) : ''; digits[n].button.dataset.empty = String(left <= 0); }
    view.players.forEach((p, i) => { stats[i].textContent = `${i === ui.player ? '你' : '对方'}：${p.correct}/${view.total} 格 · 错误 ${p.mistakes} 次`; });
    cursor.textContent = selected >= 0 ? `第 ${row + 1} 行 · 第 ${col + 1} 列 —— 选一个数字填入` : '选中一个空格开始填写';
  }
  ui.keyboard(key => {
    if (/^[1-9]$/.test(key)) { set(Number(key)); return true; }
    if (['Backspace', 'Delete', '0'].includes(key)) { set(0); return true; }
    const direction = directionKeys[key];
    if (direction) {
      const step = { left: -1, right: 1, up: -9, down: 9 }[direction];
      let next = selected < 0 ? 0 : selected;
      for (let i = 0; i < 81; i++) { next = (next + step + 81) % 81; if (!ui.view.givens[next]) { select(next); break; } }
      return true;
    }
    return false;
  });
  return { update(view) { ui.update(view); if (selected < 0) selected = view.givens.indexOf(0); refresh(); }, destroy: ui.destroy };
}

function renderQuiz(root, send, context) {
  const ui = mount(root, send, context, '共 8 道常识题，每题最多 12 秒；两人都作答后揭晓。答对 100 分，答错不扣分。点击选项或按 1–4。');
  const round = ui.el('p', 'puzzle-round');
  /* 精致问题卡：毛玻璃 + 顶部彩色饰条 */
  const card = ui.el('div', 'puzzle-quiz-card');
  card.append(ui.el('i', 'puzzle-quiz-ribbon'));
  const question = ui.el('h3', 'puzzle-question'), explanation = ui.el('p', 'puzzle-explanation');
  card.append(question, explanation);
  const choices = ui.el('div', 'puzzle-choice-grid'), results = ui.el('p', 'game-note');
  const answer = choice => ({ type: 'answer', round: ui.view?.round, choice });
  const labels = [];
  for (let i = 0; i < 4; i++) {
    const b = ui.button('', () => answer(i), 'puzzle-choice');
    const label = ui.el('span', 'puzzle-choice-label');
    b.append(label); labels.push(label); choices.append(b);
  }
  ui.content.append(round, card, choices, results);
  ui.keyboard(key => { if (!/^[1-4]$/.test(key)) return false; ui.command(answer(Number(key) - 1)); return true; });
  return {
    update(view) {
      ui.update(view);
      round.textContent = `第 ${Math.min(view.totalRounds, view.round + 1)} / ${view.totalRounds} 题 · ${view.phase === 'answer' ? `作答剩余 ${Math.max(0, Math.ceil((view.phaseEndsAt - view.now) / 1000))} 秒` : '答案揭晓'}`;
      question.textContent = view.question.text;
      /* correct 只在揭晓后由服务端下发，揭晓前 DOM 里没有任何答案痕迹。 */
      const revealed = view.question.correct !== undefined;
      labels.forEach((label, i) => { label.textContent = `${i + 1}. ${view.question.choices[i] ?? ''}`; });
      const buttons = choices.children;
      for (let i = 0; i < buttons.length; i++) {
        const b = buttons[i];
        b.disabled = view.status !== 'playing' || view.phase !== 'answer' || view.answered[ui.player];
        b.dataset.selected = String(view.choices[ui.player] === i);
        b.dataset.correct = String(revealed && view.question.correct === i);
        b.dataset.wrong = String(revealed && view.choices[ui.player] === i && view.question.correct !== i);
      }
      results.textContent = `你${view.answered[ui.player] ? '已作答' : '未作答'} · 对方${view.answered[1 - ui.player] ? '已作答' : '思考中'}`;
      explanation.textContent = revealed ? (view.question.explanation || '') : '';
    }, destroy: ui.destroy
  };
}

function renderReaction(root, send, context) {
  const ui = mount(root, send, context, '等待卡片变绿后点击，或按空格 / Enter。抢跑扣 50 分；正确反应按服务器收到的时间计分，共 5 轮。网络延迟会影响成绩。');
  const round = ui.el('p', 'puzzle-round');
  /* 灯塔式信号盘：底座 + 三圈冲击波 + 发光灯芯 + 文字 */
  const signal = ui.el('button', 'puzzle-signal');
  signal.type = 'button';
  const rings = [0, 1, 2].map(() => ui.el('i', 'puzzle-signal-ring'));
  const core = ui.el('span', 'puzzle-signal-core'), label = ui.el('span', 'puzzle-signal-label', '等待信号');
  signal.append(...rings, core, label);
  ui.listen(signal, 'click', () => ui.command({ type: 'tap', round: ui.view?.round }));
  const results = ui.el('div', 'puzzle-progress-pair');
  const labels = [0, 1].map(i => ui.el('span', `player-${i} puzzle-p${i}`)); results.append(...labels);
  ui.content.append(round, signal, results);
  ui.keyboard(key => { if (![' ', 'Enter'].includes(key)) return false; ui.command({ type: 'tap', round: ui.view.round }); return true; });
  return {
    update(view) {
      ui.update(view);
      round.textContent = `第 ${Math.min(view.totalRounds, view.round + 1)} / ${view.totalRounds} 轮`;
      const own = view.responses[ui.player];
      signal.dataset.phase = view.phase;
      signal.dataset.outcome = own === null ? 'none' : own === -1 ? 'early' : 'hit';
      signal.disabled = view.status !== 'playing' || view.phase === 'reveal' || own !== null;
      label.textContent = own !== null ? (own === -1 ? '抢跑了，下一轮再来' : `${own} ms · 等待下一轮`) : view.phase === 'waiting' ? '等待信号' : view.phase === 'ready' ? '现在点击！' : '本轮结束';
      view.responses.forEach((ms, i) => { labels[i].textContent = `${i === ui.player ? '你' : '对方'}：${ms === null ? '等待' : ms === -1 ? '抢跑 −50 分' : `${ms} ms`}`; });
    }, destroy: ui.destroy
  };
}

function renderTyping(root, send, context) {
  const ui = mount(root, send, context, '照着短文输入，中文标点也需要一致。支持中文输入法；组合输入时不会发送半成品。先完整正确输入者获胜，90 秒到时按连续正确字数结算。');
  const card = ui.el('div', 'puzzle-typing-card');
  const target = ui.el('div', 'puzzle-typing-target'), input = ui.el('textarea', 'game-input puzzle-typing-input');
  target.setAttribute('aria-label', '需要输入的短文'); input.setAttribute('aria-label', '输入上方中文短文'); input.placeholder = '点击这里，开始输入…'; input.rows = 4; input.maxLength = 300; input.spellcheck = false; input.autocomplete = 'off';
  card.append(target, input);
  const progress = ui.el('div', 'puzzle-typing-progress');
  const bars = [0, 1].map(i => meter(ui, i)); bars.forEach(b => progress.append(b.row));
  ui.content.append(card, progress);
  let composing = false, lastSent = '', phrase = '', characters = [];
  const submit = () => { if (!composing && input.value !== lastSent) { lastSent = input.value; ui.command({ type: 'input', text: input.value }); } };
  ui.listen(input, 'compositionstart', () => { composing = true; }); ui.listen(input, 'compositionend', () => { composing = false; submit(); }); ui.listen(input, 'input', submit);
  return {
    update(view) {
      ui.update(view);
      if (phrase !== view.text) { phrase = view.text; characters = Array.from(phrase).map(char => ui.el('span', '', char)); target.replaceChildren(...characters); }
      const p = view.players[ui.player];
      const cursorAt = Math.min(p.correct, Math.max(characters.length - 1, 0));
      characters.forEach((node, i) => {
        node.dataset.state = i < p.correct ? 'correct' : i === p.correct && p.length > p.correct ? 'wrong' : 'pending';
        node.dataset.cursor = String(view.status === 'playing' && characters.length > 0 && i === cursorAt);
      });
      /* 只有在未聚焦、未合成时才同步服务端回显，绝不夺走焦点或打断输入法。 */
      if (ui.doc.activeElement !== input && !composing && input.value !== view.input) { input.value = view.input; lastSent = view.input; }
      input.disabled = view.status !== 'playing';
      view.players.forEach((p, i) => {
        const total = Math.max(1, view.total);
        bars[i].fill.style.width = `${Math.min(100, Math.round(100 * p.correct / total))}%`;
        bars[i].value.textContent = `${p.correct} / ${view.total} 字`;
      });
    }, destroy: ui.destroy
  };
}

function renderSimon(root, send, context) {
  const ui = mount(root, send, context, '先看闪亮音符，播放结束后按原顺序点击。也可按数字键 1–4。每次正确 10 分，完整复现加 30 分，共 8 轮，序列逐轮增长。');
  const round = ui.el('p', 'puzzle-round'), phase = ui.el('h3', 'puzzle-question');
  /* 音乐盒：外框 + 内凹音板井 */
  const stage = ui.el('div', 'puzzle-simon-stage'), pad = ui.el('div', 'puzzle-simon-pad');
  const progress = ui.el('div', 'puzzle-progress-pair');
  const names = ['Do', 'Re', 'Mi', 'Sol'], symbols = ['●', '◆', '▲', '■'];let lastCue=null,lastNoteCount=-1;
  const action = note => ({ type: 'note', note, round: ui.view?.round });
  const buttons = names.map((name, i) => {
    const b = ui.el('button', `puzzle-note puzzle-note-${i}`);
    b.type = 'button';
    b.setAttribute('aria-label', `音符 ${name}，数字键 ${i + 1}`);
    b.append(ui.el('span', 'puzzle-note-glyph', symbols[i]), ui.el('span', 'puzzle-note-caption', `${name} · ${i + 1}`));
    ui.listen(b, 'click', () => { ui.command(action(i)); ui.flash(b, 'pressed', 520); });
    return b;
  });
  pad.append(...buttons); stage.append(pad);
  const labels = [0, 1].map(i => ui.el('span', `player-${i} puzzle-p${i}`)); progress.append(...labels);
  ui.content.append(round, phase, stage, progress);
  ui.keyboard(key => { if (!/^[1-4]$/.test(key)) return false; ui.command(action(Number(key) - 1)); return true; });
  return {
    update(view) {
      ui.update(view); round.textContent = `第 ${Math.min(view.totalRounds, view.round + 1)} / ${view.totalRounds} 轮 · ${view.length} 个音符`;
      const own = view.players[ui.player]; phase.textContent = view.phase === 'show' ? '看清顺序…' : view.phase === 'input' ? own.done ? own.success ? '复现成功，等待对方' : '本轮失误，下一轮继续' : `轮到你了 · 剩余 ${Math.max(0, Math.ceil((view.phaseEndsAt - view.now) / 1000))} 秒` : '准备下一轮';
      const cueKey=view.cue===null?null:`${view.round}:${view.cueIndex}`;if(cueKey&&cueKey!==lastCue&&!context.isPaused?.())context.feedback?.('note'+view.cue);lastCue=cueKey;
      if(lastNoteCount>=0&&own.position>lastNoteCount&&view.phase!=='show')context.feedback?.('note'+own.lastNote);lastNoteCount=own.position;
      buttons.forEach((b, i) => { b.dataset.lit = String(view.cue === i); b.disabled = view.status !== 'playing' || view.phase !== 'input' || own.done; });
      view.players.forEach((p, i) => { labels[i].textContent = `${i === ui.player ? '你' : '对方'}：${p.position}/${view.length}${p.done ? p.success ? ' · 成功' : ' · 本轮结束' : ''}`; });
    }, destroy: ui.destroy
  };
}

function renderTetris(root, send, context) {
  const ui = mount(root, send, context, '← → 移动，↓ 软降，↑ / X 顺时针旋转，Z 逆时针，空格瞬降。触屏用下方按钮。消 2/3/4 行发送 1/2/4 障碍行，落块时先抵消，再接收剩余障碍；对手封顶获胜。');
  const race = ui.el('div', 'puzzle-race puzzle-tetris-race'), grids = [], tiles = [], labels = [], previews = [], chips = [], boards = [], locks=[],sweeps=new Set();
  ui.cleanup(()=>sweeps.forEach(n=>n.remove()));
  const kinds = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  for (let i = 0; i < 2; i++) {
    const box = panel(ui, i, i === ui.player ? 'puzzle-own' : 'puzzle-opponent'), grid = ui.el('div', 'puzzle-tetris-grid'); grid.setAttribute('role', 'img'); grid.setAttribute('aria-label', `${i === ui.player ? '你的' : '对方'}方块棋盘`);
    const cells = Array.from({ length: 200 }, () => ui.el('div', 'puzzle-tetris-cell')); grid.append(...cells); tiles[i] = cells; grids[i] = grid;
    const label = ui.el('p', 'game-note puzzle-board-note'), preview = ui.el('div', 'puzzle-next');
    const chipRow = [0, 1, 2].map(() => ui.el('i', 'puzzle-next-chip'));
    preview.append(...chipRow); chips[i] = chipRow;
    labels[i] = label; previews[i] = preview; boards[i] = null; box.append(grid, label, preview); race.append(box);
  }
  if (ui.player === 1) race.replaceChildren(race.children[1], race.children[0]);
  ui.content.append(race);
  const controls = [['←', { type: 'move', direction: 'left' }, '向左'], ['↺', { type: 'rotate', direction: -1 }, '逆时针旋转'], ['↓', { type: 'move', direction: 'down' }, '向下'], ['↻', { type: 'rotate', direction: 1 }, '顺时针旋转'], ['→', { type: 'move', direction: 'right' }, '向右'], ['⤓ 瞬降', { type: 'drop' }, '瞬间落地']];
  const pad = ui.el('div', 'puzzle-tetris-controls');
  for (const [text, action, label] of controls) { const b = ui.button(text, action, action.type === 'drop' ? 'puzzle-drop' : ''); b.setAttribute('aria-label', label); pad.append(b); }
  ui.controls.append(pad);
  ui.listen(grids[ui.player], 'pointerdown', () => root.focus({ preventScroll: true }));
  ui.keyboard(key => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(key)) { ui.command({ type: 'move', direction: directionKeys[key] }); return true; }
    if (['ArrowUp', 'x', 'X', 'z', 'Z'].includes(key)) { ui.command({ type: 'rotate', direction: ['z', 'Z'].includes(key) ? -1 : 1 }); return true; }
    if (key === ' ') { ui.command({ type: 'drop' }); return true; }
    return false;
  });
  return {
    update(view) {
      ui.update(view);
      view.players.forEach((p, i) => {
        const display = p.board.map(value => ({ value, ghost: false, active: false }));
        for (const [x, y] of p.ghostCells) if (x >= 0 && x < 10 && y >= 0 && y < 20 && !display[y * 10 + x].value) display[y * 10 + x] = { value: kinds.indexOf(p.active.kind) + 1, ghost: true, active: false };
        for (const [x, y] of p.activeCells) if (x >= 0 && x < 10 && y >= 0 && y < 20) display[y * 10 + x] = { value: kinds.indexOf(p.active.kind) + 1, ghost: false, active: true };
        /* 逐列碎裂：找出刚刚被消除的那一行，按列错开延迟播放淡出。 */
        const event=p.lockEvent,newLock=locks[i]!==undefined&&event&&event.number!==locks[i];locks[i]=event?.number||0;
        const cleared = new Set(newLock?event.clearedRows:[]);
        if(newLock&&!ui.reduced){
          for(const y of cleared){const sweep=ui.el('i','puzzle-line-sweep');sweep.style.top=`${y*5}%`;sweep.setAttribute('aria-hidden','true');grids[i].append(sweep);sweeps.add(sweep);ui.animate(sweep,[{opacity:1,transform:'scaleX(.15)'},{opacity:.9,transform:'scaleX(1)',offset:.45},{opacity:0,transform:'scaleX(1.03)'}],350,()=>{sweep.remove();sweeps.delete(sweep);});}
          for(const [x,y] of event.cells)if(y>=0&&y<20&&!cleared.has(y))ui.animate(tiles[i][y*10+x],[{filter:'brightness(1.8)'},{filter:'brightness(1)'}],230);
        }
        boards[i] = [...p.board];
        display.forEach((cell, index) => {
          const node = tiles[i][index], row = Math.floor(index / 10), col = index % 10;
          node.dataset.fill = String(cell.value);
          node.dataset.ghost = String(cell.ghost);
          node.dataset.active = String(cell.active);
          node.dataset.garbage = String(cell.value === 8);
          if (cleared.has(row) && cell.value) { node.style.setProperty('--pz-col', String(col)); ui.flash(node, 'clearing', 820); }
        });
        labels[i].textContent = `${p.lines} 行 · 待接收 ${p.pending} 行${p.alive ? '' : ' · 已封顶'}`;
        chips[i].forEach((chip, k) => { const kind = p.next[k]; chip.textContent = kind || ''; chip.dataset.fill = kind ? String(kinds.indexOf(kind) + 1) : '0'; });
        grids[i].setAttribute('aria-label', `${i === ui.player ? '你的' : '对方'}棋盘，已消 ${p.lines} 行，待接收 ${p.pending} 障碍行，当前 ${p.active.kind} 方块。`);
      });
    }, destroy: ui.destroy
  };
}

export const renderers = { g2048: render2048, sudoku: renderSudoku, quiz: renderQuiz, reaction: renderReaction, typing: renderTyping, simon: renderSimon, tetris: renderTetris };
