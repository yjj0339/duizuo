import http from 'node:http';
import {readFile,stat,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {Server} from 'socket.io';
import {Rooms} from './rooms.js';
import {engines} from '../shared/engines.js';
import {catalog} from '../shared/catalog.js';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
export async function createApp({dataDir=path.join(ROOT,'runtime','data'),persist=true}={}) {
  let db=null;
  if(persist){await mkdir(dataDir,{recursive:true});db=new DatabaseSync(path.join(dataDir,'duo-play.sqlite'));db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS matches(id TEXT PRIMARY KEY, game TEXT NOT NULL, ended INTEGER NOT NULL, data TEXT NOT NULL)');}
  const rooms=new Rooms({engines,persist:r=>db?.prepare('INSERT OR IGNORE INTO matches VALUES(?,?,?,?)').run(r.id,r.gameId,r.endedAt,JSON.stringify(r))});
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Access-Control-Allow-Origin','*');
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
    let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
    if(name==='/health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,name:'DUO PLAY',version:'1.0.0',games:catalog.length,rooms:rooms.rooms.size,now:Date.now()}));return;}
    const base=path.join(ROOT,'dist');const file=path.resolve(base,'.'+(name==='/'?'/index.html':name));
    if(file!==base&&!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
    try{if(!(await stat(file)).isFile())throw new Error();const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':name.endsWith('.html')||name.endsWith('.json')?'no-store':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:body);}
    catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('页面不存在。请先构建前端或打开 GitHub Pages。');}
  });
  const io=new Server(server,{cors:{origin:'*',methods:['GET','POST']},maxHttpBufferSize:16384,pingInterval:12000,pingTimeout:15000,serveClient:false});
  const publish=()=>{for(const [id,socket] of io.sockets.sockets){const view=rooms.snapshot(id);if(view)socket.emit('snapshot',view);}};
  io.on('connection',socket=>{
    let requests=0,rateAt=0;
    for(const event of ['create','join','resume','select','ready','rematch','action','react','leave'])socket.on(event,(payload,ack)=>{
      if(typeof ack!=='function')return;
      const t=Math.floor(Date.now()/1000);if(t!==rateAt){requests=0;rateAt=t;}if(++requests>150){ack({ok:false,message:'请求过快，请稍等'});return;}
      try{const result=rooms.handle(event,socket.id,payload);ack(result);publish();}catch{ack({ok:false,message:'请求未完成，请重试'});}
    });
    socket.on('ping-check',ack=>{if(typeof ack==='function')ack(Date.now());});
    socket.on('disconnect',()=>{rooms.disconnect(socket.id);publish();});
  });
  let tickCount=0,last=Date.now();const timer=setInterval(()=>{const now=Date.now(),dt=Math.min(.1,(now-last)/1000);last=now;rooms.tick(dt);if(++tickCount%2===0)publish();},1000/30);
  return {server,io,rooms,listen(port=4380,host='127.0.0.1'){return new Promise(resolve=>server.listen(port,host,()=>resolve(server.address())));},async close(){clearInterval(timer);await new Promise(resolve=>io.close(resolve));db?.close();}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const app=await createApp();const port=Number(process.env.PORT||4380);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT');
  await app.listen(port);console.log(`DUO PLAY ready: http://127.0.0.1:${port}`);
  const stop=async()=>{await app.close();process.exit(0);};process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
