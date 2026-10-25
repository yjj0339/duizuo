import test from 'node:test';import assert from 'node:assert/strict';import {badminton,tabletennis} from '../games/racket-rules.js';
for(const [id,engine,axis]of [['badminton',badminton,'x'],['tabletennis',tabletennis,'y']])test(id+': releasing movement stops at the authoritative position without drifting or rewinding',()=>{
 const state=engine.create(42,1000);engine.action(state,0,{type:'move',[axis]:310},1000);engine.tick(state,.1,1100);const position=state.players[0][axis];assert.ok(state.players[0].speed>0);
 assert.equal(engine.action(state,0,{type:'stop'},1100),true);assert.equal(state.players[0].target,position);assert.equal(state.players[0].speed,0);
 for(let i=1;i<=15;i++)engine.tick(state,1/30,1100+i*1000/30);assert.equal(state.players[0][axis],position);
 state.status='finished';assert.equal(engine.action(state,0,{type:'stop'},1700),false);
});
