import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createApp } from '../server/index.js';
import { catalog } from '../shared/catalog.js';
import { bots } from './bots.mjs';
import { DuoClient, delay, waitFor } from './lib/duo-client.mjs';

const SPEEDS = { simon: 2, reaction: 2, quiz: 2, hockey: 10, tanks: 10, bomber: 10, snake: 10, slingshot: 10, maze: 10 };
const DEADLINES = { simon: 45000, hockey: 30000, tanks: 30000, maze: 30000, quiz: 30000, memory: 30000 };

function accelerated(app, speed) {
  const anchor = Date.now();
  app.rooms.clock = () => anchor + Math.floor((Date.now() - anchor) * speed);
  return app;
}

const PRIVATE_KEYS = ['_rng', '_solution', '_questions', '_sequence', 'mineMap', 'enemyFleet', 'serverSecret'];
const report = { games: [], checks: [], failures: [] };

function check(name, ok, detail = '') {
  report.checks.push({ name, ok, ...(detail ? { detail } : {}) });
  if (!ok) report.failures.push(`${name}${detail ? `: ${detail}` : ''}`);
  return ok;
}

function snapshotLeaks(snapshot) {
  const json = JSON.stringify(snapshot);
  return PRIVATE_KEYS.filter(key => json.includes(`"${key}"`));
}

async function newRoom(app, gameId) {
  const url = `http://127.0.0.1:${app.port}`;
  const a = new DuoClient(url, '蜜桃');
  await waitFor(() => a.connected(), 5000, '房主连接');
  const created = await a.create('蜜桃', gameId);
  if (!created.ok) throw new Error(`创建房间失败：${created.message}`);
  const b = new DuoClient(url, '薄荷');
  await waitFor(() => b.connected(), 5000, '搭档连接');
  const joined = await b.join(created.code, '薄荷');
  if (!joined.ok) throw new Error(`加入房间失败：${joined.message}`);
  return { url, a, b, code: created.code };
}

async function waitPlaying(a, b) {
  await waitFor(() => a.snapshot?.room?.phase === 'playing' && a.snapshot?.game && b.snapshot?.game, 8000, '开局');
  await waitFor(() => !a.snapshot?.room?.paused && a.snapshot.serverNow >= (a.snapshot.room.startedAt ?? 0), 9000, '倒计时结束且未暂停');
}

async function finish(a, b) {
  await waitFor(() => a.snapshot?.room?.phase === 'finished' && b.snapshot?.room?.phase === 'finished', 5000, '结算同步');
}

async function protocolRoom(app) {
  const { a, b, code } = await newRoom(app, 'gomoku');
  const url = `http://127.0.0.1:${app.port}`;
  const c = new DuoClient(url, '第三人');
  await waitFor(() => c.connected(), 5000, '第三人连接');
  const full = await c.join(code, '第三人');
  check('满员房间拒绝第三人', full.ok === false && full.code === 'FULL', JSON.stringify(full));
  c.close();

  const selected = await a.request('select', { gameId: 'gomoku', series: 3 });
  check('房主可以设置三场巡回赛', selected.ok === true);
  await a.ready();
  await b.ready();
  await waitPlaying(a, b);
  check('双方准备后进入对局', a.snapshot.room.phase === 'playing' && b.snapshot.room.phase === 'playing');
  check('服务端为双方分配相反座位', a.snapshot.player === 0 && b.snapshot.player === 1);
  check('快照不含私有字段', snapshotLeaks(a.snapshot).length === 0, snapshotLeaks(a.snapshot).join(','));

  const first = await a.action({ type: 'place', index: 112 });
  check('合法落子被服务端接受', first.ok === true, first.message);
  const duplicate = await a.request('action', { seq: 1, action: { type: 'place', index: 113 } });
  check('重复序号被拒绝', duplicate.ok === false && duplicate.code === 'DUPLICATE', JSON.stringify(duplicate));
  const outOfOrder = await b.request('action', { seq: 99, action: { type: 'place', index: 112 } });
  check('非法落子被拒绝', outOfOrder.ok === false && outOfOrder.code === 'MOVE', JSON.stringify(outOfOrder));

  const token = a.identity.token;
  a.close();
  await delay(400);
  const resumed = new DuoClient(url, '蜜桃');
  await waitFor(() => resumed.connected(), 5000, '重连客户端');
  const identity = await resumed.resume(token);
  check('断线后凭令牌恢复原身份', identity.ok === true && identity.player === 0 && identity.code === code, JSON.stringify(identity));
  await waitFor(() => resumed.snapshot?.game, 5000, '恢复后快照');
  await waitFor(() => !resumed.snapshot?.room?.paused && resumed.snapshot.serverNow >= (resumed.snapshot.room.startedAt ?? 0), 9000, '恢复后解除暂停与倒计时');
  check('恢复后仍在对局中且棋盘保留', resumed.snapshot.room.phase === 'playing' && resumed.snapshot.game.board.includes(0));

  const resigned = await resumed.action({ type: 'resign' });
  check('认输请求被接受', resigned.ok === true, resigned.message);
  await finish(resumed, b);
  const winner = resumed.snapshot.game.winner;
  check('结算胜者为对手', winner === 1 && b.snapshot.game.winner === 1, `winner=${winner}`);

  const rematchA = await resumed.request('rematch');
  const rematchB = await b.request('rematch');
  check('双方再来一局请求成功', rematchA.ok && rematchB.ok, `${rematchA.message || ''} ${rematchB.message || ''}`);
  await waitFor(() => resumed.snapshot.room.phase === 'waiting' && b.snapshot.room.phase === 'waiting', 4000, '再来一局等待');
  check('再来一局回到等待状态', resumed.snapshot.room.phase === 'waiting');
  check('巡回赛推进到第二场', resumed.snapshot.room.series.round === 2 && resumed.snapshot.room.series.scores[1] === 1, JSON.stringify(resumed.snapshot.room.series));
  check('巡回赛随机换了一款游戏', resumed.snapshot.room.gameId !== 'gomoku', resumed.snapshot.room.gameId);

  await resumed.request('leave');
  await b.request('leave');
  resumed.close();
  b.close();
}

async function playGame(app, gameId) {
  // 每款游戏用各自合理的加速倍率：实时物理类需要快，依赖"观察短暂提示"的
  // 游戏（节奏记忆、反应力、问答）必须慢到客户端真的能看清每一帧。
  accelerated(app, SPEEDS[gameId] || 1);
  const { a, b, code } = await newRoom(app, gameId);
  const botState = [{}, {}];
  const counts = { ok: 0, rejected: 0 };
  let started = false;
  let finished = false;
  let timeout = false;
  try {
    await a.ready();
    await b.ready();
    await waitPlaying(a, b);
    started = true;
    const leaks = snapshotLeaks(a.snapshot);
    check(`${gameId} 快照不含私有字段`, leaks.length === 0, leaks.join(','));
    if (gameId === 'sudoku') {
      const onlyOwn = (a.snapshot.game.players[0].cells !== undefined) && (a.snapshot.game.players[1].cells === undefined);
      check('数独仅下发自己的棋盘', onlyOwn);
    }
    if (gameId === 'quiz') check('问答未揭晓前不泄露正确答案', a.snapshot.game.question.correct === undefined);
    if (gameId === 'mines') check('扫雷快照不含雷图', JSON.stringify(a.snapshot).includes('mineMap') === false);
    const deadline = performance.now() + (DEADLINES[gameId] || 30000);
    while (performance.now() < deadline) {
      for (const [index, client] of [a, b].entries()) {
        const snapshot = client.snapshot;
        if (!snapshot?.game || snapshot.room.phase !== 'playing' || client.pending) continue;
        const action = bots[gameId](snapshot.game, snapshot.player, botState[index]);
        if (!action) continue;
        client.pending = client.action(action).then(result => {
          client.pending = null;
          if (result.ok) counts.ok++;
          else counts.rejected++;
          return result;
        });
      }
      if (a.snapshot?.room.phase === 'finished' && b.snapshot?.room.phase === 'finished') {
        finished = true;
        break;
      }
      await delay(10);
    }
    if (!finished) {
      timeout = true;
      const room = app.rooms.rooms.get(code);
      const g = room?.game;
      console.log(`   ↳ 现场 ${gameId}: roomPhase=${room?.phase} pausedAt=${room?.pausedAt} resumeAt=${room?.resumeAt} timeShift=${room?.timeShift} gameStatus=${g?.status} gamePhase=${g?.phase} round=${g?.round} _now=${g?._now} clock=${app.rooms.clock()} players=${JSON.stringify(room?.players?.map(p => p && ({ c: p.connected, a: p.active, away: p.awaySince })))}`);
      await a.request('leave');
      await waitFor(() => b.snapshot?.room?.phase === 'finished', 4000, '离开后结算').catch(() => {});
      finished = b.snapshot?.room?.phase === 'finished';
    }
  } finally {
    await a.request('leave').catch(() => {});
    await b.request('leave').catch(() => {});
    a.close();
    b.close();
  }
  const view = a.snapshot?.game || b.snapshot?.game || {};
  const gameReport = {
    id: gameId,
    name: catalog.find(game => game.id === gameId)?.name,
    started,
    finished: finished && !timeout,
    timedOut: timeout,
    winner: view.winner,
    scores: view.scores,
    message: view.message,
    actions: counts,
  };
  report.games.push(gameReport);
  check(`${gameId} 双方开赛并操作`, started && counts.ok > 0, JSON.stringify(counts));
  check(`${gameId} 对局在时限内结算`, gameReport.finished, timeout ? '超时未结束' : '');
  if (gameReport.finished) {
    const valid = view.status === 'finished' && ['winner', 'scores', 'message'].every(key => key in view);
    check(`${gameId} 结算字段完整`, valid, JSON.stringify({ status: view.status, winner: view.winner }));
    check(`${gameId} 双方结算一致`, a.snapshot.game?.winner === b.snapshot.game?.winner);
  }
}

async function persistenceCheck() {
  const dir = await mkdtemp(path.join(tmpdir(), 'duo-qa-'));
  try {
    const app = await createApp({ dataDir: dir, persist: true, countdownMs: 0 });
    accelerated(app, 20);
    const port = await app.listen(0, '127.0.0.1');
    app.port = port.port;
    const { a, b } = await newRoom(app, 'typing');
    await a.ready();
    await b.ready();
    await waitPlaying(a, b);
    const text = a.snapshot.game.text;
    await a.action({ type: 'input', text });
    await finish(a, b);
    check('打字对局写入结算快照', a.snapshot.room.phase === 'finished' && a.snapshot.game.winner === 0);
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(path.join(dir, 'duizuo.sqlite'));
    const row = db.prepare('SELECT COUNT(*) AS n FROM matches').get();
    db.close();
    check('SQLite 保存了已结束对局', row.n >= 1, `rows=${row.n}`);
    await a.request('leave');
    await b.request('leave');
    a.close();
    b.close();
    await app.close();
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function main() {
  const app = await createApp({ persist: false, countdownMs: 0 });
  const address = await app.listen(0, '127.0.0.1');
  app.port = address.port;
  accelerated(app, 1);
  try {
    await protocolRoom(app);
    for (const game of catalog) {
      process.stdout.write(`${game.id} ... `);
      const before = report.failures.length;
      await playGame(app, game.id);
      const latest = report.games.at(-1);
      console.log(`${latest.finished ? 'ok' : 'FAIL'}${latest.winner !== undefined ? ` winner=${latest.winner}` : ''}${latest.actions ? ` actions=${latest.actions.ok}/${latest.actions.ok + latest.actions.rejected}` : ''}`);
      if (report.failures.length > before) console.log(`  ↳ ${report.failures.slice(before).join(' | ')}`);
    }
    await persistenceCheck();
  } finally {
    await app.close();
  }
  const passed = report.checks.filter(item => item.ok).length;
  console.log(`\n协议与全游戏网络检查：${passed}/${report.checks.length} 通过，${report.games.filter(game => game.finished).length}/${report.games.length} 款游戏通过真实 Socket.IO 客户端完成结算`);
  if (report.failures.length) {
    console.error(`失败项：\n- ${report.failures.join('\n- ')}`);
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
