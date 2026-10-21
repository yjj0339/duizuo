import { createApp } from '../server/index.js';
import { bots } from './bots.mjs';
import { DuoClient, delay, waitFor } from './lib/duo-client.mjs';

const GAME = process.argv[2] || 'quiz';
const SPEED = { simon: 4, hockey: 10, tanks: 10, bomber: 10, snake: 10, slingshot: 10, maze: 10, reaction: 10, mines: 10 }[GAME] || 1;
const app = await createApp({ persist: false, countdownMs: 3000 });
const anchor = Date.now();
app.rooms.clock = () => anchor + Math.floor((Date.now() - anchor) * SPEED);
await app.listen(0);
const url = `http://127.0.0.1:${app.server.address().port}`;

const a = new DuoClient(url, '蜜桃');
await waitFor(() => a.connected(), 5000, '连接');
const created = await a.create('蜜桃', GAME);
const b = new DuoClient(url, '薄荷');
await waitFor(() => b.connected(), 5000, '连接');
await b.join(created.code, '薄荷');
await a.ready();
await b.ready();

const botState = [{}, {}];
let last = '';
for (let i = 0; i < 40; i++) {
  await delay(250);
  for (const [index, client] of [a, b].entries()) {
    const snapshot = client.snapshot;
    if (!snapshot?.game || snapshot.room.phase !== 'playing' || client.pending) continue;
    const action = bots[GAME](snapshot.game, snapshot.player, botState[index]);
    if (!action) continue;
    client.pending = client.action(action).then(r => { client.pending = null; return r; });
  }
  const room = app.rooms.rooms.get(created.code);
  const g = room?.game;
  if (!g) continue;
  const line = JSON.stringify({
    status: g.status, phase: g.phase, round: g.round, turn: g.turn, scores: g.scores,
    endsAt: g.endsAt, phaseEndsAt: g.phaseEndsAt, _now: g._now, clock: app.rooms.clock(),
    pausedAt: room.pausedAt, timeShift: room.timeShift,
  });
  if (line !== last) { console.log(line); last = line; }
  if (g.status === 'finished') { console.log('FINISHED winner=', g.winner, 'message=', g.message); break; }
}
a.close(); b.close();
await app.close();
process.exit(0);
