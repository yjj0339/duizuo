import * as board from './board.js';import * as puzzle from './puzzle.js';import * as arcade from './arcade.js';
const strategies={...board,...puzzle,...arcade};
export const levels={casual:'休闲',expert:'高手',master:'大师'};
export function decide(id,view,player,brain={},level='master',now=Date.now()){
 if(!view||view.status!=='playing'||!strategies[id])return null;
 // Observe every public frame, including opponent turns; keep reaction and memory honest.
 if(id==='memory'||id==='simon'||id==='reaction'||id==='rps')return strategies[id](view,player,brain,level,now);
 return strategies[id](view,player,brain,level,now);
}
export function interval(id,level='master'){const factor=level==='casual'?2.3:level==='expert'?1.5:1;return Math.round(({gomoku:650,reversi:450,fleet:550,dots:400,memory:650,mines:400,g2048:260,sudoku:1100,quiz:1500,tetris:65,typing:80,simon:280,rps:900,reaction:32,hockey:45,tanks:65,bomber:75,snake:65,slingshot:600,maze:75}[id]||300)*factor);}
