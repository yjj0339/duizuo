import {contact,shuttleFlight,clamp} from '../games/racket-rules.js';
export function badminton(v,p,b,level,now){
 const me=v.players[p],opp=v.players[1-p];
 if(!v.rally)return now>=v.readyAt&&p===v.serving?{type:'hit',style:'clear',target:level==='casual'?.6:.9}:null;
 if(v.last===p)return {type:'move',x:p?520:200};
 if(b.received!==v.event?.id){b.received=v.event?.id;b.reactAt=now+(level==='casual'?520:level==='expert'?210:85);}
 if(level==='casual'&&(v.ball.x<360?0:1)!==p){b.reactAt=now+260;return null;}
 if(now<b.reactAt)return null;
 const info=contact('badminton',v,p,now);
 if(info.ready){
  const away=Math.abs(opp.x-360)>155?.07:.95;
  if(level!=='casual'&&contact('badminton',v,p,now,'smash').ready&&v.ball.y<225)return {type:'hit',style:'smash',target:away};
  if(level!=='casual'&&v.ball.y<200&&!(me.jump>now)&&(me.stamina??100)>35)return {type:'jump'};
  return {type:'hit',style:level==='casual'?'clear':away<.2?'drop':'clear',target:level==='casual'?.5:away};
 }
 let target=p?520:200,best=Infinity;
 // Use only the public shuttle trajectory. Pick a reachable interception, not its current x.
 for(let t=.04;t<2.1;t+=.04){const q=shuttleFlight(v.ball,t);if((q.x<360?0:1)!==p||q.y<185||q.y>345)continue;const x=clamp(q.x,p?390:35,p?685:330),travel=Math.abs(x-me.x),cost=Math.max(0,travel-280*t)*4+Math.abs(q.y-265)*.2+t*15;if(cost<best){best=cost;target=x;}}
 if(level==='casual')target=clamp(v.ball.x,p?390:35,p?685:330);
 if(level!=='casual'&&Math.abs(target-me.x)>140&&(me.stamina??100)>45&&now>=(me.dashReadyAt||0))return {type:'dash',direction:Math.sign(target-me.x)};
 return {type:'move',x:target};
}
export function tabletennis(v,p,b,level,now){
 if(!v.rally)return now>=v.readyAt&&p===v.serving?{type:'hit',style:'drive',target:.5}:null;
 const ball=v.ball,me=v.players[p],opp=v.players[1-p];if(v.last===p)return {type:'move',y:200};
 if(b.received!==v.event?.id){b.received=v.event?.id;b.reactAt=now+(level==='casual'?560:level==='expert'?220:90);}
 if(now<b.reactAt)return null;
 if(contact('tabletennis',v,p,now).ready&&(level==='casual'||ball.z>48||(p?ball.x>620:ball.x<100)))return {type:'hit',style:level==='casual'?'lob':contact('tabletennis',v,p,now,'smash').ready&&ball.z>48?'smash':'drive',target:level==='casual'?.5:opp.y>200?.08:.92,spin:level==='casual'?'flat':v.rallyHits%3?'top':'back'};
 const t=ball.vx?Math.max(0,((p?605:115)-ball.x)/ball.vx):0;
 return {type:'move',y:clamp(ball.y+ball.vy*t,55,345)};
}
