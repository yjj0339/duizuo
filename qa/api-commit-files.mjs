// 通过 Git Data API 只提交指定文件到远端分支（本地 git 网络不通时的通道）
// 用法: node qa/api-commit-files.mjs <branch> <相对路径...>
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const gh = 'D:/codexAI/.runtime/github-cli/gh.exe';
const env = { ...process.env, GH_CONFIG_DIR: 'D:/codexAI/.runtime/github-config' };
const REPO = 'yjj0339/duizuo';
const CWD = 'D:/codexAI/duizuo';

function api(args, input) {
  return execFileSync(gh, ['api', ...args], { env, encoding: 'utf8', maxBuffer: 1 << 26, input: input ? JSON.stringify(input) : undefined }).trim();
}

const branch = process.argv[2] || 'main';
const paths = process.argv.slice(3);
const parent = api(['repos/' + REPO + '/git/ref/heads/' + branch, '--jq', '.object.sha']);
const baseTree = api(['repos/' + REPO + '/git/commits/' + parent, '--jq', '.tree.sha']);

const entries = [];
for (const p of paths) {
  const blob = api(['repos/' + REPO + '/git/blobs', '--method', 'POST', '--input', '-'],
    { content: readFileSync(`${CWD}/${p}`).toString('base64'), encoding: 'base64' });
  entries.push({ path: p, mode: '100644', type: 'blob', sha: JSON.parse(blob).sha });
  console.log(`  blob ${JSON.parse(blob).sha.slice(0, 8)}  ${p}`);
}
const tree = JSON.parse(api(['repos/' + REPO + '/git/trees', '--method', 'POST', '--input', '-'],
  { base_tree: baseTree, tree: entries })).sha;
const commit = JSON.parse(api(['repos/' + REPO + '/git/commits', '--method', 'POST', '--input', '-'],
  { message: 'chore: refresh public endpoint for ' + new Date().toISOString().slice(0, 19).replace('T', ' '), tree, parents: [parent] })).sha;
api(['repos/' + REPO + '/git/refs/heads/' + branch, '--method', 'PATCH', '--input', '-'], { sha: commit, force: false });
console.log(`✔ ${REPO}@${branch} -> ${commit.slice(0, 10)}`);

