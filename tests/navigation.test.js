import test from 'node:test';
import assert from 'node:assert/strict';
import {PlayFlow, BackGuard} from '../client/navigation.js';
import {isNewerRelease} from '../shared/release.js';
import {Solo,savedSolo,savedSolos} from '../client/solo.js';
import {Rooms} from '../server/rooms.js';
import {engines} from '../shared/engines.js';

test('room snapshots cannot steal the screen after returning from the same match',()=>{
 const f=new PlayFlow();assert.equal(f.accept('room:match1'),true);
 f.lobby();for(let i=0;i<20;i++)assert.equal(f.accept('room:match1'),false);
 f.play();assert.equal(f.accept('room:match1'),true);
 f.lobby();assert.equal(f.accept('room:match2'),true);
});
test('browser back closes each overlay before leaving a game without growing history',()=>{
 let state=null,depth=0,pushes=0,onPop;
 const history={get state(){return state;},pushState(v){state=v;depth++;pushes++;},replaceState(v){state=v;},back(){state=null;depth--;onPop();}};
 let layers=2,playing=true;
 const guard=new BackGuard({history,listen:fn=>onPop=fn,back:()=>{if(layers)layers--;else playing=false;},active:()=>playing||layers>0});
 guard.arm();guard.arm();assert.equal(pushes,1);
 history.back();assert.equal(layers,1);assert.equal(depth,1);
 history.back();assert.equal(layers,0);assert.equal(depth,1);
 history.back();assert.equal(playing,false);assert.equal(depth,0);
});
test('leaving through an app button consumes its browser back guard once',()=>{
 let state=null,onPop,calls=0,active=true;
 const history={get state(){return state;},pushState(v){state=v;},replaceState(v){state=v;},back(){state=null;onPop();}};
 const guard=new BackGuard({history,listen:fn=>onPop=fn,back:()=>calls++,active:()=>active});
 guard.arm();active=false;guard.release();assert.equal(calls,0);assert.equal(state,null);
});
test('repeated room snapshots cannot issue multiple pending browser back operations',()=>{
 let state=null,onPop,backs=0,active=true;
 const history={get state(){return state;},pushState(v){state=v;},replaceState(v){state=v;},back(){backs++;}};
 const guard=new BackGuard({history,listen:fn=>onPop=fn,back:()=>assert.fail('programmatic pop is already handled'),active:()=>active});
 guard.arm();active=false;guard.release();guard.release();guard.release();assert.equal(backs,1);
 active=true;guard.arm();state=null;onPop();assert.ok(state?.duizuoGuard);
});
test('update checks reject malformed, equal and older version manifests',()=>{
 assert.equal(isNewerRelease({version:'3.2.0'},'3.1.0'),true);
 for(const version of ['3.1.0','3.0.99','3.2','latest','3.2.0<script>'])assert.equal(isNewerRelease({version},'3.1.0'),false);
});
test('each game keeps its own save and finishing one cannot erase another',()=>{
 const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const a=new Solo('connect4'),b=new Solo('tictactoe');
 a.state.board[35]=0;a.save();b.save();assert.equal(savedSolos().length,2);
 assert.equal(savedSolo('connect4').state.board[35],0);
 b.state.status='finished';b.save();assert.equal(savedSolos().length,1);assert.equal(savedSolo().id,'connect4');
});
test('legacy single save remains available and storage failure is reported',()=>{
 const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const s=new Solo('connect4');s.save();data.delete('duo:solo-games-v3');assert.equal(savedSolo('connect4').id,'connect4');
 globalThis.localStorage.setItem=()=>{throw Error('quota')};assert.equal(s.save(),false);
});
test('a confirmed resignation can end a paused match once without allowing gameplay',()=>{
 let now=1000;const r=new Rooms({engines,clock:()=>now,countdownMs:0});
 const a=r.handle('create','a',{name:'甲',gameId:'gomoku'});r.handle('join','b',{name:'乙',code:a.code});r.handle('ready','a',{ready:true});r.handle('ready','b',{ready:true});
 r.handle('presence','a',{active:false});now+=5000;
 assert.equal(r.handle('action','a',{seq:1,action:{type:'place',index:112}}).code,'PAUSED');
 assert.equal(r.handle('action','a',{seq:1,action:{type:'resign'}}).ok,true);
 assert.equal(r.snapshot('b').game.winner,1);r.handle('action','a',{seq:1,action:{type:'resign'}});assert.equal(r.snapshot('b').room.history.length,1);
});
