import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {modelCamera,modelPoint,pickSurface,screenPoint,solveArm,renderBudget,tableHeight,fitCourtCamera} from './sports-space.js';
import {jumpLift,contact,shuttleLanding} from './racket-rules.js';
const colors=['#e87966','#34a58d'],V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),up=V(0,1,0),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

// A small, owned asset library. Static props are merged per material after construction.
function library(){
 const geometries=new Set(),materials=new Map(),textures=new Set(),cache=new Map();
 const geometry=(key,build)=>{if(!cache.has(key)){const g=build();geometries.add(g);cache.set(key,g);}return cache.get(key);};
 function material(color,roughness=.65,metalness=0){const key=color+':'+roughness+':'+metalness;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness,metalness}));return materials.get(key);}
 function mesh(parent,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(p,w,h,d,x,y,z,color,r=1){return mesh(p,geometry(`b${w},${h},${d},${r}`,()=>r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d)),typeof color==='string'?(['#b18354','#78513d','#76523b'].includes(color)?wood(color):material(color)):color,x,y,z);}
 function sphere(p,rx,ry,rz,x,y,z,color){const o=mesh(p,geometry('sphere',()=>new T.SphereGeometry(1,20,12)),typeof color==='string'?material(color):color,x,y,z);o.scale.set(rx,ry,rz);return o;}
 function cylinder(p,r1,r2,h,x,y,z,color,n=12){return mesh(p,geometry(`c${r1},${r2},${h},${n}`,()=>new T.CylinderGeometry(r1,r2,h,n)),typeof color==='string'?material(color):color,x,y,z);}
 function rod(p,a,b,r,color){const o=cylinder(p,r,r,1,0,0,0,color,8);segment(o,a,b);return o;}
 function torus(p,r,t,x,y,z,color){return mesh(p,geometry('t'+r+','+t,()=>new T.TorusGeometry(r,t,6,40)),typeof color==='string'?material(color):color,x,y,z);}
 function texture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=2;textures.add(t);return t;}
 function wood(color){const key='wood'+color;if(!materials.has(key)){const map=texture(256,128,(c,w,h)=>{c.fillStyle=color;c.fillRect(0,0,w,h);for(let j=0;j<h;j++){c.strokeStyle=j%3?'#38231918':'#fff1c21c';c.lineWidth=.6;c.beginPath();for(let x=0;x<=w;x+=4){const y=j+Math.sin(x*.035+j*.23)*1.8;x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}});map.wrapS=map.wrapT=T.RepeatWrapping;materials.set(key,new T.MeshStandardMaterial({map,roughness:.48}));}return materials.get(key);}
 function label(p,word,w,h,x,y,z,color='#3c6262',background=null){const map=texture(768,128,(c,W,H)=>{if(background){c.fillStyle=background;c.fillRect(0,0,W,H);}c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font='600 54px "Microsoft YaHei", sans-serif';c.fillText(word,W/2,H/2);});const m=new T.MeshBasicMaterial({map,transparent:!background,depthWrite:false});materials.set(map.uuid,m);const o=mesh(p,geometry('p'+w+','+h,()=>new T.PlaneGeometry(w,h)),m,x,y,z);o.castShadow=false;return o;}
 function merge(group){group.updateMatrixWorld(true);const buckets=new Map();for(const o of [...group.children])if(o.isMesh){const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{m:o.material,g:[]});const g=o.geometry.clone().applyMatrix4(o.matrix);buckets.get(key).g.push(g);group.remove(o);}for(const {m,g}of buckets.values()){const geom=mergeGeometries(g,false);g.forEach(x=>x.dispose());if(geom){geometries.add(geom);const o=mesh(group,geom,m);o.castShadow=false;}}}
 return{geometry,material,mesh,box,sphere,cylinder,rod,torus,texture,label,merge,dispose(){for(const g of geometries)g.dispose();for(const m of materials.values())m.dispose();for(const t of textures){t.image.width=t.image.height=1;t.dispose();}}};
}
function segment(o,a,b){o.position.copy(a).add(b).multiplyScalar(.5);const d=b.clone().sub(a);o.scale.y=Math.max(.001,d.length());o.quaternion.setFromUnitVectors(up,d.normalize());}

function hall(A,s,id){
 const p=new T.Group();s.add(p);const badminton=id==='badminton';
 A.box(p,900,20,500,0,-15,0,'#c6b49c',12);A.box(p,896,3,496,0,-3,0,'#ede0c9',10);
 for(let z=-235;z<250;z+=28)A.box(p,880,.25,.7,0,-1.3,z,'#cdbfa8',0);
 for(let z=-220;z<250;z+=28)for(let x=-400+(z%56?40:0);x<430;x+=140)A.box(p,.7,.25,27,x,-1.2,z,'#d1c3ad',0);
 A.box(p,890,170,15,0,75,-245,'#e3eae2',7);A.box(p,890,7,22,0,158,-245,'#fcf7e9',2);A.box(p,890,12,20,0,9,-242,'#a9b9af',2);
 // Real recessed window frames, mullions and softly tinted glazing.
 for(const x of [-346,-242,242,346]){A.box(p,84,106,8,x,95,-233,'#fffaf0',6);A.box(p,70,91,4,x,96,-228,'#bfd9d7',3);A.box(p,3,91,5,x,96,-224,'#f6f4e7',.8);A.box(p,70,3,5,x,96,-224,'#f6f4e7',.8);}
 A.box(p,242,83,9,0,108,-231,'#2d514f',7);A.box(p,246,3,12,0,153,-230,'#e7d7b5',1);
 A.label(p,badminton?'SHUTTLE  /  01':id==='tabletennis'?'RALLY  /  02':'EIGHT BALL  /  03',208,27,0,131,-224,'#e9edda');
 A.label(p,'对 座 运 动 俱 乐 部',192,26,0,99,-224,'#b3d0c0');
 for(const x of [-302,302]){A.box(p,142,9,36,x,26,-195,'#c19467',3);for(const xx of[x-54,x+54]){A.box(p,6,25,27,xx,12,-195,'#5a6b63',1);A.box(p,6,38,5,xx,40,-211,'#5a6b63',1);}A.box(p,142,23,5,x,49,-212,'#d7b181',2);A.box(p,32,20,18,x+20,40,-194,x<0?colors[0]:colors[1],6);A.torus(p,7,1.2,x+20,53,-194,'#546c6c');A.cylinder(p,4,4,17,x-35,39,-194,'#d9eee2');A.cylinder(p,3,3,3,x-35,49,-194,'#768c82');}
 for(const x of [-413,413]){A.cylinder(p,18,13,25,x,12,-200,'#e9d3b5');for(let j=0;j<7;j++){const a=j*2.4;A.rod(p,V(x,23,-200),V(x+Math.sin(a)*16,52+j*3,-200+Math.cos(a)*12),1,'#638f77');const o=A.sphere(p,7,19,3,x+Math.sin(a)*16,56+j*3,-200+Math.cos(a)*12,'#749c7d');o.rotation.z=Math.sin(a)*.7;}}
 A.merge(p);return p;
}
function court(A,s,id){
 const g=new T.Group();s.add(g);
 if(id==='badminton'){
  A.box(g,676,2,232,0,1,0,'#338e7b',2);A.box(g,660,.5,218,0,2.1,0,'#53a58d',1);
  const stripe=(w,d,x,z)=>A.box(g,w,.25,d,x,2.5,z,'#f9f2d7',0);
  for(const x of [-335,335])stripe(2,220,x,0);for(const z of[-110,110])stripe(670,2,0,z);
  for(const x of[-116,116])stripe(2,220,x,0);for(const z of[-90,90])stripe(670,1.6,0,z);
  for(const x of [-225,225])stripe(216,1.5,x,0);
  for(const z of[-119,119]){A.box(g,20,5,24,0,3,z,'#304c50',3);A.cylinder(g,3,4,150,0,75,z,'#52767a');A.cylinder(g,2,2,149,-1,76,z+1,'#d0d9d4');}
 }else{
  const pool=id==='billiards',w=pool?720:600,d=pool?400:320;
  A.box(g,w,pool?27:8,d,0,tableHeight-(pool?17:5),0,pool?'#78513d':'#294f62',pool?17:3);
  for(const x of[-238,238])for(const z of(pool?[-156,156]:[-125,125])){A.box(g,pool?29:12,54,pool?29:12,x,27,z,pool?'#76523b':'#425964',3);A.box(g,pool?34:17,5,pool?34:17,x,3,z,'#293d43',2);if(!pool){const wheel=A.cylinder(g,6,6,8,x,6,z,'#35434a');wheel.rotation.z=Math.PI/2;}}
  for(const x of[-238,238])A.rod(g,V(x,16,-125),V(x,53,125),3,'#607882');
  if(!pool){A.box(g,600,3,320,0,70,0,'#d8e4db',2);A.box(g,590,1.5,310,0,71.4,0,'#307d8d',1);for(const x of[-294,294])A.box(g,2,.2,310,x,72.3,0,'#f6f1df',0);for(const z of[-154,154])A.box(g,590,.2,2,0,72.3,z,'#f6f1df',0);A.box(g,590,.2,1,0,72.3,0,'#eaf2d8',0);const label=A.label(g,'RALLY CLUB',115,20,-143,72.4,40,'#7cbbb4');label.rotation.x=-Math.PI/2;}
  else poolSurface(A,g);
 }
 A.merge(g);
 if(id!=='billiards')buildNet(A,s,id==='badminton'?150:24,id==='badminton'?0:72,id==='badminton'?238:328);
}
function buildNet(A,s,height,base,width){
 const g=new T.Group();s.add(g);
 const map=A.texture(64,64,c=>{c.clearRect(0,0,64,64);c.strokeStyle='#e5ede5';c.lineWidth=2;for(let n=0;n<64;n+=16){c.beginPath();c.moveTo(n,0);c.lineTo(n,64);c.stroke();c.beginPath();c.moveTo(0,n);c.lineTo(64,n);c.stroke();}});map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(width/32,height/32);
 const mat=new T.MeshStandardMaterial({map,transparent:true,opacity:.62,side:T.DoubleSide,depthWrite:false,roughness:.9});const grid=A.mesh(g,A.geometry('net'+width,()=>new T.PlaneGeometry(width,height)),mat,0,base+height/2,0);grid.rotation.y=Math.PI/2;grid.castShadow=false;
 A.box(g,2,3,width+4,0,base+height,0,'#f8f4e7',.5);A.box(g,1,1,width,0,base,0,'#b3c1b5',0);
 if(base)for(const z of[-width/2,width/2]){A.box(g,7,height+8,5,0,base+height/2-3,z,'#3c6067',1);A.box(g,21,4,12,0,base-2,z,'#3c6067',1);}
 // The net material is owned separately because its alpha-mapped grid must not cast a solid shadow.
 g.userData.dispose=()=>mat.dispose();
}
function poolSurface(A,g){
 const shape=new T.Shape();shape.moveTo(-309,-169);shape.lineTo(-16,-169);shape.quadraticCurveTo(0,-155,16,-169);shape.lineTo(309,-169);shape.quadraticCurveTo(312,-152,329,-149);shape.lineTo(329,149);shape.quadraticCurveTo(312,152,309,169);shape.lineTo(16,169);shape.quadraticCurveTo(0,155,-16,169);shape.lineTo(-309,169);shape.quadraticCurveTo(-312,152,-329,149);shape.lineTo(-329,-149);shape.quadraticCurveTo(-312,-152,-309,-169);
 const felt=A.mesh(g,A.geometry('felt',()=>new T.ShapeGeometry(shape,16)),A.material('#2e896e',.92),0,72,0);felt.rotation.x=-Math.PI/2;
 for(const z of[-185,185])for(const x of[-174,174]){A.box(g,291,10,28,x,75,z,'#b18354',5);A.box(g,291,6,12,x,75,z>0?174:-174,'#235e4c',3);for(let k=-1;k<=1;k++){const inlay=A.box(g,4,.6,4,x+k*78,80.2,z,'#f4dfad',.3);inlay.rotation.y=Math.PI/4;}}
 for(const x of[-345,345]){A.box(g,28,10,284,x,75,0,'#b18354',5);A.box(g,12,6,284,x>0?334:-334,75,0,'#235e4c',3);for(const z of[-90,0,90])A.box(g,4,.5,4,x,80.2,z,'#f4dfad',.5);}
 for(const [x,z]of[[-337,-177],[0,-185],[337,-177],[-337,177],[0,185],[337,177]]){A.cylinder(g,21,18,15,x,65,z,'#1e2929',24);A.cylinder(g,18,18,1,x,73,z,'#101d20',24);const lip=A.torus(g,20,2,x,74,z,'#473e30');lip.rotation.x=-Math.PI/2;}
 const label=A.label(g,'对 座  /  EIGHT BALL',170,23,0,72.15,90,'#84b99a');label.rotation.x=-Math.PI/2;
 A.cylinder(g,1.5,1.5,.3,-180,72.3,0,'#d1d7b0');A.cylinder(g,1.5,1.5,.3,110,72.3,0,'#d1d7b0');
}

function racket(A,p,ping,color){
 const g=new T.Group();p.add(g);const head=ping?20:52;
 A.cylinder(g,ping?2.6:1.1,ping?2.6:1.3,ping?18:37,0,ping?7:18,0,ping?'#b48c62':'#b4c8ce',10);
 const grip=A.cylinder(g,2.8,2.5,14,0,3,0,'#31494e',10);for(let i=0;i<4;i++){const band=A.torus(g,2.7,.35,0,-2+i*3,0,'#819b9d');band.rotation.x=Math.PI/2;}
 if(ping){const edge=A.cylinder(g,13,13,2.8,0,head,0,'#d9bc8c',24);edge.rotation.x=Math.PI/2;edge.scale.z=1.12;for(const z of[-1.6,1.6]){const face=A.cylinder(g,12.3,12.3,.6,0,head,z,z>0?color:'#34474b',24);face.rotation.x=Math.PI/2;face.scale.z=1.12;}}
 else{const rim=A.torus(g,15,1.1,0,head,0,color);rim.scale.y=1.3;const inner=A.torus(g,14,.45,0,head,.5,'#e5edef');inner.scale.y=1.3;const verts=[];for(let k=-12;k<=12;k+=3){const h=Math.sqrt(196-k*k)*1.3;verts.push(k,head-h,0,k,head+h,0);const w=Math.sqrt(Math.max(0,196-(k/1.3)**2));verts.push(-w,head+k,0,w,head+k,0);}const geo=A.geometry('racket-strings',()=>new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(verts,3)));const m=new T.LineBasicMaterial({color:'#d8e4df',transparent:true,opacity:.6});g.add(new T.LineSegments(geo,m));g.userData.dispose=()=>m.dispose();}
 return{group:g,head};
}
function athlete(A,s,ping,index){
 const g=new T.Group();s.add(g);const color=colors[index],skin=A.material(index?'#e1ac87':'#efc19c',.8),dark=A.material('#304853',.9),white=A.material('#f6f0df',.7),hair=A.material('#373b42',.95);
 const body=new T.Group();g.add(body);
 A.box(body,22,38,27,0,66,0,color,7);A.box(body,23,17,27,0,43,0,dark,4);A.cylinder(body,5,6,10,0,89,0,skin);
 // Tailored collar, sleeve piping, shoulder seam and small embroidered badge.
 A.box(body,2,27,1,11.3,64,10,'#f7ebd3',.3);A.box(body,2,27,1,11.3,64,-10,'#f7ebd3',.3);A.sphere(body,2.2,3,2.2,12,76,6,'#f6eacb');
 const head=new T.Group();head.position.set(0,108,0);body.add(head);A.sphere(head,13,16,12,0,0,0,skin);A.sphere(head,13.4,8,12.4,-1,11,0,hair);A.sphere(head,5,8,10,-10,4,0,hair);A.box(head,5,3,23,10,7,0,'#f6f4e2',1);A.box(head,5.4,1,23.5,10,7,0,color,.3);
 for(const z of[-6,6]){A.sphere(head,1.4,1.9,1.2,12,0,z,'#2f353b');A.sphere(head,2.8,3.7,2.5,0,-1,z>0?12:-12,skin);}A.sphere(head,3,3,3,13,-3,0,skin);A.box(head,1,1,4,12,-8,0,'#bc7766',.3);
 const legs=[],arms=[];
 for(const z of[-8,8]){const thigh=A.cylinder(g,5.8,5,1,0,0,0,dark),shin=A.cylinder(g,4.2,3.2,1,0,0,0,skin),sock=A.cylinder(g,4.2,4,9,0,0,0,white),shoe=A.box(g,20,8,10,0,0,0,white,3);A.box(shoe,11,2,10.4,-1,-1,0,color,1);A.box(shoe,17,1,9,0,-3.3,0,'#758b84',.4);legs.push({z,thigh,shin,sock,shoe});}
 for(const z of[-14,14]){const upper=A.cylinder(g,4.7,4.1,1,0,0,0,skin),lower=A.cylinder(g,4.1,3.1,1,0,0,0,skin),sleeve=A.sphere(g,7,8,6,0,82,z,color),elbow=A.sphere(g,4.1,4.1,4.1,0,0,0,skin),hand=A.sphere(g,4,4.7,3.5,0,0,0,skin);arms.push({z,upper,lower,sleeve,elbow,hand});}
 const bat=racket(A,g,ping,color);g.rotation.y=index?Math.PI:0;g.scale.set(1.07,ping?1.22:1.28,1.07);let phase=0,last=null;
 function pose(pos,{run=0,jump=0,t=0,hit=null,ready=null,reduced=false}={}){
  if(last)phase+=pos.distanceTo(last)*.09;last=pos.clone();g.position.copy(pos);g.position.y+=jump;body.position.y=Math.abs(Math.sin(phase))*run*2;const lean=!ping&&ready&&Math.abs(ready.x-360-pos.x)<24&&ready.y>220&&ready.y<300?.28:0;body.rotation.z=lean;const joint=p=>p.applyAxisAngle(V(0,0,1),lean);for(const arm of arms)arm.sleeve.position.copy(joint(V(0,82,arm.z)));
  for(let i=0;i<2;i++){const leg=legs[i],stride=Math.sin(phase+i*Math.PI)*run*16,foot=V(stride,4+Math.max(0,-Math.cos(phase+i*Math.PI))*run*8,leg.z),hip=joint(V(0,43,leg.z)),knee=V(stride*.4+3,24+Math.max(0,stride)*.2,leg.z);segment(leg.thigh,hip,knee);segment(leg.shin,knee,foot.clone().add(V(0,6,0)));leg.sock.position.copy(foot).add(V(0,7,0));leg.shoe.position.copy(foot);}
  g.updateMatrixWorld(true);
  let target=V(ping?50:39,ping?96:117,ping?10:18),contactNow=false;
  if(hit){const age=t-hit.occurredAt;if(age>=0&&age<300){const world=modelPoint(ping?'tabletennis':'badminton',hit),local=g.worldToLocal(world),fade=clamp(age/300,0,1);target.copy(local).lerp(V(ping?42:12,ping?90:82,-28),fade*fade);contactNow=age<45;}}
  else if(ready){const local=g.worldToLocal(modelPoint(ping?'tabletennis':'badminton',ready));target.lerp(local,.8);}
  const shoulder=joint(V(0,82,14)),direction=target.clone().sub(shoulder).normalize(),grip=target.clone().addScaledVector(direction,-bat.head),solution=solveArm(shoulder,grip),front=arms[1];segment(front.upper,shoulder,solution.elbow);segment(front.lower,solution.elbow,solution.hand);front.elbow.position.copy(solution.elbow);front.hand.position.copy(solution.hand);bat.group.position.copy(solution.hand);bat.group.quaternion.setFromUnitVectors(up,target.clone().sub(solution.hand).normalize());
  const rear=arms[0],a=joint(V(0,82,-14)),b=joint(V(-12-run*7,61,-16)),d=joint(V(8-run*8,48,-19));segment(rear.upper,a,b);segment(rear.lower,b,d);rear.elbow.position.copy(b);rear.hand.position.copy(d);
  return contactNow?{head:bat.group.localToWorld(V(0,bat.head,0)),target:modelPoint(ping?'tabletennis':'badminton',hit)}:null;
 }
 return{group:g,pose};
}
function shuttle(A,s){
 const g=new T.Group();s.add(g);A.sphere(g,5,4.5,4.5,0,0,0,'#ead5ae');A.cylinder(g,3,3,2,-3,0,0,'#5c737a').rotation.z=Math.PI/2;
 for(let i=0;i<12;i++){const angle=i*Math.PI/6,sy=Math.sin(angle),sz=Math.cos(angle);const leaf=A.sphere(g,10,2.3,1.1,-15,sy*6,sz*6,i%2?'#fcf9e9':'#e1e8dd');leaf.rotation.x=angle;leaf.rotation.z=-sy*.25;A.rod(g,V(-3,0,0),V(-24,sy*9,sz*9),.28,'#aebdb5');}
 for(const x of[-12,-18]){const band=A.torus(g,x===-12?4.9:7.1,.4,x,0,0,'#b1c4ba');band.rotation.y=Math.PI/2;}
 A.merge(g);return g;
}
function shadow(A,s,r){const m=new T.MeshBasicMaterial({color:'#173f37',transparent:true,opacity:.14,depthWrite:false}),o=A.mesh(s,A.geometry('disc'+r,()=>new T.CircleGeometry(r,32)),m);o.rotation.x=-Math.PI/2;o.castShadow=false;o.userData.dispose=()=>m.dispose();return o;}
function marker(A,s,color,r){const o=A.mesh(s,A.geometry('ring'+r,()=>new T.RingGeometry(r-1,r,40)),new T.MeshBasicMaterial({color,transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}));o.rotation.x=-Math.PI/2;o.castShadow=false;o.userData.dispose=()=>o.material.dispose();return o;}

export function createSportsModel(canvas,id){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'}),scene=new T.Scene(),camera=modelCamera(id),A=library();
 scene.background=new T.Color('#e9eee6');renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.14;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
 scene.add(new T.HemisphereLight('#fff9e8','#8caaa5',2.4));const light=new T.DirectionalLight('#fff4dc',3.2);light.position.set(-260,700,400);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-500,right:500,top:400,bottom:-400,near:50,far:1400});light.shadow.bias=-.0007;light.shadow.normalBias=.7;scene.add(light);scene.add(light.target);
 hall(A,scene,id);court(A,scene,id);let dead=false,lost=false,renderAt=-1000,frames=0,firstFrame=0,hit=[null,null],lastEvent=0,lastPositions=[null,null],quality='fine';
 const people=id==='billiards'?[]:[athlete(A,scene,id==='tabletennis',0),athlete(A,scene,id==='tabletennis',1)];
 const footShadows=people.map(()=>{const o=shadow(A,scene,20);o.scale.set(1,.6,1);return o;});
 const ball=id==='badminton'?shuttle(A,scene):id==='tabletennis'?A.sphere(scene,5,5,5,0,0,0,A.material('#fff4ca',.27)):null;
 const aim=marker(A,scene,'#f8d79a',id==='badminton'?18:14),landing=marker(A,scene,'#f4f3c8',14),ballShadow=ball?shadow(A,scene,6):null;
 const pathGeo=A.geometry('trail',()=>new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(60*3),3))),pathMat=new T.LineBasicMaterial({color:'#f4d5a0',transparent:true,opacity:.65}),trail=new T.Line(pathGeo,pathMat);scene.add(trail);const path=[];
 let balls=[],cue=null,ghost=null,guide=null,rotations=Array(16).fill(0),poolLast=[],pottedAt=Array(16).fill(-1),shotTime=-1000,shotOrigin=null,lastShotInput=null,wasPotted=Array(16).fill(false);
 if(id==='billiards'){
  cue=new T.Group();scene.add(cue);A.cylinder(cue,1.6,4,185,0,-92.5,0,'#d5b780',12);A.cylinder(cue,4,4.2,58,0,-157,0,'#4a4d48',12);A.cylinder(cue,1.7,1.7,4,0,0,0,'#8db8b8',12);for(let i=0;i<10;i++){const ring=A.torus(cue,4,.25,0,-135-i*4,0,'#bda77e');ring.rotation.x=Math.PI/2;}
  ghost=A.sphere(scene,11,11,11,0,0,0,new T.MeshBasicMaterial({color:'#fff5c8',transparent:true,opacity:.23,depthWrite:false}));ghost.castShadow=false;
  const geo=A.geometry('guide',()=>new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(12),3)));guide=new T.LineSegments(geo,new T.LineBasicMaterial({color:'#fff3c3',transparent:true,opacity:.7}));scene.add(guide);
 }
 const resize=()=>{if(dead)return;const r=canvas.getBoundingClientRect(),b=renderBudget(r.width,quality==='smooth'?Math.min(devicePixelRatio,1.25):devicePixelRatio,r.height/r.width||460/720);renderer.setSize(b.width,b.height,false);const wide=r.width/r.height>1.6;fitCourtCamera(camera,id,r.width,r.height,wide&&id!=='billiards'?{top:30,bottom:36,left:120,right:165}:{top:38,bottom:110,left:7,right:7});};const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 const onLost=e=>{e.preventDefault();lost=true;canvas.dataset.context='lost';},onRestore=()=>{lost=false;delete canvas.dataset.context;resize();};canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestore);canvas.dataset.renderer='2.5d';
 function poolBall(b){const texture=A.texture(256,128,(c,w,h)=>{c.fillStyle=b.n>8?'#fff5df':b.color||'#fff5df';c.fillRect(0,0,w,h);if(b.n>8){c.fillStyle=b.color;c.fillRect(0,34,w,60);}if(b.n){for(const x of[64,192]){c.fillStyle='#fff5df';c.beginPath();c.arc(x,64,19,0,7);c.fill();c.fillStyle='#263536';c.textAlign='center';c.textBaseline='middle';c.font='bold 26px Arial';c.fillText(b.n,x,65);}}});const m=new T.MeshStandardMaterial({map:texture,roughness:.24,metalness:.04});const o=A.sphere(scene,11,11,11,0,0,0,m);o.userData.dispose=()=>m.dispose();o.userData.number=b.n;return o;}
 function updatePool(v,t,opts){
  if(!balls.length){balls=Array(16);for(const b of v.balls){balls[b.n]=poolBall(b);wasPotted[b.n]=b.potted;}}
  for(const b of v.balls){const o=balls[b.n],prev=poolLast[b.n];if(prev&&!wasPotted[b.n]&&b.potted)pottedAt[b.n]=t;wasPotted[b.n]=b.potted;const age=t-pottedAt[b.n];o.visible=!b.potted||(pottedAt[b.n]>=0&&age<280);if(!o.visible)continue;
   const base=b.potted&&prev?prev:b;o.position.copy(modelPoint(id,{...base,z:11}));o.scale.setScalar(11);if(b.potted){o.position.y-=age*.04;o.scale.setScalar(11*(1-age/280));}else if(prev){const dx=b.x-prev.x,dz=b.y-prev.y,d=Math.hypot(dx,dz);if(d>.001){const q=new T.Quaternion().setFromAxisAngle(V(dz,0,-dx).normalize(),d/11);o.quaternion.premultiply(q);}}if(!b.potted)poolLast[b.n]={...b};
  }
  aim.visible=landing.visible=false;const b=v.balls[0],can=!v.moving&&v.turn===opts.player&&v.status==='playing';guide.visible=ghost.visible=can;cue.visible=can||t-shotTime<240;
  if(v.moving&&opts.shot&&lastShotInput!==opts.shot.at){lastShotInput=opts.shot.at;shotTime=t;shotOrigin={...opts.shot};}
  const angle=opts.angle||0,dx=Math.cos(angle),dy=Math.sin(angle);if(can){let dist=Math.min(800,Math.abs(dx)<.001?800:(dx>0?689-b.x:31-b.x)/dx,Math.abs(dy)<.001?800:(dy>0?369-b.y:31-b.y)/dy),target=null;for(const o of v.balls){if(!o.n||o.potted)continue;const x=o.x-b.x,y=o.y-b.y,a=x*dx+y*dy,k=Math.abs(x*dy-y*dx);if(a>0&&k<22){const d=a-Math.sqrt(484-k*k);if(d>0&&d<dist){dist=d;target=o;}}}const start=modelPoint(id,{...b,z:11}),end=modelPoint(id,{x:b.x+dx*dist,y:b.y+dy*dist,z:11});ghost.position.copy(end);const p=guide.geometry.attributes.position;p.setXYZ(0,start.x,start.y,start.z);p.setXYZ(1,end.x,end.y,end.z);const dest=target?modelPoint(id,{...target,z:11}):end.clone(),away=target?dest.clone().sub(end).normalize().multiplyScalar(65).add(dest):dest;p.setXYZ(2,dest.x,dest.y,dest.z);p.setXYZ(3,away.x,away.y,away.z);p.needsUpdate=true;guide.geometry.computeBoundingSphere();}
  if(cue.visible){const age=t-shotTime,origin=can?b:shotOrigin||b,dist=can?25+(opts.power||.5)*32:age<80?32-age*.25:12+(age-80)*.3;cue.position.copy(modelPoint(id,{x:origin.x-dx*dist,y:origin.y-dy*dist,z:13}));cue.quaternion.setFromUnitVectors(up,V(dx,-.045,dy).normalize());}
 }
 function draw(v,t,dt,opts={}){
  if(dead||lost)return;
  // The simulation continues at its own fixed step; graphics have a 60 Hz ceiling.
  if(t-renderAt<15)return;const elapsed=(t-renderAt)/1000;renderAt=t;
  if(id==='billiards')updatePool(v,t,opts);else{
   if(v.event?.id!==lastEvent){lastEvent=v.event?.id;if(v.event?.type==='hit')hit[v.event.player]={...v.event};if(v.event?.type==='point')path.length=0;}
   for(let i=0;i<2;i++){const p=v.players[i],pos=id==='badminton'?V(p.x-360,0,0):V(i?340:-340,0,p.y-200),prev=lastPositions[i],run=prev?clamp(pos.distanceTo(prev)/Math.max(.001,elapsed)/240,0,1):0;lastPositions[i]=pos.clone();footShadows[i].position.set(pos.x,2.8,pos.z);const active=v.event?.type==='hit'&&v.event.player===i&&v.now-v.event.occurredAt<300?v.event:null;people[i].pose(pos,{run,jump:id==='badminton'?jumpLift(p.jump,v.now):0,t:v.now,hit:active,ready:contact(id,v,i).ready?v.ball:null,reduced:opts.reduced});}
   const pos=modelPoint(id,v.ball);ball.position.copy(pos);if(id==='badminton')ball.quaternion.setFromUnitVectors(V(1,0,0),(v.rally?V(v.ball.vx||1,-(v.ball.vy||0),0):V(0,-1,0)).normalize());else ball.rotation.z+=elapsed*(v.ball.spin==='back'?-10:12);
   ballShadow.position.set(pos.x,id==='badminton'?2.7:72.6,pos.z);ballShadow.scale.setScalar(1+Math.max(0,pos.y-(id==='badminton'?0:72))*.004);
   aim.position.copy(id==='badminton'?V((opts.player?-1:1)*(40+(opts.depth??.85)*260),2.7,0):V(opts.player?-155:155,72.6,75+(opts.target??.5)*250-200));
   landing.visible=id==='badminton'&&v.rally&&v.last!==opts.player;
   if(landing.visible){const p=shuttleLanding(v.ball);landing.visible=p.x>=25&&p.x<=695;landing.position.set(p.x-360,2.8,0);}
   if(v.rally&&!opts.reduced){path.push({p:pos.clone(),t});while(path.length>30||path.length&&t-path[0].t>160)path.shift();const a=pathGeo.attributes.position;path.forEach((p,i)=>a.setXYZ(i,p.p.x,p.p.y,p.p.z));a.needsUpdate=true;pathGeo.setDrawRange(0,path.length);pathGeo.computeBoundingSphere();trail.visible=path.length>1;}else{path.length=0;trail.visible=false;}
  }
  renderer.render(scene,camera);frames++;firstFrame||=performance.now();window.__SPORTS_MODEL_STATS__={id,frames,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,buffer:[canvas.width,canvas.height],renderFPS:frames*1000/Math.max(1,performance.now()-firstFrame)};
 }
 const debug={id,project:b=>screenPoint(camera,modelPoint(id,b)),pick:p=>pickSurface(id,camera,p),inspect:()=>({frames,quality,lost,balls:balls.map(o=>({number:o.userData.number,visible:o.visible,x:o.position.x,y:o.position.y,z:o.position.z})),ball:ball?{x:ball.position.x,y:ball.position.y,z:ball.position.z}:null})};window.__SPORTS_MODEL__=debug;
 return{draw,pick:debug.pick,project:debug.project,quality(value){quality=value==='smooth'?'smooth':'fine';renderer.shadowMap.enabled=quality==='fine';resize();},dispose(){if(dead)return;dead=true;observer.disconnect();canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestore);scene.traverse(o=>o.userData.dispose?.());pathMat.dispose();ghost?.material.dispose();guide?.material.dispose();renderer.dispose();renderer.forceContextLoss();A.dispose();scene.clear();if(window.__SPORTS_MODEL_STATS__?.id===id)delete window.__SPORTS_MODEL_STATS__;if(window.__SPORTS_MODEL__===debug)delete window.__SPORTS_MODEL__;}};
}
