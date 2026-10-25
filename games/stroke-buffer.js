import {contact} from './racket-rules.js';
import {simpleBadmintonShot} from './court-controls.js';

// Input grace only: the authority still validates the resulting ordinary hit action.
export function createStrokeBuffer(id,player){
 let pending=null;
 const token=v=>`${v.scores?.join(',')}:${v.rallyHits}:${v.last}`;
 const resolve=(v,input)=>{
  const style=input.style==='auto'?simpleBadmintonShot(v,player):input.style;
  const info=contact(id,v,player,v?.now,style||'clear');
  return {info,action:style&&info.ready?{...input,type:'hit',style}:null};
 };
 return {
  clear(){pending=null;},
  press(v,input,now){
   pending=null;
   if(!v)return {status:'rejected',reason:'等待球场就绪'};
   const {info,action}=resolve(v,input);
   if(action)return {status:'ready',action};
   if(v.status==='playing'&&v.rally&&v.last!==player&&v.now>=v.readyAt){pending={input:{...input},until:now+140,token:token(v)};return {status:'buffered',reason:info.reason};}
   return {status:'rejected',reason:info.reason};
  },
  take(v,now){
   if(!pending)return null;
   if(!v||now>pending.until||v.status!=='playing'||!v.rally||pending.token!==token(v)){pending=null;return null;}
   const {action}=resolve(v,pending.input);
   if(action)pending=null;
   return action;
  }
 };
}
