import test from 'node:test';import assert from 'node:assert/strict';
import {engines} from '../shared/engines.js';import {catalog} from '../shared/catalog.js';import {bots} from '../scripts/test-bots.mjs';
import {goals,guide,blockedReason,stampAction,actionEvent} from '../games/experience-model.js';
for(const {id} of catalog)test(`${id}: guidance follows public state, accepts legal input and does not replay feedback`,()=>{
 const e=engines[id],s=e.create(41,1000),brains=[{},{}];let accepted=0;
 assert.ok(goals[id]);
 for(let frame=0;frame<85&&s.status==='playing';frame++){
  const now=1001+frame*120;e.tick?.(s,.12,now);
  for(const p of[0,1]){
   const v=e.view(s,p),frozen=structuredClone(v),g=guide(id,v,p);assert.ok(g.goal&&g.state,id);assert.equal(actionEvent(id,v,structuredClone(v),p),null,id+' idle feedback');
   const a=bots[id]?.(v,p,brains[p]);
   if(a){const trial=structuredClone(s),legal=e.action(trial,p,a,now);if(legal){assert.equal(blockedReason(id,v,p,a),null,id+JSON.stringify(a));const sent=stampAction(id,v,a);assert.equal(e.action(s,p,sent,now),true);accepted++;const event=actionEvent(id,v,e.view(s,p),p);assert.ok(!event||typeof event.text==='string');}}
   assert.deepEqual(v,frozen,id+' presentation must not change view');
  }
 }
 const done={...e.view(s,0),status:'finished',winner:0};assert.equal(guide(id,done,0).waiting,true);assert.ok(blockedReason(id,done,0,{type:'anything'}));
});
test('hidden choices stay hidden while guidance waits for an opponent',()=>{
 for(const id of['rps','quiz','penalty','archery']){const e=engines[id],s=e.create(5,1000),before=e.view(s,0);const a=id==='rps'?{type:'choose',choice:'rock'}:id==='quiz'?{type:'answer',round:0,choice:s._questions[0].correct}:id==='archery'?{type:'shoot',x:.5,y:.25}:{type:'choose',zone:2};e.action(s,1,a,1100);const v=e.view(s,0);assert.equal(actionEvent(id,before,v,0),null,id+' cannot announce hidden score or choice');}
});
test('invalid slide and occupied moves have a precise reason without consuming a turn',()=>{
 const e=engines.slide,s=e.create(1,1000),v=e.view(s,0),z=v.players[0].cells.indexOf(0);assert.match(blockedReason('slide',v,0,{type:'slide',index:z}),/空格/);
 const m=engines.memory.create(1,1000);m.open=[0];assert.match(blockedReason('memory',engines.memory.view(m,0),0,{type:'flip',index:0}),/尚未翻开/);
});
test('practice undo is described as restoration, never as a negative merge score',()=>{
 const e=engines.g2048,s=e.create(2,1000);s.players[0].cells=[2,2,2,2,...Array(12).fill(0)];const before=e.view(s,0);e.action(s,0,{type:'move',direction:'left'},1100);assert.equal(actionEvent('g2048',e.view(s,0),before,0).kind,'restore');
});
