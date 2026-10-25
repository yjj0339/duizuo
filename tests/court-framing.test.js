import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {modelCamera,fitCourtCamera,courtBounds,screenPoint,pickSurface,modelPoint} from '../games/sports-space.js';

test('all court bounds remain inside the clear area in portrait and both landscape safe areas',()=>{
 for(const id of ['badminton','tabletennis','billiards'])for(const [width,height]of [[350,600],[800,302],[600,263],[1200,700]])for(const safe of [{top:48,bottom:96,left:12,right:12},{top:48,bottom:96,left:48,right:12},{top:48,bottom:96,left:12,right:48}]){
  const camera=modelCamera(id);fitCourtCamera(camera,id,width,height,safe);const b=courtBounds(id);
  for(const x of[b.min[0],b.max[0]])for(const y of[b.min[1],b.max[1]])for(const z of[b.min[2],b.max[2]]){const q=screenPoint(camera,new Vector3(x,y,z)),px=q.x/720*width,py=q.y/460*height;assert.ok(px>=safe.left-.01&&px<=width-safe.right+.01&&py>=safe.top-.01&&py<=height-safe.bottom+.01,JSON.stringify({id,width,height,safe,px,py}));}
 }
});
test('fitted camera keeps touch-to-world mapping accurate after changing aspect ratio',()=>{
 for(const id of ['badminton','tabletennis','billiards'])for(const size of [[390,650],[844,310]]){
  const camera=modelCamera(id);fitCourtCamera(camera,id,...size,{top:48,bottom:96,left:15,right:15});
  for(const p of [{x:90,y:200,z:0},{x:610,y:300,z:0}]){const q=pickSurface(id,camera,screenPoint(camera,modelPoint(id,p)));assert.ok(Math.abs(q.x-p.x)<1e-6&&Math.abs(q.y-p.y)<1e-6);}
 }
});
