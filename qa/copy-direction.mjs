// 确认"复制方向"和"部署是否互相顶替"
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import * as fs from 'node:fs';

const git = 'D:/codexAI/.toolchains/git/cmd/git.exe';
const run = (args, cwd) => {
  try { return execFileSync(git, args, { cwd, encoding: 'utf8', maxBuffer: 1 << 24 }).trim(); }
  catch (e) { return 'ERR: ' + ((e.stderr || e.stdout || e.message) + '').slice(0, 160); }
};

const dirs = [
  'D:/codexAI/duizuo',
  'D:/codexAI/duizuo-a',
  'D:/codexAI/peachmint-duo',
  'D:/codexAI/duizuo-visual-v2-backup-20261021',
];

for (const d of dirs) {
  const name = d.split('/').pop();
  const hasGit = existsSync(`${d}/.git`);
  const remote = hasGit ? run(['remote', '-v'], d).split('\n')[0] : '(无 .git)';
  const head = hasGit ? run(['log', '--format=%h %ad %an %s', '--date=format:%m-%d %H:%M', '-1'], d) : '-';
  const mtime = existsSync(d) ? new Date(statSync(d).mtimeMs).toLocaleString('zh-CN') : '-';
  const pkg = existsSync(`${d}/package.json`)
    ? (() => { try { return JSON.parse(require('fs').readFileSync(`${d}/package.json`, 'utf8')); } catch { return {}; } })() : {};
  console.log(`\n【${name}】`);
  console.log(`  目录 mtime : ${mtime}`);
  console.log(`  git remote : ${remote || '(无)'}`);
  console.log(`  最近提交   : ${head}`);
  console.log(`  package    : name=${pkg.name || '?'} version=${pkg.version || '?'}`);
}

