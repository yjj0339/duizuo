import {stage} from './sports-stage.js';
import {palette,clamp,round,circle,ellipse,line,poly,text,gradient,shadow,racket,athlete,shuttle,stadium,net,grain} from './sports-art.js';
import {contact,jumpLift,shuttleLanding} from './racket-rules.js';

function courtHud(ui,kind){
 const row=ui.el('div','racket-scoreline'),rally=ui.el('strong','','准备开球'),record=ui.el('span'),energy=ui.el('meter');energy.min=0;energy.max=100;energy.value=100;energy.setAttribute('aria-label','体力');
 const label=ui.el('label','racket-energy','体力');label.append(energy);row.append(rally,record);if(kind==='badminton')row.append(label);ui.canvas.parentElement.before(row);
 const recent=ui.el('div','racket-recent');recent.setAttribute('aria-label','最近得分');ui.tools.after(recent);
 return v=>{rally.textContent=v.rally?`${v.rallyHits||1} 拍回合`:v.scores.some(n=>n>=10)?'局点争夺':'准备开球';record.textContent=`最长 ${Math.max(v.longestRally||0,v.rallyHits||0)} 拍 · 甜点 ${v.stats?.[ui.player]?.sweet||0} 次`;energy.value=v.players[ui.player].stamina??100;
  const sig=v.history?.length+':'+v.scores.join();if(recent.dataset.state!==sig){recent.dataset.state=sig;recent.replaceChildren();for(const h of (v.history||[]).slice(-5)){const e=ui.el('span','',`${h.player===ui.player?'我方':'对方'} +1 · ${h.reason} · ${h.shots} 拍`);e.style.setProperty('--point',palette[h.player]);recent.append(e);}if(!v.history?.length)recent.textContent='每一分会记录回合拍数和得分原因';}
 };
}
function choice(ui,label,options,initial,change){const wrap=ui.el('div','racket-choice'),name=ui.el('span','',label),group=ui.el('div');wrap.append(name,group);const list=[];for(const[value,title]of options){const b=ui.button(title,()=>{for(const [n,x]of list){x.classList.toggle('selected',n===value);x.setAttribute('aria-pressed',String(n===value));}change(value);});b.classList.toggle('selected',value===initial);b.setAttribute('aria-pressed',String(value===initial));list.push([value,b]);group.append(b);}ui.tools.append(wrap);return wrap;}
function recentEffects(ui,v,old,path,hits){
 if(!old)return;if(v.event?.id!==old.event?.id&&v.event?.type==='hit'){hits[v.event.player]={...v.event,time:ui.time};ui.puff(v.event.x,v.event.y-(v.event.z||0)*.48,'#fff5c9',v.event.quality>.72?10:5);ui.sound(v.sport==='badminton'?'shuttle':'ping');}
 if(v.scores.some((n,i)=>n>old.scores[i])){path.length=0;ui.sound('point');}
}
function drawTrail(c,path,b,t,reduced){if(reduced)return;path.push({...b,t});while(path.length&&t-path[0].t>180)path.shift();for(let i=1;i<path.length;i++){c.globalAlpha=(1-(t-path[i].t)/180)*.32;line(c,path[i-1].x,path[i-1].y,path[i].x,path[i].y,'#fff9cd',2.8);}c.globalAlpha=1;}
function pointCaption(c,v,t){if(!v.lastPoint||v.rally||v.now-v.lastPoint.occurredAt>1400)return;round(c,262,52,196,46,14,'#fffffff0','#fff');circle(c,281,75,5,palette[v.lastPoint.player]);text(c,`${v.lastPoint.reason} · ${v.lastPoint.shots} 拍`,368,75,15,'#36535b',700);}

export function renderBadminton(root,send,context){
 const ui=stage(root,send,context,{id:'badminton',title:'晴光羽球馆 · 技术对决',hint:'先选近网／中场／后场，再用高远、吊球或扣杀回球。左右移动，↑ 起跳，Shift 向移动方向冲刺。扣杀要求高点触球；冲刺和跳跃消耗体力并自动恢复。11 分净胜 2，15 分封顶。'}),c=ui.ctx,hud=courtHud(ui,'badminton'),hits=[null,null],path=[],gait=[0,0],positions=[180,540];let style='clear',depth=.85,lastDirection=1;
 const move=keys=>{const v=ui.view;if(!v)return;const d=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));if(d){lastDirection=d;ui.command({type:'move',x:clamp(v.players[ui.player].x+d*85,0,720)});}};
 ui.moveKeys(move);ui.arrows([['ArrowLeft','←'],['ArrowRight','→']],()=>move(ui.keys));
 choice(ui,'落点深度',[[.08,'近网'],[.5,'中场'],[.85,'后场']],depth,v=>depth=v);
 const hit=s=>{style=s;const info=contact('badminton',ui.view,ui.player,ui.view?.now,s);if(info.ready)ui.command({type:'hit',style:s,target:depth});else ui.message(info.reason);};
 const group=ui.el('div','sports-shot-choices'),shots=[];for(const[s,n]of[['clear','高远球 1'],['drop','吊球 2'],['smash','扣杀 3']]){const b=ui.button(n,()=>hit(s));shots.push([s,b]);group.append(b);}ui.tools.append(group);
 const jump=ui.button('起跳 ↑',()=>ui.command({type:'jump'}),'jump'),dash=ui.button('冲刺 ⇧',()=>ui.command({type:'dash',direction:lastDirection}));ui.tools.append(jump,dash);
 ui.drag(p=>{if(ui.view)lastDirection=p.x>=ui.view.players[ui.player].x?1:-1;ui.command({type:'move',x:clamp(p.x,0,720)});});
 ui.key(k=>{if(k==='ArrowUp'){jump.click();return true;}if(k==='Shift'){dash.click();return true;}if(['1','2','3',' '].includes(k)){hit({1:'clear',2:'drop',3:'smash'}[k]||style);return true;}return false;});
 ui.setBackdrop(c=>{stadium(c);round(c,273,10,174,28,9,'#eff8f4e0');text(c,'SHUTTLE CLUB  /  01',360,24,11,'#577d78',700);});
 ui.events((v,old)=>{hud(v);const info=contact('badminton',v,ui.player);ui.state(v.rally?`${v.rallyHits} 拍 · ${v.event?.style==='smash'?'进攻中':'往返中'}`:v.serving===ui.player?'你的发球':'对方发球');ui.hint(info.ready?(v.rally?info.reason+' · 选择球路与落点':'点击高远球或吊球发球'):info.reason,info.ready);
  for(const[s,b]of shots){const q=contact('badminton',v,ui.player,v.now,s);b.classList.toggle('can-hit',q.ready);b.classList.toggle('selected',s===style);b.setAttribute('aria-pressed',String(s===style));b.title=q.reason;}
  jump.disabled=v.players[ui.player].stamina<16||v.players[ui.player].jumpReadyAt>v.now;dash.disabled=v.players[ui.player].stamina<35||v.players[ui.player].dashReadyAt>v.now;recentEffects(ui,v,old,path,hits);
 });
 ui.animate((v,t,dt)=>{
  const me=v.players[ui.player],dir=ui.player?-1:1,dest=360+dir*(40+depth*260);
  ellipse(c,dest,390,22,5,'#ffeac24d');line(c,dest,381,dest,397,'#ffecc0a0',1.4);text(c,depth<.2?'近网':depth>.7?'后场':'中场',dest,412,10,'#fff4d4');
  if(v.rally&&v.last!==ui.player){const land=shuttleLanding(v.ball);if((land.x<360?0:1)===ui.player&&land.x>=25&&land.x<=695){c.save();c.setLineDash([4,5]);ellipse(c,land.x,390,18,5,'#ffffff18');line(c,land.x-16,390,land.x+16,390,'#fff7b6a0',2);c.restore();}}
  const info=contact('badminton',v,ui.player);if(info.ready&&v.rally){circle(c,v.ball.x,v.ball.y,13,null,'#fff1aa');ellipse(c,me.x,386,35,7,'#ebf7b74d');}
  v.players.forEach((p,i)=>{const dx=p.x-positions[i];positions[i]=p.x;gait[i]+=Math.abs(dx)*.11;const run=clamp(Math.abs(p.speed||dx/Math.max(dt,.001))/260,0,1),h=hits[i],age=h?t-h.time:9999,lift=jumpLift(p.jump,v.now);
   if(p.dashUntil>v.now&&!ui.reduced){c.save();c.globalAlpha=.12;athlete(c,p.x-Math.sign(p.speed)*13,386,{color:palette[i],side:i?-1:1,run,phase:gait[i]-.4,jump:lift});c.restore();}
   athlete(c,p.x,386,{color:palette[i],side:i?-1:1,run,phase:gait[i],jump:lift,swing:age<420?age/420:0,style:h?.style||'clear',own:i===ui.player,t:ui.reduced?0:t,contactPoint:age<150?{x:h.x,y:h.y}:null});
   const energy=p.stamina??100;round(c,p.x-22,399,44,3,1,'#164c4c40');round(c,p.x-22,399,44*energy/100,3,1,energy<35?'#eab46a':'#c9f4dd');
  });
  net(c);shadow(c,clamp(v.ball.x,20,700),390,Math.max(3,10-(390-v.ball.y)/80),2,.12);if(v.rally)drawTrail(c,path,v.ball,t,ui.reduced);else path.length=0;shuttle(c,v.ball,Math.atan2(v.ball.vy,v.ball.vx));pointCaption(c,v,t);
 });return{update:ui.update,destroy:ui.destroy};
}

export function renderPing(root,send,context){
 const ui=stage(root,send,context,{id:'tabletennis',title:'轻快乒乓俱乐部 · 旋转对决',hint:'上下键或拖动移动球拍。发球先弹己方台，再过网；回球必须等己方弹台一次。上旋前冲、下旋减速；球太低不能快攻。空格平击、2 挑高、3 快攻。11 分净胜 2，15 分封顶，每两分换发。'}),c=ui.ctx,hud=courtHud(ui,'tabletennis'),hits=[null,null],path=[];let spin='flat',bounceAt=-1000;
 const target=ui.slider('回球落点 · 上角 ↔ 下角',0,1,.01,.5);choice(ui,'球的旋转',[['flat','不转'],['top','上旋 ↗'],['back','下旋 ↘']],spin,v=>spin=v);
 const move=keys=>{const v=ui.view;if(!v)return;const d=Number(keys.has('ArrowDown'))-Number(keys.has('ArrowUp'));if(d)ui.command({type:'move',y:clamp(v.players[ui.player].y+d*75,0,400)});};ui.moveKeys(move);ui.arrows([['ArrowUp','↑'],['ArrowDown','↓']],()=>move(ui.keys));
 const hit=style=>{const info=contact('tabletennis',ui.view,ui.player,ui.view?.now,style);if(info.ready)ui.command({type:'hit',style,target:Number(target.value),spin});else ui.message(info.reason);};
 const group=ui.el('div','sports-shot-choices');for(const[s,n]of[['drive','回击 · 空格'],['lob','挑高球 2'],['smash','快攻 3']])group.append(ui.button(n,()=>hit(s)));ui.tools.append(group);ui.drag(p=>ui.command({type:'move',y:clamp(p.y,0,400)}));ui.key(k=>{if([' ','1','2','3'].includes(k)){hit(k==='2'?'lob':k==='3'?'smash':'drive');return true;}return false;});
 ui.setBackdrop(c=>{round(c,-10,-35,740,500,0,gradient(c,0,-30,0,460,['#e5eee9','#b2cacc','#86acae']));for(let x=0;x<750;x+=90)line(c,x,-25,x,460,'#fff3',1);for(let y=0;y<460;y+=60)line(c,0,y,720,y,'#fff3',1);
  shadow(c,360,371,318,24,.2);for(const x of[117,603]){poly(c,[[x-10,280],[x+10,280],[x+15,387],[x-15,387]],'#45606c');circle(c,x,389,7,'#35444c');}round(c,51,42,618,330,10,'#344f61');round(c,54,32,612,330,9,'#d8e3df');round(c,61,38,598,321,4,gradient(c,0,38,0,359,['#3e91a7','#317c94','#28687f']),'#f5fff5');grain(c,65,43,590,311,'#8dc4d1',5);c.strokeStyle='#eef9ef';c.lineWidth=2.5;c.strokeRect(65,45,590,310);line(c,65,200,655,200,'#dff2e7bb',1.5);text(c,'RALLY CLUB',220,210,15,'#d5f5f025');
 });
 ui.events((v,old)=>{hud(v);const info=contact('tabletennis',v,ui.player);ui.state(v.rally?(v.serveStage?'发球 · 两跳过网':v.ball.spin==='top'?'来球上旋':v.ball.spin==='back'?'来球下旋':'来球不转'):v.serving===ui.player?'轮到你发球':'等待对方发球');ui.hint(info.ready?'现在挥拍 · 选择落点与旋转':info.reason,info.ready);group.classList.toggle('can-hit',info.ready);recentEffects(ui,v,old,path,hits);if(old&&v.bounceEvent?.id!==old.bounceEvent?.id){bounceAt=ui.time;ui.sound('bounce');}});
 ui.animate((v,t)=>{const aimY=75+Number(target.value)*250,aimX=ui.player?205:515;ellipse(c,aimX,aimY,15,7,'#fff9b51f');circle(c,aimX,aimY,12,null,'#fff9ba80');
  for(let i=0;i<2;i++){const p=v.players[i],side=i?-1:1,x=i?686:34,py=p.y;shadow(c,x,py+34,22,12,.18);ellipse(c,x,py+9,21,30,palette[i]);circle(c,x-side*3,py-15,14,'#eabb98');ellipse(c,x-side*6,py-19,12,7,'#3d4752');line(c,x-side*13,py+30,x-side*17,py+44,'#fcffed',9);line(c,x+side*12,py+30,x+side*17,py+44,'#fcffed',9);
   const h=hits[i],age=h?t-h.time:10000,reach=age<230?Math.sin(age/230*Math.PI)*25:0,rx=(i?646:74)+side*reach,ry=py;line(c,x,py+5,rx-side*10,ry+15,'#edbb95',9);c.save();c.translate(rx,ry);c.rotate(i?Math.PI/2:-Math.PI/2);racket(c,0,53,age<250?Math.sin(age/250*Math.PI)*.6:0,palette[i],true);c.restore();if(i===ui.player&&contact('tabletennis',v,i).ready)circle(c,rx,ry,26,null,'#ffeeb8');}
  shadow(c,368,200,12,157,.1);round(c,353,39,14,321,2,'#173e5555');for(let y=42;y<356;y+=6)line(c,355,y-10,365,y+1,'#b8d7d7',.8);for(let x=355;x<=365;x+=3)line(c,x,30,x,354,'#c8e1dd',.8);line(c,356,29,356,350,'#fff8ec',3);line(c,365,39,365,359,'#567e8b',3);round(c,350,24,21,8,3,'#355466');round(c,350,350,21,8,3,'#355466');
  if(v.bounceEvent&&t-bounceAt<500){const b=v.bounceEvent;c.globalAlpha=1-(t-bounceAt)/500;ellipse(c,b.x,b.y,6+(t-bounceAt)/30,4,'#f8f4b15c');c.globalAlpha=1;}
  const b=v.ball,yy=b.y-b.z*.48;shadow(c,b.x,b.y,5+b.z*.018,2.5,.2);if(v.rally)drawTrail(c,path,{x:b.x,y:yy},t,ui.reduced);else path.length=0;circle(c,b.x,yy,6,gradient(c,b.x-4,yy-5,b.x+4,yy+5,['#fffff4','#fff0b5','#e9b668']));line(c,b.x-3,yy,b.x+3,yy,b.spin==='top'?'#db876d':b.spin==='back'?'#5c9ab1':'#cab482',1.2);pointCaption(c,v,t);
 });return{update:ui.update,destroy:ui.destroy};
}
