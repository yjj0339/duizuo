import {chromium} from 'file:///D:/codexAI/.runtime/browser-tools/node_modules/pwcore/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {catalog} from '../shared/catalog.js';import {engines} from '../shared/engines.js';import {createApp} from '../server/index.js';
const dir=process.env.ARTIFACT_DIR||'D:/codexAI/duizuo/artifacts/mobile-v9/audit';await mkdir(dir,{recursive:true});
const app=await createApp({persist:false}),address=await app.listen(0),browser=await chromium.launch({headless:true,executablePath:'D:/codexAI/.runtime/browsers/chromium-1234/chrome-win64/chrome.exe',args:['--no-proxy-server']}),context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:1}),page=await context.newPage(),rows=[],errors=[];
page.on('pageerror',e=>errors.push(e.stack));page.setDefaultTimeout(8000);
const ids=process.env.GAME_IDS?.split(',')||catalog.map(g=>g.id);
try{await page.goto('http://127.0.0.1:'+address.port);await page.waitForFunction(()=>window.__DUIZUO__);
for(const id of ids){
 const saved={version:2,id,state:engines[id].create(42,1000),mode:'practice',level:'master',human:0,seed:42,now:1000,brain:{},ui:{seat:0}};
 await page.evaluate(({id,saved})=>__DUIZUO__.openLocal(id,{saved}),{id,saved});
 if(['badminton','tabletennis','billiards'].includes(id))await page.waitForFunction(()=>window.__SPORTS_MODEL_STATS__?.frames>2);
 for(const [name,width,height,left,right]of [['portrait',390,844,0,0],['landscape',844,390,0,0],['left',844,390,44,0],['right',844,390,0,44]]){
  await page.setViewportSize({width,height});await page.evaluate(({left,right})=>{document.documentElement.style.setProperty('--safe-left',left+'px');document.documentElement.style.setProperty('--safe-right',right+'px');window.scrollTo(0,0);},{left,right});await page.waitForTimeout(160);
  const row=await page.evaluate(()=>{const visible=e=>e.checkVisibility()&&e.getBoundingClientRect().width>0;const controls=[...document.querySelectorAll('#play-screen button,#play-screen input,#play-screen textarea,.court-joystick')].filter(visible).map(e=>{const r=e.getBoundingClientRect();return{label:e.getAttribute('aria-label')||e.textContent?.slice(0,30),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};});return{scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],viewport:[innerWidth,innerHeight],paused:__DUIZUO__.getLocal()?.paused,controls,canvas:[...document.querySelectorAll('canvas')].filter(visible).map(e=>({w:e.clientWidth,h:e.clientHeight}))};});
  rows.push({id,name,...row});await page.screenshot({path:`${dir}/${id}-${name}.png`});if(row.scroll[0]>width+1)errors.push(`${id} ${name}: horizontal overflow ${row.scroll[0]}`);
  if(['badminton','tabletennis','billiards'].includes(id)){if(row.paused)errors.push(`${id} ${name}: rotation paused match`);if(row.scroll[1]>height+3)errors.push(`${id} ${name}: viewport overflow ${row.scroll[1]}`);for(const b of row.controls)if(b.y<0||b.y+b.h>height+1||b.x<left||b.x+b.w>width-right+1)errors.push(`${id} ${name}: occluded control ${JSON.stringify(b)}`);}
 }
 await page.locator('#back').click();console.log('AUDIT '+id);
}
}catch(e){errors.push(e.stack);}finally{await browser.close();await app.close();await writeFile(dir+'/report.json',JSON.stringify({rows,errors},null,2));console.log(JSON.stringify({screens:rows.length,errors}));if(errors.length)process.exitCode=1;}
