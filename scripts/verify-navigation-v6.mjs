import {chromium} from 'file:///D:/codexAI/.runtime/browser-tools/node_modules/pwcore/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import {catalog} from '../shared/catalog.js';import {createApp} from '../server/index.js';
const dir=process.env.ARTIFACT_DIR||'D:/codexAI/duizuo/artifacts/navigation-v6';await mkdir(dir,{recursive:true});
const app=await createApp({persist:false,countdownMs:80}),address=await app.listen(0),base=process.env.TEST_URL||'http://127.0.0.1:'+address.port;
const browser=await chromium.launch({headless:true,executablePath:'D:/codexAI/.runtime/browsers/chromium-1234/chrome-win64/chrome.exe',...(process.env.TEST_PROXY?{proxy:{server:process.env.TEST_PROXY}}:{args:['--no-proxy-server']})});
const checks=[],errors=[];let lastPage;
function pass(text){checks.push(text);console.log('PASS '+text);}
async function lobby(p){await p.locator('#lobby').waitFor({state:'visible'});await p.waitForFunction(()=>!window.__DUIZUO__.getLocal());await p.waitForTimeout(100);}
async function play(p,id){await p.waitForFunction(id=>window.__DUIZUO__.getLocal()?.id===id,id);await p.locator('#play-screen').waitFor({state:'visible'});await p.waitForTimeout(120);}
async function open(p,id){await p.locator(`button[data-game="${id}"]`).click();if(await p.locator('#mode-continue').count())await p.locator('#mode-continue').click();else{await p.locator('#solo-style').selectOption('practice');await p.locator('#mode-start').click();}await play(p,id);}
try{
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const p=lastPage=await ctx.newPage();p.setDefaultTimeout(9000);p.on('pageerror',e=>errors.push(e.stack));await p.goto(base);await p.waitForFunction(()=>window.__DUIZUO__);
 const ids=process.env.GAME_IDS?catalog.filter(g=>process.env.GAME_IDS.split(',').includes(g.id)):catalog;
 for(const {id} of ids){
  await open(p,id);assert.equal(await p.locator('#dialog').evaluate(d=>d.open),false,id+' mode picker closed');
  for(const sel of ['#back','#game-menu']){const b=await p.locator(sel).boundingBox();assert.ok(b.width>=44&&b.height>=44,id+' touch target');}
  await p.evaluate(()=>window.scrollTo(0,Math.min(500,document.body.scrollHeight-innerHeight)));const b=await p.locator('#back').boundingBox();assert.ok(b.y>=0&&b.y<innerHeightFallback(),id+' back stays on screen');
  await p.locator('#game-menu').click();assert.equal(await p.evaluate(()=>__DUIZUO__.getLocal().paused),true);
  await p.locator('#menu-rules').click();assert.equal(await p.locator('#dialog').getAttribute('data-depth'),'2');
  await p.locator('#dialog-back').click();await p.locator('#menu-continue').waitFor();
  if(['billiards','badminton','gomoku'].includes(id))await p.screenshot({path:dir+'/'+id+'-menu-mobile.png'});
  await p.locator('#menu-lobby').click();await lobby(p);assert.equal(await p.locator('#return-strip').isVisible(),true);
  assert.equal(await p.evaluate(id=>JSON.parse(localStorage.getItem('duo:solo-games-v3'))[id]?.id,id),id);
  await open(p,id);await p.locator('#back').click();await lobby(p);pass(id+': menu / rules / save / resume / back');
 }
 await open(p,'connect4');await p.locator('.classic-cell:not(:disabled)').first().click();const board=await p.evaluate(()=>__DUIZUO__.getLocal().view.board);
 await p.locator('#game-menu').click();await p.locator('#menu-rules').click();await p.evaluate(()=>history.back());await p.locator('#menu-continue').waitFor();await p.evaluate(()=>history.back());await p.waitForFunction(()=>!document.querySelector('#dialog').open);assert.equal(await p.evaluate(()=>__DUIZUO__.getLocal().paused),false);
 await p.evaluate(()=>history.back());await lobby(p);await p.reload();await open(p,'connect4');assert.deepEqual(await p.evaluate(()=>__DUIZUO__.getLocal().view.board),board);pass('browser Back peels rules, menu, then game; reload restores board');
 await p.keyboard.press('Escape');await p.locator('#menu-continue').waitFor();await p.keyboard.press('ArrowRight');assert.deepEqual(await p.evaluate(()=>__DUIZUO__.getLocal().view.board),board);
 await p.locator('#menu-restart').click();await p.locator('#confirm-cancel').click();await p.locator('#menu-continue').click();assert.deepEqual(await p.evaluate(()=>__DUIZUO__.getLocal().view.board),board);pass('Escape, keyboard isolation and restart cancellation preserve state');
 for(const viewport of [{width:320,height:740},{width:844,height:390},{width:1440,height:980}]){
  await p.setViewportSize(viewport);await p.locator('#game-menu').click();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const menu=await p.locator('#dialog').boundingBox();assert.ok(menu.x>=0&&menu.x+menu.width<=viewport.width+1&&menu.y>=0);await p.locator('#menu-focus').click();await p.locator('#game-menu').click();await p.locator('#menu-lobby').click();await lobby(p);await open(p,'connect4');pass(viewport.width+'x'+viewport.height+' menu / focus / return layout');
 }
 await p.locator('#back').click();await lobby(p);await p.locator('button[data-game="connect4"]').click();await p.locator('#mode-start').click();await p.locator('#confirm-cancel').click();await p.locator('#mode-continue').click();await play(p,'connect4');assert.deepEqual(await p.evaluate(()=>__DUIZUO__.getLocal().view.board),board);pass('mode picker overwrite confirmation keeps original save on cancel');
 await p.route('**/version.json?*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({version:'3.99.0',id:'navigation-test-next'})}));
 await p.locator('#game-menu').click();await p.locator('#menu-version').click();await p.locator('#check-update').click();await p.locator('#apply-update').waitFor();assert.equal(await p.evaluate(()=>__DUIZUO__.getLocal().paused),true);await p.locator('#apply-update').click();await p.waitForURL('**v=navigation-test-next');await open(p,'connect4');assert.deepEqual(await p.evaluate(()=>__DUIZUO__.getLocal().view.board),board);pass('update discovery is opt-in and saves solo before reload');
 await ctx.close();
 // Independent identities, Socket.IO on one side and HTTPS long polling on the other.
 const ca=await browser.newContext({viewport:{width:1440,height:980}}),cb=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await cb.addInitScript(()=>localStorage.setItem('duizuo:transport','http'));
 const a=lastPage=await ca.newPage(),b=await cb.newPage();for(const page of [a,b]){page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.stack));await page.goto(base);await page.locator('#connection-label.online').waitFor();}
 await a.locator('button[data-game="connect4"]').click();await a.locator('[data-mode="online"]').click();await a.locator('#mode-nickname').fill('桃桃');await a.locator('#mode-start').click();await a.waitForFunction(()=>__DUIZUO__.getSnapshot()?.room.code);
 const code=await a.evaluate(()=>__DUIZUO__.getSnapshot().room.code);await b.locator('#nickname').fill('薄荷');await b.locator('#room-code').fill(code);await b.locator('#join-form button').click();await b.waitForFunction(()=>__DUIZUO__.getSnapshot()?.room.players.every(Boolean));
 await a.locator('#ready').click();await b.locator('#ready').click();await a.locator('#play-screen').waitFor();await a.locator('#countdown').waitFor({state:'hidden'});await a.locator('.classic-cell:not(:disabled)').first().click();
 const first=await a.evaluate(()=>__DUIZUO__.getSnapshot().room.matchId);await a.locator('#back').click();await a.locator('#lobby').waitFor();await b.waitForFunction(()=>__DUIZUO__.getSnapshot()?.room.paused);await a.waitForTimeout(1000);assert.equal(await a.locator('#lobby').isVisible(),true);assert.equal(await a.evaluate(()=>__DUIZUO__.getSnapshot().room.matchId),first);
 await a.evaluate(()=>window.dispatchEvent(new Event('focus')));await a.waitForTimeout(300);assert.equal(await a.locator('#lobby').isVisible(),true);assert.equal(await b.evaluate(()=>__DUIZUO__.getSnapshot().room.paused),true);pass('return to room preserves match; snapshots and focus cannot force re-entry');
 if(!process.env.TEST_URL){await ca.setOffline(true);await a.waitForTimeout(400);await ca.setOffline(false);await a.evaluate(()=>window.dispatchEvent(new Event('online')));await a.waitForTimeout(900);assert.equal(await a.locator('#lobby').isVisible(),true);assert.equal(await b.evaluate(()=>__DUIZUO__.getSnapshot().room.paused),true);pass('network recovery while in room retains deliberate away state');}
 await a.locator('#resume-match').click();await a.locator('#play-screen').waitFor();await a.locator('#countdown').waitFor({state:'hidden'});assert.equal(await a.evaluate(()=>__DUIZUO__.getSnapshot().room.matchId),first);pass('continue restores the same match after protection countdown');
 await b.locator('#game-menu').click();await a.waitForFunction(()=>__DUIZUO__.getSnapshot().room.paused);await b.locator('#menu-rules').click();await b.locator('#dialog-back').click();await b.locator('#menu-lobby').click();await b.locator('#lobby').waitFor();await b.screenshot({path:dir+'/online-return-mobile.png'});await b.locator('#continue-online').click();await b.locator('#countdown').waitFor({state:'hidden'});assert.equal(await b.evaluate(()=>__DUIZUO__.getConnection().http),true);pass('HTTPS client menu, rules, room return and continue');
 await a.locator('#game-menu').click();await a.locator('#menu-resign').click();await a.locator('#confirm-cancel').click();assert.equal(await a.evaluate(()=>__DUIZUO__.getSnapshot().room.phase),'playing');await a.locator('#menu-resign').click();await a.locator('#confirm-resign').click();for(const page of [a,b])await page.locator('#game-result').waitFor();pass('confirmed resignation works while paused and settles both clients');
 await a.locator('#result-lobby').click();await b.locator('#result-lobby').click();await a.locator('#ready').click();await b.locator('#ready').click();await a.locator('#play-screen').waitFor();assert.notEqual(await a.evaluate(()=>__DUIZUO__.getSnapshot().room.matchId),first);pass('result -> room -> both ready -> new match');
 await a.locator('#game-menu').click();await a.locator('#menu-resign').click();await a.locator('#confirm-resign').click();await a.locator('#game-result').waitFor();await a.locator('#result-lobby').click();await b.locator('#result-lobby').click();await a.locator('#leave').click();await b.locator('#leave').click();await ca.close();await cb.close();
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:checks.length,errors}));
}catch(e){errors.push(String(e));await lastPage?.screenshot({path:dir+'/failure.png',fullPage:true}).catch(()=>{});throw e;}
finally{await writeFile(dir+(process.env.TEST_URL?'/public-report.json':'/report.json'),JSON.stringify({base,checks,errors},null,2));await browser.close();await app.close();}
function innerHeightFallback(){return 844;}
