// 全量改名：DUIZUO · 面对面的小游戏  →  对座 DUIZUO · 面对面的小游戏
// 有序替换表，长串优先，逐条校验。
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = 'D:/codexAI/duizuo';
const SKIP = new Set(['node_modules', 'dist', 'runtime', 'artifacts', '.git']);

// [模式, 替换成] —— 顺序敏感，靠前的先做
const RULES = [
  // —— 仓库 / 路径 ——
  ['yjj0339/duizuo', 'yjj0339/duizuo'],
  ['yjj0339.github.io/duizuo', 'yjj0339.github.io/duizuo'],
  ['D:/codexAI/duizuo', 'D:/codexAI/duizuo'],
  ['D:\\codexAI\\duizuo', 'D:\\codexAI\\duizuo'],
  ['duizuo.sqlite', 'duizuo.sqlite'],
  // —— 界面品牌 ——
  ['对座<span>DUIZUO</span><small>面对面的小游戏</small>', '对座<span>DUIZUO</span><small>面对面的小游戏</small>'],
  ['aria-label="对座 首页"', 'aria-label="对座 首页"'],
  ['面对面坐好，一局好游戏 <span>♡</span> DUIZUO', '面对面坐好，一局好游戏 <span>♡</span> DUIZUO'],
  ['<h2>对座房间</h2>', '<h2>对座房间</h2>'],
  ['面对面', '面对面'],
  ['TWO SEATS · ONE GAME', 'TWO SEATS · ONE GAME'],
  ['面对面的小游戏', '面对面的小游戏'],
  ['DUIZUO', 'DUIZUO'],
  ['DUIZUO', 'DUIZUO'],
  // —— 内部标识 ——
  ["'duizuo:'+k", "'duizuo:'+k"],
  ['"duizuo:"+k', '"duizuo:"+k'],
  ['window.__DUIZUO__', 'window.__DUIZUO__'],
  ['__DUIZUO__', '__DUIZUO__'],
  // —— 目录 / 包名 ——
  ['duizuo', 'duizuo'],
  ['duizuo', 'duizuo'],
];

const EXT = new Set(['.js', '.mjs', '.cjs', '.ps1', '.json', '.md', '.html', '.css', '.yml', '.yaml', '.cmd', '.txt']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (EXT.has(extname(name))) yield p;
  }
}

const changed = [];
for (const file of walk(ROOT)) {
  const before = readFileSync(file, 'utf8');
  let text = before;
  for (const [from, to] of RULES) text = text.split(from).join(to);
  if (text !== before) {
    writeFileSync(file, text, 'utf8');
    changed.push([file.replace(ROOT + '/', ''), (before.length - text.length)]);
  }
}
console.log(`已改写 ${changed.length} 个文件：`);
for (const [f, d] of changed) console.log(`  ${f}  (${d > 0 ? '-' : '+'}${Math.abs(d)} 字符)`);
