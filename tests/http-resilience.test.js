import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server/index.js';
test('independent HTTPS-compatible channel creates, joins, plays, resumes and never exposes the other token',async()=>{
 const app=await createApp({persist:false,countdownMs:0});const address=await app.listen(0),base=`http://127.0.0.1:${address.port}`;
 const post=async(path,body,token)=>{const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});return r.json();};
 try{const a=await post('/api/session',{event:'create',payload:{name:'甲',gameId:'gomoku'}});assert.equal(a.ok,true);const b=await post('/api/session',{event:'join',payload:{name:'乙',code:a.code}});assert.equal(b.ok,true);
 await post('/api/command',{event:'ready',payload:{ready:true}},a.token);await post('/api/command',{event:'ready',payload:{ready:true}},b.token);
 assert.equal((await post('/api/command',{event:'action',payload:{seq:1,action:{type:'place',index:112}}},a.token)).ok,true);
 let v=await (await fetch(base+'/api/snapshot',{headers:{Authorization:`Bearer ${b.token}`}})).json();assert.equal(v.game.board[112],0);assert.ok(!JSON.stringify(v).includes(a.token));
 assert.equal((await post('/api/presence',{token:a.token,active:false})).ok,true);v=await (await fetch(base+'/api/snapshot',{headers:{Authorization:`Bearer ${b.token}`}})).json();assert.equal(v.room.paused,true);
 const resume=await post('/api/session',{event:'resume',payload:{token:a.token}});assert.equal(resume.player,0);assert.equal((await post('/api/command',{event:'create',payload:{}},b.token)).ok,false);
 const bad=await fetch(base+'/api/snapshot',{headers:{Authorization:'Bearer fake'}});assert.equal(bad.status,401);
 const preflight=await fetch(base+'/api/command',{method:'OPTIONS'});assert.equal(preflight.status,204);assert.match(preflight.headers.get('access-control-allow-headers'),/Authorization/i);
 }finally{await app.close();}
});
