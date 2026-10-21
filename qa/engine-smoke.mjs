import {engines} from '../shared/engines.js';
import {catalog} from '../shared/catalog.js';
import {bots} from '../scripts/test-bots.mjs';
import {writeFile} from 'node:fs/promises';
const rows=[];
for(const {id} of catalog){
 const start=1700000000000,s=engines[id].create(id.length*2654435761>>>0||1,start),locals=[{},{}];let now=start,accepted=0,error=null;
 try{while(s.status!=='finished'&&now-start<650000){now+=33;engines[id].tick?.(s,.033,now);for(const p of [0,1]){if(s.status==='finished')break;const view=engines[id].view(s,p),action=bots[id](view,p,locals[p]);if(action&&engines[id].action(s,p,action,now))accepted++;}}}catch(e){error=e.stack;}
 const row={id,finished:s.status==='finished',winner:s.winner,scores:s.scores,seconds:Math.round((now-start)/1000),accepted,error};rows.push(row);console.log(`${row.finished&&!error?'PASS':'FAIL'} ${id} ${row.seconds}s ${accepted} accepted ${error||''}`);
}
await writeFile(new URL('../artifacts/playthrough.json',import.meta.url),JSON.stringify(rows,null,2));
console.log(`${rows.filter(x=>x.finished&&!x.error).length}/${rows.length} complete`);if(rows.some(x=>!x.finished||x.error))process.exitCode=1;
