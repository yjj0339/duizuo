// 查证"部署是否覆盖/代替了别的东西"
import { execFileSync } from 'node:child_process';

const git = 'D:/codexAI/.toolchains/git/cmd/git.exe';
const gh = 'D:/codexAI/.runtime/github-cli/gh.exe';
const env = { ...process.env, GH_CONFIG_DIR: 'D:/codexAI/.runtime/github-config' };
const run = (bin, args, cwd) => {
  try { return execFileSync(bin, args, { env, cwd, encoding: 'utf8', maxBuffer: 1 << 24 }).trim(); }
  catch (e) { return 'ERR: ' + ((e.stderr || e.stdout || e.message) + '').slice(0, 200); }
};

const CWD = 'D:/codexAI/duizuo';

console.log('=== 1) 每个作者的提交是否都还在 origin/main（有无被覆盖丢失） ===');
const log = run(git, ['log', '--format=%h|%an|%s', 'origin/main', '-30'], CWD);
for (const line of log.split('\n')) {
  if (!line.trim()) continue;
  const [sha, author, subject] = line.split('|');
  if (author === 'DUIZUO Owner') continue;
  const ok = run(git, ['merge-base', '--is-ancestor', sha, 'origin/main'], CWD).startsWith('ERR') ? '丢失' : '在  ';
  console.log(`  ${ok} ${sha} ${author.padEnd(16)} ${subject.slice(0, 56)}`);
}

console.log('\n=== 2) yjj0339 账号下的仓库（查同名 / Pages 冲突） ===');
const repos = run(gh, ['repo', 'list', 'yjj0339', '--limit', '80', '--json', 'name,visibility,homepageUrl,updatedAt', '--jq', '.[] | "\\(.visibility)\\t\\(.name)\\t\\(.homepageUrl // "-")\\t\\(.updatedAt)"'], CWD);
console.log(repos);

console.log('\n=== 3) 用户级 Pages 站点 ===');
console.log(run(gh, ['api', 'users/yjj0339/pages'], CWD).slice(0, 400));

console.log('\n=== 4) 本机 4387/4390/5173 等端口的占用者 ===');
for (const port of ['4387', '4390', '4380', '5173']) {
  const out = run('netstat', ['-ano', '-p', 'TCP'], 'C:/Windows/System32')
    .split('\n').filter(l => l.includes(':' + port + ' ') && l.includes('LISTENING'));
  console.log(`  ${port}: ${out.length ? out.map(s => s.trim().split(/\s+/).pop()).join(',') : '空闲'}`);
}
