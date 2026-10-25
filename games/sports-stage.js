import {clamp,circle,line,text,gradient} from './sports-art.js';
import {sampleMotion} from './sports-motion.js';
export function stage(root,send,context,{id,title,hint,width=720,height=460,world={x:0,y:30,scale:1},webgl=false}){
 root.replaceChildren();root.classList.add('sports-game');root.dataset.sport=id;root.tabIndex=0;
 const doc=root.ownerDocument,clean=[],keys=new Set(),particles=[];let view,previous,received=performance.now(),gap=50,frame=0,last=performance.now(),time=0,draw=()=>{},events=()=>{},suspend=()=>{},directions=null,controlAt=0,noticeUntil=0,dead=false;
 const el=(tag,cls='',value)=>{const e=doc.createElement(tag);e.className=cls;if(value!==undefined)e.textContent=value;return e;};
 const on=(e,k,fn)=>{e.addEventListener(k,fn);clean.push(()=>e.removeEventListener(k,fn));};
 const top=el('div','sports-topline'),venue=el('strong','sports-venue',title),state=el('span','sports-state'),shell=el('div','sports-scene'),canvas=el('canvas','sports-canvas');
 canvas.width=width*2;canvas.height=height*2;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',title+'，'+hint);canvas.tabIndex=0;shell.append(canvas);top.append(venue,state);
 const ctx=webgl?null:canvas.getContext('2d'),tools=el('div','sports-tools'),notice=el('p','sports-coach'),details=el('details','sports-rules'),summary=el('summary','','玩法与操作');details.append(summary,el('p','',hint));root.append(top,shell,notice,tools,details);let pointerMap=null;
 const backdrop=doc.createElement('canvas');backdrop.width=width*2;backdrop.height=height*2;
 const transformed=c=>{c.translate(world.x,world.y);c.scale(world.scale,world.scale);};
 const paused=()=>context.isPaused?.()||doc.hidden;
 const command=a=>{if(view?.status==='playing'&&!paused())send(a);};
 const button=(label,fn,kind='')=>{const b=el('button','game-button sports-action '+kind,label);b.type='button';on(b,'click',fn);return b;};
 const slider=(label,min,max,step,value,format=null)=>{const wrap=el('label','sports-slider'),head=el('span','sports-slider-label'),name=el('span','',label),output=el('output'),input=el('input');input.type='range';input.id='sport-'+id+'-slider-'+tools.querySelectorAll('input').length;wrap.htmlFor=input.id;input.setAttribute('aria-label',label);Object.assign(input,{min,max,step,value});const paint=()=>{const percent=Math.round((Number(input.value)-min)/(max-min)*100)+'%';output.textContent=format?format(Number(input.value)):percent;input.style.setProperty('--fill',percent);};on(input,'input',paint);paint();head.append(name,output);wrap.append(head,input);tools.append(wrap);return input;};
 const xy=e=>{const r=canvas.getBoundingClientRect(),p={x:(e.clientX-r.left)*width/r.width,y:(e.clientY-r.top)*height/r.height};return pointerMap?pointerMap(p):{x:(p.x-world.x)/world.scale,y:(p.y-world.y)/world.scale};};
 const puff=(x,y,color='#fff',count=8)=>{if(context.reducedMotion)return;for(let i=0;i<count;i++){const a=i*2.3999;particles.push({x,y,vx:Math.cos(a)*(25+i*5),vy:Math.sin(a)*(25+i*5),life:0,duration:380+i*19,color});}if(particles.length>80)particles.splice(0,particles.length-80);};
 on(root,'keydown',e=>{if(e.target.closest('input,select,textarea')||e.altKey||e.ctrlKey||e.metaKey)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){keys.add(e.key);if(directions)e.preventDefault();}});
 on(window,'keyup',e=>keys.delete(e.key));on(window,'blur',()=>keys.clear());on(doc,'visibilitychange',()=>keys.clear());
 function tick(now){if(dead)return;frame=requestAnimationFrame(tick);const dt=Math.min(50,now-last);last=now;if(!view||paused()){suspend();keys.clear();return;}time+=dt;
  if(directions&&now-controlAt>65&&keys.size&&view.status==='playing'){directions(keys);controlAt=now;}
  if(webgl){draw(sampleMotion(view,previous,clamp((now-received)/gap,0,1)),time,dt/1000);return;}
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(backdrop,0,0);ctx.setTransform(2,0,0,2,0,0);ctx.save();transformed(ctx);
  const smooth=sampleMotion(view,previous,clamp((now-received)/gap,0,1));draw(smooth,time,dt/1000);
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life+=dt;if(p.life>=p.duration){particles.splice(i,1);continue;}p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.vy+=80*dt/1000;ctx.globalAlpha=1-p.life/p.duration;circle(ctx,p.x,p.y,1.2+(1-p.life/p.duration)*1.5,p.color);}ctx.globalAlpha=1;ctx.restore();
 }
 frame=requestAnimationFrame(tick);
 return {ctx,canvas,tools,notice,el,on,button,slider,xy,command,puff,player:context.player,reduced:context.reducedMotion,keys,get view(){return view;},get time(){return time;},
  mapPointer(fn){pointerMap=fn;},dispose(fn){clean.push(fn);},
  sound:kind=>context.feedback?.(kind),
  setBackdrop(fn){const c=backdrop.getContext('2d');c.setTransform(2,0,0,2,0,0);c.fillStyle=gradient(c,0,0,0,height,['#eef4f7','#e4eced']);c.fillRect(0,0,width,height);c.save();transformed(c);fn(c);c.restore();},
  animate(fn){draw=fn;},events(fn){events=fn;},moveKeys(fn){directions=fn;},whenPaused(fn){const previous=suspend;suspend=()=>{previous();fn();};},isPaused:paused,
  hint(value,urgent=false){if(time<noticeUntil&&!urgent)return;if(notice.textContent!==value)notice.textContent=value;notice.classList.toggle('is-ready',urgent);},
  message(value){notice.textContent=value;noticeUntil=time+1200;notice.classList.remove('is-ready');},
  state(value){if(state.textContent!==value)state.textContent=value;},
  key(fn){on(root,'keydown',e=>{if(e.target.closest('input,select,textarea')||e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;if(fn(e.key,e))e.preventDefault();});},
  drag(fn){let held=false;on(canvas,'pointerdown',e=>{canvas.focus({preventScroll:true});held=true;canvas.setPointerCapture(e.pointerId);fn(xy(e),true);});on(canvas,'pointermove',e=>{if(held)fn(xy(e),false);});for(const k of ['pointerup','pointercancel','lostpointercapture'])on(canvas,k,()=>held=false);},
  arrows(labels,fn){const pad=el('div','sports-move-pad');for(const [key,label]of labels){const b=button(label,()=>{});b.setAttribute('aria-label',key==='ArrowLeft'?'向左移动':key==='ArrowRight'?'向右移动':key==='ArrowUp'?'向上移动':'向下移动');on(b,'pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(key);fn?.(key);});for(const k of ['pointerup','pointercancel','lostpointercapture'])on(b,k,()=>keys.delete(key));pad.append(b);}tools.append(pad);return pad;},
  update(next){const p=view;previous=view;view=next;const now=performance.now();gap=clamp(now-received,16,100);received=now;if(!p)previous=next;events(next,p);},
  destroy(){dead=true;cancelAnimationFrame(frame);keys.clear();for(const fn of clean)fn();particles.length=0;backdrop.width=backdrop.height=1;root.replaceChildren();root.classList.remove('sports-game');delete root.dataset.sport;root.removeAttribute('tabindex');}
 };
}
