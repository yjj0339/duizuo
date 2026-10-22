const path = require('path');
const { chromium } = require('D:/codexAI/.runtime/browser-tools/node_modules/pwcore');

const BASE = process.env.DUO_URL || 'http://127.0.0.1:4380/';
const OUT = path.join(__dirname, '..', 'artifacts', 'shots');
const errors = [];

async function main() {
  const browser = await chromium.launch();
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, locale: 'zh-CN' });
  const page = await desktop.newPage();
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, 'lobby-desktop.png'), fullPage: true });
  await page.screenshot({ path: path.join(OUT, 'lobby-desktop-fold.png') });

  const games = ['gomoku', 'fleet', 'quiz', 'typing', 'simon', 'hockey', 'bomber', 'sudoku', 'tetris', 'slingshot'];
  for (const id of games) {
    await page.evaluate(gameId => window.__DUIZUO__.openLocal(gameId), id);
    await page.waitForTimeout(650);
    await page.screenshot({ path: path.join(OUT, `game-${id}.png`) });
    await page.evaluate(() => document.querySelector('#back').click());
    await page.waitForTimeout(120);
  }
  await desktop.close();

  for (const [label, width, height] of [['390', 390, 844], ['320', 320, 568]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'zh-CN' });
    const mobile = await context.newPage();
    mobile.on('console', message => { if (message.type() === 'error') errors.push(`mobile console: ${message.text()}`); });
    mobile.on('pageerror', error => errors.push(`mobile pageerror: ${error.message}`));
    await mobile.goto(BASE, { waitUntil: 'networkidle' });
    await mobile.waitForTimeout(600);
    await mobile.screenshot({ path: path.join(OUT, `lobby-mobile-${label}.png`), fullPage: false });
    await mobile.evaluate(() => window.__DUIZUO__.openLocal('gomoku'));
    await mobile.waitForTimeout(600);
    await mobile.screenshot({ path: path.join(OUT, `game-mobile-${label}.png`) });
    await context.close();
  }

  await browser.close();
  console.log(errors.length ? errors.join('\n') : 'no browser errors');
}

main().catch(error => { console.error(error); process.exit(1); });