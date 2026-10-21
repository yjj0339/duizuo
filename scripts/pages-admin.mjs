// 诊断并刷新 GitHub Pages 部署
import { execFileSync } from 'node:child_process';

const gh = 'D:/codexAI/.runtime/github-cli/gh.exe';
const env = { ...process.env, GH_CONFIG_DIR: 'D:/codexAI/.runtime/github-config' };

function api(args) {
  try {
    return execFileSync(gh, ['api', ...args], { env, encoding: 'utf8', maxBuffer: 1 << 24 });
  } catch (e) {
    return `ERR: ${(e.stderr || e.stdout || e.message).toString().slice(0, 300)}`;
  }
}

const mode = process.argv[2] || 'inspect';

if (mode === 'inspect') {
  console.log('--- pages config ---');
  console.log(api(['repos/yjj0339/duo-play/pages']));
  console.log('--- built-in workflow runs ---');
  const runs = api(['repos/yjj0339/duo-play/actions/workflows/391801731/runs?per_page=4']);
  try {
    const data = JSON.parse(runs);
    for (const r of data.workflow_runs || []) {
      console.log(`${r.status} ${r.created_at} ${r.head_sha.slice(0, 8)} event=${r.event} conclusion=${r.conclusion}`);
    }
  } catch { console.log(runs.slice(0, 400)); }
  console.log('--- recent deployments ---');
  const dep = api(['repos/yjj0339/duo-play/deployments?per_page=4']);
  try {
    const data = JSON.parse(dep);
    for (const d of data) console.log(`${d.created_at} ${d.sha.slice(0, 8)} ${d.ref} ${d.environment}`);
  } catch { console.log(dep.slice(0, 400)); }
}

if (mode === 'legacy') {
  console.log(api(['-X', 'PUT', 'repos/yjj0339/duo-play/pages', '-f', 'build_type=legacy', '-f', 'source[branch]=gh-pages', '-f', 'source[path]=/']));
}

if (mode === 'workflow') {
  console.log(api(['-X', 'PUT', 'repos/yjj0339/duo-play/pages', '-f', 'build_type=workflow']));
}
