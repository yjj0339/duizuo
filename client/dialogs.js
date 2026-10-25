export function createDialogs({dialog,pause,changed}){
 const title=dialog.querySelector('#dialog-title'),body=dialog.querySelector('#dialog-body');
 const back=document.createElement('button');back.id='dialog-back';back.className='text-button';back.textContent='‹ 上一级';back.hidden=true;
 dialog.querySelector('.dialog-header').prepend(back);dialog.setAttribute('aria-labelledby','dialog-title');
 let stack=[],release=null,origin=null;
 function render(){const page=stack.at(-1);title.textContent=page.title;body.replaceChildren(page.body);back.hidden=stack.length<2;dialog.dataset.depth=String(stack.length);}
 function discard(){stack.pop()?.onClose?.();}
 function finish(){if(!stack.length)return;while(stack.length)discard();release?.();release=null;document.documentElement.classList.remove('has-dialog');changed?.();if(origin?.isConnected&&!origin.closest('[hidden]'))origin.focus({preventScroll:true});origin=null;}
 function close(all=false){if(!all&&stack.length>1){discard();render();back.hidden?dialog.querySelector('#dialog-close').focus():back.focus();return;}dialog.close();finish();}
 function show(text,content,{nested=false,onClose}={}){
  const node=document.createElement('div');if(typeof content==='string')node.innerHTML=content;else node.append(content);
  if(!dialog.open){origin=document.activeElement;release=pause?.();stack=[];}
  if(!nested)while(stack.length)discard();stack.push({title:text,body:node,onClose});render();
  if(!dialog.open)dialog.showModal();document.documentElement.classList.add('has-dialog');changed?.();
 }
 back.onclick=()=>close();dialog.querySelector('#dialog-close').onclick=()=>close(true);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 dialog.addEventListener('close',()=>{if(!dialog.open)finish();});
 // The top screen owns input. Native buttons/selects retain their default actions.
 for(const type of ['keydown','keyup','keypress'])dialog.addEventListener(type,e=>e.stopPropagation());
 return {show,close,depth:()=>stack.length};
}
