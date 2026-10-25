import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {modelPoint,modelCamera,screenPoint,pickSurface,solveArm,renderBudget} from '../games/sports-space.js';
test('projected pool and ping surfaces round-trip pointer targets for both seats',()=>{
 for(const id of ['billiards','tabletennis'])for(const x of [40,180,360,680])for(const y of [40,200,360]){
  const camera=modelCamera(id),p=modelPoint(id,{x,y,z:0}),screen=screenPoint(camera,p),q=pickSurface(id,camera,screen);
  assert.ok(Math.abs(q.x-x)<1e-6&&Math.abs(q.y-y)<1e-6,JSON.stringify({id,x,y,q}));
 }
});
test('badminton ground, net and jump use authoritative heights, not a decorative arc',()=>{
 assert.equal(modelPoint('badminton',{x:360,y:390}).y,0);
 assert.equal(modelPoint('badminton',{x:360,y:240}).y,150);
 const camera=modelCamera('badminton');for(const x of [35,180,540,685]){const s=screenPoint(camera,modelPoint('badminton',{x,y:390}));assert.ok(Math.abs(pickSurface('badminton',camera,s).x-x)<1e-6);}
 const a=modelPoint('tabletennis',{x:100,y:200,z:0}),b=modelPoint('tabletennis',{x:100,y:200,z:45});assert.equal(b.y-a.y,45);assert.equal(b.z,a.z);
});
test('two bone arm keeps anatomical segment lengths even beyond reach',()=>{
 const shoulder=new Vector3(0,88,12);
 for(const target of [new Vector3(30,110,12),new Vector3(100,200,0),shoulder.clone()]){
  const {elbow,hand}=solveArm(shoulder,target,38,36);
  assert.ok(Math.abs(elbow.distanceTo(shoulder)-38)<1e-5);
  assert.ok(Math.abs(hand.distanceTo(elbow)-36)<1e-5);
  assert.ok(hand.distanceTo(shoulder)<=74);
 }
});
test('resolution follows visible surface and has a bounded high-DPI budget',()=>{
 assert.equal(renderBudget(356,3).width,712);
 assert.ok(renderBudget(2000,3).width<=1600);
 assert.ok(renderBudget(0,0).width>0);
});
