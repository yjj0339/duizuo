import test from 'node:test';
import assert from 'node:assert/strict';
import {Rooms} from '../server/rooms.js';
import {engines} from '../shared/engines.js';
import {createApp} from '../server/index.js';
import {io} from 'socket.io-client';

function room(){let now=1000;const rooms=new Rooms({engines,clock:()=>now,countdownMs:0});const a=rooms.handle('create','a',{name:'甲',gameId:'badminton'});rooms.handle('join','b',{name:'乙',code:a.code});rooms.handle('ready','a',{});rooms.handle('ready','b',{});return {rooms,a,advance:n=>{now+=n;rooms.tick(.01);}};}
test('a delayed away message cannot overwrite a newer return',()=>{
 const {rooms,advance}=room();rooms.handle('presence','a',{active:false,seq:1});rooms.handle('presence','a',{active:true,seq:3});
 rooms.handle('presence','a',{active:false,seq:2});advance(2100);assert.equal(rooms.snapshot('a').room.paused,false);assert.equal(rooms.snapshot('a').room.players[0].active,true);
});
test('a delayed return cannot resume a player who has gone away again',()=>{
 const {rooms,advance}=room();rooms.handle('presence','a',{active:false,seq:4});rooms.handle('presence','a',{active:true,seq:3});advance(2100);assert.equal(rooms.snapshot('a').room.paused,true);
 assert.equal(rooms.handle('presence','a',{active:true,seq:NaN}).ok,false);assert.equal(rooms.snapshot('a').room.players[0].active,false);
});
test('new connection generations restart presence ordering while old channels stay invalid',()=>{
 const {rooms,a}=room();rooms.handle('presence','a',{active:false,seq:99});rooms.disconnect('a');rooms.handle('resume','new-a',{token:a.token});
 rooms.handle('presence','new-a',{active:false,seq:1});assert.equal(rooms.snapshot('new-a').room.players[0].active,false);
 assert.equal(rooms.handle('presence','a',{active:true,seq:100}).code,'SESSION');
});
test('HTTP beacon ordering is shared with both WebSocket and HTTPS commands',async()=>{
 const app=await createApp({persist:false,countdownMs:0}),address=await app.listen(0),url='http://127.0.0.1:'+address.port;
 const socket=io(url,{transports:['websocket'],reconnection:false});
 const send=(event,payload)=>new Promise((resolve,reject)=>socket.timeout(2000).emit(event,payload,(e,r)=>e?reject(e):resolve(r)));
 const post=async(path,body,headers={})=>(await fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)})).json();
 try{
  await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
  const a=await send('create',{name:'甲',gameId:'badminton'});await send('presence',{active:true,seq:2});await post('/api/presence',{token:a.token,channelId:socket.id,active:false,seq:1});assert.equal(app.rooms.snapshot(socket.id).room.players[0].active,true);
  const b=await post('/api/session',{event:'join',payload:{name:'乙',code:a.code}});const headers={Authorization:'Bearer '+b.token,'X-Duo-Connection':b.channelId};
  await post('/api/command',{event:'presence',payload:{active:true,seq:5}},headers);await post('/api/presence',{token:b.token,channelId:b.channelId,active:false,seq:4});assert.equal(app.rooms.snapshot(b.channelId).room.players[1].active,true);
 }finally{socket.disconnect();await app.close();}
});
