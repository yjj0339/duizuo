import {contact} from './racket-rules.js';
export const lerp=(a,b,t)=>a+(b-a)*Math.max(0,Math.min(1,t));
// Interpolate presentation coordinates only. Never advance or mutate authoritative state.
export function sampleMotion(current,previous,alpha){
 if(!previous)return current;
 const span=current.now-previous.now;
 // A new point, reconnect or restored clock is a discontinuity, not a flight path.
 if(span<0||span>250||current.status!==previous.status||current.rally!==previous.rally||current.scores?.some((n,i)=>n!==previous.scores?.[i]))return current;
 const point=(b,a,t=alpha)=>{if(!a||b.potted||a.potted)return b;const q={...b};for(const k of ['x','y','z'])if(Number.isFinite(a[k])&&Number.isFinite(b[k]))q[k]=lerp(a[k],b[k],t);return q;};
 const now=Number.isFinite(span)?lerp(previous.now,current.now,alpha):current.now;
 let ball=current.ball?point(current.ball,previous.ball):undefined;
 if(ball&&current.rally&&span>0){
  // Keep confirmed racket contacts and table bounces on the displayed path.
  const anchors=[];
  if(current.event?.type==='hit'&&current.event.id!==previous.event?.id)anchors.push(current.event);
  if(current.bounceEvent&&current.bounceEvent.id!==previous.bounceEvent?.id)anchors.push({...current.bounceEvent,z:0});
  const path=[{...previous.ball,occurredAt:previous.now},...anchors.filter(e=>e.occurredAt>previous.now&&e.occurredAt<current.now).sort((a,b)=>a.occurredAt-b.occurredAt),{...current.ball,occurredAt:current.now}];
  for(let i=1;i<path.length;i++)if(now<=path[i].occurredAt){const a=path[i-1],b=path[i];ball={...current.ball,...Object.fromEntries(['x','y','z'].filter(k=>Number.isFinite(a[k])&&Number.isFinite(b[k])).map(k=>[k,lerp(a[k],b[k],(now-a.occurredAt)/(b.occurredAt-a.occurredAt))]))};break;}
 }
 return {...current,now,players:current.players?.map((p,i)=>point(p,previous.players?.[i])),balls:current.balls?.map((b,i)=>current.ballInHand&&!current.moving?b:point(b,previous.balls?.[i])),ball};
}
export function jumpHeight(until,now,reduced=false){const t=Math.max(0,Math.min(1,1-(until-now)/650));return until>now?Math.sin(t*Math.PI)*(reduced?45:65):0;}
export function hitAvailable(id,v,p){return !!v&&contact(id,v,p).ready;}
