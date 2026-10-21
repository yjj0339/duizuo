// 幂等地把"结算帧必须推送"的修复写回 server/rooms.js。
// 其它工具可能并发改写这个文件，所以先检测再改，改完立刻校验。
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'server/rooms.js';
let text = readFileSync(file, 'utf8');

if (text.includes('return changed;')) {
  console.log('already patched');
  process.exit(0);
}

const before = `  tick(dt){
    const now=this.clock();for(const room of this.rooms.values()){`;
const after = `  tick(dt){
    // 返回 true 表示本帧有对局刚刚结束，调用方必须立刻推送最终状态，
    // 否则由超时或引擎判定结束的对局，客户端会永远停在"进行中"的旧快照上。
    const now=this.clock();let changed=false;
    for(const room of this.rooms.values()){`;

if (!text.includes(before)) {
  console.error('ANCHOR MISSING: tick 开头与预期不符');
  process.exit(1);
}
text = text.replace(before, after);

const pairs = [
  [
    `this.rooms.delete(room.code);continue;}`,
    `this.rooms.delete(room.code);changed=true;continue;}`,
  ],
  [
    `if(room.game.status==='finished')this.finish(room,now);
    }
  }`,
    `if(room.game.status==='finished'){this.finish(room,now);changed=true;}
    }
    return changed;
  }`,
  ],
];

for (const [from, to] of pairs) {
  if (!text.includes(from)) {
    console.error('ANCHOR MISSING:', from.slice(0, 50));
    process.exit(1);
  }
  text = text.replace(from, to);
}

writeFileSync(file, text, 'utf8');

const check = readFileSync(file, 'utf8');
if (!check.includes('return changed;') || !check.includes('changed=true;')) {
  console.error('PATCH VERIFY FAILED');
  process.exit(1);
}
console.log('patched and verified');
