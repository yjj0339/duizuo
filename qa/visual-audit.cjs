/* DUIZUO · 可视化验收
   逐款打开 20 款游戏，桌面 + 移动两种视口截图，并自动检测：
   1) 控制台报错
   2) 横向溢出（内容宽于视口）
   3) 深色主题回退（大面积深色背景）
   4) 触控目标小于 42px
   用法：node qa/visual-audit.cjs   （需先启动本地服务，默认 4387）
*/
const path = require('path');
const fs = require('fs');
const { chromium } = require('D:/codexAI/.runtime/browser-tools/node_modules/pwcore');

const BASE = process.env.DUO_URL || 'http://127.0.0.1:4387/';
const OUT = path.join(__dirname, '..', 'artifacts', 'audit');
const GAMES = [
  'gomoku', 'fleet', 'dots', 'memory', 'hockey', 'tanks', 'bomber', 'snake',
  'tetris', 'slingshot', 'maze', 'quiz', 'g2048', 'sudoku', 'reversi', 'rps',
  'reaction', 'mines', 'typing', 'simon',
];

/* 深色回退检测：统计视口内面积可观的深色背景元素 */
const DARK_PROBE = () => {
  const offenders = [];
  const vw = innerWidth, vh = innerHeight;
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) return;
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return;
    const s = getComputedStyle(el);
    const m = s.backgroundColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    if (!m) return;
    const a = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (a < 0.55) return;
    const lum = (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
    if (lum > 0.42) return;
    const area = (Math.min(r.right, vw) - Math.max(r.left, 0)) * (Math.min(r.bottom, vh) - Math.max(r.top, 0));
    if (area > vw * vh * 0.12) {
      offenders.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} bg=${s.backgroundColor}`);
    }
  });
  return offenders;
};

const TOUCH_PROBE = () => {
  const small = [];
  document.querySelectorAll('button, a, input, select, [role="button"]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.height < 42 && r.width < 42) {
      small.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  });
  return [...new Set(small)];
};

async function auditViewport(browser, label, viewport, isMobile) {
  const context = await browser.newContext({
    viewport, deviceScaleFactor: isMobile ? 2 : 1,
    isMobile, hasTouch: isMobile, locale: 'zh-CN',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${label}] console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${label}] pageerror: ${e.message}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const report = { label, games: {}, overflow: [], dark: [], small: [] };

  report.overflow.push(...await page.evaluate(() => {
    const bad = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) bad.push(`lobby scrollWidth=${document.documentElement.scrollWidth} > ${innerWidth}`);
    return bad;
  }));

  for (const id of GAMES) {
    await page.evaluate(g => window.__DUIZUO__.openLocal(g), id);
    await page.waitForTimeout(520);
    await page.screenshot({ path: path.join(OUT, `${label}-${id}.png`) });
    const overflow = await page.evaluate(() => {
      const bad = [];
      if (document.documentElement.scrollWidth > innerWidth + 1) {
        bad.push(`scrollWidth=${document.documentElement.scrollWidth} > ${innerWidth}`);
      }
      return bad;
    });
    const dark = await page.evaluate(DARK_PROBE);
    const small = await page.evaluate(TOUCH_PROBE);
    report.games[id] = { overflow, dark, small };
    await page.evaluate(() => document.querySelector('#back')?.click());
    await page.waitForTimeout(140);
  }

  await context.close();
  return { report, errors };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const all = { games: {}, errors: [] };
  for (const [label, viewport, mobile] of [
    ['desktop', { width: 1440, height: 1000 }, false],
    ['m390', { width: 390, height: 844 }, true],
    ['m320', { width: 320, height: 568 }, true],
  ]) {
    const { report, errors } = await auditViewport(browser, label, viewport, mobile);
    all.games[label] = report.games;
    all.errors.push(...errors);
  }
  await browser.close();

  const problems = [];
  for (const [label, games] of Object.entries(all.games)) {
    for (const [id, r] of Object.entries(games)) {
      if (r.overflow.length) problems.push(`${label}/${id} 横向溢出: ${r.overflow.join(', ')}`);
      if (r.dark.length) problems.push(`${label}/${id} 深色回退: ${r.dark.slice(0, 3).join(' | ')}`);
      if (r.small.length) problems.push(`${label}/${id} 触控目标过小: ${r.small.slice(0, 5).join(', ')}`);
    }
  }
  const report = [
    `DUIZUO 可视化验收 · ${new Date().toISOString()}`,
    `视口: desktop 1440x1000 / m390 390x844 / m320 320x568`,
    `游戏数量: ${GAMES.length}`,
    ``,
    `控制台错误: ${all.errors.length ? all.errors.join('\n') : '无'}`,
    ``,
    `问题: ${problems.length ? problems.join('\n') : '无'}`,
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'report.txt'), report, 'utf8');
  console.log(report);
  console.log('\n截图目录: ' + OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
