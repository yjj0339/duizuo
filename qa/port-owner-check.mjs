// 查证：三个 AI 是否挤占了/覆盖了本机其它项目
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const run = (bin, args, cwd) => {
  try { return execFileSync(bin, args, { encoding: 'utf8', maxBuffer: 1 << 24 }).trim(); }
  catch (e) { return 'ERR: ' + ((e.stderr || e.stdout || e.message) + '').slice(0, 200); }
};

console.log('=== 5173 / 4390 上的进程分别是谁 ===');
for (const pid of ['49532', '73944']) {
  const cmd = run('wmic', ['process', 'where', `ProcessId=${pid}`, 'get', 'ExecutablePath,CommandLine', '/format:list'], 'C:/Windows/System32');
  console.log(`--- PID ${pid} ---`);
  console.log(cmd.split('\n').filter(l => l.trim()).slice(0, 4).join('\n'));
}

console.log('\n=== 5173 实际在提供什么站点 ===');
try {
  const r = await fetch('http://127.0.0.1:5173/', { signal: AbortSignal.timeout(6000) });
  const html = await r.text();
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '(无 title)';
  const body = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  console.log(`  HTTP ${r.status}  title=${title}`);
  console.log(`  首屏文本: ${body}`);
} catch (e) { console.log('  读取失败: ' + e.message); }

console.log('\n=== 本机其它项目目录在最近 24 小时被改动的文件（排除 duizuo 自身） ===');
const root = 'D:/codexAI';
const cutoff = Date.now() - 24 * 3600 * 1000;
const hits = [];
for (const name of readdirSync(root)) {
  if (name === 'duizuo' || name.startsWith('.')) continue;
  const dir = join(root, name);
  let st;
  try { st = statSync(dir); } catch { continue; }
  if (!st.isDirectory()) continue;
  // 只看顶层几个常见会被部署脚本写入的位置
  for (const sub of ['', 'runtime', 'dist', 'public']) {
    const target = sub ? join(dir, sub) : dir;
    let s2;
    try { s2 = statSync(target); } catch { continue; }
    if (s2.mtimeMs > cutoff) hits.push(`${target}  ${new Date(s2.mtimeMs).toISOString()}`);
  }
}
if (!hits.length) console.log('  没有其它项目目录在 24 小时内被改动');
else hits.forEach(h => console.log('  ' + h));
