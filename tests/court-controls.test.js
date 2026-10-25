import test from 'node:test';import assert from 'node:assert/strict';
import {simpleBadmintonShot,needsLandscape} from '../games/court-controls.js';
import {games} from '../games/sports-engines.js';
test('single hit button chooses a legal serve, high smash and low clear',()=>{const s=games.badminton.create(1,1000);assert.equal(simpleBadmintonShot(s,0),'clear');assert.equal(simpleBadmintonShot(s,1),null);s.rally=true;s.last=1;s.ball={x:180,y:215,vx:-100,vy:50};assert.equal(simpleBadmintonShot(s,0),'smash');s.ball.y=315;assert.equal(simpleBadmintonShot(s,0),'clear');s.ball.x=600;assert.equal(simpleBadmintonShot(s,0),null);});
test('no viewport blocks play behind an orientation requirement',()=>{for(const [w,h]of [[390,844],[844,390],[1280,980],[768,1024]])assert.equal(needsLandscape(w,h),false);});
