import test from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {io} from 'socket.io-client';
import {createApp} from '../server/index.js';
import {catalog} from '../shared/catalog.js';
const request=(socket,event,payload={})=>new Promise((resolve,reject)=>socket.timeout(3000).emit(event,payload,(e,r)=>e?reject(e):resolve(r)));
async function connect(url){const s=io(url,{transports:['websocket'],forceNew:true,reconnection:false});await new Promise((resolve,reject)=>{s.once('connect',resolve);s.once('connect_error',reject);});s.latest=null;s.on('snapshot',v=>s.latest=v);return s;}
async function until(fn){for(let i=0;i<150;i++){if(fn())return;await delay(20);}throw new Error('snapshot condition timed out');}
test('real WebSocket clients can start, operate and end every one of the 20 games',async t=>{
 const app=await createApp({persist:false,countdownMs:0});const address=await app.listen(0);const url=`http://127.0.0.1:${address.port}`;
 try{for(const game of catalog)await t.test(game.id,async()=>{
  const a=await connect(url),b=await connect(url);let seq=1;
  try{
   const room=await request(a,'create',{name:'玩家甲',gameId:game.id});assert.equal(room.ok,true);
   assert.equal((await request(b,'join',{name:'玩家乙',code:room.code})).ok,true);
   await request(a,'ready',{ready:true});await request(b,'ready',{ready:true});await until(()=>a.latest?.room.phase==='playing'&&b.latest?.game?.status==='playing');
   assert.equal(a.latest.player,0);assert.equal(b.latest.player,1);assert.ok(!JSON.stringify(b.latest).includes(room.token));
   assert.equal((await request(a,'action',{seq:seq++,action:{type:'score',score:9999,winner:0}})).ok,false);
   const s=app.rooms.rooms.get(room.code).game;let actions=[];
   switch(game.id){
    case 'gomoku':actions=[{type:'place',index:112}];break;
    case 'fleet':await request(a,'action',{seq:seq++,action:{type:'ready'}});await request(b,'action',{seq:1,action:{type:'ready'}});actions=[{type:'fire',index:0}];break;
    case 'dots':actions=[{type:'line',index:0}];break;
    case 'memory':actions=[{type:'flip',index:0}];break;
    case 'hockey':actions=[{type:'move',x:120,y:220}];break;
    case 'tanks':actions=[{type:'fire'}];break;
    case 'bomber':actions=[{type:'bomb'}];break;
    case 'snake':actions=[{type:'direction',dir:'down'}];break;
    case 'tetris':actions=[{type:'drop'}];break;
    case 'slingshot':actions=[{type:'shoot',angle:45,power:80}];break;
    case 'maze':actions=['up','down','left','right'].map(dir=>({type:'move',dir}));break;
    case 'quiz':actions=[{type:'answer',round:0,choice:0}];break;
    case 'g2048':actions=['up','left','right','down'].map(direction=>({type:'move',direction}));break;
    case 'sudoku':{const index=s.givens.indexOf(0);actions=[{type:'set',index,value:s._solution[index]}];break;}
    case 'reversi':actions=[{type:'place',index:a.latest.game.legalMoves[0]}];break;
    case 'rps':actions=[{type:'choose',choice:'rock'}];break;
    case 'reaction':actions=[{type:'tap',round:0}];break;
    case 'mines':actions=[{type:'open',index:0}];break;
    case 'typing':actions=[{type:'input',text:s.text.slice(0,3)}];break;
    case 'simon':await delay(Math.max(50,s.phaseEndsAt-Date.now()+100));actions=[{type:'note',note:s._sequence[0],round:0}];break;
   }
   let accepted=false;for(const action of actions){const r=await request(a,'action',{seq:seq++,action});if(r.ok){accepted=true;break;}}
   assert.equal(accepted,true,`${game.id} must accept a real legal player action`);
   await delay(100);assert.ok(a.latest?.game&&b.latest?.game);assert.deepEqual(a.latest.game.scores,b.latest.game.scores);
   assert.equal((await request(a,'action',{seq:seq++,action:{type:'resign'}})).ok,true);await until(()=>b.latest?.room.phase==='finished');assert.equal(b.latest.game.winner,1);
   assert.equal((await request(a,'rematch')).ok,true);await until(()=>b.latest?.room.phase==='waiting');
   const resume=await request(a,'resume',{token:room.token});assert.equal(resume.ok,true);
  }finally{a.disconnect();b.disconnect();}
 });}finally{await app.close();}
});
