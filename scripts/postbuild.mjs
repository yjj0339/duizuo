// 构建后处理：把当前对战服务地址与 .nojekyll 一起放进 dist，
// 避免任何一次 vite build 把发布所需的这两个文件冲掉。
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {release} from '../shared/release.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) { console.log('dist 不存在，跳过'); process.exit(0); }

const endpoint = join(root, 'runtime-endpoint.json');
if (existsSync(endpoint)) {
  copyFileSync(endpoint, join(dist, 'runtime-endpoint.json'));
  console.log('✔ 已复制 runtime-endpoint.json 到 dist');
}
writeFileSync(join(dist, '.nojekyll'), '');
writeFileSync(join(dist, 'version.json'), JSON.stringify(release));
console.log('✔ 已生成 dist/.nojekyll');
