import {engines} from '../shared/engines.js';
export function shiftView(value,shift){const v=structuredClone(value);function walk(o){if(!o||typeof o!=='object')return;for(const[k,n]of Object.entries(o))if(typeof n==='number'&&n>0&&(/At$|Until$/.test(k)||k==='now'||k==='until'))o[k]=n+shift;else if(n&&typeof n==='object')walk(n);}walk(v);return v;}
const saveKey='duo:solo-v2';
export function savedSolo(){try{const s=JSON.parse(localStorage.getItem(saveKey));return s?.version===2&&engines[s.id]&&s.state?.status==='playing'?s:null;}catch{return null;}}
export class Solo{
 constructor(id,{mode='practice',level='master',human=0,daily=false,saved=null,onError=()=>{}}={}){
  this.id=id;this.mode=mode;this.level=level;this.human=human;this.key=Date.now()+':'+Math.random();this.timeShift=0;this.pausedAt=null;this.busy=false;this.moves=0;this.aiBrain=saved?.brain||{};
  const date=new Date().toLocaleDateString('en-CA');this.seed=daily?[...date+id].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619),2166136261)>>>0:crypto.getRandomValues(new Uint32Array(1))[0];this.daily=daily;
  this.state=engines[id].create(this.seed||1,Date.now());
  if(saved){Object.assign(this,{id:saved.id,state:saved.state,level:saved.level,mode:'ai',human:saved.human,seed:saved.seed,daily:saved.daily});this.timeShift=Date.now()-saved.now;}
  if(this.mode==='ai'){this.worker=new Worker(new URL('../ai/worker.js',import.meta.url),{type:'module'});this.worker.onmessage=({data})=>{this.busy=false;if(data.key!==this.key)return;if(data.brain)this.aiBrain=data.brain;if(this.pausedAt!=null||document.hidden||this.state.status!=='playing')return;if(data.error){if(!this.errored){this.errored=true;onError('AI 计算遇到问题，请保存后重新载入');}return;}if(data.action&&engines[this.id].action(this.state,1-this.human,data.action,this.now()))this.moves++;};this.worker.onerror=()=>onError('AI 载入失败，请刷新页面重试');}
 }
 now(){return (this.pausedAt??Date.now())-this.timeShift;}
 pause(value=true){if(value){this.pausedAt??=Date.now();this.save();}else if(this.pausedAt!=null){this.timeShift+=Date.now()-this.pausedAt;this.pausedAt=null;}}
 action(player,action){if(this.pausedAt!=null||document.hidden)return false;return engines[this.id].action(this.state,player,action,this.now());}
 view(player){return shiftView(engines[this.id].view(this.state,player),Date.now()-this.now());}
 tick(dt){if(this.pausedAt!=null||document.hidden||this.state.status==='finished')return;const now=this.now();engines[this.id].tick?.(this.state,dt,now);if(this.worker&&!this.busy&&this.state.status==='playing'){this.busy=true;this.worker.postMessage({key:this.key,id:this.id,view:engines[this.id].view(this.state,1-this.human),player:1-this.human,level:this.level,now,brain:this.aiBrain});}if(Date.now()-(this.savedAt||0)>2000){this.savedAt=Date.now();this.save();}}
 save(){if(this.mode!=='ai')return;try{localStorage.setItem(saveKey,JSON.stringify({version:2,id:this.id,level:this.level,human:this.human,seed:this.seed,daily:this.daily,state:this.state,now:this.now(),brain:this.aiBrain}));}catch{}}
 destroy(){this.save();this.worker?.terminate();}
}
