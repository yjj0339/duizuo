import {io} from 'socket.io-client';
const storage={get(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}},set(key,value){try{value?localStorage.setItem(key,JSON.stringify(value)):localStorage.removeItem(key);}catch{}}};
export class Connection{
 constructor(url,{snapshot,identity,state,reset,room='',mode='auto',isActive=()=>!document.hidden,allowResumeFrom=''}={}){
  this.isActive=isActive;
  this.url=url;this.callbacks={snapshot,identity,state,reset};this.mode=mode;this.alive=true;this.connected=false;this.ready=false;this.http=false;this.token=null;this.revision=0;
  let saved=storage.get('duo:session-v2');if(!saved){try{saved=JSON.parse(sessionStorage.getItem('duo:session'));}catch{}}
  if(saved?.token&&(!room||saved.code===room)&&(saved.server===url||saved.server===allowResumeFrom||!room))this.saved=saved;
  if(mode==='http')this.startHTTP();else this.startSocket();
 }
 setState(label,state){if(this.alive)this.callbacks.state?.(label,state);}
 remember(r){if(!r?.ok||!r.token)return;this.token=r.token;if(r.channelId)this.channelId=r.channelId;this.saved={token:r.token,code:r.code,server:this.url};storage.set('duo:session-v2',this.saved);try{sessionStorage.setItem('duo:session',JSON.stringify(this.saved));}catch{}this.callbacks.identity?.(r);if(this.http)this.poll();}
 forget(){this.token=null;this.saved=null;storage.set('duo:session-v2',null);try{sessionStorage.removeItem('duo:session');}catch{}this.callbacks.reset?.();}
 startSocket(){
  this.socket=io(this.url,{transports:['polling','websocket'],tryAllTransports:true,reconnection:true,reconnectionDelay:500,reconnectionDelayMax:2500,randomizationFactor:.3,timeout:6000});
  this.fallback=setTimeout(()=>{if(!this.connected)this.startHTTP();},6500);
  this.socket.on('snapshot',v=>{if(this.alive&&!this.http){this.ready=true;this.setState('对战服务在线','online');this.callbacks.snapshot?.(v);}});
  this.socket.on('connect',async()=>{if(!this.alive||this.http)return;clearTimeout(this.fallback);this.connected=true;this.ready=false;this.setState('正在恢复身份与进度','connecting');await this.restore();if(!this.token){this.ready=true;this.setState('对战服务在线','online');}});
  this.socket.on('disconnect',()=>{if(!this.alive||this.http)return;this.connected=false;this.ready=false;this.setState('连接恢复中 · 对局受保护','offline');clearTimeout(this.fallback);this.fallback=setTimeout(()=>this.startHTTP(),4500);});
  this.socket.on('connect_error',()=>this.setState('连接恢复中 · 正在尝试备用通道','connecting'));
    this.socket.on('session-replaced',()=>{this.replaced=true;this.connected=false;clearTimeout(this.fallback);this.socket.removeAllListeners();this.socket.disconnect();this.setState('本局已在另一个页面打开','offline');});
 }
 async restore(){if(this.replaced||!this.alive)return;if(this.restoring)return this.restoring;this.restoring=(async()=>{const token=this.token||this.saved?.token;if(token){const r=await this.request('resume',{token});if(r.ok)this.remember(r);else if(r.code==='SESSION'){this.forget();this.setState('原房间已关闭 · 可以新开一局','online');}}await this.presence(this.isActive?.()??!document.hidden);})();try{await this.restoring;}finally{this.restoring=null;}}
 async fetchJSON(path,options={}){const r=await fetch(this.url+path,{...options,cache:'no-store',signal:AbortSignal.timeout(path.includes('snapshot')?25000:7000)});return r.json();}
 async startHTTP(){
  if(!this.alive||this.http||this.replaced)return;this.http=true;this.ready=false;clearTimeout(this.fallback);this.socket?.removeAllListeners();this.socket?.disconnect();this.connected=false;
  this.setState('正在切换 HTTPS 兼容连接','connecting');
  while(this.alive&&this.http&&!this.connected){try{const health=await this.fetchJSON('/health');if(!health.transports?.includes('https-long-poll'))throw Error();this.connected=true;await this.restore();if(!this.token){this.ready=true;this.setState('HTTPS 兼容连接在线','online');}this.poll();}catch{this.setState('等待网络恢复 · 已保留身份','offline');await new Promise(r=>setTimeout(r,2000));}}
 }
 async request(event,payload={}){
  if(!this.alive||!this.connected||this.replaced)return {ok:false,code:'NETWORK',message:'正在恢复连接，对局和身份会保留，请稍候'};
  if(!this.ready&&!['resume','presence'].includes(event))return {ok:false,code:'NETWORK',message:'正在同步身份和最新进度，请稍候'};
  if(!this.http)return new Promise(resolve=>this.socket.timeout(6500).emit(event,payload,(err,result)=>resolve(err?{ok:false,code:'NETWORK',message:'网络暂时超时，请重试；身份已保留'}:result||{ok:false,code:'NETWORK'})));
  try{const session=['create','join','resume'].includes(event);return await this.fetchJSON(session?'/api/session':'/api/command',{method:'POST',headers:{'Content-Type':'application/json',...(this.token?{Authorization:`Bearer ${this.token}`}:{ } ),...(this.channelId?{'X-Duo-Connection':this.channelId}:{})},body:JSON.stringify({event,payload})});}catch{return {ok:false,code:'NETWORK',message:'网络暂时超时，请稍候重试'};}
 }
 async poll(){
  if(this.polling||!this.alive||!this.http||!this.token)return;this.polling=true;
  while(this.alive&&this.http&&this.token&&!this.replaced){const token=this.token,channelId=this.channelId;try{
   const v=await this.fetchJSON('/api/snapshot?after='+this.revision,{headers:{Authorization:`Bearer ${token}`,...(channelId?{'X-Duo-Connection':channelId}:{})}});if(!this.alive||token!==this.token)break;if(channelId!==this.channelId)continue;
   if(v.code==='REPLACED'){this.replaced=true;this.connected=false;this.setState('本局已在另一个页面打开','offline');break;}
   if(v.code==='SESSION'){this.connected=true;const r=await this.request('resume',{token});if(r.ok)this.remember(r);else if(r.code==='SESSION'){this.forget();break;}else throw Error();}
   else{this.revision=v.revision;this.connected=true;this.ready=true;this.setState('HTTPS 兼容连接在线','online');this.callbacks.snapshot?.(v);}
   await new Promise(r=>setTimeout(r,80));
  }catch{this.connected=false;this.ready=false;this.setState('网络恢复中 · 身份已保留','offline');await new Promise(r=>setTimeout(r,1500));}}
  this.polling=false;
 }
 presence(active){
  if(!this.alive||this.replaced)return Promise.resolve();const token=this.token||this.saved?.token;if(!token)return Promise.resolve();
  if(!active){const data=JSON.stringify({token,active:false,channelId:this.http?this.channelId:this.socket?.id});try{if(navigator.sendBeacon?.(this.url+'/api/presence',new Blob([data],{type:'text/plain'})))return Promise.resolve();}catch{}
   return fetch(this.url+'/api/presence',{method:'POST',body:data,keepalive:true}).catch(()=>{});
  }
  return this.request('presence',{active:true});
 }
 async recover(){if(!this.alive||this.replaced)return;if(this.http){if(!this.connected)this.connected=true;await this.restore();this.poll();}else if(!this.socket.connected)this.socket.connect();else await this.restore();}
 close(){this.alive=false;clearTimeout(this.fallback);this.socket?.removeAllListeners();this.socket?.disconnect();}
}
