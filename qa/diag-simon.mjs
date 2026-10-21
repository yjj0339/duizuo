import { createApp } from '../server/index.js';
import { bots } from './bots.mjs';
import { DuoClient, delay, waitFor } from './lib/duo-client.mjs';

const app = await createApp({ persist: false, countdownMs: 3000 });
const anchor = Date.now();
app.rooms.clock = () => anchor + Math.floor((Date.now() - anchor) * 10);
await app.listen(0);
const address = app.server.address();
const url = `http://127.0.0.1:${address.port}`;

const a = new DuoClient(url, '蜜桃');
await waitFor(() => a.connected(), 5000, '连接');
const created = await a.create('蜜桃', 'simon');
const b = new DuoClient(url, '薄荷');
await waitFor(() => b.connected(), 5000, '连接');
await b.join(created.code, '薄荷');
console.log('ready results:', JSON.stringify(await a.ready()), JSON.stringify(await b.ready()));

for (let i = 0; i < 12; i++) {
  await delay(400);
  const room = app.rooms.rooms.get(created.code);
  const s = room ? {
    phase: room.phase, pausedAt: room.pausedAt, resumeAt: room.resumeAt,
    timeShift: room.timeShift, startedAt: room.startedAt,
    players: room.players.map(p => p && ({ name: p.name, connected: p.connected, active: p.active, ready: p.ready, awaySince: p.awaySince })),
    game: room.game && { status: room.game.status, phase: room.game.phase, turn: room.game.turn, endsAt: room.game.endsAt, round: room.game.round, scores: room.game.scores },
  } : null;
  console.log(`t+${(i + 1) * 0.4}s clock=${app.rooms.clock()}`, JSON.stringify(s));
  console.log('   view(a):', JSON.stringify(a.snapshot?.game ? { phase: a.snapshot.game.phase, status: a.snapshot.game.status, message: a.snapshot.game.message } : null), 'snapshotPaused=', a.snapshot?.room?.paused, 'serverNow=', a.snapshot?.serverNow, 'startedAt=', a.snapshot?.room?.startedAt);
  if (room?.game?.status === 'finished') break;
}

console.log('\n--- bot output on a view ---');
console.log(JSON.stringify(bots.simon(a.snapshot?.game, 0, {})));
a.close(); b.close();
await app.close();
process.exit(0);
