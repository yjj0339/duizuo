// One set of contact and flight rules is shared by authority, AI and presentation.
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export const jumpLift=(until,now)=>until>now?Math.sin(clamp(1-(until-now)/650,0,1)*Math.PI)*65:0;
export function contact(id,s,p,now=s.now,style){
 if(!s||s.status!=='playing'||now<s.readyAt)return {ready:false,reason:'等待下一球'};
 if(!s.rally)return {ready:s.serving===p&&style!=='smash',reason:s.serving===p?'发球请选择高远／吊球或普通回击':'等待对方发球',quality:1};
 if(s.last===p)return {ready:false,reason:'已完成击球，等待对方回球'};
 const b=s.ball,me=s.players[p];
 if(id==='badminton'){
  const d=Math.hypot((b.x-me.x)/78,(b.y-(280-jumpLift(me.jump,now)))/88);
  if((b.x<360?0:1)!==p)return {ready:false,reason:'不能越网击球'};
  if(d>1)return {ready:false,reason:b.y<210?'球很高，起跳迎球':'移动到羽球下方'};
  if(style==='smash'&&b.y>235)return {ready:false,reason:'扣杀需要高点击球，请先起跳或改用高远球'};
  return {ready:true,quality:clamp(1-d*.6,.35,1),reason:d<.47?'甜点击球':'可以回球'};
 }
 if(s.bounces!==1)return {ready:false,reason:'先等球在己方台面弹一次'};
 if(Math.abs(b.x-(p?625:95))>95||Math.abs(b.y-me.y)>75||b.z>120)return {ready:false,reason:'移动球拍迎球'};
 if(style==='smash'&&b.z<45)return {ready:false,reason:'来球过低，平击或削球更稳'};
 return {ready:true,quality:clamp(1-Math.abs(b.y-me.y)/110,.3,1),reason:'现在可以挥拍'};
}
export function shuttleFlight(ball,dt){const k=.45,a=Math.exp(-k*dt);return {...ball,x:ball.x+ball.vx*(1-a)/k,y:ball.y+ball.vy*dt+315*dt*dt,vx:ball.vx*a,vy:ball.vy+630*dt};}
export function shuttleLanding(ball){const t=(-ball.vy+Math.sqrt(Math.max(0,ball.vy**2+1260*(390-ball.y))))/630;return {...shuttleFlight(ball,Math.max(0,t)),time:Math.max(0,t)};}
function hydrate(s){
 s.rallyHits??=0;s.longestRally??=0;s.history??=[];s.eventSeq??=0;s.stats??=[0,1].map(()=>({shots:0,smashes:0,sweet:0,winners:0,errors:0}));
 for(const p of s.players){p.speed??=0;p.stamina??=100;p.dashUntil??=0;p.dashReadyAt??=0;}
}
function event(s,type,now,data){s.event={id:++s.eventSeq,type,occurredAt:now,...data};return s.event;}
function point(s,p,now,reason){
 const b=s.ball;s.scores[p]++;s.longestRally=Math.max(s.longestRally,s.rallyHits);
 s.lastPoint={player:p,reason,x:b.x,y:b.y,shots:s.rallyHits,occurredAt:now};s.history.push(s.lastPoint);if(s.history.length>30)s.history.shift();
 if(reason==='落地'||reason==='二次弹台'||reason==='未接住')s.stats[p].winners++;else s.stats[1-p].errors++;
 event(s,'point',now,s.lastPoint);s.rally=false;s.rallyHits=0;s.serveStage=0;
 if(s.scores[p]>=11&&(s.scores[p]-s.scores[1-p]>=2||s.scores[p]>=15)){s.status='finished';s.winner=p;s.message=`${reason} · 比赛结束`;return;}
 s.serving=p;s.readyAt=now+1400;s.message=`${reason} · ${p===0?'蜜桃':'薄荷'}得分`;
 if(s.sport==='tabletennis'){const total=s.scores[0]+s.scores[1];s.serving=total>=20?total%2:Math.floor(total/2)%2;}
}
const snapshot=s=>Object.fromEntries(Object.entries(structuredClone(s)).filter(([k])=>!k.startsWith('_')));
function create(sport,now){const badminton=sport==='badminton';return {sport,version:2,status:'playing',winner:null,scores:[0,0],message:badminton?'先找落点，再移动迎球':'先弹己方台，再过网；接球须等一次弹台',endsAt:now+300000,now,players:badminton?[{x:180,target:180,jump:0},{x:540,target:540,jump:0}]:[{y:200,target:200},{y:200,target:200}],ball:badminton?{x:180,y:265,vx:0,vy:0}:{x:95,y:200,z:40,vx:0,vy:0,vz:0},serving:0,last:1,rally:false,bounces:0,readyAt:now,serveStage:0};}
function serveBall(s){const p=s.serving;s.ball=s.sport==='badminton'?{x:s.players[p].x,y:265,vx:0,vy:0}:{x:p?625:95,y:s.players[p].y,z:40,vx:0,vy:0,vz:0};}
function allowed(s,p,a,now){return s.status==='playing'&&(p===0||p===1)&&a&&typeof a==='object'&&!Array.isArray(a)&&finite(now)&&now<s.endsAt;}
function stepPlayers(s,dt,now){
 for(let i=0;i<2;i++){const p=s.players[i],key=s.sport==='badminton'?'x':'y',dist=p.target-p[key],max=key==='x'?(now<p.dashUntil?460:280):410;
  p.stamina=Math.min(100,p.stamina+18*dt);const desired=clamp(dist*12,-max,max);p.speed+=clamp(desired-p.speed,-1600*dt,1600*dt);
  const change=p.speed*dt;p[key]+=Math.abs(change)>Math.abs(dist)&&Math.sign(change)===Math.sign(dist)?dist:change;
  p[key]=clamp(p[key],key==='x'?(i?390:35):55,key==='x'?(i?685:330):345);
 }
}
function shotEvent(s,p,a,now,q){s.last=p;s.rally=true;s.rallyHits++;s.longestRally=Math.max(s.longestRally,s.rallyHits);s.stats[p].shots++;s.stats[p].smashes+=Number(a.style==='smash');s.stats[p].sweet+=Number(q>.72);event(s,'hit',now,{player:p,style:a.style,quality:q,spin:a.spin||'flat',x:s.ball.x,y:s.ball.y,z:s.ball.z||0});}
export const badminton={
 create(seed,now){const s=create('badminton',now);hydrate(s);return s;},
 action(s,p,a,now){if(!allowed(s,p,a,now))return false;hydrate(s);s.sport='badminton';const me=s.players[p];
  if(a.type==='stop'){me.target=me.x;me.speed=0;return true;}
  if(a.type==='move'&&finite(a.x)&&a.x>=0&&a.x<=720){me.target=clamp(a.x,p?390:35,p?685:330);return true;}
  if(a.type==='dash'&&(a.direction===1||a.direction===-1)&&now>=me.dashReadyAt&&me.stamina>=35){me.stamina-=35;me.dashUntil=now+260;me.dashReadyAt=now+700;me.target=clamp(me.x+a.direction*135,p?390:35,p?685:330);return true;}
  if(a.type==='jump'){if(me.jump>now||now<(me.jumpReadyAt||0)||me.stamina<16)return false;me.jump=now+650;me.jumpReadyAt=now+850;me.stamina-=16;return true;}
  if(a.type!=='hit'||!['clear','drop','smash'].includes(a.style)||a.target!==undefined&&(!finite(a.target)||a.target<0||a.target>1))return false;
  const info=contact('badminton',s,p,now,a.style);if(!info.ready)return false;if(!s.rally)serveBall(s);
  const b=s.ball,aim=a.target??(a.style==='drop'?.12:.8),depth=40+aim*260,dest=p?360-depth:360+depth,k=.45;
  let t=(a.style==='clear'?1.65:a.style==='drop'?1.08:.54)+(1-info.quality)*.13;
  // Solve a real arc to the chosen depth, with sufficient clearance over the net.
  for(let i=0;i<24;i++){const vx=(dest-b.x)*k/(1-Math.exp(-k*t)),vy=(390-b.y-315*t*t)/t,r=1-(360-b.x)*k/vx,nt=r>0?-Math.log(r)/k:0;
   if(nt>0&&nt<t&&b.y+vy*nt+315*nt*nt<=(a.style==='clear'?200:228))break;t+=.065;
  }
  b.vx=(dest-b.x)*k/(1-Math.exp(-k*t));b.vy=(390-b.y-315*t*t)/t;
  s.shotTarget=dest;shotEvent(s,p,a,now,info.quality);s.message=`${a.style==='clear'?'高远球':a.style==='drop'?'吊球':'扣杀'} · ${info.quality>.72?'甜点击球':'回球成功'}`;return true;
 },
 tick(s,dt,now){if(s.status!=='playing'||!finite(now))return;hydrate(s);s.sport='badminton';s.now=now;if(now>=s.endsAt){s.status='finished';s.winner=s.scores[0]===s.scores[1]?-1:s.scores[0]>s.scores[1]?0:1;s.message='时间到，按比分结算';return;}
  dt=clamp(finite(dt)?dt:0,0,.1);const n=Math.max(1,Math.ceil(dt*240)),h=dt/n;
  for(let i=0;i<n;i++){stepPlayers(s,h,now);if(!s.rally)continue;const old=s.ball;s.ball=shuttleFlight(old,h);const b=s.ball;
   if((old.x<360)!==(b.x<360)&&b.y>240){point(s,1-s.last,now,'触网');continue;}
   if(b.y>=390){point(s,b.x<25||b.x>695?1-s.last:b.x<360?1:0,now,b.x<25||b.x>695?'出界':'落地');}
  }
  if(!s.rally&&now>=s.readyAt)serveBall(s);
 },view(s,p){hydrate(s);return snapshot(s);}
};
export const tabletennis={
 create(seed,now){const s=create('tabletennis',now);hydrate(s);return s;},
 action(s,p,a,now){if(!allowed(s,p,a,now))return false;hydrate(s);s.sport='tabletennis';if(a.type==='stop'){s.players[p].target=s.players[p].y;s.players[p].speed=0;return true;}if(a.type==='move'&&finite(a.y)&&a.y>=0&&a.y<=400){s.players[p].target=clamp(a.y,55,345);return true;}
  if(a.type!=='hit'||!['drive','lob','smash'].includes(a.style)||!finite(a.target)||a.target<0||a.target>1||a.spin!==undefined&&!['flat','top','back'].includes(a.spin))return false;
  const info=contact('tabletennis',s,p,now,a.style);if(!info.ready)return false;const serve=!s.rally;if(serve)serveBall(s);const b=s.ball;
  b.spin=serve?'flat':a.spin||'flat';b.gravity=b.spin==='top'?440:b.spin==='back'?340:380;
  if(serve){const t=.34;b.vx=(p?-125:125)/t;b.vz=(190*t*t-b.z)/t;const up=Math.sqrt(b.vz*b.vz+760*b.z)*.86;const full=t+2*up/380;b.vy=(80+a.target*240-b.y)/full;s.serveStage=1;}
  else{const t=a.style==='lob'?1.22:a.style==='smash'?.60:.88,dest=p?205:515;b.vx=(dest-b.x)/t;b.vy=(75+a.target*250-b.y)/t;b.vz=(b.gravity*t*t/2-b.z)/t;s.serveStage=0;}
  s.bounces=0;shotEvent(s,p,a,now,info.quality);s.message=serve?'发球 · 先弹己方台':`${a.style==='smash'?'快攻':a.style==='lob'?'挑高':'平击'} · ${b.spin==='top'?'上旋':b.spin==='back'?'下旋':'不转'}`;return true;
 },
 tick(s,dt,now){if(s.status!=='playing'||!finite(now))return;hydrate(s);s.sport='tabletennis';s.now=now;if(now>=s.endsAt){s.status='finished';s.winner=s.scores[0]===s.scores[1]?-1:s.scores[0]>s.scores[1]?0:1;s.message='时间到，按比分结算';return;}
  dt=clamp(finite(dt)?dt:0,0,.1);const n=Math.max(1,Math.ceil(dt*240)),h=dt/n;
  for(let i=0;i<n;i++){stepPlayers(s,h,now);if(!s.rally)continue;const b=s.ball,old=b.x,g=b.gravity||380;b.x+=b.vx*h;b.y+=b.vy*h;b.z+=b.vz*h-g*h*h/2;b.vz-=g*h;
   if((old<360)!==(b.x<360)&&b.z<24){
    if(s.serveStage===2&&b.z>=20){s.rally=false;s.readyAt=now+1000;s.serveStage=0;s.rallyHits=0;s.message='擦网重发 · 不计分';event(s,'let',now,{player:s.serving});continue;}
    point(s,1-s.last,now,'触网');continue;
   }
   if(b.z<=0){const side=b.x<360?0:1;if(b.y<45||b.y>355||b.x<65||b.x>655){point(s,s.bounces? s.last:1-s.last,now,'出界');continue;}
    if(s.serveStage===1&&side===s.last){s.serveStage=2;}else if(side===s.last){point(s,1-s.last,now,'未过网');continue;}else{if(s.serveStage===1){point(s,1-s.last,now,'发球违例');continue;}s.serveStage=0;s.bounces++;}
    s.bounceEvent={id:(s.bounceEvent?.id||0)+1,x:b.x,y:b.y,side,occurredAt:now};
    if(s.bounces>=2){point(s,s.last,now,'二次弹台');continue;}
    b.z=0;b.vz=Math.abs(b.vz)*(b.spin==='back'?.94:b.spin==='top'?.74:.86);b.vx*=b.spin==='top'?1.13:b.spin==='back'?.78:1;
   }
   if(b.x<5||b.x>715||b.y<0||b.y>400)point(s,s.bounces===0?1-s.last:s.last,now,s.bounces?'未接住':'出界');
  }
  if(!s.rally&&now>=s.readyAt)serveBall(s);
 },view(s,p){hydrate(s);return snapshot(s);}
};
