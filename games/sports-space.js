import {Vector3,OrthographicCamera,Raycaster,Plane,Vector2} from 'three';
export const tableHeight=72;
// One coordinate conversion for balls, contact poses, targets and pointer input.
export function modelPoint(id,b){return id==='badminton'?new Vector3(b.x-360,390-b.y,0):new Vector3(b.x-360,tableHeight+(b.z||0),b.y-200);}
export function modelCamera(id){
 const extent=id==='badminton'?462:486,c=new OrthographicCamera(-extent,extent,extent*460/720,-extent*460/720,1,3000);
 if(id==='badminton'){c.position.set(100,420,1050);c.lookAt(0,105,0);}else{c.position.set(420,850,1000);c.lookAt(0,50,0);}
 c.updateMatrixWorld();return c;
}
export function screenPoint(camera,p){const q=p.clone().project(camera);return{x:(q.x+1)*360,y:(1-q.y)*230};}
export function pickSurface(id,camera,p){
 const ray=new Raycaster();ray.setFromCamera(new Vector2(p.x/360-1,1-p.y/230),camera);
 // The side-on badminton game has no depth movement. Pick its actual vertical playing plane.
 const plane=id==='badminton'?new Plane(new Vector3(0,0,1),0):new Plane(new Vector3(0,1,0),-tableHeight),v=new Vector3();
 if(!ray.ray.intersectPlane(plane,v))return{x:360,y:200};
 return id==='badminton'?{x:v.x+360,y:390-v.y}:{x:v.x+360,y:v.z+200};
}
export function solveArm(shoulder,target,upper=38,lower=36){
 const axis=target.clone().sub(shoulder),raw=axis.length();if(raw<1e-8)axis.set(1,0,0);else axis.divideScalar(raw);
 const d=Math.max(Math.abs(upper-lower)+.001,Math.min(upper+lower-.001,raw)),along=(upper*upper-lower*lower+d*d)/(2*d),lift=Math.sqrt(Math.max(0,upper*upper-along*along));
 const bend=new Vector3(0,-1,.4).addScaledVector(axis,-new Vector3(0,-1,.4).dot(axis));if(bend.lengthSq()<1e-8)bend.set(0,0,1);bend.normalize();
 return{elbow:shoulder.clone().addScaledVector(axis,along).addScaledVector(bend,lift),hand:shoulder.clone().addScaledVector(axis,d)};
}
export function renderBudget(cssWidth,dpr=1,ratio=460/720){const width=Math.max(360,Math.min(1600,Math.round((cssWidth||360)*Math.min(2,Math.max(1,dpr||1)))));return{width,height:Math.round(width*ratio)};}
