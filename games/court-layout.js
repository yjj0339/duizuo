export function courtLayout(root){
 const sync=()=>{root.dataset.orientation=innerWidth>innerHeight?'landscape':'portrait';};
 window.addEventListener('resize',sync);sync();
 return()=>{window.removeEventListener('resize',sync);delete root.dataset.orientation;};
}
