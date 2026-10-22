import { move as publicMove, DIRECTIONS } from './engine.js';

// Row evaluation adapted from nneonneo/2048-ai (MIT); see THIRD_PARTY_NOTICES.md.
// Five bits per rank: unlike a 4-bit board, 32768+32768 remains 65536.
const POW4 = Array.from({length: 64}, (_,i) => i ** 4);
const POW35 = Array.from({length: 64}, (_,i) => i ** 3.5);
const left4 = new Uint32Array(65536), right4 = new Uint32Array(65536), scores4 = new Float64Array(65536);
let initialized = false;
const caches = new Map();
function lineScore(line, n) {
  let empty=0, sum=0, merges=0, previous=0, chain=0, rising=0, falling=0, last=0;
  for(let i=0;i<n;i++) {
    const rank=(line >>> (5*i)) & 31;
    sum += POW35[rank];
    if(!rank) empty++;
    else { if(previous===rank) chain++; else if(chain) { merges+=chain+1;chain=0; } previous=rank; }
    if(i) { const delta=POW4[rank]-POW4[last]; if(delta>0) rising+=delta; else falling-=delta; }
    last=rank;
  }
  if(chain) merges+=chain+1;
  return 200000 + empty*270 + merges*700 - Math.min(rising,falling)*47 - sum*11;
}
function reverse(line,n) { let result=0;for(let i=0;i<n;i++)result=(result*32)+((line >>> (i*5))&31);return result; }
function slideLine(line,n) {
  let result=0, write=0, held=0;
  for(let i=0;i<n;i++) {
    const rank=(line >>> (5*i))&31;if(!rank)continue;
    if(!held) held=rank;
    else if(held===rank) {result+=(held+1)*2**(write++*5);held=0;}
    else {result+=held*2**(write++*5);held=rank;}
  }
  if(held)result+=held*2**(write*5);
  return result;
}
export function initializeAI() {
  if(initialized)return;
  for(let code=0;code<65536;code++) {
    const row=(code&15)|((code&240)<<1)|((code&3840)<<2)|((code&61440)<<3);
    left4[code]=slideLine(row,4);right4[code]=reverse(slideLine(reverse(row,4),4),4);scores4[code]=lineScore(row,4);
  }
  initialized=true;
}
function lineData(line,n) {
  let cache=caches.get(n);if(!cache){cache=new Map();caches.set(n,cache);}
  let value=cache.get(line);
  if(!value){value={left:slideLine(line,n),right:reverse(slideLine(reverse(line,n),n),n),score:lineScore(line,n)};if(cache.size>=90000)cache.clear();cache.set(line,value);}
  return value;
}
function code4(row) {return(row&15)|((row>>>1)&240)|((row>>>2)&3840)|((row>>>3)&61440);}
function transpose(rows,n) {
  if(n===4) {
    const [a,b,c,d]=rows;
    return[(a&31)|((b&31)<<5)|((c&31)<<10)|((d&31)<<15),((a>>>5)&31)|(b&992)|((c&992)<<5)|((d&992)<<10),((a>>>10)&31)|((b>>>5)&992)|(c&31744)|((d&31744)<<5),(a>>>15)|((b>>>10)&992)|((c>>>5)&31744)|(d&1015808)];
  }
  const result=Array(n).fill(0);
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)result[c]|=((rows[r]>>>(c*5))&31)<<(r*5);
  return result;
}
function shift(rows,n,direction) {
  const vertical=direction===0||direction===2, back=direction===1||direction===2;
  const source=vertical?transpose(rows,n):rows,result=Array(n);let changed=false;
  for(let i=0;i<n;i++) {
    const line=source[i];
    result[i]=n===4 && !(line&0x84210) ? (back?right4:left4)[code4(line)] : lineData(line,n)[back?'right':'left'];
    if(result[i]!==line)changed=true;
  }
  return changed ? vertical?transpose(result,n):result : null;
}
function evaluateRows(rows,n) {
  const columns=transpose(rows,n);let score=0;
  for(let i=0;i<n;i++)for(const line of [rows[i],columns[i]])score+=n===4 && !(line&0x84210)?scores4[code4(line)]:lineData(line,n).score;
  return score;
}
function pack(board,n) { const rows=Array(n).fill(0);for(let i=0;i<board.length;i++)if(board[i])rows[Math.floor(i/n)]|=Math.round(Math.log2(board[i]))<<((i%n)*5);return rows; }
function wideEvaluate(board,n) {
  const logs=board.map(value=>value?Math.log2(value):0);let score=0;
  for(let axis=0;axis<2;axis++)for(let line=0;line<n;line++) {
    let empty=0,sum=0,previous=0,chain=0,merges=0,rising=0,falling=0,last=0;
    for(let i=0;i<n;i++) {
      const rank=logs[axis?i*n+line:line*n+i];sum+=rank**3.5;
      if(!rank)empty++;else {if(previous===rank)chain++;else if(chain){merges+=chain+1;chain=0;}previous=rank;}
      if(i){const delta=rank**4-last**4;if(delta>0)rising+=delta;else falling-=delta;}last=rank;
    }
    if(chain)merges+=chain+1;score+=200000+empty*270+merges*700-Math.min(rising,falling)*47-sum*11;
  }
  return score;
}
export function evaluate(board,n) {initializeAI();return Math.max(...board)>=2**30?wideEvaluate(board,n):evaluateRows(pack(board,n),n);}
function chooseWide(board,n,budget) {
  const started=performance.now(),candidates=DIRECTIONS.map(direction=>({direction,result:publicMove(board,n,direction)})).filter(c=>c.result.changed);
  if(!candidates.length)return{direction:null,nodes:0,cacheHits:0,depth:0,ms:performance.now()-started};
  let best=candidates.reduce((a,b)=>wideEvaluate(a.result.board,n)>wideEvaluate(b.result.board,n)?a:b).direction,value=-Infinity,nodes=0;
  for(const c of candidates){
    const empty=c.result.board.flatMap((v,i)=>v?[]:[i]);let expected=0;
    for(const index of empty)for(const [tile,probability] of [[2,.9],[4,.1]]){
      if(performance.now()-started>budget)return{direction:best,nodes,cacheHits:0,depth:0,ms:performance.now()-started};
      const child=[...c.result.board];child[index]=tile;let nextBest=-Infinity;
      for(const dir of DIRECTIONS){nodes++;const next=publicMove(child,n,dir);if(next.changed)nextBest=Math.max(nextBest,wideEvaluate(next.board,n));}
      expected+=probability*nextBest/empty.length;
    }
    if(expected>value){value=expected;best=c.direction;}
  }
  return{direction:best,nodes,cacheHits:0,depth:1,ms:performance.now()-started};
}
// Exported for equivalence/property tests. The renderer uses the separate, audited engine.
export function searchMove(board,n,direction) {
  initializeAI();if(Math.max(...board)>=2**30)return publicMove(board,n,direction);
  const next=shift(pack(board,n),n,DIRECTIONS.indexOf(direction));
  return {changed:!!next,board:next?Array.from({length:n*n},(_,i)=>{const rank=(next[Math.floor(i/n)]>>>((i%n)*5))&31;return rank?2**rank:0;}):[...board]};
}

export function chooseMove(board,size,budget=40,options={}) {
  initializeAI();
  // Extremely large imported boards use ordinary numeric cells, never overflowing packed ranks.
  if(board.reduce((sum,value)=>sum+value,0)>=2**30)return chooseWide(board,size,budget);
  const started=performance.now(), deadline=started+Math.max(1,budget), rows=pack(board,size);
  let nodes=0,cacheHits=0,completedDepth=0;
  const choices=[];
  for(let direction=0;direction<4;direction++) {const next=shift(rows,size,direction);if(next)choices.push({direction,rows:next,value:evaluateRows(next,size)});}
  if(!choices.length)return{direction:null,nodes,cacheHits,depth:0,ms:performance.now()-started};
  choices.sort((a,b)=>b.value-a.value);
  let best=choices[0].direction;
  // All spawn positions are enumerated. Only extremely unlikely deeper branches are cut.
  const probabilityCutoff=options.cutoff ?? 0.0001, maxDepth=options.maxDepth ?? 8, limit=options.nodeLimit ?? Infinity;
  const timeout=Symbol('budget'), tables=Array.from({length:maxDepth+1},()=>new Map());
  function tick(){if((++nodes&255)===0&&(performance.now()>=deadline||nodes>=limit))throw timeout;}
  function chance(state,depth,probability) {
    tick();if(depth===0||probability<probabilityCutoff)return evaluateRows(state,size);
    let key,table;
    if(depth>=2) {
      table=tables[depth];key=state.join(',')+':'+Math.round(probability*1e8);
      const cached=table.get(key);if(cached!==undefined){cacheHits++;return cached;}
    }
    let count=0;
    for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(!((state[r]>>>(5*c))&31))count++;
    if(!count)return player(state,depth-1,probability);
    const nextProbability=probability/count;
    let value=0;
    for(let r=0;r<size;r++)for(let c=0;c<size;c++) {
      const bit=5*c;if((state[r]>>>bit)&31)continue;
      const child=state.slice();child[r]|=1<<bit;value+=.9*player(child,depth-1,nextProbability*.9);
      child[r]=state[r]|(2<<bit);value+=.1*player(child,depth-1,nextProbability*.1);
    }
    value/=count;
    if(table&&table.size<25000)table.set(key,value);
    return value;
  }
  function player(state,depth,probability) {
    tick();let value=-1e12;
    for(let direction=0;direction<4;direction++) {const next=shift(state,size,direction);if(next)value=Math.max(value,chance(next,depth,probability));}
    return value;
  }
  for(let depth=1;depth<=maxDepth;depth++) {
    const iteration=[];
    try {
      for(const choice of choices)iteration.push({...choice,value:chance(choice.rows,depth,1)});
      iteration.sort((a,b)=>b.value-a.value);best=iteration[0].direction;completedDepth=depth;
      choices.splice(0,choices.length,...iteration);
    } catch(error){if(error!==timeout)throw error;break;}
    if(performance.now()>=deadline||nodes>=limit)break;
  }
  return{direction:DIRECTIONS[best],nodes,cacheHits,depth:completedDepth,ms:performance.now()-started};
}
