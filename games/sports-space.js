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
// Reserve HUD and thumb-control space in CSS pixels, then fit the complete playable court.
export function courtBounds(id){return id==='badminton'?{min:[-365,-8,-92],max:[365,350,92]}:id==='tabletennis'?{min:[-380,0,-205],max:[380,225,205]}:{min:[-370,-5,-210],max:[370,115,210]};}
export function fitCourtCamera(camera,id,width,height,{top=48,bottom=96,left=12,right=12}={}){
 const w=Math.max(1,width),h=Math.max(1,height),bounds=courtBounds(id);camera.updateMatrixWorld();
 const points=[];for(const x of[bounds.min[0],bounds.max[0]])for(const y of[bounds.min[1],bounds.max[1]])for(const z of[bounds.min[2],bounds.max[2]])points.push(new Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
 const x0=Math.min(...points.map(p=>p.x)),x1=Math.max(...points.map(p=>p.x)),y0=Math.min(...points.map(p=>p.y)),y1=Math.max(...points.map(p=>p.y));
 const scale=Math.max((x1-x0)/Math.max(1,w-left-right),(y1-y0)/Math.max(1,h-top-bottom));
 const cx=(x0+x1)/2+(right-left)*scale/2,cy=(y0+y1)/2+(top-bottom)*scale/2;
 Object.assign(camera,{left:cx-w*scale/2,right:cx+w*scale/2,top:cy+h*scale/2,bottom:cy-h*scale/2});camera.updateProjectionMatrix();
 return camera;
}
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
