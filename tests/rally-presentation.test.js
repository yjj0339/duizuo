import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleMotion} from '../games/sports-motion.js';
import {games} from '../games/sports-engines.js';

test('a point and a new serve never interpolate a ball across the court',()=>{
 const a=games.badminton.create(7,1000);a.rally=true;a.ball={x:670,y:389,vx:50,vy:200};
 const b=structuredClone(a);b.now=1066;b.rally=false;b.scores[0]=1;b.ball={x:180,y:265,vx:0,vy:0};
 const visual=sampleMotion(b,a,.5);assert.equal(visual.ball.x,180);assert.equal(visual.now,1066);
});
test('a racket reversal passes through the confirmed contact point',()=>{
 const a=games.badminton.create(7,1000);a.rally=true;a.ball={x:495,y:250,vx:300,vy:40};
 const b=structuredClone(a);b.now=1100;b.ball={x:500,y:240,vx:-250,vy:-200};b.event={id:2,type:'hit',player:1,occurredAt:1050,x:510,y:252,z:0};
 const saved=JSON.stringify(b),atContact=sampleMotion(b,a,.5);
 assert.equal(atContact.ball.x,510);assert.equal(atContact.ball.y,252);
 assert.ok(sampleMotion(b,a,.25).ball.x<510);assert.ok(sampleMotion(b,a,.75).ball.x<510);assert.equal(JSON.stringify(b),saved);
});
test('a ping pong bounce touches the table instead of floating above it',()=>{
 const a=games.tabletennis.create(7,1000);a.rally=true;a.ball={x:480,y:180,z:10,vx:200,vy:0,vz:-190};
 const b=structuredClone(a);b.now=1100;b.ball={x:500,y:180,z:8,vx:200,vy:0,vz:160};b.bounceEvent={id:1,x:490,y:180,occurredAt:1050};
 const v=sampleMotion(b,a,.5);assert.equal(v.ball.z,0);assert.equal(v.ball.x,490);
 assert.ok(sampleMotion(b,a,.25).ball.z>0);assert.ok(sampleMotion(b,a,.75).ball.z>0);
});
test('a stalled or rewound snapshot does not replay stale travel',()=>{
 const a=games.badminton.create(7,1000),b=structuredClone(a);a.rally=b.rally=true;b.now=2000;b.ball.x=520;
 assert.equal(sampleMotion(b,a,.2).ball.x,520);b.now=900;assert.equal(sampleMotion(b,a,.2).ball.x,520);
});
test('pool ball-in-hand placement moves immediately while rolling remains interpolated',()=>{
 const a=games.billiards.create(7,1000),b=structuredClone(a);a.ballInHand=b.ballInHand=true;b.balls[0].x=300;b.balls[0].y=300;
 assert.equal(sampleMotion(b,a,.5).balls[0].y,300);
});
