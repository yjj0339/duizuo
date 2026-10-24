// Scalable, locally drawn materials and articulated characters. No remote textures.
export const palette=['#eb7969','#35ad93'];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
export function circle(c,x,y,r,fill,stroke){c.beginPath();c.arc(x,y,Math.max(.01,r),0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
export function ellipse(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
export function line(c,x,y,xx,yy,color,width=2){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
export function poly(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
export function text(c,t,x,y,size=16,color='#29454b',weight=600){c.font=`${weight} ${size}px "PingFang SC","Microsoft YaHei",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(String(t),x,y);}
export function gradient(c,x,y,xx,yy,colors){const g=c.createLinearGradient(x,y,xx,yy);colors.forEach((v,i)=>g.addColorStop(i/(colors.length-1),v));return g;}
export function radial(c,x,y,r,colors){const g=c.createRadialGradient(x-r*.3,y-r*.4,0,x,y,r);colors.forEach((v,i)=>g.addColorStop(i/(colors.length-1),v));return g;}
export function shadow(c,x,y,rx,ry,alpha=.2){ellipse(c,x,y,rx,ry,`rgba(22,49,51,${alpha})`);}
export function grain(c,x,y,w,h,color,step=4){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.fillStyle=color;for(let yy=y;yy<y+h;yy+=step)for(let xx=x;xx<x+w;xx+=step){const n=Math.sin(xx*12.98+yy*78.23)*43758.54;c.globalAlpha=.02+Math.abs(n%1)*.055;c.fillRect(xx+(n%1)*step,yy+(n%1)*step,1,1);}c.restore();}
export function racket(c,x,y,angle,color,small=false){c.save();c.translate(x,y);c.rotate(angle);line(c,0,0,0,-35,'#354e59',5);line(c,0,2,0,-12,color,7);for(let i=0;i<4;i++)line(c,-3,-i*3,3,-i*3,'#ffffff80',1);c.translate(0,-53);c.beginPath();c.ellipse(0,0,small?15:17,small?19:23,0,0,Math.PI*2);c.fillStyle=small?color:'#f5fcffb0';c.fill();c.save();c.clip();if(!small){for(let i=-24;i<25;i+=5){line(c,i,-24,i,24,'#758d9a88',.7);line(c,-20,i,20,i,'#758d9a88',.7);}}else{ellipse(c,-5,-7,5,7,'#ffffff24');}c.restore();c.beginPath();c.ellipse(0,0,small?15:17,small?19:23,0,0,Math.PI*2);c.strokeStyle='#eaf8ff';c.lineWidth=4;c.stroke();c.strokeStyle=color;c.lineWidth=2;c.stroke();c.restore();}

// Each limb has separate shoulder/elbow/knee joints; gait is driven by actual displacement.
export function athlete(c,x,y,{color=palette[0],side=1,run=0,phase=0,jump=0,swing=0,style='clear',own=false,t=0,keeper=false,dive=0,contactPoint=null}={}){
 shadow(c,x,y+5,26-jump*.07,6-jump*.008,.14);
 c.save();c.translate(x,y-jump);c.scale(side,1);c.rotate(dive);
 const gait=Math.sin(phase)*run,bob=Math.abs(Math.sin(phase))*run*2+(run<.1?Math.sin(t*.002)*1.2:0),hip=-34-bob;
 for(const s of[-1,1]){const stride=gait*s*18,kx=stride*.55+s*5,ky=hip+18-Math.max(0,gait*s)*4,fx=stride+s*5,fy=-Math.max(0,gait*s)*9;
  line(c,s*6,hip,kx,ky,'#294854',9);line(c,kx,ky,fx,fy-6,'#edb58d',7);line(c,fx,fy-7,fx,fy-3,'#fff9ed',9);round(c,fx-6,fy-5,18,7,3,'#fafcff','#b7c8cc');line(c,fx-2,fy-3,fx+6,fy-3,color,2);
 }
 const shoulder=-68-bob;
 round(c,-15,shoulder,30,37,10,gradient(c,-15,0,16,0,[color,'#ffffff25',color]));
 poly(c,[[-15,shoulder+6],[-8,shoulder],[-5,shoulder+5],[5,shoulder+5],[8,shoulder],[15,shoulder+6],[11,hip],[-11,hip]],color);
 line(c,-8,shoulder+4,0,shoulder+10,'#ffffffb0',2);line(c,0,shoulder+10,8,shoulder+4,'#ffffffb0',2);line(c,-11,shoulder+16,-11,hip-4,'#ffffff85',2);
 c.save();c.scale(side,1);text(c,side===1?'01':'02',1,shoulder+24,11,'#fff',800);c.restore();
 const sp=clamp(swing,0,1),wind=sp<.28?sp/.28:1-(sp-.28)/.72;
 const armAngle=keeper?-.5:(style==='drop'?-.3:style==='smash'?-2.1:-1.7)*wind;
 const handX=contactPoint?(contactPoint.x-x)*side-14:27+Math.sin(armAngle)*15,handY=contactPoint?contactPoint.y-y+jump+51:shoulder+14+Math.cos(armAngle)*8-wind*32;
 line(c,-12,shoulder+8,-24-gait*6,shoulder+28,'#efba95',8);line(c,-24-gait*6,shoulder+28,-16-gait*9,shoulder+37,'#efba95',7);
 line(c,13,shoulder+9,24,shoulder+18-wind*13,'#efba95',9);line(c,24,shoulder+18-wind*13,handX,handY,'#f6c6a1',7);circle(c,handX,handY,4.8,'#f6c6a1');
 if(!keeper){racket(c,handX,handY,contactPoint ? .27 : .45-wind*2.3+(sp>.28?(sp-.28)*3:0),color);if(sp>.24&&sp<.75){c.save();c.globalAlpha=(1-sp)*.35;c.strokeStyle='#ffffff';c.lineWidth=7;c.beginPath();c.arc(18,shoulder+10,48,-2.7,1);c.stroke();c.restore();}}
 else{circle(c,handX,handY,8,'#f4f9ff',color);circle(c,-16-gait*9,shoulder+37,8,'#f4f9ff',color);}
 round(c,-5,shoulder-9,11,12,3,'#e7b18a');
 const hy=shoulder-21;circle(c,0,hy,15,radial(c,0,hy,18,['#ffdfbc','#efba95','#d39a7c']));
 c.beginPath();c.moveTo(-15,hy+1);c.quadraticCurveTo(-22,hy-24,0,hy-19);c.quadraticCurveTo(17,hy-20,16,hy-3);c.quadraticCurveTo(5,hy-10,0,hy-11);c.quadraticCurveTo(-4,hy-4,-15,hy+1);c.fillStyle='#3c3d49';c.fill();
 line(c,-13,hy-7,13,hy-9,'#f6fff9',4);line(c,-12,hy-7,13,hy-9,color,2);circle(c,7,hy,1.7,'#2e3945');line(c,8,hy+7,12,hy+5,'#a4655b',1.2);ellipse(c,8,hy+5,3,1.5,'#e99f8e80');circle(c,-12,hy+3,3,'#efba95');
 if(own){poly(c,[[-6,-120-bob],[6,-120-bob],[0,-113-bob]],color);}
 c.restore();
}

export function poolBall(c,b,x=b.x,y=b.y,rotation=0,scale=1){
 if(scale<=0)return;c.save();c.translate(x,y);c.scale(scale,scale);shadow(c,2,5,10.8,8,.23);
 const base=b.n>8?'#fff9eb':b.color;
 circle(c,0,0,10.8,radial(c,0,0,12,['#ffffff',base,base,'#243e4866']),'#ffffff50');
 c.save();c.beginPath();c.arc(0,0,10.3,0,7);c.clip();c.rotate(rotation);
 if(b.n>8){round(c,-13,-6.5,26,13,2,b.color);line(c,-13,-5.7,13,-5.7,'#ffffff55',.7);}
 if(b.n){const yy=Math.sin(rotation*.7)*3;circle(c,0,yy,5.6,'#fffdf0');text(c,b.n,0,yy+.3,7.6,'#26363f',800);}
 c.restore();ellipse(c,-3.5,-5,3,1.7,'#ffffffcc');circle(c,4,5,2,'#ffffff12');c.restore();
}

export function shuttle(c,b,angle){c.save();c.translate(b.x,b.y);c.rotate(angle);shadow(c,0,4,5,2,.12);for(let i=-3;i<=3;i++){const yy=i*3.1;poly(c,[[-3,0],[-23,yy-2],[-27,yy],[-22,yy+2]],i%2?'#e8f0f5':'#fffef6','#b8cbd277');line(c,-2,0,-24,yy,'#aac1cb',.7);}line(c,-13,-7,-13,7,'#d7e2e9',1.5);ellipse(c,0,0,5,4,'#deb990');circle(c,2,-1,2.2,'#fff2d9');c.restore();}

export function stadium(c,kind='badminton'){
 round(c,-30,-40,780,510,0,gradient(c,0,-20,0,400,['#edf5fa','#dce7e9','#b2c6c5']));
 for(let x=20;x<720;x+=136){round(c,x,5,92,142,42,'#ffffff70','#fff');round(c,x+7,12,78,125,35,gradient(c,0,0,0,160,['#d4e7f4','#f4fbff']));line(c,x+46,14,x+46,136,'#fff',3);line(c,x+9,76,x+83,76,'#fff',3);}
 poly(c,[[50,0],[130,0],[265,330],[80,330]],'#ffffff22');poly(c,[[490,0],[570,0],[720,330],[540,330]],'#ffffff22');
 for(let r=0;r<3;r++){const y=178+r*22;round(c,14,y,692,17,5,['#d7e3e9','#becfd6','#9eb9c1'][r]);for(let x=30;x<710;x+=25){const co=['#8fa9b8','#ebc7ad','#90bdad','#bdafce'][(Math.floor(x/25)+r)%4];circle(c,x,y-4,4.5,co);round(c,x-6,y+1,12,9,4,co);}}
 round(c,8,247,704,39,4,'#f5f8f6','#c5d6d9');text(c,'对座运动馆',360,267,14,'#78949b',700);text(c,'一起，认真打一场',130,267,11,'#a2b1b5');text(c,'好球，留给搭档',590,267,11,'#a2b1b5');
 if(kind==='badminton'){
  round(c,-20,288,760,172,0,gradient(c,0,288,0,450,['#d5b996','#b8946f']));for(let y=294;y<460;y+=13){line(c,0,y,720,y,'#fff5df40',1);for(let x=(y%26?0:75);x<720;x+=150)line(c,x,y,x,y+13,'#8e704b20',1);}
  poly(c,[[48,317],[672,317],[705,420],[15,420]],'#3b9b8c','#f5fcf4');poly(c,[[52,322],[668,322],[695,414],[25,414]],gradient(c,0,320,0,420,['#56ad9b','#2a8d7c']));
  for(const points of [[[56,326],[664,326],[689,408],[31,408]],[[117,326],[603,326],[622,408],[98,408]]])poly(c,points,null,'#f4f7dbe0');
  line(c,360,326,360,408,'#f8fbef',2);line(c,33,368,687,368,'#f8fbefaa',1.3);line(c,252,326,244,408,'#f8fbefcc',1.4);line(c,468,326,476,408,'#f8fbefcc',1.4);
 }else{round(c,-20,285,760,170,0,gradient(c,0,285,0,450,['#91b8bd','#578c95']));for(let y=300;y<460;y+=30)line(c,0,y,720,y,'#ffffff15',1);}
}

export function net(c){
 shadow(c,365,393,18,5,.18);poly(c,[[360,240],[385,226],[385,355],[360,390]],'#effaff40');
 for(let y=243;y<386;y+=7)line(c,361,y,384,226+(y-240)*.9,'#b6d2d7aa',.8);for(let x=361;x<386;x+=4)line(c,x,240-(x-360)*.55,x,390-(x-360)*1.4,'#c8dee1b0',.8);
 line(c,360,237,385,223,'#f9ffff',4);line(c,385,223,385,360,'#547585',4);line(c,360,236,360,394,'#345a67',6);line(c,358,238,358,389,'#e3f3f2',1.5);round(c,350,393,21,5,2,'#294956');
}
