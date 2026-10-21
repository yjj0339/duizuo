import {chromium} from 'file:///D:/codexAI/.runtime/browser-tools/node_modules/pwcore/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:4387';
const dir=new URL('../artifacts/',import.meta.url);await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'D:/codexAI/.runtime/browsers/chromium-1234/chrome-win64/chrome.exe'});
const errors=[],results=[];
try{
 const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.stack));
 await page.goto(base,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__DUO__);
 await page.screenshot({path:new URL('lobby-desktop.png',dir).pathname.replace(/^\//,''),fullPage:true});
 results.push({name:'lobby 20 cards',ok:await page.locator('[data-game]').count()===20});
 const ids=await page.evaluate(()=>window.__DUO__.catalog.map(g=>g.id));
 for(const width of [390,320]){
   await page.setViewportSize({width,height:844});
   await page.screenshot({path:new URL(`lobby-${width}.png`,dir).pathname.replace(/^\//,''),fullPage:true});
   for(const id of ids){
     await page.evaluate(id=>window.__DUO__.openLocal(id),id);await page.waitForTimeout(120);
     const state=await page.evaluate(()=>({state:window.__DUO__.getLocal()?.view?.status,overflow:document.documentElement.scrollWidth>innerWidth+1,children:document.querySelector('#game-root').childElementCount}));
     results.push({name:`${id} mount at ${width}`,ok:state.state==='playing'&&!state.overflow&&state.children>0,...state});
     if(width===390)await page.screenshot({path:new URL(`game-${id}.png`,dir).pathname.replace(/^\//,''),fullPage:true});
     await page.locator('[data-local-player="1"]').click();await page.waitForTimeout(60);
     await page.locator('#back').click();
   }
 }
 await page.setViewportSize({width:1440,height:1000});await page.locator('#nickname').fill('桃桃');await page.locator('#create').click();
 await page.waitForFunction(()=>window.__DUO__.getSnapshot()?.room.code);
 const code=await page.evaluate(()=>window.__DUO__.getSnapshot().room.code);
 const ctxB=await browser.newContext({viewport:{width:390,height:844}}),b=await ctxB.newPage();b.on('pageerror',e=>errors.push(e.message));await b.goto(base,{waitUntil:'networkidle'});await b.locator('#nickname').fill('薄荷');await b.locator('#room-code').fill(code);await b.locator('#join-form button').click();await b.waitForFunction(()=>window.__DUO__.getSnapshot()?.room.players.every(Boolean));
 await page.locator('#ready').click();await b.locator('#ready').click();await page.waitForFunction(()=>window.__DUO__.getSnapshot()?.room.phase==='playing');
 await page.screenshot({path:new URL('online-gomoku.png',dir).pathname.replace(/^\//,''),fullPage:true});
 results.push({name:'two actual browser clients join and start',ok:await b.locator('#play-screen').isVisible()});
 await page.evaluate(()=>window.__DUO__.send({type:'place',index:112}));await b.waitForTimeout(300);
 const views=await Promise.all([page,b].map(p=>p.evaluate(()=>window.__DUO__.getSnapshot().game)));
 results.push({name:'authoritative board replicated to both browser clients',ok:JSON.stringify(views[0].board)===JSON.stringify(views[1].board)});
 await page.evaluate(()=>window.__DUO__.send({type:'resign'}));await b.waitForFunction(()=>window.__DUO__.getSnapshot()?.room.phase==='finished');
 results.push({name:'both browser clients show result',ok:await page.locator('#game-result').isVisible()&&await b.locator('#game-result').isVisible()});
 await ctxB.close();await ctx.close();
}finally{await browser.close();}
const report={results,errors};await writeFile(new URL('ui-inspection.json',dir),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(errors.length||results.some(r=>!r.ok))process.exitCode=1;
