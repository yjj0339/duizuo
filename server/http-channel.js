import {randomUUID} from 'node:crypto';
const allowed=new Set(['select','ready','rematch','action','react','leave','presence']);
export function httpChannel(rooms,changed,replaced=()=>{}){
 const leases=new Map(),waiters=new Set();let revision=1;
 const notify=()=>{revision++;for(const wake of [...waiters])wake();};
 const json=(res,value,code=200)=>{if(res.destroyed)return;res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 const body=async req=>{let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>16384)throw Error('请求过大');}const value=JSON.parse(text||'{}');if(!value||typeof value!=='object'||Array.isArray(value))throw Error('请求无效');return value;};
 const tokenFor=req=>req.headers.authorization?.replace(/^Bearer /,'');
 const session=token=>typeof token==='string'&&token.length===48?rooms.tokens.get(token):null;
 function activate(id){leases.set(id,Date.now());}
 return {notify,close(){for(const wake of [...waiters])wake();waiters.clear();},tick(){for(const [id,at]of leases)if(Date.now()-at>40000){leases.delete(id);rooms.disconnect(id);notify();}},async handle(req,res,name){
  if(!name.startsWith('/api/'))return false;
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, X-Duo-Connection');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Max-Age','600');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return true;}
  try{
   if(name==='/api/session'&&req.method==='POST'){
    const b=await body(req);if(!['create','join','resume'].includes(b.event)){json(res,{ok:false,message:'会话请求无效'},400);return true;}
    const old=b.event==='resume'?session(b.payload?.token)?.participant.conn:null,id='http:'+randomUUID(),r=rooms.handle(b.event,id,b.payload||{});if(r.ok){activate(id);r.channelId=id;if(old&&old!==id)replaced(old);}changed();json(res,r);return true;
   }
   if(name==='/api/presence'&&req.method==='POST'){
    const b=await body(req),s=session(b.token||tokenFor(req));if(!s?.participant.conn){json(res,{ok:false,code:'SESSION'},401);return true;}
    if(b.channelId&&b.channelId!==s.participant.conn){json(res,{ok:false,code:'REPLACED'},409);return true;}
    const result=rooms.handle('presence',s.participant.conn,{active:b.active});changed();json(res,result);return true;
   }
   const s=session(tokenFor(req)),id=s?.participant.conn;
   if(!id?.startsWith('http:')||!rooms.connections.has(id)||req.headers['x-duo-connection']&&req.headers['x-duo-connection']!==id){json(res,{ok:false,code:s?'REPLACED':'SESSION',message:'此对局已在另一个页面恢复'},401);return true;}
   activate(id);
   if(name==='/api/command'&&req.method==='POST'){
    const b=await body(req);if(!allowed.has(b.event)){json(res,{ok:false,message:'请求无效'},400);return true;}
    const result=rooms.handle(b.event,id,b.payload||{});changed();json(res,result);return true;
   }
   if(name==='/api/snapshot'&&req.method==='GET'){
    const after=Number(new URL(req.url,'http://localhost').searchParams.get('after'));
    if(after===revision&&!req.destroyed)await new Promise(resolve=>{let timer;const wake=()=>{clearTimeout(timer);waiters.delete(wake);req.off('close',wake);resolve();};waiters.add(wake);req.on('close',wake);timer=setTimeout(wake,20000);});
    const view=rooms.snapshot(id);json(res,view?{...view,revision}:{ok:false,code:'SESSION'},view?200:401);return true;
   }
   json(res,{ok:false,message:'找不到请求'},404);
  }catch{json(res,{ok:false,message:'请求格式无效'},400);}return true;
 }};
}
