import {chromium} from 'file:///D:/codexAI/.runtime/browser-tools/node_modules/pwcore/index.mjs';
import {createApp} from '../server/index.js';import {writeFile,mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';
const app=await createApp({persist:false}),address=await app.listen(0),base=process.env.TEST_URL||'http://127.0.0.1:'+address.port;
const browser=await chromium.launch({headless:true,executablePath:'D:/codexAI/.runtime/browsers/chromium-1234/chrome-win64/chrome.exe',...(process.env.TEST_PROXY?{proxy:{server:process.env.TEST_PROXY}}:{})});
const report={base,checks:[],errors:[]};
try{const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.stack));
 if(process.env.TEST_URL)await p.route('https://yjj0339.github.io/duizuo/runtime-endpoint.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({server:'https://words-clause-sacramento-virtue.trycloudflare.com'})}));
 const url=new URL(base);url.searchParams.set('server','https://words-clause-sacramento-virtue.trycloudflare.com');url.searchParams.set('v','navigation-v6');await p.goto(url.href);await p.locator('#connection-label.online').waitFor({timeout:60000});
 assert.notEqual(new URL(p.url()).searchParams.get('server'),'https://words-clause-sacramento-virtue.trycloudflare.com');report.checks.push('retired tunnel link finds healthy published endpoint automatically');
 assert.equal(await p.locator('#version-info').textContent(),'v3.1.0 · 更新记录');report.checks.push('v3.1.0 interface loaded');
 await p.locator('button[data-game="badminton"]').click();await p.locator('#solo-style').selectOption('practice');await p.locator('#mode-start').click();await p.locator('#game-menu').click();await p.screenshot({path:'D:/codexAI/duizuo/artifacts/navigation-v6/recovered-public-menu.png'});await p.locator('#menu-lobby').click();await p.locator('#lobby').waitFor();report.checks.push('recovered page supports game entry, menu and save return');
 report.url=p.url();await context.close();assert.deepEqual(report.errors,[]);
}catch(e){report.errors.push(String(e));process.exitCode=1;}finally{await browser.close();await app.close();await mkdir('D:/codexAI/duizuo/artifacts/navigation-v6',{recursive:true});await writeFile('D:/codexAI/duizuo/artifacts/navigation-v6/'+(process.env.TEST_URL?'public-endpoint':'local-endpoint')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
