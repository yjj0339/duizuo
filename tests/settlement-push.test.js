import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { io } from 'socket.io-client';
import { createApp } from '../server/index.js';
import { Rooms } from '../server/rooms.js';

/* 结算帧必须送达：一场由引擎自己判定结束（超时 / 引擎内部结束）的对局，
   客户端也必须收到 room.phase === 'finished' 的快照，
   否则玩家会永远停在一块"还在进行中"的旧棋盘上。 */
const timedOut = {
  create: (seed, now) => ({ status: 'playing', winner: null, scores: [0, 0], message: '进行中', startedAt: now, endsAt: now + 120, _now: now }),
  action: () => false,
  tick: (s, dt, now) => { if (now >= s.endsAt) { s.status = 'finished'; s.winner = -1; s.message = '时间到'; } },
  view: s => structuredClone(s),
};

test('tick reports a settled match so the final snapshot can be pushed', () => {
  let now = 10000;
  const rooms = new Rooms({ engines: { timedOut }, clock: () => now, countdownMs: 0 });
  const created = rooms.handle('create', 'a', { name: '甲', gameId: 'timedOut' });
  rooms.handle('join', 'b', { code: created.code, name: '乙' });
  rooms.handle('ready', 'a', { ready: true });
  rooms.handle('ready', 'b', { ready: true });
  assert.equal(rooms.snapshot('a').room.phase, 'playing');
  now += 500;
  assert.equal(rooms.tick(0.03), true, '结束的那一帧必须报告状态变化');
  assert.equal(rooms.snapshot('a').room.phase, 'finished');
  assert.equal(rooms.snapshot('a').game.winner, -1);
  now += 500;
  assert.equal(rooms.tick(0.03), false, '已经结束的房间不再重复报告');
});

test('a match that ends on its own reaches the client as a finished snapshot', async () => {
  const app = await createApp({ persist: false, countdownMs: 0 });
  const address = await app.listen(0);
  const url = `http://127.0.0.1:${address.port}`;
  const socket = io(url, { transports: ['websocket'], forceNew: true, reconnection: false });
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
  let latest = null;
  socket.on('snapshot', v => { latest = v; });
  try {
    const request = (event, payload = {}) => new Promise((resolve, reject) =>
      socket.timeout(3000).emit(event, payload, (e, r) => e ? reject(e) : resolve(r)));
    // 用一款必定会自己结束的对局替换真实引擎
    const room = app.rooms.rooms.get((await request('create', { name: '甲', gameId: 'gomoku' })).code);
    const peer = io(url, { transports: ['websocket'], forceNew: true, reconnection: false });
    await new Promise(resolve => peer.once('connect', resolve));
    await new Promise((resolve, reject) => peer.timeout(3000).emit('join', { name: '乙', code: room.code }, (e, r) => e ? reject(e) : resolve(r)));
    await new Promise((resolve, reject) => socket.timeout(3000).emit('ready', { ready: true }, e => e ? reject(e) : resolve()));
    await new Promise((resolve, reject) => peer.timeout(3000).emit('ready', { ready: true }, e => e ? reject(e) : resolve()));
    // 让引擎在这一帧自行判定结束
    room.game.status = 'finished';
    room.game.winner = -1;
    let reached = false;
    for (let i = 0; i < 100 && !reached; i++) {
      await delay(20);
      reached = latest?.room?.phase === 'finished' && latest?.game?.status === 'finished';
    }
    assert.equal(reached, true, '客户端必须收到结算快照');
    peer.close();
  } finally {
    socket.close();
    await app.close();
  }
});
