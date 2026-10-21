import { randomInt, randomBytes } from 'node:crypto';
const fail=(message,code='INVALID')=>({ok:false,message,code});
const safeName=v=>typeof v==='string'?v.trim().replace(/[\u0000-\u001f\u007f<>]/g,'').slice(0,18):'';
export class Rooms {
  constructor({engines,clock=Date.now,persist=()=>{},countdownMs=3000}) {
    this.engines=engines;this.clock=clock;this.persist=persist;this.countdownMs=countdownMs;
    this.rooms=new Map();this.connections=new Map();this.tokens=new Map();
  }
  handle(event,id,payload={}) {
    if(!payload||typeof payload!=='object'||Array.isArray(payload))return fail('请求格式无效');
    const now=this.clock();
    if(event==='create') {
      const name=safeName(payload.name),gameId=payload.gameId;
      if(!name||!Object.hasOwn(this.engines,gameId))return fail('请输入昵称并选择有效游戏');
      this.leave(id);let code;do{code=String(randomInt(100000,1000000));}while(this.rooms.has(code));
      const room={code,gameId,phase:'waiting',players:[null,null],game:null,createdAt:now,touchedAt:now,history:[],series:{total:1,round:1,scores:[0,0]},recorded:false};
      this.rooms.set(code,room);return this.attach(room,0,name,id,now);
    }
    if(event==='join') {
      const name=safeName(payload.name),code=String(payload.code||'').trim();
      if(!name||!/^\d{6}$/.test(code))return fail('请输入昵称和六位房间码');
      const room=this.rooms.get(code);if(!room)return fail('房间不存在或已经关闭','NOT_FOUND');
      const existing=this.connections.get(id);if(existing?.room===room)return this.identity(existing);
      const slot=room.players.findIndex(p=>p===null);if(slot<0)return fail('这个房间已有两位玩家','FULL');
      if(room.phase==='playing')return fail('这场比赛正在进行');
      this.leave(id);return this.attach(room,slot,name,id,now);
    }
    if(event==='resume') {
      if(typeof payload.token!=='string'||payload.token.length>100)return fail('会话已失效','SESSION');
      const s=this.tokens.get(payload.token);if(!s||!this.rooms.has(s.room.code))return fail('房间已关闭，请重新创建或加入','SESSION');
      const old=s.participant.conn;if(old)this.connections.delete(old);
      this.leave(id);s.participant.conn=id;s.participant.connected=true;s.participant.disconnectedAt=null;s.room.touchedAt=now;
      this.connections.set(id,s);return this.identity(s);
    }
    const s=this.connections.get(id);if(!s)return fail('请先创建或加入房间','SESSION');
    const {room,participant:p,slot}=s;room.touchedAt=now;
    if(event==='leave'){this.leave(id);return {ok:true};}
    if(event==='select') {
      if(room.phase==='playing')return fail('请在本局结束后更换游戏');
      if(slot!==0&&room.players[0])return fail('请让房主选择游戏');
      if(!Object.hasOwn(this.engines,payload.gameId))return fail('找不到这款游戏');
      room.gameId=payload.gameId;room.phase='waiting';room.game=null;room.recorded=false;
      room.series={total:[1,3,5].includes(payload.series)?payload.series:1,round:1,scores:[0,0]};
      room.players.forEach(x=>{if(x)x.ready=false;});return {ok:true};
    }
    if(event==='ready') {
      if(room.phase!=='waiting')return fail('请先选择再来一局');
      p.ready=payload.ready!==false;if(room.players.every(x=>x?.connected&&x.ready))this.start(room,now);return {ok:true};
    }
    if(event==='rematch') {
      if(room.phase!=='finished')return fail('本局尚未结束');
      const series=room.series;
      if(series.round<series.total){series.round++;const ids=Object.keys(this.engines).filter(x=>x!==room.gameId);if(ids.length)room.gameId=ids[randomInt(ids.length)];}
      else if(series.total>1)room.series={total:series.total,round:1,scores:[0,0]};
      room.phase='waiting';room.game=null;room.players.forEach(x=>{if(x)x.ready=false;});return {ok:true};
    }
    if(event==='react') {
      if(!['👏','💪','🤔','😂','❤️','✨'].includes(payload.emoji))return fail('请选择一个表情');
      if(now-(p.reactedAt||0)<800)return fail('稍等一下再发送');p.reactedAt=now;room.reaction={slot,emoji:payload.emoji,at:now};return {ok:true};
    }
    if(event==='action') {
      if(room.phase!=='playing'||!room.game)return fail('等待双方准备后开始');
      if(now<room.startedAt)return fail('双方就位，倒计时后开始','COUNTDOWN');
      if(!Number.isSafeInteger(payload.seq)||payload.seq<=p.lastSeq)return fail('这次操作已处理，请重试','DUPLICATE');
      const a=payload.action;if(!a||typeof a!=='object'||Array.isArray(a)||typeof a.type!=='string'||JSON.stringify(a).length>4096)return fail('操作无效');
      if(p.rateAt!==Math.floor(now/1000)){p.rateAt=Math.floor(now/1000);p.rateCount=0;}if(++p.rateCount>120)return fail('操作过快，请稍等');
      if(a.type==='resign'){p.lastSeq=payload.seq;room.game.status='finished';room.game.winner=1-slot;room.game.message='对方认输';this.finish(room,now);return {ok:true};}
      let accepted=false;try{accepted=this.engines[room.gameId].action(room.game,slot,a,now)===true;}catch{return fail('操作未被接受');}
      if(!accepted)return fail('当前不能这样操作','MOVE');p.lastSeq=payload.seq;
      if(room.game.status==='finished')this.finish(room,now);return {ok:true};
    }
    return fail('不支持的请求');
  }
  attach(room,slot,name,id,now) {
    const token=randomBytes(24).toString('hex'),p={name,token,conn:id,connected:true,ready:false,lastSeq:0,disconnectedAt:null};
    room.players[slot]=p;room.touchedAt=now;const s={room,slot,participant:p};this.connections.set(id,s);this.tokens.set(token,s);return this.identity(s);
  }
  identity(s){return {ok:true,code:s.room.code,player:s.slot,token:s.participant.token,nextSeq:s.participant.lastSeq+1};}
  start(room,now){const start=now+this.countdownMs;room.game=this.engines[room.gameId].create(randomInt(1,0xffffffff),start);room.phase='playing';room.recorded=false;room.startedAt=start;room.players.forEach(x=>x.ready=false);}
  finish(room,now){
    if(room.recorded)return;room.recorded=true;room.phase='finished';room.touchedAt=now;
    const g=room.game,winner=g.winner;if(winner===0||winner===1)room.series.scores[winner]++;else{room.series.scores[0]+=.5;room.series.scores[1]+=.5;}
    const record={id:randomBytes(10).toString('hex'),gameId:room.gameId,players:room.players.map(p=>p?.name||'离开的玩家'),scores:g.scores||[0,0],winner,endedAt:now,startedAt:room.startedAt};
    room.history.unshift(record);room.history=room.history.slice(0,20);try{this.persist(record);}catch(e){console.error('Result persistence failed:',e.message);}
  }
  snapshot(id){
    const s=this.connections.get(id);if(!s)return null;const {room,slot}=s;
    return {player:slot,serverNow:this.clock(),room:{code:room.code,gameId:room.gameId,phase:room.phase,players:room.players.map(p=>p?{name:p.name,connected:p.connected,ready:p.ready}:null),series:structuredClone(room.series),history:structuredClone(room.history),reaction:room.reaction?{...room.reaction}:null,startedAt:room.startedAt||null},game:room.game?this.engines[room.gameId].view(room.game,slot):null};
  }
  disconnect(id){const s=this.connections.get(id);if(!s)return;this.connections.delete(id);s.participant.connected=false;s.participant.conn=null;s.participant.disconnectedAt=this.clock();s.participant.ready=false;s.room.touchedAt=this.clock();}
  leave(id){
    const s=this.connections.get(id);if(!s)return;const {room,slot,participant:p}=s;
    if(room.phase==='playing'&&room.game){room.game.status='finished';room.game.winner=room.players[1-slot]?1-slot:-1;room.game.message='对方离开了房间';this.finish(room,this.clock());}
    this.connections.delete(id);this.tokens.delete(p.token);room.players[slot]=null;room.touchedAt=this.clock();
    if(!room.players.some(Boolean)){this.rooms.delete(room.code);return;}if(room.phase==='waiting')room.players.forEach(x=>{if(x)x.ready=false;});
  }
  tick(dt){
    const now=this.clock();for(const room of this.rooms.values()){
      if(!room.players.some(x=>x?.connected)&&now-room.touchedAt>3600000){room.players.forEach(p=>{if(p)this.tokens.delete(p.token);});this.rooms.delete(room.code);continue;}
      if(room.phase!=='playing'||!room.game)continue;
      if(now<room.startedAt)continue;
      const expired=room.players.map(p=>!p||(!p.connected&&p.disconnectedAt!==null&&now-p.disconnectedAt>60000));
      if(expired.some(Boolean)){room.game.status='finished';room.game.winner=expired.every(Boolean)?-1:expired[0]?1:0;room.game.message='断线超过 60 秒，本局结束';}
      else try{this.engines[room.gameId].tick?.(room.game,dt,now);}catch(e){console.error('Game tick failed:',room.gameId,e.message);room.game.status='finished';room.game.winner=-1;room.game.message='本局异常结束，请再来一局';}
      if(room.game.status==='finished')this.finish(room,now);
    }
  }
}
