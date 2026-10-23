import {chromium} from 'file:///D:/codexAI/.runtime/browser-tools/node_modules/pwcore/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {decide} from '../ai/strategies.js';
const dir='D:/codexAI/duizuo/artifacts/visual-v4';await mkdir(dir+'/video',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'D:/codexAI/.runtime/browsers/chromium-1234/chrome-win64/chrome.exe',args:['--no-proxy-server','--disable-quic']}),checks=[],errors=[];
try {
 const ctx=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:dir+'/video',size:{width:1280,height:900}}});
 await ctx.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window),caf=window.cancelAnimationFrame.bind(window),pending=new Set();let count=0;window.requestAnimationFrame=fn=>{const id=raf(t=>{pending.delete(id);count++;fn(t);});pending.add(id);return id;};window.cancelAnimationFrame=id=>{pending.delete(id);caf(id);};window.__animationAudit=()=>({pending:pending.size,count});});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.stack));await p.goto('http://127.0.0.1:4390',{waitUntil:'networkidle'});const baseline=await p.evaluate(()=>window.__animationAudit().pending);
 for(const id of ['billiards','badminton','tabletennis','archery','penalty','checkers']){
  await p.evaluate(id=>window.__DUIZUO__.openAI(id,{level:'expert',human:0}),id);await p.locator('#focus-play').click();await p.waitForTimeout(130);const start=await p.evaluate(()=>window.__animationAudit().count);const brain={};let actions=0;
  const until=Date.now()+(['badminton','tabletennis'].includes(id)?11000:id==='billiards'?8000:5000);
  while(Date.now()<until){const local=await p.evaluate(()=>window.__DUIZUO__.getLocal()),v=local.view;if(v.status==='finished')break;const a=decide(id,v,0,brain,'master',v.now);if(a){
   if(a.type==='move'&&['badminton','tabletennis'].includes(id)){const box=await p.locator('.sports-canvas').boundingBox(),x=id==='badminton'?a.x:74,y=id==='badminton'?380:a.y;await p.mouse.click(box.x+x/720*box.width,box.y+(y+30)/460*box.height);}
   else if(a.type==='hit')await p.getByRole('button',{name:id==='badminton'?(a.style==='drop'?'吊球 2':a.style==='smash'?'扣杀 3':'高远球 1'):(a.style==='lob'?'挑高球 2':a.style==='smash'?'快攻 3':'回击 · 空格'),exact:true}).click();
   else if(id==='billiards'&&a.type==='shoot'){const b=v.balls[0],box=await p.locator('.sports-canvas').boundingBox(),x=24+(b.x+Math.cos(a.angle)*100)*672/720,y=42+(b.y+Math.sin(a.angle)*100)*672/720;await p.mouse.click(box.x+x/720*box.width,box.y+y/460*box.height);await p.locator('input[type=range]').fill(a.power.toFixed(2));await p.getByRole('button',{name:'击球 · 空格',exact:true}).click();}
   else if(id==='archery'){await p.getByRole('button',{name:'放箭 · 空格',exact:true}).click();}
   else if(id==='penalty'){await p.locator('.sports-zones button').nth(a.zone).click();}
   else if(id==='checkers'){const box=await p.locator('canvas').boundingBox();for(const i of[a.from,a.to])await p.mouse.click(box.x+(59+(i%8)*46)/440*box.width,box.y+(59+(i>>3)*46)/440*box.height);}
   actions++;
  }await p.waitForTimeout(95);}
  if(id==='badminton'){await p.getByRole('button',{name:'起跳 ↑',exact:true}).click();await p.waitForTimeout(200);await p.locator('.sports-canvas').screenshot({path:dir+'/badminton-jump.png'});await p.waitForTimeout(400);}
  const end=await p.evaluate(()=>window.__animationAudit());assert.ok(end.count-start>40,id+' continuous frames');assert.ok(actions>0,id+' actions');await p.screenshot({path:dir+'/'+id+'-played.png',fullPage:true});checks.push({id,frames:end.count-start,actions});await p.locator('#back').click();await p.waitForTimeout(90);assert.equal(await p.evaluate(()=>window.__animationAudit().pending),baseline,id+' cleans animation loop');
 }
 await ctx.close();checks.push({check:'all six sports clean animation loops on exit'});
}catch(e){errors.push(e.stack);process.exitCode=1;}finally{await browser.close();await writeFile(dir+'/motion-report.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors}));}
