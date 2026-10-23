import test from 'node:test';
import assert from 'node:assert/strict';
import {engines} from '../shared/engines.js';

for(const id of ['connect4','tictactoe','hex','nim']) test(`${id}: first turn has the same 45 second limit as later turns`,()=>{
 const s=engines[id].create(17,1000);assert.equal(s.endsAt,46000);
 engines[id].tick(s,.03,46000);assert.equal(s.winner,1);
});
test('penalty: a late choice cannot beat the round deadline between server ticks',()=>{
 const e=engines.penalty,s=e.create(1,1000);
 assert.equal(e.action(s,0,{type:'choose',zone:2},16000),false);
 e.tick(s,.03,16001);assert.equal(s.reveal.shot,-1);assert.equal(s.scores[0],0);
});
for(const id of ['rps','archery','penalty']) test(`${id}: delayed input stamped with an old round is rejected`,()=>{
 const e=engines[id],s=e.create(1,1000);s.round+=1;
 const a=id==='rps'?{type:'choose',choice:'rock'}:id==='archery'?{type:'shoot',x:0,y:0}:{type:'choose',zone:1};
 assert.equal(e.action(s,0,{...a,round:s.round-1},1100),false);
 assert.equal(e.action(s,0,{...a,round:s.round},1101),true);
});
for(const id of ['badminton','tabletennis']) test(`${id}: serving uses the current player location even before the next tick`,()=>{
 const e=engines[id],s=e.create(1,1000);s.serving=1;s.players[1][id==='badminton'?'x':'y']=id==='badminton'?610:300;
 assert.equal(e.action(s,1,{type:'hit',style:id==='badminton'?'clear':'drive',target:.5},1100),true);
 assert.equal(s.ball[id==='badminton'?'x':'y'],id==='badminton'?610:300);
});
test('2048: authoritative motion trace distinguishes two merges and the new tile',()=>{
 const e=engines.g2048,s=e.create(2,1000);s.players[0].cells=[2,2,2,2,...Array(12).fill(0)];
 e.action(s,0,{type:'move',direction:'left'},1100);const v=e.view(s,0),m=v.players[0].motion;
 assert.equal(m.number,1);assert.deepEqual(m.merged,[0,1]);
 assert.deepEqual(m.slides.map(x=>[x.from,x.to,x.value]),[[0,0,2],[1,0,2],[2,1,2],[3,1,2]]);
 assert.equal(s.scores[0],8);assert.equal(m.spawn.value,v.players[0].cells[m.spawn.index]);
 m.slides[0].to=99;assert.notEqual(e.view(s,0).players[0].motion.slides[0].to,99);
});
test('tetris: cleared row information survives authoritative compaction',()=>{
 const e=engines.tetris,s=e.create(1,1000),p=s.players[0];
 p.board=Array(200).fill(0);p.board.splice(190,10,...[1,1,1,0,0,0,0,1,1,1]);p.active={kind:'I',rotation:0,x:3,y:0};
 e.action(s,0,{type:'drop'},1100);const v=e.view(s,0);
 assert.deepEqual(v.players[0].lockEvent.clearedRows,[19]);
 assert.equal(v.players[0].lockEvent.number,1);assert.equal(v.players[0].lines,1);
 assert.ok(v.players[0].board.every(n=>n===0));
});
test('tanks and slingshot publish persistent event numbers, independent of display clock shifts',()=>{
 const t=engines.tanks,s=t.create(1,1000);t.action(s,0,{type:'fire'},1000);assert.equal(t.view(s,0).tanks[0].shots,1);t.action(s,0,{type:'fire'},1500);assert.equal(t.view(s,0).tanks[0].shots,2);
 const e=engines.slingshot,q=e.create(1,1000);q.projectile={x:500,y:450,vx:0,vy:20,owner:0,age:0};e.tick(q,.03,1100);assert.equal(e.view(q,0).impact.id,1);
 q.projectile={x:500,y:450,vx:0,vy:20,owner:1,age:0};e.tick(q,.03,1300);assert.equal(e.view(q,0).impact.id,2);
});
