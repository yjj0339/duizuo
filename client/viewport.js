// The visual viewport follows mobile browser chrome without forcing device orientation.
export function installViewport(){
 const sync=()=>{const v=window.visualViewport,h=v?.height||innerHeight,w=v?.width||innerWidth;document.documentElement.style.setProperty('--play-height',Math.round(h)+'px');document.body.classList.toggle('compact-landscape',w>h&&h<600);};
 window.addEventListener('resize',sync);window.visualViewport?.addEventListener('resize',sync);sync();
}
