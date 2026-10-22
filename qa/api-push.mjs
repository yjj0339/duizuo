// 用 Git Data API 推送本地提交（当 git over https 不可用时的替代通道）
// 用法: node qa/api-push.mjs <localCommit> <branch>
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const gh = 'D:/codexAI/.runtime/github-cli/gh.exe';
const git = 'D:/codexAI/.toolchains/git/cmd/git.exe';
const env = { ...process.env, GH_CONFIG_DIR: 'D:/codexAI/.runtime/github-config' };
const REPO = 'yjj0339/duizuo';

function api(args, input) {
  const out = execFileSync(gh, ['api', ...args], {
    env, encoding: 'utf8', maxBuffer: 1 << 26,
    input: input ? JSON.stringify(input) : undefined,
  });
  return out.trim();
}
function gitOut(args, cwd) {
  return execFileSync(git, args, { cwd, encoding: 'utf8', maxBuffer: 1 << 26 }).trim();
}

const localSha = process.argv[2];
const branch = process.argv[3] || 'main';
const CWD = 'D:/codexAI/duizuo';

const localParent = gitOut(['rev-parse', `${localSha}^`], CWD);
const remoteSha = api(['repos/' + REPO + '/git/ref/heads/' + branch, '--jq', '.object.sha']);
if (localParent !== remoteSha) {
  console.log(`✖ 本地基点与远端不一致\n  本地父提交 ${localParent}\n  远端 HEAD  ${remoteSha}`);
  process.exit(1);
}

const changed = gitOut(['diff', '--name-status', '-z', localParent, localSha], CWD)
  .split('\0').filter(Boolean);
const entries = [];
for (let i = 0; i < changed.length; i += 2) {
  const status = changed[i], path = changed[i + 1];
  if (status.startsWith('D')) { entries.push({ path, mode: '100644', type: 'blob', sha: null }); continue; }
  let content = readFileSync(`${CWD}/${path}`);
  if (status.startsWith('R')) { i += 1; }  // 跳过旧路径
  const blob = api(['repos/' + REPO + '/git/blobs', '--method', 'POST', '--input', '-'],
    { content: content.toString('base64'), encoding: 'base64' });
  const sha = JSON.parse(blob).sha;
  entries.push({ path, mode: '100644', type: 'blob', sha });
  console.log(`  blob ${sha.slice(0, 8)}  ${path}`);
}

const baseTree = api(['repos/' + REPO + '/git/commits/' + localParent, '--jq', '.tree.sha']);
const tree = JSON.parse(api(['repos/' + REPO + '/git/trees', '--method', 'POST', '--input', '-'],
  { base_tree: baseTree, tree: entries })).sha;
console.log(`tree ${tree.slice(0, 10)}`);

const message = gitOut(['log', '-1', '--format=%s', localSha], CWD);
const commitSha = JSON.parse(api(['repos/' + REPO + '/git/commits', '--method', 'POST', '--input', '-'],
  { message, tree, parents: [localParent] })).sha;
console.log(`commit ${commitSha.slice(0, 10)}  ${message}`);

api(['repos/' + REPO + '/git/refs/heads/' + branch, '--method', 'PATCH', '--input', '-'],
  { sha: commitSha, force: false });
console.log(`✔ 已推送到 ${REPO}@${branch}  ${commitSha.slice(0, 10)}`);


