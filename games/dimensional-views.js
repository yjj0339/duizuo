import {courtJoystick} from './court-joystick.js';
import {stage} from './sports-stage.js';
import {createSportsModel} from './sports-models.js';
import {contact} from './racket-rules.js';
import {simpleBadmintonShot} from './court-controls.js';
import {createStrokeBuffer} from './stroke-buffer.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function mount(root,send,context,id,title,hint){
 const ui=stage(root,send,context,{id,title,hint,webgl:true});let model;
 try{model=createSportsModel(ui.canvas,id);}catch(error){ui.destroy();throw error;}
 ui.mapPointer(model.pick);ui.dispose(model.dispose);
 const options=ui.el('section','court-options');root.append(options);ui.dispose(context.registerPanel?.('球场设置',options)||(()=>{}));ui.options=options;
 ui.canvas.parentElement.append(ui.tools,ui.notice);ui.canvas.parentElement.append(root.querySelector('.sports-topline'));
 const quality=ui.button('画质：精细',()=>{smooth=!smooth;model.quality(smooth?'smooth':'fine');quality.textContent='画质：'+(smooth?'流畅':'精细');quality.setAttribute('aria-pressed',String(smooth));});let smooth=matchMedia('(pointer:coarse)').matches||Math.min(innerWidth,innerHeight)<600;if(smooth){model.quality('smooth');quality.textContent='画质：流畅';}quality.className='model-quality';quality.setAttribute('aria-label','切换流畅画质');quality.setAttribute('aria-pressed',String(smooth));options.append(quality);
 const lost=ui.el('div','model-lost'),recover=ui.button('使用轻量球场',()=>root.dispatchEvent(new Event('dimensionfallback',{bubbles:true})));lost.append(ui.el('span','','画面暂时中断，正在等待恢复'),recover);lost.hidden=true;lost.setAttribute('role','status');ui.canvas.parentElement.append(lost);ui.on(ui.canvas,'webglcontextlost',()=>{lost.hidden=false;context.holdPresentation?.('graphics',true);});ui.on(ui.canvas,'webglcontextrestored',()=>{lost.hidden=true;context.holdPresentation?.('graphics',false);});ui.dispose(()=>context.holdPresentation?.('graphics',false));
 const badge=ui.el('div','model-score'),score=ui.el('strong'),label=ui.el('span'),point=ui.el('div','model-point');badge.append(label,score);ui.canvas.parentElement.append(badge,point);
 let pointKey='';
 return{ui,model,status(v){label.textContent=id==='billiards'?'八球 · 轮流出杆':'11 分制 · 净胜 2 分';score.textContent=(v.scores||[0,0]).join('  :  ');const p=v.lastPoint,key=p?.occurredAt;if(key!==pointKey){pointKey=key;point.textContent=p?`${p.player===context.player?'我方':'对方'}得分 · ${p.reason}`:'';}point.hidden=!p||v.rally||v.now-p.occurredAt>1400;},result:{update:ui.update,destroy:ui.destroy}};
}
function choice(ui,label,options,initial,change){const wrap=ui.el('div','racket-choice'),group=ui.el('div');wrap.append(ui.el('span','',label),group);const buttons=[];for(const[value,title]of options){const b=ui.button(title,()=>{for(const [n,x]of buttons){x.classList.toggle('selected',n===value);x.setAttribute('aria-pressed',String(n===value));}change(value);});b.classList.toggle('selected',value===initial);b.setAttribute('aria-pressed',String(value===initial));buttons.push([value,b]);group.append(b);}ui.tools.append(wrap);}
function hud(ui,id){
 const row=ui.el('div','racket-scoreline'),rally=ui.el('strong'),best=ui.el('span'),energy=ui.el('meter'),label=ui.el('label','racket-energy','体力');energy.min=0;energy.max=100;energy.value=100;energy.setAttribute('aria-label','体力');label.append(energy);row.append(rally,best);if(id==='badminton')row.append(label);ui.canvas.parentElement.append(row);const recent=ui.el('div','racket-recent');ui.tools.after(recent);let sig='';
 return v=>{rally.textContent=v.rally?`${v.rallyHits||1} 拍回合`:'准备开球';best.textContent=`最长 ${Math.max(v.longestRally||0,v.rallyHits||0)} 拍 · 甜点 ${v.stats?.[ui.player]?.sweet||0} 次`;energy.value=v.players[ui.player].stamina??100;const key=v.scores.join()+':'+v.history?.length;if(key!==sig){sig=key;recent.replaceChildren();for(const h of(v.history||[]).slice(-4))recent.append(ui.el('span','',`${h.player===ui.player?'我方':'对方'} +1 · ${h.reason} · ${h.shots} 拍`));if(!v.history?.length)recent.textContent='找准时机，打一场有来有回的球。';}};
}
function sound(ui,v,old,id){if(!old)return;if(v.event?.id!==old.event?.id&&v.event?.type==='hit')ui.sound(id==='badminton'?'shuttle':'ping');if(v.scores.some((n,i)=>n>old.scores[i]))ui.sound('point');if(id==='tabletennis'&&v.bounceEvent?.id!==old.bounceEvent?.id)ui.sound('bounce');}
function strokeControls(ui,id){
 const buffer=createStrokeBuffer(id,ui.player),clear=()=>buffer.clear();
 ui.whenPaused(clear);ui.on(window,'blur',clear);ui.on(document,'visibilitychange',clear);ui.dispose(clear);
 return {clear,press(input){if(ui.isPaused()){clear();return;}const r=buffer.press(ui.view,input,performance.now());if(r.action)ui.command(r.action);else ui.message(r.status==='buffered'?'已准备挥拍 · 继续迎球':r.reason);},tick(){const action=buffer.take(ui.view,performance.now());if(action)ui.command(action);}};
}
function pressButton(ui,label,fn,kind=''){
 let last=-1000;
 const b=ui.button(label,()=>{if(performance.now()-last>250)fn();},kind);
 ui.on(b,'pointerdown',e=>{if(b.disabled)return;e.preventDefault();b.focus({preventScroll:true});last=performance.now();fn();});
 return b;
}

function badminton(root,send,context){
 const {ui,model,status,result}=mount(root,send,context,'badminton','晴光羽球馆','左手移动，右手击球；高点击球会自动扣杀，低点会用高远球。起跳可够到更高的球。稍早按下击球会短暂准备挥拍，仍需移动到合法触球范围。菜单里的球场设置可以指定球路与落点。键盘：← → 移动，空格击球，↑ 起跳，1/2/3 手动球路。'),updateHud=hud(ui,'badminton'),stroke=strokeControls(ui,'badminton');let style='auto',depth=.85,lastDirection=1;
 ui.tools.classList.add('badminton-simple');
 const move=keys=>{const v=ui.view;if(!v)return;const d=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));if(d){lastDirection=d;ui.command({type:'move',x:clamp(v.players[ui.player].x+d*85,0,720)});}};
 ui.moveKeys(move);const joystick=courtJoystick(ui,'x',move);
 const hit=override=>stroke.press({style:override||style,target:depth});
 const actions=ui.el('div','badminton-actions'),swing=pressButton(ui,'击球',()=>hit(),'primary badminton-hit'),jump=pressButton(ui,'起跳 ↑',()=>ui.command({type:'jump'}),'badminton-jump');actions.append(jump,swing);ui.tools.append(actions);
 const advanced=ui.el('details','badminton-advanced'),summary=ui.el('summary','','进阶球路'),inner=ui.el('div','badminton-settings');advanced.append(summary,inner);ui.options.append(advanced);advanced.open=true;
 choice(ui,'球路',[['auto','自动判高低'],['clear','高远球'],['drop','吊球'],['smash','扣杀']],style,v=>style=v);inner.append(ui.tools.lastElementChild);
 choice(ui,'落点',[[.08,'近网'],[.5,'中场'],[.85,'后场']],depth,v=>depth=v);inner.append(ui.tools.lastElementChild);inner.append(ui.el('p','','键盘：← → 移动，空格击球，↑ 起跳，1 / 2 / 3 指定球路，Shift 冲刺。'));

 ui.drag(p=>{if(ui.view)lastDirection=p.x>=ui.view.players[ui.player].x?1:-1;ui.command({type:'move',x:clamp(p.x,0,720)});});
 ui.key(k=>{if(k==='ArrowUp'){jump.click();return true;}if(k==='Shift'){ui.command({type:'dash',direction:lastDirection});return true;}if(['1','2','3',' '].includes(k)){hit({1:'clear',2:'drop',3:'smash'}[k]);return true;}return false;});
 ui.events((v,old)=>{status(v);updateHud(v);const chosen=style==='auto'?simpleBadmintonShot(v,ui.player):style,q=contact('badminton',v,ui.player,v.now,chosen||'clear');ui.state(v.rally?v.rallyHits+' 拍 · 往返中':v.serving===ui.player?'你的发球':'对方发球');ui.hint(q.ready?(v.rally?(chosen==='smash'?'好高球！现在击球会扣杀':'可以接球 · 点击击球'):'点击击球，开始这一分'):q.reason,q.ready);swing.classList.toggle('can-hit',q.ready);swing.title=q.reason;jump.disabled=v.players[ui.player].stamina<16||v.players[ui.player].jumpReadyAt>v.now;sound(ui,v,old,'badminton');});
 ui.animate((v,t,dt)=>{joystick.flush();stroke.tick();model.draw(v,t,dt,{depth,player:ui.player,reduced:ui.reduced});});return result;
}
function tabletennis(root,send,context){
 const {ui,model,status,result}=mount(root,send,context,'tabletennis','轻快乒乓俱乐部 · 立体球台','上下键或拖动球台移动球员。发球先弹己方台；接球须等己方弹台一次。选择落点与旋转，空格平击、2 挑高、3 快攻；球太低不能快攻。11 分净胜 2，15 分封顶。'),updateHud=hud(ui,'tabletennis'),stroke=strokeControls(ui,'tabletennis');let spin='flat';
 const target=ui.slider('回球落点 · 上角 ↔ 下角',0,1,.01,.5);choice(ui,'球的旋转',[['flat','不转'],['top','上旋 ↗'],['back','下旋 ↘']],spin,v=>spin=v);ui.options.append(target.closest('label'),ui.tools.lastElementChild);
 const move=keys=>{const v=ui.view;if(!v)return;const d=Number(keys.has('ArrowDown'))-Number(keys.has('ArrowUp'));if(d)ui.command({type:'move',y:clamp(v.players[ui.player].y+d*75,0,400)});};ui.moveKeys(move);const joystick=courtJoystick(ui,'y',move);
 const hit=style=>stroke.press({style,target:Number(target.value),spin});
 const group=ui.el('div','sports-shot-choices');group.append(pressButton(ui,'回击',()=>hit('drive'),'primary'),pressButton(ui,'挑高',()=>hit('lob')));ui.options.append(ui.el('p','','键盘：上下移动，空格回击，2 挑高，3 快攻。快攻需要足够的触球高度。'));ui.tools.append(group);
 ui.drag(p=>ui.command({type:'move',y:clamp(p.y,0,400)}));ui.key(k=>{if([' ','1','2','3'].includes(k)){hit(k==='2'?'lob':k==='3'?'smash':'drive');return true;}return false;});
 ui.events((v,old)=>{status(v);updateHud(v);const q=contact('tabletennis',v,ui.player);ui.state(v.rally?(v.serveStage?'发球 · 两跳过网':v.ball.spin==='top'?'来球上旋':v.ball.spin==='back'?'来球下旋':'来球不转'):v.serving===ui.player?'你的发球':'对方发球');ui.hint(q.ready?'现在挥拍 · 选择落点与旋转':q.reason,q.ready);group.classList.toggle('can-hit',q.ready);sound(ui,v,old,'tabletennis');});
 ui.animate((v,t,dt)=>{joystick.flush();stroke.tick();model.draw(v,t,dt,{target:Number(target.value),player:ui.player,reduced:ui.reduced});});return result;
}
function billiards(root,send,context){
 const {ui,model,status,result}=mount(root,send,context,'billiards','绿绒球房 · 木作八球台','拖动球台瞄准，左右键微调，空格击球。先清空自己的球组，再打黑八。犯规后点球台摆白球；拉杆与顺杆会改变碰撞后的白球走位。');let angle=0,shotEvent=null,lastSound=0;
 const rack=ui.el('div','sports-ball-rack');ui.canvas.parentElement.append(rack);const power=ui.slider('出杆力度',.1,1,.01,.55),spin=ui.slider('杆法 · 拉杆 ← 中杆 → 顺杆',-1,1,.1,0,n=>n===0?'中杆':(n<0?'拉杆 ':'顺杆 ')+Math.round(Math.abs(n)*100)+'%'),shot=ui.button('击球',()=>ui.command({type:'shoot',angle,power:Number(power.value),spin:Number(spin.value)}),'primary');ui.tools.append(shot);ui.options.append(spin.closest('label'));ui.tools.classList.add('pool-controls');
 ui.drag((p,down)=>{const v=ui.view;if(!v||v.moving||v.turn!==ui.player)return;if(v.ballInHand&&down)ui.command({type:'place',x:p.x,y:p.y});else angle=Math.atan2(p.y-v.balls[0].y,p.x-v.balls[0].x);});ui.moveKeys(keys=>{angle+=(Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')))*.025;angle=((angle+Math.PI*3)%(Math.PI*2))-Math.PI;});ui.key(k=>{if(k===' '){shot.click();return true;}return false;});
 ui.events((v,old)=>{status(v);shot.disabled=v.moving||v.turn!==ui.player||v.status!=='playing';shot.textContent=v.moving?'球在滚动…':v.turn!==ui.player?'等待对方出杆':'击球';power.disabled=spin.disabled=shot.disabled;ui.state(v.groups[ui.player]===null?'球组未定':v.groups[ui.player]?'你打花色球':'你打实色球');ui.hint(v.moving?'观察白球走位，等球停稳':v.turn!==ui.player?'对方正在瞄准':v.ballInHand?(v.lastShot?.reason||'犯规')+' · 自由球：点球台摆白球':'拖动球台瞄准，亮球位置是预计碰撞点',!shot.disabled);
  const key=v.groups[ui.player]+':'+v.balls.filter(b=>b.potted).map(b=>b.n).join();if(rack.dataset.state!==key){rack.dataset.state=key;rack.replaceChildren();for(const b of v.balls.filter(b=>b.n&&b.n!==8&&(v.groups[ui.player]===null||Number(b.n>8)===v.groups[ui.player]))){const n=ui.el('span','sports-rack-ball'+(b.n>8?' stripe':'')+(b.potted?' potted':''),b.n);n.style.setProperty('--ball-color',b.color);n.title=b.n+' 号球'+(b.potted?'已入袋':'未入袋');rack.append(n);}}
  if(!old)return;if(v.moving&&!old.moving){shotEvent={...old.balls[0],at:ui.time};if(v.turn!==ui.player)angle=Math.atan2(v.balls[0].vy,v.balls[0].vx);ui.sound('cue');}for(let i=0;i<v.balls.length;i++){const b=v.balls[i],before=old.balls[i];if(b.potted&&!before.potted)ui.sound('pocket');else if(!b.potted&&v.moving&&old.moving&&Math.hypot(b.vx-before.vx,b.vy-before.vy)>100&&ui.time-lastSound>70){lastSound=ui.time;ui.sound('ball');}}
 });ui.animate((v,t,dt)=>model.draw(v,t,dt,{angle,power:Number(power.value),player:ui.player,shot:shotEvent,reduced:ui.reduced}));return result;
}
export const renderers={badminton,tabletennis,billiards};
