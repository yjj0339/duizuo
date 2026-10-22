// 比对 duizuo 与同机其他副本的内容指纹
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const files = [
  'client/style.css', 'client/art.js', 'client/main.js', 'shared/catalog.js',
  'games/board-views.js', 'games/arcade-views.js', 'games/puzzle-views.js',
  'server/rooms.js', 'server/index.js', 'vite.config.js', 'index.html',
];
const roots = [
  'D:/codexAI/duizuo',
  'D:/codexAI/duizuo-a',
  'D:/codexAI/peachmint-duo',
  'D:/codexAI/duizuo-visual-v2-backup-20261021',
];

const hash = f => { try { return createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 10); } catch { return null; } };

for (const f of files) {
  const marks = roots.map(r => {
    const h = hash(`${r}/${f}`);
    return h ? h : '—';
  });
  const present = marks.filter(m => m !== '—');
  const same = new Set(present).size === 1 && present.length > 1;
  console.log(`${same ? '完全相同' : '不同    '} ${f.padEnd(26)} ${roots.map((r, i) => `${r.split('/').pop()}:${marks[i]}`).join('  ')}`);
}

console.log('\n=== peachmint-duo 目录概览 ===');
for (const r of ['D:/codexAI/peachmint-duo', 'D:/codexAI/duizuo-a']) {
  console.log(`--- ${r} ---`);
  for (const sub of ['', 'client', 'games', 'server', 'docs']) {
    const p = `${r}/${sub}`;
    if (!existsSync(p)) continue;
    try {
      const { readdirSync } = await import('node:fs');
      console.log(`  ${sub || './'}: ${readdirSync(p).slice(0, 14).join(', ')}`);
    } catch {}
  }
}
