import {courtLayout} from './court-layout.js';
// Load the modeling engine only when one of the three modelled sports is entered.
export function dimensionRenderer(id,fallback){return(root,send,context)=>{
 const host=root.ownerDocument.createElement('div');host.className='dimension-host';host.tabIndex=0;root.classList.add('dimensional-game');const loading=root.ownerDocument.createElement('p');loading.className='model-loading';loading.textContent='正在布置球场…';loading.setAttribute('role','status');host.append(loading);root.replaceChildren(host);
 const disposeLayout=courtLayout(root,context);context.holdPresentation?.('loading',true);let live=true,renderer=null,latest;
 const useFallback=()=>{if(!live)return;renderer?.destroy();renderer=fallback(host,send,context);if(latest)renderer.update(latest);};host.addEventListener('dimensionfallback',useFallback);
 import('./dimensional-views.js').then(({renderers})=>{if(!live)return;try{renderer=renderers[id](host,send,context);}catch(e){console.warn('Modelled scene unavailable; using lightweight court.',e);renderer=fallback(host,send,context);const note=root.ownerDocument.createElement('p');note.className='game-note';note.textContent='当前设备使用轻量球场，操作与对战规则相同。';host.append(note);}if(latest)renderer.update(latest);}).catch(()=>{if(live){renderer=fallback(host,send,context);if(latest)renderer.update(latest);}}).finally(()=>context.holdPresentation?.('loading',false));
 return{update(v){latest=v;renderer?.update(v);},destroy(){live=false;host.removeEventListener('dimensionfallback',useFallback);renderer?.destroy();context.holdPresentation?.('loading',false);disposeLayout();host.remove();root.classList.remove('dimensional-game');}};
};}
