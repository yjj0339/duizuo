(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Sudoku = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ALL = 511;
  const bits = m => { const a = []; for (let n = 1; n <= 9; n++) if (m & (1 << (n - 1))) a.push(n); return a; };
  const count = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
  const rows = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c));
  const cols = Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => r * 9 + c));
  const boxes = Array.from({ length: 9 }, (_, b) => Array.from({ length: 9 }, (_, k) => Math.floor(b / 3) * 27 + b % 3 * 3 + Math.floor(k / 3) * 9 + k % 3));
  const units = [...rows, ...cols, ...boxes];
  const peers = Array.from({ length: 81 }, (_, i) => [...new Set(units.filter(u => u.includes(i)).flat())].filter(j => j !== i));
  const name = i => `第 ${Math.floor(i / 9) + 1} 行第 ${i % 9 + 1} 列`;
  const unitName = u => u < 9 ? `第 ${u + 1} 行` : u < 18 ? `第 ${u - 8} 列` : `第 ${u - 17} 宫`;
  const candidates = board => board.map((v, i) => v ? 0 : peers[i].reduce((m, j) => board[j] ? m & ~(1 << (board[j] - 1)) : m, ALL));
  function valid(board) {
    return Array.isArray(board) && board.length === 81 && board.every(v => Number.isInteger(v) && v >= 0 && v <= 9) && units.every(u => { const a = u.map(i => board[i]).filter(Boolean); return new Set(a).size === a.length; });
  }
  function solve(board, limit = 2) {
    if (!valid(board)) return { count: 0, solution: null, nodes: 0, branches: 0 };
    const b = board.slice(), rm = Array(9).fill(0), cm = Array(9).fill(0), bm = Array(9).fill(0);
    const box = i => Math.floor(i / 27) * 3 + Math.floor(i % 9 / 3);
    b.forEach((v, i) => { if (v) { const bit = 1 << (v - 1); rm[Math.floor(i / 9)] |= bit; cm[i % 9] |= bit; bm[box(i)] |= bit; } });
    let found = 0, solution = null, nodes = 0, branches = 0;
    function search() {
      if (found >= limit) return;
      nodes++;
      let best = -1, mask = 0, size = 10;
      for (let i = 0; i < 81; i++) if (!b[i]) {
        const m = ALL & ~(rm[Math.floor(i / 9)] | cm[i % 9] | bm[box(i)]), c = count(m);
        if (!c) return;
        if (c < size) { best = i; mask = m; size = c; if (c === 1) break; }
      }
      if (best < 0) { found++; if (!solution) solution = b.slice(); return; }
      if (size > 1) branches++;
      const r = Math.floor(best / 9), c = best % 9, x = box(best);
      for (const v of bits(mask)) {
        const bit = 1 << (v - 1); b[best] = v; rm[r] |= bit; cm[c] |= bit; bm[x] |= bit;
        search(); b[best] = 0; rm[r] ^= bit; cm[c] ^= bit; bm[x] ^= bit;
        if (found >= limit) return;
      }
    }
    search(); return { count: found, solution, nodes, branches };
  }
  function logical(board, masks) {
    for (let i = 0; i < 81; i++) if (!board[i] && count(masks[i]) === 1) {
      const value = bits(masks[i])[0];
      return { type: 'place', tier: 1, title: '唯一候选数', index: i, value, focus: [i], reason: `${name(i)} 的同行、同列和同宫已经排除了其他数字，只剩下 ${value}。` };
    }
    for (let u = 0; u < 27; u++) for (let n = 1; n <= 9; n++) {
      const bit = 1 << (n - 1), cells = units[u].filter(i => !board[i] && (masks[i] & bit));
      if (cells.length === 1) return { type: 'place', tier: 2, title: '隐性唯一数', index: cells[0], value: n, focus: units[u], reason: `${unitName(u)} 中，只有${name(cells[0])}可以放入 ${n}，因此这个格子必须是 ${n}。` };
    }
    // Locked candidates: any two intersecting units (pointing and claiming).
    for (let u = 0; u < 27; u++) for (let n = 1; n <= 9; n++) {
      const bit = 1 << (n - 1), cells = units[u].filter(i => masks[i] & bit);
      if (cells.length < 2) continue;
      for (let v = 0; v < 27; v++) if (u !== v && cells.every(i => units[v].includes(i))) {
        const targets = units[v].filter(i => !units[u].includes(i) && (masks[i] & bit));
        if (targets.length) return { type: 'eliminate', tier: 3, title: '区块排除', focus: cells, changes: targets.map(index => ({ index, mask: bit })), reason: `${unitName(u)} 的 ${n} 只能出现在与${unitName(v)}重叠的格子里，所以${unitName(v)}的其他格子可以排除 ${n}。` };
      }
    }
    for (let u = 0; u < 27; u++) {
      const pairCells = units[u].filter(i => count(masks[i]) === 2);
      for (let a = 0; a < pairCells.length; a++) for (let b = a + 1; b < pairCells.length; b++) {
        const i = pairCells[a], j = pairCells[b], m = masks[i];
        if (m !== masks[j]) continue;
        const targets = units[u].filter(k => k !== i && k !== j && (masks[k] & m));
        if (targets.length) return { type: 'eliminate', tier: 4, title: '显性数对', focus: [i, j], changes: targets.map(index => ({ index, mask: m })), reason: `${unitName(u)} 的两个格子只包含 ${bits(m).join('、')}，这两个数字被它们占用，其他格子可以排除这两个候选数。` };
      }
    }
    for (let u = 0; u < 27; u++) for (let a = 1; a < 9; a++) for (let b = a + 1; b <= 9; b++) {
      const am = 1 << (a - 1), bm = 1 << (b - 1), ac = units[u].filter(i => masks[i] & am), bc = units[u].filter(i => masks[i] & bm);
      if (ac.length === 2 && bc.length === 2 && ac.every(i => bc.includes(i))) {
        const m = am | bm, changes = ac.filter(i => masks[i] & ~m).map(index => ({ index, mask: masks[index] & ~m }));
        if (changes.length) return { type: 'eliminate', tier: 4, title: '隐性数对', focus: ac, changes, reason: `${unitName(u)} 的 ${a} 和 ${b} 都只能放在这两个格子里，所以这两个格子的其他候选数可以删除。` };
      }
    }
    for (let orientation = 0; orientation < 2; orientation++) {
      const lines = orientation ? cols : rows, crosses = orientation ? rows : cols;
      for (let n = 1; n <= 9; n++) for (let a = 0; a < 8; a++) {
        const bit = 1 << (n - 1), ac = lines[a].filter(i => masks[i] & bit);
        if (ac.length !== 2) continue;
        const coords = ac.map(i => orientation ? Math.floor(i / 9) : i % 9);
        for (let b = a + 1; b < 9; b++) {
          const bc = lines[b].filter(i => masks[i] & bit);
          if (bc.length !== 2 || !bc.every(i => coords.includes(orientation ? Math.floor(i / 9) : i % 9))) continue;
          const focus = [...ac, ...bc], targets = coords.flatMap(k => crosses[k]).filter(i => !focus.includes(i) && (masks[i] & bit));
          if (targets.length) return { type: 'eliminate', tier: 5, title: 'X-Wing 矩形排除', focus, changes: targets.map(index => ({ index, mask: bit })), reason: `数字 ${n} 在两条${orientation ? '列' : '行'}中形成四角矩形，必定占据对角线，所以对应${orientation ? '行' : '列'}中的其他格子可排除 ${n}。` };
        }
      }
    }
    return null;
  }
  function next(board, solution) {
    const wrong = solution ? board.findIndex((v, i) => v && v !== solution[i]) : -1;
    if (wrong >= 0) return { type: 'repair', tier: 0, title: '先修正这一步', index: wrong, value: 0, focus: [wrong], reason: `${name(wrong)} 的数字与本题的唯一解不一致。先清除它，我们再继续推理。` };
    const masks = candidates(board), chain = [];
    for (let k = 0; k < 160; k++) {
      const step = logical(board, masks);
      if (!step) break;
      if (step.type === 'place') return { ...step, chain, title: chain.length ? `${chain[chain.length - 1].title} → ${step.title}` : step.title, reason: [...chain.map(s => s.reason), step.reason].join('\n\n'), tier: Math.max(step.tier, ...chain.map(s => s.tier)) };
      chain.push(step); step.changes.forEach(c => masks[c.index] &= ~c.mask);
    }
    const result = solve(board, 1);
    if (!result.solution) return null;
    let index = -1, size = 10;
    for (let i = 0; i < 81; i++) if (!board[i] && count(masks[i]) < size) { index = i; size = count(masks[i]); }
    if (index < 0) return null;
    return { type: 'place', tier: 6, title: '大师推演 · 分支验证', index, value: result.solution[index], focus: [index], chain, reason: `基础与进阶排除暂时无法继续。AI 对${name(index)}的候选数 ${bits(masks[index]).join('、')} 进行分支搜索，沿每条分支检查整盘约束，确认唯一解中这里是 ${result.solution[index]}。这一步使用搜索验证。` };
  }
  function rate(board) {
    const b = board.slice(); let masks = candidates(b), tier = 1, effort = 0, eliminations = 0;
    for (let k = 0; k < 500 && b.includes(0); k++) {
      const step = logical(b, masks);
      if (!step) { const s = solve(b, 2); return { tier: 6, effort, branches: s.branches, score: 600000 + s.branches * 100 + b.filter(v => !v).length * 10 + effort }; }
      tier = Math.max(tier, step.tier); effort += step.tier * step.tier;
      if (step.type === 'place') { b[step.index] = step.value; masks[step.index] = 0; peers[step.index].forEach(i => masks[i] &= ~(1 << (step.value - 1))); }
      else { eliminations++; step.changes.forEach(c => masks[c.index] &= ~c.mask); }
    }
    return { tier, effort, branches: 0, eliminations, score: tier * 100000 + effort * 10 + board.filter(v => !v).length };
  }
  function random(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let a = Math.imul(t ^ t >>> 15, 1 | t); a ^= a + Math.imul(a ^ a >>> 7, 61 | a); return ((a ^ a >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(a, rng) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function generate(seed, clues = 30) {
    const rng = random(seed), b = Array(81).fill(0);
    function fill() {
      const masks = candidates(b); let index = -1, size = 10;
      for (let i = 0; i < 81; i++) if (!b[i]) { const c = count(masks[i]); if (!c) return false; if (c < size) { index = i; size = c; } }
      if (index < 0) return true;
      for (const n of shuffle(bits(masks[index]), rng)) { b[index] = n; if (fill()) return true; }
      b[index] = 0; return false;
    }
    fill(); const solution = b.slice(); let left = 81;
    for (const i of shuffle(Array.from({ length: 81 }, (_, k) => k), rng)) {
      if (left <= clues) break;
      const old = b[i]; b[i] = 0;
      if (solve(b, 2).count !== 1) b[i] = old; else left--;
    }
    return { puzzle: b.join(''), solution: solution.join(''), clues: left };
  }
  return { bits, count, rows, cols, boxes, units, peers, name, candidates, valid, solve, logical, next, rate, random, shuffle, generate };
});
