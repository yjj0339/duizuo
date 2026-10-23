import {chromium} from 'file:///D:/codexAI/.runtime/browser-tools/node_modules/pwcore/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import {catalog} from '../shared/catalog.js';import {engines} from '../shared/engines.js';import {createApp} from '../server/index.js';
const dir=process.env.ARTIFACT_DIR||'D:/codexAI/duizuo/artifacts/upgrade-v5';await mkdir(dir+'/video',{recursive:true});
const cases=process.env.GAME_IDS?catalog.filter(g=>process.env.GAME_IDS.split(',').includes(g.id)):catalog;
const app=await createApp({persist:false,countdownMs:100}),address=await app.listen(0),base='http://127.0.0.1:'+address.port;
const browser=await chromium.launch({headless:true,executablePath:'D:/codexAI/.runtime/browsers/chromium-1234/chrome-win64/chrome.exe',args:['--no-proxy-server','--disable-quic']}),checks=[],errors=[];
function fixture(id){const e=engines[id],s=e.create(37,1000);let index=0;
 if(id==='fleet'){e.action(s,0,{type:'ready'},1000);e.action(s,1,{type:'ready'},1000);}
 if(id==='dots'){for(const[p,i]of[[0,0],[1,4],[0,20]])e.action(s,p,{type:'line',index:i},1000);e.action(s,1,{type:'line',index:1},1000);index=21;}
 if(id==='memory'){e.action(s,0,{type:'flip',index:0},1000);index=s.cards.findIndex((n,i)=>i&&n===s.cards[0]);}
 if(id==='hockey')Object.assign(s.puck,{x:690,y:220,vx:400,vy:0});
 if(id==='snake')s.food[0]={x:6,y:5};
 if(id==='tetris'){const p=s.players[0];p.board=Array(200).fill(0);p.board.splice(190,10,...[1,1,1,0,0,0,0,1,1,1]);p.active={kind:'I',rotation:0,x:3,y:0};}
 if(id==='maze'){s.players[0].x=8;s.players[0].y=7;}
 if(id==='g2048')s.players[0].cells=[2,2,2,2,...Array(12).fill(0)];
 if(id==='sudoku')index=s.givens.indexOf(0);
 if(id==='rps')e.action(s,1,{type:'choose',choice:'scissors'},1000);
 if(id==='reaction'){s._signalAt=1000;s.phaseEndsAt=4000;}
 if(id==='mines')index=s.mineMap.findIndex(n=>!n);
 if(id==='simon'){s.phase='input';s.phaseEndsAt=20000;}
 if(id==='penalty')e.action(s,1,{type:'choose',zone:5},1000);
 if(id==='checkers'){s.board=Array(64).fill(0);s.board[17]=1;s.board[26]=-1;s.board[62]=-1;}
 return{saved:{version:2,id,state:s,mode:'practice',level:'expert',human:0,seed:37,now:1000,daily:false,brain:{},ui:{}},index};
}
try{
 const ctx=await browser.newContext({viewport:{width:1280,height:960},recordVideo:{dir:dir+'/video',size:{width:1280,height:960}}});
 await ctx.addInitScript(()=>{const raf=requestAnimationFrame.bind(window),caf=cancelAnimationFrame.bind(window),pending=new Set();let created=0;const animate=Element.prototype.animate;Element.prototype.animate=function(...args){created++;return animate.apply(this,args);};window.requestAnimationFrame=fn=>{const id=raf(t=>{pending.delete(id);fn(t);});pending.add(id);return id;};window.cancelAnimationFrame=id=>{pending.delete(id);caf(id);};window.__audit=()=>({pending:pending.size,created});});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.stack));await p.goto(base,{waitUntil:'networkidle'});const baseline=await p.evaluate(()=>__audit().pending);
 for(const {id} of cases){console.log('Experience '+id);const f=fixture(id);await p.evaluate(({id,saved})=>__DUIZUO__.openLocal(id,{saved}),{id,saved:f.saved});await p.locator('.match-guide').waitFor();
  switch(id){
   case'gomoku':await p.locator('.board-gomoku-grid button').nth(112).click();await p.locator('.board-precision > button').click();break;
   case'fleet':await p.locator('.board-sea-panel').nth(1).locator('.board-precision > button').click();break;
   case'dots':await p.locator('.board-edge').nth(f.index).click();break;
   case'memory':await p.locator('.board-memory-grid button').nth(f.index).click();break;
   case'hockey':case'snake':await p.waitForTimeout(260);break;
   case'tanks':case'bomber':await p.locator('.arcade-action').click();break;
   case'tetris':await p.locator('.puzzle-drop').click();break;
   case'slingshot':await p.locator('.arcade-fire').click();break;
   case'maze':await p.locator('.arcade-dir-up').click();break;
   case'quiz':await p.locator('.puzzle-choice').first().click();break;
   case'g2048':await p.locator('.puzzle-dir-left').click();break;
   case'sudoku':await p.locator('.puzzle-sudoku-cell').nth(f.index).click();await p.keyboard.press(String(f.saved.state._solution[f.index]));break;
   case'reversi':await p.locator('.board-legal').first().click();await p.locator('.board-precision > button').click();break;
   case'rps':await p.locator('.board-rps-choices button').first().click();break;
   case'reaction':await p.locator('.puzzle-signal').click();break;
   case'mines':await p.locator('.board-mines-grid button').nth(f.index).click();await p.locator('.board-precision > button').click();break;
   case'typing':await p.locator('.puzzle-typing-input').fill(f.saved.state.text.slice(0,6));break;
   case'simon':await p.locator('.puzzle-note').nth(f.saved.state._sequence[0]).click();break;
   case'connect4':case'tictactoe':case'lights':await p.locator('.classic-cell:not(:disabled)').first().click();break;
   case'hex':await p.locator('.classic-hex polygon').first().click();break;
   case'slide':await p.locator('.classic-cell:not(:disabled)').first().click();break;
   case'nim':await p.locator('.classic-confirm').click();break;
   case'billiards':await p.getByRole('button',{name:'击球 · 空格',exact:true}).click();break;
   case'badminton':await p.getByRole('button',{name:'高远球 1',exact:true}).click();break;
   case'tabletennis':await p.getByRole('button',{name:'回击 · 空格',exact:true}).click();break;
   case'archery':await p.getByRole('button',{name:'放箭 · 空格',exact:true}).click();break;
   case'penalty':await p.locator('.sports-zones button').first().click();break;
   case'checkers':{const b=await p.locator('canvas').boundingBox();for(const i of[17,35])await p.mouse.click(b.x+(59+i%8*46)/440*b.width,b.y+(59+(i>>3)*46)/440*b.height);break;}
  }
  await p.waitForFunction(()=>Number(document.querySelector('#game-root').dataset.eventCount)>0,{},{timeout:6000});
  const event=await p.locator('.match-cue').textContent();assert.ok(event);assert.ok((await p.locator('.match-guide-state').textContent()).length>0);
  await p.locator('#pause-local').click();await p.waitForTimeout(80);
  const frozen=await p.evaluate(()=>({canvas:[...document.querySelectorAll('#game-root canvas')].map(c=>c.toDataURL()),moves:__DUIZUO__.getLocal().view.scores,animations:document.querySelector('#game-root').getAnimations({subtree:true}).filter(a=>a.playState==='running').length}));
  await p.waitForTimeout(160);assert.equal(await p.evaluate(()=>JSON.stringify([...document.querySelectorAll('#game-root canvas')].map(c=>c.toDataURL()))),JSON.stringify(frozen.canvas),id+' paused Canvas');assert.equal(frozen.animations,0,id+' paused DOM animations');
  await p.locator('#menu-continue').click();await p.waitForTimeout(350);
  assert.equal(await p.locator('.match-ghost,.puzzle-motion-tile,.puzzle-line-sweep').count(),0,id+' transient cleanup');
  await p.screenshot({path:dir+'/'+id+'-played.png',fullPage:true});
  checks.push({id,check:'actual control, state feedback, pause and transient cleanup',event});
  await p.locator('#back').click();await p.waitForTimeout(70);assert.equal(await p.evaluate(()=>__audit().pending),baseline,id+' RAF cleanup');
 }
 // Every game at narrow portrait and landscape. Stable nodes preserve keyboard and IME.
 for(const size of[{width:390,height:844},{width:320,height:740},{width:844,height:390}]){await p.setViewportSize(size);for(const{id}of cases){await p.evaluate(id=>__DUIZUO__.openLocal(id),id);await p.waitForTimeout(50);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,id+' overflow '+size.width);assert.equal(await p.locator('.match-guide').count(),1);checks.push({id,check:'responsive',...size});if(size.width===390)await p.screenshot({path:dir+'/'+id+'-390.png',fullPage:true});await p.locator('#back').click();}}
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),q=await reduced.newPage();q.on('pageerror',e=>errors.push(e.stack));await q.goto(base);
 const f=fixture('g2048');await q.evaluate(saved=>__DUIZUO__.openLocal('g2048',{saved}),f.saved);await q.locator('.puzzle-dir-left').click();assert.equal(await q.locator('.puzzle-motion-tile').count(),0);assert.equal(await q.evaluate(()=>__DUIZUO__.getLocal().view.scores[0]),8);checks.push({check:'reduced motion preserves exact merge and score'});await reduced.close();
 await ctx.close();
}catch(e){errors.push(e.stack);process.exitCode=1;}finally{await browser.close();await app.close();await writeFile(dir+(process.env.GAME_IDS?'/targeted-report.json':'/experience-report.json'),JSON.stringify({checks,errors,at:new Date().toISOString()},null,2));console.log(JSON.stringify({checks:checks.length,errors}));}
