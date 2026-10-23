// A server tick can update a match without deciding which screen the player sees.
export class PlayFlow {
 constructor(){this.screen='lobby';this.key=null;}
 accept(key){if(this.key!==key){this.key=key;this.play();}return this.screen==='play';}
 play(){this.screen='play';}
 lobby(){this.screen='lobby';}
 reset(){this.key=null;this.lobby();}
}

// Keep one browser-history entry for the interactive surface. Back peels off a
// dialog first, then the game. Replacing dialogs never accumulates stale entries.
export class BackGuard {
 constructor({history,listen,back,active}){
  this.history=history;this.back=back;this.active=active;this.id='duizuo-'+Math.random();this.popping=false;this.pending=false;
  listen(()=>{
   if(this.pending){this.pending=false;if(this.active())this.arm();return;}
   if(this.history.state?.duizuoGuard===this.id){
    if(!this.active())this.history.replaceState(null,'');
    return;
   }
   if(!this.active())return;
   this.popping=true;this.back();this.popping=false;
   if(this.active())this.arm();
  });
 }
 arm(){if(!this.pending&&this.history.state?.duizuoGuard!==this.id)this.history.pushState({duizuoGuard:this.id},'');}
 release(){if(!this.pending&&!this.popping&&!this.active()&&this.history.state?.duizuoGuard===this.id){this.pending=true;this.history.back();}}
}
