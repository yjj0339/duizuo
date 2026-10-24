import {strict as assert} from 'node:assert';import {writeFileSync,mkdirSync} from 'node:fs';
import {games} from '../games/sports-engines.js';import {sportsAI} from '../ai/sports.js';import {interval} from '../ai/strategies.js';
const report=[];
for(const id of ['badminton','tabletennis'])for(const levels of [['master','master'],['master','casual'],['casual','master']]){
 const e=games[id],s=e.create(31,1000),brains=[{},{}],next=[1000,1000];let invalid=0,shots=0;
 for(let n=1;n<=18000&&s.status==='playing';n++){const now=1000+n*1000/60;e.tick(s,1/60,now);for(let p=0;p<2&&s.status==='playing';p++)if(now>=next[p]){next[p]=now+interval(id,levels[p]);const a=sportsAI[id](e.view(s,p),p,brains[p],levels[p],now);if(a){if(!e.action(s,p,a,now))invalid++;else if(a.type==='hit')shots++;}}}
 assert.ok(shots>=10,id+' should sustain actual rallies');assert.equal(invalid,0,id+' AI only sends legal actions');assert.equal(s.status,'finished');
 if(levels[0]!==levels[1])assert.equal(s.winner,levels[0]==='master'?0:1,id+' skill levels must differ in actual outcomes');
 else assert.ok(s.longestRally>=10,id+' equal masters sustain a rally');
 report.push({id,levels,scores:s.scores,shots,longest:s.longestRally,winner:s.winner,invalid,stats:s.stats});
}
mkdirSync('artifacts/gameplay-v7',{recursive:true});writeFileSync('artifacts/gameplay-v7/ai-rallies.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
