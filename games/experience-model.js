import {hitAvailable} from './sports-motion.js';

// Advice uses only the same public view the player can see. It never reads answers.
export const goals={
 gomoku:['连成五子','选格后确认落子，留意对方的四连'],fleet:['击沉三艘敌舰','先锁定布阵，再轮流搜索敌方海域'],dots:['争夺 16 块领地','围出一格后仍由你继续画线'],memory:['找到 12 对图案','翻两张，配对成功继续行动'],
 hockey:['先攻入 7 球','移动球拍迎击，守住自己一侧的球门'],tanks:['击破 5 点装甲','先瞄准再开火，掩体会挡住炮弹'],bomber:['成为最后的幸存者','炸弹有延时，放下后给自己留出口'],snake:['吃果实，避开蛇身','每个移动节拍只能预选一次转向'],tetris:['消行，逼对手封顶','消 2 / 3 / 4 行可反击，落点虚影供你参考'],slingshot:['击破对方城堡','看风向调角度与力度，等待炮弹落地'],maze:['带回 3 面旗帜','拿旗后回自己的基地；碰到持旗者可截旗'],
 quiz:['完成 8 题','每题 12 秒，选好后锁定，双方答完再揭晓'],g2048:['3 分钟争高分','同一块每步只合并一次，无效滑动不产生新块'],sudoku:['率先完成数独','每格正确加 10 分，错误扣 2 分'],reversi:['让己方棋子更多','带圆点的位置可落子，无路可走自动跳过'],rps:['先赢下 3 轮','双方暗选，锁定后同时揭晓'],reaction:['完成 5 轮信号挑战','只在绿灯亮后出手，抢跑扣 50 分'],mines:['打开 69 个安全格','数字表示邻雷；插旗后不能直接打开该格'],typing:['完整输入同一短文','先修正第一个错误，再往后输入'],simon:['复现 8 轮旋律','先听看，再按顺序输入；每轮序列更长'],
 connect4:['先连成四枚','棋子落到该列最低空位，每步 45 秒'],tictactoe:['先连成三个标记','每步 45 秒，先防住对方的两连'],hex:['连接你的两岸','蜜桃上下连，薄荷左右连，相邻六向相通'],slide:['将 1–8 排好','只能挪动空格旁的数字，空格最终留右下'],nim:['拿到最后一颗豆','一次只能从同一盘取豆，至少取一颗'],lights:['点亮 25 盏星灯','点击会同时翻转自身与上下左右'],
 billiards:['清空己方球，再进黑八','先碰己方球；犯规后对手可自由摆白球'],badminton:['先得 11 分，净胜 2 分','进入击球范围再挥拍，起跳后可以扣杀'],tabletennis:['先得 11 分，净胜 2 分','球在己方弹台一次后回击，不能连击'],archery:['5 箭比总环数','按风向修正准星，双方落箭后揭晓'],penalty:['轮换射门与守门','每次暗选一个方向，15 秒内锁定'],checkers:['吃掉或困住对方','有吃必吃；连续跳吃时必须继续用同一枚']
};
const turnIds=new Set(['gomoku','dots','memory','reversi','connect4','tictactoe','hex','nim','checkers','billiards','slingshot']);
export function guide(id,v,p){
 const [goal,tip]=goals[id]||['完成这一局','按场内提示操作'];
 let state=tip,waiting=false;
 if(!v)return{goal,state:'等待开局',waiting:true};
 if(v.status!=='playing')return{goal,state:v.winner===-1?'平局 · 可以再来一局':v.winner===p?'本局获胜 · 可以再来一局':'本局结束 · 再挑战一次',waiting:true};
 if(turnIds.has(id)){waiting=v.turn!==p;state=waiting?'对方行动中，观察下一步':tip;}
 const own=v.players?.[p];
 if(id==='fleet'){waiting=v.phase==='setup'?v.ready[p]:v.turn!==p;state=v.phase==='setup'?(v.ready[p]?'布阵已锁定，等待搭档':'调整舰船后，点「布阵完成」'):v.turn===p?'选一个未轰炸的格子，再确认轰炸':'等待对方轰炸，已探明信息会保留';}
 if(id==='memory'&&v.phase==='reveal'){waiting=true;state='记住两张牌的位置，收牌后换人';}else if(id==='memory'&&!waiting)state=v.open.length?'再翻一张，看看能否配对':'翻开第一张牌';
 if(id==='reversi'&&!waiting)state=`当前有 ${v.legalMoves.length} 个合法落点${v.passed!==null?' · 对方无路可走，你继续':''}`;
 if(id==='rps'){waiting=v.phase!=='choose'||!!v.ownChoice;state=v.phase==='reveal'?'双方出拳已揭晓':v.ownChoice?'已锁定，等对方出拳':'暗选石头、剪刀或布';}
 if(id==='quiz'){waiting=v.phase!=='answer'||v.answered[p];state=v.phase==='reveal'?'看答案与解析，下一题马上开始':v.answered[p]?'答案已锁定，等待对方':'点击答案或按 1–4';}
 if(id==='reaction'){waiting=v.phase!=='ready'||v.responses[p]!==null;state=v.responses[p]!==null?(v.responses[p]===-1?'抢跑了，下一轮信号再试':'反应已记录，等待下一轮'):v.phase==='ready'?'绿灯亮了，现在点击！':v.phase==='waiting'?'保持准备，等绿灯亮起':'本轮结束';}
 if(id==='simon'){waiting=v.phase!=='input'||own.done;state=v.phase==='show'?'观察音符与声音，现在先不要按':v.phase==='input'?(own.done?'本轮输入已结束，等待揭晓':`复现第 ${own.position+1} / ${v.length} 个音符`):'本轮结束，下一轮序列更长';}
 if(id==='typing')state=own.length>own.correct?`先修正第 ${own.correct+1} 个字或标点`:`已正确输入 ${own.correct} / ${v.total} 字`;
 if(id==='sudoku')state=`已完成 ${own.correct} / ${v.total} 格 · ${own.mistakes} 次错误`;
 if(id==='g2048'){waiting=own.stuck;state=own.stuck?'棋盘无可用移动，等待对方或时间结束':`最高 ${own.highest} · ${own.moves} 步 · 可以继续合并`;}
 if(id==='tetris'){waiting=!own.alive;state=own.pending?`${own.pending} 行障碍待接收，消行可先抵消攻击`:`已消 ${own.lines} 行 · 观察下一块，留好落点`;}
 if(id==='mines')state=`已开 ${v.safeOpened[p]} / 69 安全格 · ${v.flags.filter(Boolean).length} / 12 面旗`;
 if(id==='slide')state=`${own.moves} 步 · 只移动空格旁的数字`;
 if(id==='lights')state=`已点亮 ${v.scores[p]} / 25 盏 · ${own.moves} 次翻转`;
 if(id==='nim'&&!waiting)state=`还剩 ${v.piles.reduce((a,b)=>a+b,0)} 颗豆，选一盘再确认数量`;
 if(id==='billiards')state=v.moving?'球还在滚动，停稳后才能再次出杆':waiting?'等待对手出杆':v.ballInHand?'自由球：点球台摆好白球，再瞄准出杆':tip;
 if(id==='slingshot'&&v.projectile){waiting=true;state='炮弹飞行中，落地后交换回合';}
 if(['badminton','tabletennis'].includes(id)){waiting=!hitAvailable(id,v,p);state=v.now<v.readyAt?'得分后稍作准备，即将发球':!v.rally?(v.serving===p?'轮到你发球，点击击球按钮':'对方发球，准备接球'):hitAvailable(id,v,p)?'进入可击范围，现在挥拍！':id==='tabletennis'?'移动球拍迎球，等球在己方弹台':'跟随羽球移动，靠近再挥拍';}
 if(id==='archery'){waiting=!!v.shots[p]||!!v.revealAt;state=v.revealAt?'双箭落靶，本轮结果已揭晓':v.shots[p]?'你的箭已落靶，等待搭档':`第 ${v.round+1} / 5 箭 · 修正风偏后放箭`;}
 if(id==='penalty'){waiting=!!v.reveal||v.ready[p];state=v.reveal?(v.reveal.shot<0?'射门超时，本轮未得分':v.reveal.goal?'进球！稍后交换攻守':'扑救成功！稍后交换攻守'):v.ready[p]?'方向已锁定，等待揭晓':v.attacker===p?'你来射门，暗选一个落点':'你来守门，猜一个扑救方向';}
 if(id==='checkers'&&!waiting)state=v.chain!==null?'继续用刚才那枚棋子跳吃':v.legal.some(m=>m.capture!==null)?'有吃必吃：选择高亮的跳吃路径':tip;
 if(id==='maze')state=v.flag.carrier===p?'你拿到旗了，回自己的基地！':v.flag.carrier===1-p?'搭档拿到旗了，赶去拦截':'金旗在场上，穿过迷宫去拿旗';
 return{goal,state,waiting};
}

// Advisory input guards: authority still belongs to the engine/server.
export function blockedReason(id,v,p,a){
 if(!v||v.status!=='playing')return'本局尚未开始或已经结束';
 if(turnIds.has(id)&&v.turn!==p)return'现在轮到对方，请稍等';
 if(id==='fleet'&&(v.phase==='setup'?v.ready[p]:v.turn!==p))return v.phase==='setup'?'布阵已锁定':'等待对方轰炸';
 if(id==='memory'&&(v.phase!=='choose'||v.owners[a.index]>=0||v.open.includes(a.index)))return'请选一张尚未翻开的牌';
 if(['gomoku','tictactoe','hex'].includes(id)&&v.board[a.index]!==-1)return'这里已有棋子，请换一个空位';
 if(id==='reversi'&&!v.legalMoves.includes(a.index))return'请选择带圆点的合法落点';
 if(id==='connect4'&&v.board[a.column]!==-1)return'这一列已满，换一列投入';
 if(id==='dots'&&v.edges[a.index]!==-1)return'这条边已经连接';
 if(id==='slide'){const z=v.players[p].cells.indexOf(0),i=a.index;if(Math.abs(z%3-i%3)+Math.abs((z/3|0)-(i/3|0))!==1)return'只能移动紧挨空格的数字';}
 if(id==='rps'&&(v.phase!=='choose'||v.ownChoice))return'出拳已锁定，等待下一轮';
 if(id==='quiz'&&(v.phase!=='answer'||v.answered[p]))return'答案已锁定，等待下一题';
 if(id==='reaction'&&(v.phase==='reveal'||v.responses[p]!==null))return'本轮反应已记录';
 if(id==='simon'&&(v.phase!=='input'||v.players[p].done))return'先看完音符播放，再按顺序复现';
 if(id==='g2048'&&v.players[p].stuck)return'棋盘已经没有可用移动';
 if(id==='billiards'&&v.moving)return'请等所有球停稳后再出杆';
 if(id==='slingshot'&&v.projectile)return'炮弹还在飞行';
 if(id==='archery'&&(v.shots[p]||v.revealAt))return'这轮的箭已经射出，等待下一轮';
 if(id==='penalty'&&(v.ready[p]||v.reveal))return'方向已锁定，等待揭晓';
 return null;
}
export function stampAction(id,v,a){return ['rps','archery','penalty'].includes(id)?{...a,round:v.round}:a;}

const changed=(a,b)=>JSON.stringify(a)!==JSON.stringify(b);
// One semantic event for each newly observed action, never replayed on identical snapshots.
export function actionEvent(id,b,v,p){
 if(!b)return null;
 if(b.status==='playing'&&v.status==='finished')return{kind:'finish',text:v.winner===p?'漂亮，赢下这一局！':v.winner===-1?'势均力敌，平局':'本局结束，再接再厉'};
 if(v.players?.[p]?.moves<b.players?.[p]?.moves||['gomoku','connect4','tictactoe','hex','reversi'].includes(id)&&v.board.filter(n=>n>=0).length<b.board.filter(n=>n>=0).length)return{kind:'restore',text:'已撤回一步，重新想一想'};
 const dp=(v.scores?.[p]||0)-(b.scores?.[p]||0),other=(v.scores?.[1-p]||0)-(b.scores?.[1-p]||0);
 if(id==='g2048'&&v.players[p].moves!==b.players[p].moves)return{kind:'merge',text:dp?`合并 +${dp}`:'滑动到位'};
 if(id==='tetris'&&v.players[p].lockEvent?.number!==b.players[p].lockEvent?.number)return{kind:'lock',text:v.players[p].lockEvent?.clearedRows.length?`消除 ${v.players[p].lockEvent.clearedRows.length} 行`:'落块就位'};
 if(id==='sudoku'&&changed(b.players[p].cells,v.players[p].cells))return{kind:dp<0?'error':'place',text:dp<0?'这个数字不对，换一个试试':dp>0?'正确填入一格':'格子已更新'};
 if(id==='memory'&&changed(b.faces,v.faces))return{kind:'flip',text:dp?'配对成功，再翻一次':v.phase==='reveal'?'记住位置，下次再配':'翻开一张'};
 if(id==='dots'&&b.lastLine!==v.lastLine)return{kind:'line',text:dp?'围出领地，继续行动':other?'对方围出领地，继续行动':'连好一条边'};
 if(id==='fleet'&&changed(b.lastShot,v.lastShot))return{kind:'shot',text:v.lastShot?.hit?'命中舰船！':'水花一闪，这格落空'};
 if(id==='reversi'&&b.lastMove!==v.lastMove)return{kind:'flip',text:'落子，夹住的棋子翻转'};
 if(['gomoku','connect4','tictactoe','hex'].includes(id)&&changed(b.board,v.board))return{kind:'place',text:'落子完成'};
 if(id==='nim'&&changed(b.piles,v.piles))return{kind:'take',text:`取走 ${v.lastMove?.count||0} 颗豆`};
 if(id==='lights'&&v.players[p].moves!==b.players[p].moves)return{kind:'light',text:`星灯翻转 · ${v.scores[p]} / 25`};
 if(id==='slide'&&v.players[p].moves!==b.players[p].moves)return{kind:'slide',text:'数字归位一步'};
 if(id==='mines'&&changed(b.board,v.board))return{kind:dp<0?'error':'reveal',text:dp<0?'踩雷 −5，仍可继续':`打开 ${v.safeOpened[p]-b.safeOpened[p]} 个安全格`};
 if(id==='mines'&&changed(b.flags,v.flags))return{kind:'flag',text:'旗帜已更新'};
 if(id==='typing'&&v.players[p].correct>b.players[p].correct)return{kind:'type',text:`正确进度 ${v.players[p].correct} / ${v.total}`};
 if(['rps','quiz','reaction','simon'].includes(id)&&b.phase!==v.phase)return{kind:'phase',text:guide(id,v,p).state};
 if(id==='simon'&&changed(b.players[p],v.players[p]))return{kind:'note',text:v.players[p].done&&!v.players[p].success?'顺序错了，下一轮再试':`已接上 ${v.players[p].position} 个音符`};
 if(id==='quiz'&&!b.answered[p]&&v.answered[p])return{kind:'lock',text:'答案已锁定'};
 if(id==='reaction'&&b.responses[p]!==v.responses[p])return{kind:v.responses[p]===-1?'error':'reaction',text:v.responses[p]===-1?'抢跑 −50':`${v.responses[p]} ms`};
 if(id==='rps'&&!b.ownChoice&&v.ownChoice)return{kind:'lock',text:'出拳已锁定'};
 if(id==='archery'&&changed(b.shots[p],v.shots[p])&&v.shots[p])return{kind:'arrow',text:`你的箭：${v.shots[p].score} 环`};
 if(id==='penalty'&&!b.reveal&&v.reveal)return{kind:'kick',text:guide(id,v,p).state};
 if(id==='penalty'&&!b.ready[p]&&v.ready[p])return{kind:'lock',text:'方向已锁定'};
 if(id==='checkers'&&changed(b.board,v.board))return{kind:'jump',text:dp?'跳吃成功'+(v.chain!==null?'，继续跳吃':''):'棋子前进一步'};
 if(id==='billiards'&&!b.moving&&v.moving)return{kind:'cue',text:'出杆！'};
 if(['badminton','tabletennis'].includes(id)&&v.rally&&(!b.rally||v.last!==b.last))return{kind:'rally',text:v.message};
 if(id==='tanks'&&v.tanks.some((t,i)=>t.shots>(b.tanks[i].shots||0)))return{kind:'fire',text:'炮弹出膛'};
 if(id==='bomber'&&v.bombs.length>b.bombs.length)return{kind:'bomb',text:'炸弹已放下，快离开十字范围'};
 if(id==='slingshot'&&!b.projectile&&v.projectile)return{kind:'fire',text:'发射！观察风中的弹道'};
 if(id==='maze'&&b.flag.carrier!==v.flag.carrier)return{kind:'flag',text:guide(id,v,p).state};
 if(dp||other)return{kind:dp<0?'error':'score',text:dp>0?`你 +${dp}`:dp<0?`你 ${dp}`:`对方 +${other}`};
 return null;
}
