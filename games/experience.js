import {guide,blockedReason,stampAction,actionEvent} from './experience-model.js';

const pop=[{transform:'scale(.78)',opacity:.35},{transform:'scale(1.08)',opacity:1,offset:.7},{transform:'scale(1)',opacity:1}];
const glow=[{filter:'brightness(1.55)'},{filter:'brightness(1)'}];
const flip=[{transform:'perspective(500px) rotateY(-90deg)',opacity:.35},{transform:'perspective(500px) rotateY(0)',opacity:1}];
const cellSelectors={gomoku:'.board-gomoku-grid .board-cell',reversi:'.board-reversi-grid .board-cell',memory:'.board-memory-grid .board-cell',mines:'.board-mines-grid .board-cell',connect4:'.classic-cell',tictactoe:'.classic-cell',hex:'.classic-hex polygon',slide:'.classic-cell',lights:'.classic-cell'};

// A retained presentation layer for all 32 renderers. Never invent scores or winners.
export function withExperience(id,mount){return(root,send,context)=>{
 let view=null,dead=false,frame=0,paused=false,eventCount=0;const animations=new Set(),pausedAnimations=new Set(),ghosts=new Set();
 const doc=root.ownerDocument,el=(tag,cls,text)=>{const e=doc.createElement(tag);e.className=cls;if(text)e.textContent=text;return e;};
 const panel=el('aside','match-guide'),goal=el('strong','match-guide-goal'),state=el('span','match-guide-state'),cue=el('span','match-cue','一起认真玩一局');
 cue.setAttribute('role','status');cue.setAttribute('aria-live','polite');panel.append(goal,state,cue);
 const isPaused=()=>!!context.isPaused?.()||doc.hidden;
 function animate(node,frames=pop,duration=280,delay=0){
  if(!node||context.reducedMotion||dead)return null;
  // Replacing a transient on the same node avoids accumulating effects on fast input.
  for(const a of animations)if(a.effect?.target===node){a.cancel();animations.delete(a);}
  const a=node.animate(frames,{duration,delay,easing:'cubic-bezier(.18,.75,.28,1)',fill:'none'});animations.add(a);
  if(isPaused()){a.pause();pausedAnimations.add(a);}
  a.finished.then(()=>{animations.delete(a);pausedAnimations.delete(a);},()=>{animations.delete(a);pausedAnimations.delete(a);});return a;
 }
 function announce(text,kind='action'){
  cue.textContent=text;cue.dataset.kind=kind;root.dataset.lastEvent=kind;root.dataset.eventCount=String(++eventCount);
  animate(cue,[{opacity:.35,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],260);
 }
 const command=a=>{
  if(dead||!a)return false;
  const reason=isPaused()?'当前已暂停，继续对局后再操作':blockedReason(id,view,context.player,a);
  if(reason){announce(reason,'notice');return false;}
  return send(stampAction(id,view,a));
 };
 const renderer=mount(root,command,context);root.append(panel);root.classList.add('experience-game');
 const nodes=selector=>[...root.querySelectorAll(selector)];
 function changedCells(before,after,selector,frames=pop){const list=nodes(selector);after?.forEach((n,i)=>{if(before?.[i]!==n)animate(list[i],frames,300,Math.min(i%9,5)*22);});}
 function ghost(node,frames){
  if(!node||context.reducedMotion)return;const r=node.getBoundingClientRect(),base=root.getBoundingClientRect(),g=node.cloneNode(true);
  g.removeAttribute('id');g.removeAttribute('tabindex');g.setAttribute('aria-hidden','true');g.classList.add('match-ghost');Object.assign(g.style,{left:`${r.left-base.left}px`,top:`${r.top-base.top}px`,width:`${r.width}px`,height:`${r.height}px`});root.append(g);ghosts.add(g);
  const a=animate(g,frames,330);a?.finished.finally(()=>{g.remove();ghosts.delete(g);}).catch(()=>{});
 }
 function motion(b,v){
  if(!b||context.reducedMotion)return;
  if(id==='gomoku')changedCells(b.board,v.board,cellSelectors[id],[{transform:'translateY(-14px) scale(.8)',opacity:.2},{transform:'translateY(0) scale(1)',opacity:1}]);
  if(id==='dots'){changedCells(b.edges,v.edges,'.board-edge',[{opacity:.2,filter:'brightness(1.6)'},{opacity:1,filter:'brightness(1)'}]);changedCells(b.boxes,v.boxes,'.board-dots-box');}
  if(id==='reversi')changedCells(b.board,v.board,cellSelectors[id],flip);
  if(id==='memory')v.owners.forEach((n,i)=>{if(n>=0&&b.owners[i]!==n)animate(nodes(cellSelectors[id])[i],glow,520);});
  if(id==='fleet'){for(const [key,offset]of[['ownBoard',0],['targetBoard',64]])v[key].forEach((n,i)=>{if(n!==b[key][i])animate(nodes('.board-sea-grid .board-cell')[offset+i],n===0||n===3?glow:pop,420);});}
  if(id==='rps'&&b.phase!==v.phase&&v.phase==='reveal')nodes('.board-rps-hand').forEach((n,i)=>animate(n,[{transform:`translateX(${i?22:-22}px) rotate(${i?10:-10}deg)`,opacity:.3},{transform:'translateX(0) rotate(0)',opacity:1}],440,i*60));
  if(id==='mines')changedCells(b.flags,v.flags,cellSelectors[id],pop);
  if(id==='sudoku'){
   const p=context.player,prev=b.players[p].cells,next=v.players[p].cells,list=nodes('.puzzle-sudoku-cell');
   next.forEach((n,i)=>{if(n!==prev[i])animate(list[i],v.players[p].wrong[i]?[{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}]:pop,280);});
   for(let row=0;row<9;row++){const done=a=>a.slice(row*9,row*9+9).every(Boolean)&&new Set(a.slice(row*9,row*9+9)).size===9;if(done(next)&&!done(prev))for(let col=0;col<9;col++)animate(list[row*9+col],glow,500,col*30);}
  }
  if(id==='quiz'&&(v.round!==b.round||v.phase!==b.phase)){animate(root.querySelector('.puzzle-quiz-card'),[{opacity:.25,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],280);if(v.phase==='reveal')animate(root.querySelector('[data-correct="true"]'),pop,420);}
  if(id==='reaction'&&v.phase==='ready'&&b.phase!=='ready')animate(root.querySelector('.puzzle-signal'),glow,180);
  if(id==='typing'&&v.players[context.player].correct>b.players[context.player].correct)animate(root.querySelector('.puzzle-meter-fill'),glow,220);
  if(id==='simon'){
   if(v.cue!==null&&(b.cueIndex!==v.cueIndex||b.cue!==v.cue))animate(nodes('.puzzle-note')[v.cue],pop,300);
   const p=context.player;if(v.players[p].position>b.players[p].position)animate(nodes('.puzzle-note')[v.players[p].lastNote],glow,250);
  }
  if(id==='lights')changedCells(b.players[context.player].cells,v.players[context.player].cells,cellSelectors[id],[{transform:'scale(.84) rotate(-12deg)',filter:'brightness(1.8)'},{transform:'scale(1) rotate(0)',filter:'brightness(1)'}]);
  if(id==='nim')b.piles.forEach((count,p)=>{if(count>v.piles[p]){const tray=nodes('.classic-tray')[p];animate(tray,glow,400);}});
  if(v.winningLine?.length&&!b.winningLine?.length){const list=nodes(cellSelectors[id]||'.classic-cell');v.winningLine.forEach((i,k)=>animate(list[i],glow,650,k*75));}
  // Spatial feedback is already rendered inside all twelve Canvas games.
  // Highlight their score badge only after the authoritative score changes.
  if(root.querySelector('canvas')&&v.scores.some((n,i)=>n!==b.scores[i]))animate(root.querySelector('.sports-state,.arcade-scoreboard'),glow,450);
 }
 // Capture repeat only for discrete actions; movement keys keep their hold behavior.
 const repeat=e=>{if(!e.repeat||e.target.closest('input,textarea,select'))return;if(['gomoku','fleet','dots','memory','reversi','rps','quiz','reaction','simon','connect4','tictactoe','hex','nim','lights','checkers','penalty','archery'].includes(id)||id==='tetris'&&[' ','ArrowUp','x','X','z','Z'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();}};
 root.addEventListener('keydown',repeat,true);
 function syncPause(){
  if(dead)return;const next=isPaused();
  if(next!==paused){paused=next;root.classList.toggle('motion-paused',paused);
   if(paused){for(const a of root.getAnimations({subtree:true})){if(a.playState==='running'||a.pending){a.pause();pausedAnimations.add(a);}}}
   else{for(const a of pausedAnimations)if(a.playState==='paused')a.play();pausedAnimations.clear();}
  }frame=requestAnimationFrame(syncPause);
 }frame=requestAnimationFrame(syncPause);
 return{update(v){if(dead)return;const before=view;
  // Removed beans need their old screen bounds before the renderer hides them.
  if(id==='nim'&&before&&!isPaused())before.piles.forEach((n,p)=>{if(n>v.piles[p]){const beans=nodes('.classic-tray')[p]?.querySelectorAll('.classic-bean');for(let i=v.piles[p];i<n;i++)ghost(beans?.[i],[{transform:'translateY(0) scale(1)',opacity:1},{transform:'translateY(-28px) scale(.35)',opacity:0}]);}});
  view=v;renderer.update(v);const g=guide(id,v,context.player);goal.textContent=g.goal;state.textContent=g.state;panel.dataset.waiting=String(g.waiting);
  if(!isPaused()){motion(before,v);const event=actionEvent(id,before,v,context.player);if(event){announce(event.text,event.kind);if(['score','merge','lock','flip','place','take','light','reveal','flag','jump'].includes(event.kind))context.feedback?.(event.kind==='score'?'point':'tap');else if(event.kind==='error')context.feedback?.('error');}}
 },destroy(){dead=true;cancelAnimationFrame(frame);root.removeEventListener('keydown',repeat,true);for(const a of animations)a.cancel();for(const g of ghosts)g.remove();animations.clear();ghosts.clear();pausedAnimations.clear();renderer.destroy();panel.remove();root.classList.remove('experience-game','motion-paused');delete root.dataset.lastEvent;delete root.dataset.eventCount;}};
};}
