// 通过 Git Data API 发布站点到 gh-pages 分支（git over https 不可用时的通道）
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const gh = 'D:/codexAI/.runtime/github-cli/gh.exe';
const env = { ...process.env, GH_CONFIG_DIR: 'D:/codexAI/.runtime/github-config' };
const REPO = 'yjj0339/duizuo';
const DIST = 'D:/codexAI/duizuo/dist';

function api(args, input) {
  const out = execFileSync(gh, ['api', ...args], { env, encoding: 'utf8', maxBuffer: 1 << 26, input: input ? JSON.stringify(input) : undefined });
  return out.trim();
}
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

// 1) 收集要发布的文件
const files = [...walk(DIST)].map(p => relative(DIST, p).split('\\').join('/'));
const entries = [];
for (const f of files) {
  const blob = api(['repos/' + REPO + '/git/blobs', '--method', 'POST', '--input', '-'],
    { content: readFileSync(join(DIST, f)).toString('base64'), encoding: 'base64' });
  entries.push({ path: f, mode: '100644', type: 'blob', sha: JSON.parse(blob).sha });
}
console.log(`上传 ${entries.length} 个文件`);

// 2) 找出旧分支上要删掉的旧资源
const ref = api(['repos/' + REPO + '/git/ref/heads/gh-pages', '--jq', '.object.sha']);
const oldTree = api(['repos/' + REPO + '/git/commits/' + ref, '--jq', '.tree.sha']);
const oldList = JSON.parse(api(['repos/' + REPO + '/git/trees/' + oldTree + '?recursive=1'])).tree || [];
const newSet = new Set(files);
for (const e of oldList) {
  if (e.type === 'blob' && !newSet.has(e.path)) { entries.push({ path: e.path, mode: '100644', type: 'blob', sha: null }); console.log('  移除旧资源 ' + e.path); }
}

// 3) 提交并更新分支
const tree = JSON.parse(api(['repos/' + REPO + '/git/trees', '--method', 'POST', '--input', '-'],
  { base_tree: oldTree, tree: entries })).sha;
const commit = JSON.parse(api(['repos/' + REPO + '/git/commits', '--method', 'POST', '--input', '-'],
  { message: 'Publish ' + new Date().toISOString().slice(0, 19).replace('T', ' ') + ' 对座 DUIZUO', tree, parents: [ref] })).sha;
api(['repos/' + REPO + '/git/refs/heads/gh-pages', '--method', 'PATCH', '--input', '-'], { sha: commit, force: true });
console.log(`✔ gh-pages 已更新到 ${commit.slice(0, 10)}`);

// 4) 触发 Pages 重建
console.log('触发 Pages 重建: ' + api(['-X', 'POST', 'repos/' + REPO + '/pages/builds']));



