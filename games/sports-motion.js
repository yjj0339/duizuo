export const lerp=(a,b,t)=>a+(b-a)*Math.max(0,Math.min(1,t));
// Interpolate presentation coordinates only. Never advance or mutate authoritative state.
export function sampleMotion(current,previous,alpha){
 if(!previous)return current;
 const point=(b,a)=>{if(!a||b.potted||a.potted)return b;const q={...b};for(const k of ['x','y','z'])if(Number.isFinite(a[k])&&Number.isFinite(b[k]))q[k]=lerp(a[k],b[k],alpha);return q;};
 return {...current,now:Number.isFinite(current.now)&&Number.isFinite(previous.now)?lerp(previous.now,current.now,alpha):current.now,players:current.players?.map((p,i)=>point(p,previous.players?.[i])),balls:current.balls?.map((b,i)=>point(b,previous.balls?.[i])),ball:current.ball?point(current.ball,previous.ball):undefined};
}
export function jumpHeight(until,now,reduced=false){const t=Math.max(0,Math.min(1,1-(until-now)/650));return until>now?Math.sin(t*Math.PI)*(reduced?45:65):0;}
export function hitAvailable(id,v,p){
 if(!v||v.status!=='playing'||v.now<v.readyAt)return false;
 if(!v.rally)return v.serving===p;
 if(v.last===p)return false;
 const b=v.ball,me=v.players[p];
 if(id==='badminton')return (b.x<360?0:1)===p&&Math.hypot(b.x-me.x,b.y-(me.jump>v.now?200:280))<=115;
 return v.bounces===1&&Math.abs(b.x-(p?625:95))<=95&&Math.abs(b.y-me.y)<=75&&b.z<=120;
}
