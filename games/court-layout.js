import {needsLandscape} from './court-controls.js';
export function courtLayout(root,context){
 const doc=root.ownerDocument,gate=doc.createElement('section');gate.className='court-rotate';gate.setAttribute('aria-label','横屏开打');
 const icon=doc.createElement('div');icon.className='court-turn-icon';icon.textContent='↻';const title=doc.createElement('h2');title.textContent='横过来，好好打一场';const message=doc.createElement('p');message.textContent='横屏后球场更大，左右手分别移动和击球。对局会在这里等你。';const button=doc.createElement('button');button.className='button primary';button.textContent='全屏横屏';const note=doc.createElement('small');note.textContent='也可以开启手机自动旋转，再横置手机';gate.append(icon,title,message,button,note);root.append(gate);
 let ownedFullscreen=false;
 const turn=async()=>{try{if(!doc.fullscreenElement&&doc.documentElement.requestFullscreen){await doc.documentElement.requestFullscreen();ownedFullscreen=true;}if(screen.orientation?.lock)await screen.orientation.lock('landscape');}catch{note.textContent='请开启手机自动旋转，再将手机横过来；对局已暂停等待。';}};button.addEventListener('click',turn);
 const sync=()=>{const portrait=needsLandscape(innerWidth,innerHeight),wide=innerWidth>innerHeight&&innerHeight<600;gate.hidden=!portrait;doc.body.classList.toggle('court-portrait',portrait);doc.body.classList.toggle('court-wide',wide);context.holdPresentation?.('orientation',portrait);};
 window.addEventListener('resize',sync);window.addEventListener('orientationchange',sync);sync();
 return()=>{window.removeEventListener('resize',sync);window.removeEventListener('orientationchange',sync);button.removeEventListener('click',turn);gate.remove();doc.body.classList.remove('court-portrait','court-wide');context.holdPresentation?.('orientation',false);if(ownedFullscreen&&doc.fullscreenElement){try{screen.orientation?.unlock?.();doc.exitFullscreen?.().catch(()=>{});}catch{}}};
}
