import {contact} from './racket-rules.js';
export const lerp=(a,b,t)=>a+(b-a)*Math.max(0,Math.min(1,t));
// Interpolate presentation coordinates only. Never advance or mutate authoritative state.
export function sampleMotion(current,previous,alpha){
 if(!previous)return current;
 const point=(b,a)=>{if(!a||b.potted||a.potted)return b;const q={...b};for(const k of ['x','y','z'])if(Number.isFinite(a[k])&&Number.isFinite(b[k]))q[k]=lerp(a[k],b[k],alpha);return q;};
 return {...current,now:Number.isFinite(current.now)&&Number.isFinite(previous.now)?lerp(previous.now,current.now,alpha):current.now,players:current.players?.map((p,i)=>point(p,previous.players?.[i])),balls:current.balls?.map((b,i)=>point(b,previous.balls?.[i])),ball:current.ball?point(current.ball,previous.ball):undefined};
}
export function jumpHeight(until,now,reduced=false){const t=Math.max(0,Math.min(1,1-(until-now)/650));return until>now?Math.sin(t*Math.PI)*(reduced?45:65):0;}
export function hitAvailable(id,v,p){return !!v&&contact(id,v,p).ready;}
