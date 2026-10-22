// 重试式 GitHub 操作
import { execFileSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const gh = 'D:/codexAI/.runtime/github-cli/gh.exe';
const env = { ...process.env, GH_CONFIG_DIR: 'D:/codexAI/.runtime/github-config' };

async function retry(label, args, tries = 8) {
  for (let i = 1; i <= tries; i++) {
    try {
      const out = execFileSync(gh, args, { env, encoding: 'utf8', maxBuffer: 1 << 24 });
      console.log(`✔ ${label} (第 ${i} 次尝试)\n${out.trim()}`);
      return out.trim();
    } catch (e) {
      const msg = ((e.stderr || e.stdout || e.message) + '').trim().slice(0, 160);
      console.log(`  · ${label} 第 ${i} 次失败: ${msg}`);
      if (i < tries) await sleep(4000 * i);
    }
  }
  console.log(`✖ ${label} 全部重试失败`);
  return null;
}

const action = process.argv[2];
if (action === 'rename') {
  await retry('仓库改名 duizuo → duizuo', ['api', '-X', 'PATCH', 'repos/yjj0339/duizuo', '-f', 'name=duizuo']);
  await retry('确认新仓库', ['api', 'repos/yjj0339/duizuo', '--jq', '.full_name + " " + .html_url']);
  await retry('Pages 配置', ['api', 'repos/yjj0339/duizuo/pages', '--jq', '.html_url + " build_type=" + .build_type + " src=" + .source.branch']);
} else if (action === 'check') {
  await retry('新仓库', ['api', 'repos/yjj0339/duizuo', '--jq', '.full_name']);
  await retry('新 Pages', ['api', 'repos/yjj0339/duizuo/pages', '--jq', '.html_url']);
}
