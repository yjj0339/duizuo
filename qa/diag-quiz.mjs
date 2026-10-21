import { createApp } from '../server/index.js';
import { bots } from './bots.mjs';
import { DuoClient, delay, waitFor } from './lib/duo-client.mjs';

const GAME = process.argv[2] || 'quiz';
const SPEED = Number(process.argv[4] || 1);
const LIMIT = Number(process.argv[3] || 35000);

const app = await createApp({ persist: false, countdownMs: Number(process.argv[5] ?? 3000) });
const anchor = Date.now();
app.rooms.clock = () => anchor + Math.floor((Date.now() - anchor) * SPEED);
await app.listen(0);
const url = `http://127.0.0.1:${app.server.address().port}`;

const a = new DuoClient(url, '蜜桃');
await waitFor(() => a.connected(), 5000);
const created = await a.create('蜜桃', GAME);
const b = new DuoClient(url, '薄荷');
await waitFor(() => b.connected(), 5000);
await b.join(created.code, '薄荷');
await a.ready();
await b.ready();

const botState = [{}, {}];
const t0 = Date.now();
let last = '';
while (Date.now() - t0 < LIMIT) {
  await delay(40);
  for (const [index, client] of [a, b].entries()) {
    const s = client.snapshot;
    if (!s?.game || s.room.phase !== 'playing' || client.pending) continue;
    const act = bots[GAME](s.game, s.player, botState[index]);
    if (!act) continue;
    client.pending = client.action(act).then(r => { client.pending = null; return r; });
  }
  const room = app.rooms.rooms.get(created.code);
  const g = room?.game;
  if (!g) continue;
  const key = `${g.status}|${g.phase}|${g.round}|${g.turn}`;
  if (key !== last) {
    console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${key} _now=${g._now} endsAt=${g.endsAt} phaseEndsAt=${g.phaseEndsAt} pausedAt=${room.pausedAt} timeShift=${room.timeShift} scores=${JSON.stringify(g.scores)}`);
    last = key;
  }
  if (g.status === 'finished') { console.log('FINISHED winner=', g.winner, g.message); break; }
}
a.close(); b.close();
await app.close();
process.exit(0);

