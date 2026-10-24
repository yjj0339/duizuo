import {study,playbooks} from './game-lab.js';
const selectors={gomoku:'.board-gomoku-grid .board-cell',connect4:'.classic-cell',tictactoe:'.classic-cell',reversi:'.board-reversi-grid .board-cell'};
export function mountLab(root,id,context){
 const doc=root.ownerDocument,el=(tag,cls='',value)=>{const e=doc.createElement(tag);e.className=cls;if(value!==undefined)e.textContent=value;return e;};
 const prefs=context.annotations||(context.annotations={}),key='lab-'+context.player,state=prefs[key]||(prefs[key]={open:false,marks:false,achieved:false});
 const box=el('details','game-lab'),summary=el('summary'),title=el('span','','本局观察 · 进阶手册'),badge=el('span','game-lab-badge','展开'),body=el('div','game-lab-body'),metrics=el('div','game-lab-metrics'),insight=el('p','game-lab-insight'),goal=el('div','game-lab-goal'),label=el('span'),bar=el('progress');
 summary.append(title,badge);goal.append(label,bar);body.append(metrics,insight,goal);
 const lessons=el('ol','game-lab-lessons');for(const tip of playbooks[id])lessons.append(el('li','',tip));body.append(lessons);box.append(summary,body);box.open=state.open;root.append(box);
 let view,lastAt=-Infinity,signature='',marked=[],markButton;
 if(context.practice&&selectors[id]){markButton=el('button','game-button','显示战术标记');markButton.type='button';markButton.setAttribute('aria-pressed',String(state.marks));body.append(markButton);markButton.addEventListener('click',toggleMarks);}
 const stop=e=>e.stopPropagation();box.addEventListener('keydown',stop);box.addEventListener('keyup',stop);
 function paintMarks(marks){for(const n of marked)n.classList.remove('lab-mark');marked=[];if(!state.marks||!box.open||!context.practice)return;const cells=root.querySelectorAll(selectors[id]||':not(*)');for(const i of marks)if(cells[i]){cells[i].classList.add('lab-mark');marked.push(cells[i]);}}
 function toggleMarks(){state.marks=!state.marks;markButton.setAttribute('aria-pressed',String(state.marks));markButton.textContent=state.marks?'隐藏战术标记':'显示战术标记';refresh(true);}
 function refresh(force=false){if(!view)return;const now=performance.now();if(!force&&now-lastAt<250)return;lastAt=now;const r=study(id,view,context.player);if(r.progress>=r.target)state.achieved=true;badge.textContent=state.achieved?'目标达成 ✓':box.open?'收起':'展开';if(!box.open){paintMarks([]);return;}
  const sig=JSON.stringify(r);if(sig===signature&&!force)return;signature=sig;metrics.replaceChildren();for(const m of r.metrics){const item=el('div'),name=el('span','',m.label),value=el('strong','',m.value);item.append(name,value);metrics.append(item);}insight.textContent=r.insight;label.textContent='训练目标：'+r.goal+(state.achieved?' · 已达成':'');bar.max=Math.max(1,r.target);bar.value=Math.min(r.target,Math.max(0,r.progress));bar.setAttribute('aria-label',r.goal);paintMarks(r.marks);
 }
 const toggle=()=>{state.open=box.open;refresh(true);};box.addEventListener('toggle',toggle);
 return {update(v){view=v;refresh();},destroy(){for(const n of marked)n.classList.remove('lab-mark');box.removeEventListener('toggle',toggle);box.removeEventListener('keydown',stop);box.removeEventListener('keyup',stop);markButton?.removeEventListener('click',toggleMarks);box.remove();}};
}
