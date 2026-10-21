// 幂等地把 owner 的两处服务端修复写回源码（正则匹配，兼容 CRLF / LF）。
// 同一工作区里可能有其它 agent 临时替换 server/ 下的文件来回比较，
// 因此这里做成可重复执行 + 改完自校验的补丁脚本。
import { readFileSync, writeFileSync } from 'node:fs';

function patch(file, rules) {
  let text = readFileSync(file, 'utf8');
  let changed = false;
  for (const { from, to, verify } of rules) {
    if (verify && text.includes(verify)) continue;
    const re = new RegExp(from, 'm');
    if (!re.test(text)) {
      console.error(`ANCHOR MISSING in ${file}: ${from}`);
      process.exit(1);
    }
    text = text.replace(re, to);
    changed = true;
  }
  if (changed) writeFileSync(file, text, 'utf8');
  const check = readFileSync(file, 'utf8');
  for (const { verify } of rules) {
    if (verify && !check.includes(verify)) {
      console.error(`VERIFY FAILED in ${file}: ${verify}`);
      process.exit(1);
    }
  }
  console.log(`${file}: ${changed ? 'patched' : 'already ok'}`);
}

// 1) rooms.js：tick 报告"本帧有对局结束"，调用方据此立刻推送最终快照
patch('server/rooms.js', [
  {
    from: '^  tick\\(dt\\)\\{\\r?\\n    const now=this\\.clock\\(\\);for\\(const room of this\\.rooms\\.values\\(\\)\\)\\{',
    to: '  tick(dt){\n    // 返回 true 表示本帧有对局刚刚结束，调用方必须立刻推送最终状态，\n    // 否则由超时或引擎判定结束的对局，客户端会永远停在"进行中"的旧快照上。\n    const now=this.clock();let changed=false;\n    for(const room of this.rooms.values()){',
    verify: 'let changed=false;',
  },
  {
    from: 'this\\.rooms\\.delete\\(room\\.code\\);continue;\\}',
    to: 'this.rooms.delete(room.code);changed=true;continue;}',
    verify: 'changed=true;continue;}',
  },
  {
    from: "if\\(room\\.game\\.status==='finished'\\)this\\.finish\\(room,now\\);\\r?\\n    \\}\\r?\\n  \\}",
    to: "if(room.game.status==='finished'){this.finish(room,now);changed=true;}\n    }\n    return changed;\n  }",
    verify: 'return changed;',
  },
]);

// 2) index.js：状态必须可靠送达，且结束的那一帧必须立刻推送
patch('server/index.js', [
  {
    from: "  const publish=\\(volatile=false\\)=>\\{channel\\.notify\\(\\);for\\(const \\[id,socket\\] of io\\.sockets\\.sockets\\)\\{const view=rooms\\.snapshot\\(id\\);if\\(view\\)\\(volatile\\?socket\\.volatile:socket\\)\\.emit\\('snapshot',view\\);\\}\\};",
    to: "  // 状态必须可靠送达：节奏记忆的音符、问答的题面、反应力的信号都只有一次显示机会，\n  // 丢一帧就等于玩家漏看一次提示，因此这里用可靠推送而不是 volatile。\n  const publish=()=>{channel.notify();for(const [id,socket] of io.sockets.sockets){const view=rooms.snapshot(id);if(view)socket.emit('snapshot',view);}};",
    verify: "const publish=()=>{channel.notify();",
  },
  {
    from: "const now=Date\\.now\\(\\),dt=Math\\.min\\(\\.1,\\(now-last\\)/1000\\);last=now;rooms\\.tick\\(dt\\);channel\\.tick\\(\\);if\\(\\+\\+tickCount%2===0&&\\[\\.\\.\\.rooms\\.rooms\\.values\\(\\)\\]\\.some\\(r=>r\\.phase==='playing'\\)\\)publish\\((?:true)?\\);",
    to: "const now=Date.now(),dt=Math.min(.1,(now-last)/1000);last=now;const settled=rooms.tick(dt);channel.tick();if(++tickCount%2===0||settled)publish();",
    verify: 'const settled=rooms.tick(dt);',
  },
]);
