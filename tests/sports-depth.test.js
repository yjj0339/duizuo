import test from 'node:test';
import assert from 'node:assert/strict';
import {games} from '../games/sports-engines.js';
import {shiftView} from '../client/solo.js';
import {contact} from '../games/racket-rules.js';
const advance=(e,s,seconds,start=1000)=>{for(let n=1;n<=seconds*120&&s.status==='playing';n++)e.tick(s,1/120,start+n*1000/120);};
test('badminton jump does not grant an instant airborne reach, and smash requires a high contact',()=>{
 const e=games.badminton,s=e.create(1,1000);s.rally=true;s.last=1;s.ball={x:180,y:170,vx:-100,vy:0};
 e.action(s,0,{type:'jump'},1000);
 assert.equal(e.action(s,0,{type:'hit',style:'smash'},1000),false);
 assert.equal(e.action(s,0,{type:'hit',style:'smash'},1300),true);
 const low=e.create(1,1000);low.rally=true;low.last=1;low.ball={x:180,y:315,vx:-80,vy:200};
 assert.equal(e.action(low,0,{type:'hit',style:'smash'},1100),false);
 assert.equal(e.action(low,0,{type:'hit',style:'clear'},1100),true);
});
test('badminton selected depth changes the landing, and points retain a concrete reason and rally history',()=>{
 const land=[];for(const target of [0,1]){const e=games.badminton,s=e.create(1,1000);e.action(s,0,{type:'hit',style:'clear',target},1000);advance(e,s,3);land.push(s.lastPoint?.x);assert.equal(s.lastPoint?.reason,'落地');assert.equal(s.history.length,1);assert.ok(s.stats[0].shots>=1);}
 assert.ok(land[1]-land[0]>100);
});
test('badminton dash consumes stamina and repeated dash is rejected',()=>{const e=games.badminton,s=e.create(1,1000);assert.equal(e.action(s,0,{type:'dash',direction:1},1000),true);assert.ok(s.players[0].stamina<100);assert.equal(e.action(s,0,{type:'dash',direction:1},1001),false);advance(e,s,2);assert.ok(s.players[0].stamina>65);});
test('table tennis serve bounces on the server side before the receiver side',()=>{
 const e=games.tabletennis,s=e.create(1,1000);e.action(s,0,{type:'hit',style:'drive',target:.5},1000);const sides=[];let id=0;
 for(let n=1;n<200&&s.rally;n++){e.tick(s,1/120,1000+n*1000/120);if(s.bounceEvent?.id!==id&&s.bounceEvent){id=s.bounceEvent.id;sides.push(s.bounceEvent.side);}}
 assert.deepEqual(sides.slice(0,2),[0,1]);
});
test('table tennis topspin and backspin change bounce speed, never allow a volley',()=>{
 const speed=[];for(const spin of ['top','back']){const e=games.tabletennis,s=e.create(1,1000);s.rally=true;s.last=1;s.bounces=1;s.ball={x:95,y:200,z:65,vx:-280,vy:0,vz:40};e.action(s,0,{type:'hit',style:'drive',target:.5,spin},1000);advance(e,s,.92);speed.push(Math.abs(s.ball.vx));assert.equal(e.action(s,0,{type:'hit',style:'drive',target:.5},2000),false);}
 assert.ok(speed[0]>speed[1]*1.1);
});
test('pool legal contact without a subsequent rail or pot is a foul with a readable reason',()=>{
 const e=games.billiards,s=e.create(1,1000);e.action(s,0,{type:'shoot',angle:0,power:.1},1000);s._first=1;s._railAfterContact=false;s._potted=[];for(const b of s.balls)b.vx=b.vy=0;e.tick(s,.01,1100);
 assert.equal(s.ballInHand,true);assert.match(s.lastShot.reason,/碰库/);assert.equal(s.turn,1);
});
test('sports event and telemetry survive JSON saves without exposing private state',()=>{for(const id of ['badminton','tabletennis']){const e=games[id],s=e.create(1,1000);e.action(s,0,{type:'hit',style:id==='badminton'?'clear':'drive',target:.5},1000);const loaded=JSON.parse(JSON.stringify(s));advance(e,loaded,3);assert.deepEqual(e.view(loaded,0).scores,loaded.scores);assert.ok(e.view(loaded,0).history.length);assert.ok(!Object.keys(e.view(loaded,0)).some(k=>k.startsWith('_')));}});
test('resuming a paused jump preserves contact availability in the translated client view',()=>{const s=games.badminton.create(1,1000);s.rally=true;s.last=1;s.ball={x:180,y:170,vx:0,vy:0};s.players[0].jump=1650;s.now=1300;assert.equal(contact('badminton',s,0).ready,true);const translated=shiftView(s,120000);assert.equal(contact('badminton',translated,0).ready,true);});
