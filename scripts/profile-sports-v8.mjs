import {chromium} from 'file:///D:/codexAI/.runtime/browser-tools/node_modules/pwcore/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {createApp} from '../server/index.js';
import {engines} from '../shared/engines.js';
import * as bots from '../ai/rackets.js';
const label=process.env.PROFILE_LABEL||'baseline',dir='D:/codexAI/duizuo/artifacts/dimension-v8/'+label;
await mkdir(dir,{recursive:true});
const app=await createApp({persist:false}),a=await app.listen(0),browser=await chromium.launch({headless:true,executablePath:'D:/codexAI/.runtime/browsers/chromium-1234/chrome-win64/chrome.exe',args:['--no-proxy-server']});
const report={label,at:new Date().toISOString(),scenarios:[],errors:[]};
try{
 for(const viewport of [{width:1280,height:980},{width:844,height:390}]){
  const ctx=await browser.newContext({viewport,deviceScaleFactor:2}),p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  await p.addInitScript(()=>{const native=requestAnimationFrame;window.__profile={frames:[],cpu:[],last:0,enabled:false};window.requestAnimationFrame=fn=>native(t=>{const q=window.__profile,start=performance.now();if(q.enabled&&q.last!==t){if(q.last)q.frames.push(t-q.last);q.last=t;}fn(t);if(q.enabled)q.cpu.push(performance.now()-start);});});
  await p.goto('http://127.0.0.1:'+a.port,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.__DUIZUO__);
  for(const id of ['badminton','tabletennis','billiards']){
   const state=engines[id].create(42,1000),saved={version:2,id,state,mode:id==='billiards'?'practice':'ai',level:'master',human:0,seed:42,now:1000,brain:{},ui:{}};
   await p.evaluate(({id,saved})=>__DUIZUO__.openLocal(id,{saved}),{id,saved});await p.locator('.sports-canvas').waitFor();await p.waitForTimeout(1800);
   if(id==='billiards')await p.getByRole('button',{name:'击球 · 空格',exact:true}).click();
   await p.evaluate(()=>Object.assign(__profile,{frames:[],cpu:[],last:0,enabled:true,modelStart:window.__SPORTS_MODEL_STATS__?.frames||0,startedAt:performance.now()}));
   const brain={},end=Date.now()+8000;
   while(Date.now()<end){if(bots[id]){const v=await p.evaluate(()=>__DUIZUO__.getLocal()?.view);if(v?.status==='playing'){const action=bots[id](v,0,brain,'master',v.now);if(action)await p.evaluate(a=>__DUIZUO__.send(a),action);}}await p.waitForTimeout(50);}
   const sample=await p.evaluate(()=>{__profile.enabled=false;const q=__profile,c=document.querySelector('.sports-canvas'),r=c.getBoundingClientRect(),sort=a=>a.sort((a,b)=>a-b),pct=(a,t)=>a[Math.min(a.length-1,Math.floor(a.length*t))]||0;sort(q.frames);sort(q.cpu);return{actualRenderFPS:window.__SPORTS_MODEL_STATS__?(__SPORTS_MODEL_STATS__.frames-q.modelStart)*1000/(performance.now()-q.startedAt):null,frames:q.frames.length,fps:1000/(q.frames.reduce((s,n)=>s+n,0)/q.frames.length),frameP95:pct(q.frames,.95),frameP99:pct(q.frames,.99),longFrames:q.frames.filter(n=>n>34).length,callbackP95:pct(q.cpu,.95),callbackP99:pct(q.cpu,.99),buffer:[c.width,c.height],css:[r.width,r.height],renderer:c.dataset.renderer,stats:window.__SPORTS_MODEL_STATS__||null};});
   report.scenarios.push({id,viewport,...sample});await p.locator('.sports-scene').screenshot({path:dir+'/'+id+'-'+viewport.width+'.png'});await p.locator('#back').click();console.log(JSON.stringify(report.scenarios.at(-1)));
  }
  await ctx.close();
 }
}finally{await browser.close();await app.close();await writeFile(dir+'/profile.json',JSON.stringify(report,null,2));}
