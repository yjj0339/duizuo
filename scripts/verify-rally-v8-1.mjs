import {chromium} from 'file:///D:/codexAI/.runtime/browser-tools/node_modules/pwcore/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createApp} from '../server/index.js';
import {engines} from '../shared/engines.js';
const dir=process.env.ARTIFACT_DIR||'D:/codexAI/duizuo/artifacts/dimension-v8/rally-ui';await mkdir(dir,{recursive:true});
const app=await createApp({persist:false}),address=await app.listen(0),browser=await chromium.launch({headless:true,executablePath:'D:/codexAI/.runtime/browsers/chromium-1234/chrome-win64/chrome.exe',...(process.env.TEST_PROXY?{proxy:{server:process.env.TEST_PROXY.trim()}}:{args:['--no-proxy-server']})});
const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),p=await context.newPage(),checks=[],errors=[];p.on('pageerror',e=>errors.push(e.stack));
const fixture=()=>{const state=engines.badminton.create(42,1000);state.rally=true;state.last=0;state.rallyHits=1;state.ball={x:461.5,y:280,vx:0,vy:0};return {version:2,id:'badminton',state,mode:'practice',level:'master',human:1,seed:42,now:1000,brain:{},ui:{seat:1}};};
const open=async()=>{await p.evaluate(saved=>__DUIZUO__.openLocal('badminton',{saved}),fixture());await p.waitForFunction(()=>window.__SPORTS_MODEL_STATS__?.frames>1);};
const press=async pause=>p.evaluate(pause=>{const before=__DUIZUO__.getLocal().view,button=document.querySelector('.badminton-hit');button.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1}));const queued=document.querySelector('.sports-coach').textContent;__DUIZUO__.send({type:'move',x:500});if(pause)document.querySelector('#game-menu').click();return {queued,beforeShots:before.stats[1].shots};},pause);
try{
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:'+address.port,{waitUntil:'networkidle'});
 await open();const result=await press(false);assert.match(result.queued,/已准备挥拍/);await p.waitForFunction(()=>__DUIZUO__.getLocal().view.stats[1].shots===1);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>__DUIZUO__.getLocal().view.stats[1].shots),1);checks.push('early touchscreen hit waits for legal reach and sends exactly one stroke');await p.locator('#back').click();
 await open();assert.match((await press(true)).queued,/已准备挥拍/);await p.waitForFunction(()=>__DUIZUO__.getLocal().paused);await p.waitForTimeout(35);await p.locator('#menu-continue').click();await p.waitForTimeout(180);assert.equal(await p.evaluate(()=>__DUIZUO__.getLocal().view.stats[1].shots),0);checks.push('opening the menu clears a queued stroke instead of firing after resume');await p.locator('#back').click();
 await open();await p.evaluate(()=>{const b=document.querySelector('.badminton-jump');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:2}));});assert.ok(await p.evaluate(()=>{const v=__DUIZUO__.getLocal().view;return v.players[1].jump>v.now;}));checks.push('jump activates on touch down without waiting for finger release');await p.locator('#back').click();
}catch(e){errors.push(e.stack);await p.screenshot({path:dir+'/failure.png',fullPage:true}).catch(()=>{});process.exitCode=1;}
finally{if(errors.length)process.exitCode=1;await browser.close();await app.close();await writeFile(dir+'/report.json',JSON.stringify({checks,errors,at:new Date().toISOString()},null,2));console.log(JSON.stringify({checks,errors}));}
