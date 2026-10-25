import test from 'node:test';
import assert from 'node:assert/strict';
import {createStrokeBuffer} from '../games/stroke-buffer.js';
import {games} from '../games/sports-engines.js';
const incoming=()=>{const v=games.badminton.create(7,1000);v.rally=true;v.last=0;v.rallyHits=1;v.ball={x:450,y:280,vx:300,vy:0};return v;};
test('an early press fires once only when a legal contact arrives inside 140 ms',()=>{
 const b=createStrokeBuffer('badminton',1),v=incoming();assert.equal(b.press(v,{style:'auto',target:.5},0).status,'buffered');
 assert.equal(b.take(v,40),null);v.ball.x=500;const action=b.take(v,80);assert.equal(action.style,'clear');assert.equal(action.type,'hit');
 assert.equal(games.badminton.action(v,1,action,1000),true);assert.equal(b.take(v,90),null);
});
test('expired input never becomes a late automatic shot',()=>{
 const b=createStrokeBuffer('badminton',1),v=incoming();b.press(v,{style:'auto',target:.5},0);v.ball.x=500;assert.equal(b.take(v,141),null);
});
test('pause, new rally, scoring and a finished match discard queued strokes',()=>{
 for(const change of [v=>{v.rallyHits++;},v=>{v.scores[0]++;},v=>{v.status='finished';},v=>{v.rally=false;}]){
  const b=createStrokeBuffer('badminton',1),v=incoming();b.press(v,{style:'auto',target:.5},0);change(v);v.ball.x=500;assert.equal(b.take(v,50),null);
 }
 const b=createStrokeBuffer('badminton',1),v=incoming();b.press(v,{style:'auto',target:.5},0);b.clear();v.ball.x=500;assert.equal(b.take(v,50),null);
});
test('automatic shot chooses height at contact and respects the shared rules',()=>{
 const b=createStrokeBuffer('badminton',1),v=incoming();v.players[1].jump=1650;
 b.press(v,{style:'auto',target:.85},0);v.now=1200;v.ball.x=530;v.ball.y=215;const action=b.take(v,100);assert.equal(action.style,'smash');assert.equal(games.badminton.action(v,1,action,1200),true);
});
test('a serve is immediate but waiting between points is never buffered',()=>{
 const b=createStrokeBuffer('badminton',0),v=games.badminton.create(7,1000);
 assert.equal(b.press(v,{style:'auto',target:.5},0).action.style,'clear');v.readyAt=2000;
 assert.equal(b.press(v,{style:'auto',target:.5},1).status,'rejected');v.now=2001;assert.equal(b.take(v,20),null);
});
test('ping pong cannot hit early; a buffered press waits for a legal single bounce',()=>{
 const v=games.tabletennis.create(7,1000);v.rally=true;v.last=0;v.rallyHits=1;v.ball={x:590,y:200,z:10,vx:300,vy:0,vz:-100};v.bounces=0;
 const b=createStrokeBuffer('tabletennis',1);assert.equal(b.press(v,{style:'drive',target:.5,spin:'top'},0).status,'buffered');assert.equal(b.take(v,30),null);v.bounces=1;
 const a=b.take(v,70);assert.equal(a.spin,'top');assert.equal(games.tabletennis.action(v,1,a,1000),true);assert.equal(b.take(v,100),null);
});
