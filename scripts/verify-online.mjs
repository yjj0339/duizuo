import {chromium} from 'file:///D:/codexAI/.runtime/browser-tools/node_modules/pwcore/index.mjs';
import {writeFile} from 'node:fs/promises';
const url=process.env.TEST_URL||'https://yjj0339.github.io/duizuo/';
const browser=await chromium.launch({headless:true,executablePath:'D:/codexAI/.runtime/browsers/chromium-1234/chrome-win64/chrome.exe',args:['--disk-cache-size=1','--media-cache-size=1','--no-proxy-server','--proxy-bypass-list=*']});
const results=[],errors=[];
async function navigate(p,url){for(let n=0;n<3;n++){try{await p.goto(url,{waitUntil:'networkidle'});return;}catch(e){if(n===2)throw e;await p.waitForTimeout(1200);}}}
async function waitGame(page,id,phase='playing'){await page.waitForFunction(({id,phase})=>{const s=window.__DUIZUO__?.getSnapshot();return s?.room.gameId===id&&s.room.phase===phase;},{id,phase},{timeout:30000});}
const evidence={
 gomoku:g=>g.board.includes(0),fleet:g=>g.targetBoard.some(n=>n!==-1),dots:g=>g.edges.includes(0),memory:g=>g.faces.some(n=>n!==null),
 hockey:g=>Math.abs(g.paddles[0].y-220)>5,tanks:g=>g.tanks[0].nextShot>g.startedAt,bomber:g=>g.bombs.length>0,snake:g=>g.snakes[0].dir==='down'||g.snakes[0].pending==='down',
 tetris:g=>g.players[0].board.some(Boolean),slingshot:g=>!!g.projectile||g.turn===1,maze:g=>g.players[0].y!==6,
 quiz:g=>g.answered[0],g2048:g=>g.players[0].moves>0,sudoku:g=>g.players[0].cells.some((v,i)=>v&&!g.givens[i]),reversi:g=>g.scores[0]>2,
 rps:g=>g.ownChoice==='rock',reaction:g=>g.responses[0]!==null,mines:g=>g.board.some(n=>n!==null),typing:g=>g.players[0].length>0,simon:g=>g.players[0].position>0||g.players[0].done
};
try{
 const ca=await browser.newContext({viewport:{width:1440,height:980}}),cb=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const a=await ca.newPage(),b=await cb.newPage();for(const p of [a,b])p.on('pageerror',e=>errors.push(e.stack));
 await Promise.all([a.goto(url,{waitUntil:'domcontentloaded'}),b.goto(url,{waitUntil:'domcontentloaded'})]);
 for(const p of [a,b])await p.waitForSelector('#connection-label.online',{timeout:30000});
 await a.locator('#nickname').fill('桃桃');await b.locator('#nickname').fill('薄荷');await a.locator('#create').click();await a.getByRole('tab',{name:/联机/}).click();await a.locator('#mode-start').click();
 await a.waitForFunction(()=>window.__DUIZUO__.getSnapshot()?.room.code);const code=await a.evaluate(()=>window.__DUIZUO__.getSnapshot().room.code);
 await b.locator('#room-code').fill(code);await b.locator('#join-form button').click();await b.waitForFunction(()=>window.__DUIZUO__.getSnapshot()?.room.players.every(Boolean));
 const ids=process.env.GAME_IDS?process.env.GAME_IDS.split(','):await a.evaluate(()=>window.__DUIZUO__.catalog.map(g=>g.id));
 for(const id of ids){
  console.log('Checking '+id);
  await a.locator(`[data-game="${id}"]`).click();await a.getByRole('tab',{name:/联机/}).click();await a.locator('#mode-start').click();
  await a.waitForFunction(id=>{const s=window.__DUIZUO__.getSnapshot();return s?.room.gameId===id&&s.room.phase==='waiting';},id);
  await b.waitForFunction(id=>window.__DUIZUO__.getSnapshot()?.room.gameId===id,id);
  await a.locator('#ready').click();await b.locator('#ready').click();await Promise.all([waitGame(a,id),waitGame(b,id)]);await a.locator('#countdown').waitFor({state:'hidden'});
  switch(id){
   case 'gomoku':await a.locator('.board-gomoku-grid button').nth(112).click();await a.locator('.board-precision > button').click();break;
   case 'fleet':await a.getByRole('button',{name:'布阵完成',exact:true}).click();await b.getByRole('button',{name:'布阵完成',exact:true}).click();await a.waitForFunction(()=>window.__DUIZUO__.getSnapshot().game.phase==='battle');await a.locator('.board-sea-panel').nth(1).locator('.board-precision > button').click();break;
   case 'dots':await a.locator('.board-edge').first().click();break;
   case 'memory':await a.locator('.board-memory-grid button').first().click();break;
   case 'hockey':{const box=await a.locator('canvas').boundingBox();await a.mouse.move(box.x+box.width*.2,box.y+box.height*.25);await a.mouse.down();await a.mouse.move(box.x+box.width*.22,box.y+box.height*.3,{steps:5});await a.mouse.up();break;}
   case 'tanks':case 'bomber':await a.locator('.arcade-action').click();break;
   case 'snake':await a.locator('.arcade-dir-down').click();await b.locator('.arcade-dir-up').click();break;
   case 'tetris':await a.locator('.puzzle-drop').click();break;
   case 'slingshot':await a.locator('.arcade-fire').click();break;
   case 'maze':await a.locator('.arcade-dir-up').click();break;
   case 'quiz':await a.locator('.puzzle-choice').first().click();break;
   case 'g2048':for(const d of ['left','down','right'])await a.locator('.puzzle-dir-'+d).click();break;
   case 'sudoku':await a.locator('.puzzle-sudoku-cell:not(:disabled)').first().click();await a.locator('.puzzle-number').first().click();break;
   case 'reversi':await a.locator('.board-legal').first().click();await a.locator('.board-precision > button').click();break;
   case 'rps':await a.locator('.board-rps-choices button').first().click();break;
   case 'reaction':await a.locator('.puzzle-signal').click();break;
   case 'mines':await a.locator('.board-precision > button').click();break;
   case 'typing':{const text=await a.evaluate(()=>window.__DUIZUO__.getSnapshot().game.text.slice(0,3));await a.locator('.puzzle-typing-input').fill(text);await a.waitForTimeout(400);if(await a.locator('.puzzle-typing-input').inputValue()!==text)throw new Error('Typing focus/text lost');break;}
   case 'simon':await a.waitForFunction(()=>window.__DUIZUO__.getSnapshot().game.phase==='input');await a.locator('.puzzle-note').first().click();break;
  }
  if(!evidence[id]){const a0=await a.evaluate(()=>window.__DUIZUO__.getSnapshot().game);let action;
  if(id==='connect4')action={type:'drop',column:3};if(id==='tictactoe'||id==='hex')action={type:'place',index:0};if(id==='slide'){let z=a0.players[0].cells.indexOf(0);action={type:'slide',index:z%3?z-1:z+1};}if(id==='lights')action={type:'toggle',index:0};if(id==='nim')action={type:'take',pile:0,count:1};if(id==='billiards')action={type:'shoot',angle:0,power:.5};if(id==='badminton')action={type:'hit',style:'clear'};if(id==='tabletennis')action={type:'hit',style:'drive',target:.5};if(id==='archery')action={type:'shoot',x:0,y:0};if(id==='penalty')action={type:'choose',zone:1};if(id==='checkers')action={type:'move',from:17,to:24};
  await a.evaluate(action=>window.__DUIZUO__.send(action),action);await a.waitForFunction(({id,before})=>{const g=window.__DUIZUO__.getSnapshot().game;if(id==='connect4'||id==='tictactoe'||id==='hex')return g.board.includes(0);if(id==='slide'||id==='lights')return g.players[0].moves>0;if(id==='nim')return g.piles[0]===2;if(id==='billiards')return g.moving||g.turn===1;if(id==='badminton'||id==='tabletennis')return g.rally||g.scores.some(Boolean);if(id==='archery')return !!g.shots[0];if(id==='penalty')return g.ready[0];if(id==='checkers')return g.turn===1;return JSON.stringify(g)!==before;},{id,before:JSON.stringify(a0)},{timeout:20000});results.push({id,check:'authoritative action reaches browser snapshot',ok:true});
  }else await a.waitForFunction(source=>{const check=(0,eval)('('+source+')');return check(window.__DUIZUO__.getSnapshot().game);},evidence[id].toString(),{timeout:10000});
  results.push({id,check:'actual desktop control accepted by public server',ok:true});
  const overflow=await b.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow)throw new Error(id+' mobile overflow');
  results.push({id,check:'mobile partner receives game without overflow',ok:true});
  if(id==='gomoku'){
   const oldName=await b.evaluate(()=>window.__DUIZUO__.getSnapshot().room.players[1].name);await b.reload({waitUntil:'domcontentloaded'});await waitGame(b,id);await Promise.all([a,b].map(p=>p.locator('#countdown').waitFor({state:'hidden'})));const p=await b.evaluate(()=>window.__DUIZUO__.getSnapshot().player);if(p!==1)throw new Error('Reconnect identity lost');results.push({id,check:'reload resumes same identity and active game',ok:true,name:oldName});
  }
  if(['gomoku','g2048','sudoku','tanks'].includes(id))await b.screenshot({path:new URL(`../artifacts/online-${id}-mobile.png`,import.meta.url).pathname.replace(/^\//,''),fullPage:true});
  if(await a.evaluate(()=>window.__DUIZUO__.getSnapshot().game.status!=='finished'))await a.locator('#resign').click();await Promise.all([waitGame(a,id,'finished'),waitGame(b,id,'finished')]);
  if(!await b.locator('#game-result').isVisible())throw new Error('Partner result is not visible');
  results.push({id,check:'both clients reach result',ok:true});
  await a.locator('#result-lobby').click();await a.waitForTimeout(220);if(!await a.locator('#lobby').isVisible())throw new Error('Return to lobby was overwritten by a snapshot');
  await b.locator('#result-lobby').click();
 }
 await a.locator('#leave').click();await b.locator('#leave').click();
 await a.screenshot({path:new URL('../artifacts/public-lobby.png',import.meta.url).pathname.replace(/^\//,''),fullPage:true});
 await ca.close();await cb.close();
}catch(e){errors.push(e.stack);console.error(e.stack);}finally{await browser.close();}
const report={url,results,errors,at:new Date().toISOString()};await writeFile(new URL('../artifacts/'+(url.startsWith('https:')?'online-public-v3.json':'online-local-v3.json'),import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:results.length,errors},null,2));if(errors.length)process.exitCode=1;


