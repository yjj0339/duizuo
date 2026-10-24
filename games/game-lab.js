// Per-game observations are derived only from the player's public snapshot.
// This module never imports an engine's hidden map, solution, PRNG or AI brain.
export const playbooks={
 gomoku:['先看横、竖、两条斜线。四连通常比扩张自己的三连更紧急。','把两条进攻线放在一个交叉点，让一手棋形成两个威胁。','先手执黑；练习模式可用 Rapfi 分析与悔棋，实战需要自己确认落子。'],
 fleet:['先完成布阵；船长是 4、3、2，别让每艘船都排在同一条线上。','命中后沿横竖方向继续探测，确认方向后沿线追击。','击沉后转去搜索未知区域；对方未击中的船位始终保密。'],
 dots:['第三条边会把方格送给下一手，前期尽量连安全边。','围格可以连走，连续出现的三边格是一条可收取的链。','收尾时比较链的长短；不一定要把眼前所有格子立即吃完。'],
 memory:['第一张牌翻开后，先想曾在哪里见过相同图案。','没配对也有价值：记住两张牌的相对位置。','配对后继续行动，利用连续回合清掉已知配对。'],
 hockey:['守门时把拍子留在球与球门之间，避免追到边线。','迎球移动可以加速回击；沿边墙反弹会改变入射方向。','对方压上时找空门；打完后及时回到门前。'],
 tanks:['炮弹会被掩体挡住；先找射线，再考虑开火。','移动与瞄准可以分别控制，绕侧翼比正面对轰更稳。','每发射击有冷却，横向躲弹后利用对方的空档反击。'],
 bomber:['放下炸弹前先确认至少一条退路；延时为 1.8 秒。','爆炸被硬墙阻挡，砖块会被炸开；另一颗炸弹会被提前引爆。','利用连锁封路，同时留意自己的退路是否也被第二颗炸弹覆盖。'],
 snake:['一次节拍只能确定一个转向，提前转弯比贴墙再转稳。','吃果实时尾巴不会腾出原格，别把空尾格当作永远安全。','围住空间可以压缩对手路线；两条蛇撞向同格会一起出局。'],
 tetris:['看虚影和接下来三块，先保留平整的堆面。','C 暂存换块，每块只能用一次；预留长条能组织四行反击。','连续消行有连击加成；攻击先抵消待接收障碍，再发给对手。'],
 slingshot:['保持一个角度，用力度逐次修正距离，避免两个参数同时乱改。','顺风可减力，逆风可加力；高弹道会更长时间受风影响。','靠近城堡也能造成范围伤害；上一发的落点是下一发的参考。'],
 maze:['拿到旗后必须回到自己的圆形基地，中央不是得分点。','看对方位置选择回程路线，别与追兵在狭道正面相遇。','碰到持旗者会重置金旗；拦截回家的必经路往往比追尾更快。'],
 quiz:['先读完整题目和选项，答对固定 100 分，不抢网速。','两人都答完或时间到才公开答案，锁定后不能修改。','揭晓时看解析；记住理由比只记住选项位置更有用。'],
 g2048:['把最大数留在角落，沿两条主要方向整理数字。','空位越多越有调度空间，尽量避免棋盘同时被小数填满。','同一块一手只合并一次；练习模式可借助原版 MINT 搜索提示。'],
 sudoku:['先扫空格较少的行、列和宫，用自动候选检查可填数字。','候选笔记记录推理；优先找只剩一个候选的格子或唯一位置。','错误会扣分，修改前先检查关联格；练习可查看原数独引擎的逐步解释。'],
 reversi:['角上的棋子无法被翻转，优先控制四角。','靠近空角的斜邻格风险很高，别只看一手翻了多少枚。','中盘压缩对手合法落点，收尾再争子数；无合法步会自动跳过。'],
 rps:['双方暗选同时揭晓，不能从等待状态得知对方出了什么。','注意对方是否习惯赢后重复、输后换拳，避免自己固定循环。','平局不会加分，下一轮重新选择；先赢三轮结束。'],
 reaction:['只看绿色信号，不要按固定节奏猜时间。','连续几轮保持同样的手指位置，减少移动距离。','抢跑扣分且本轮不能重来；联机成绩包含传输延迟。'],
 mines:['数字代表周围八格的雷数，旗帜只是一项标记。','周围旗数等于数字时可双击数字联开；旗放错也会踩雷。','踩雷扣五分仍可继续；盲点前先找能确定安全的相邻格。'],
 typing:['先修正第一个不匹配的位置，后面的字才会计入有效进度。','中文标点也要一致，输入法组词时不会提前提交未完成的拼音。','保持准确比只求快更重要；用正确字数而非输入框总长度比较进度。'],
 simon:['播放时先把序列分成两三音的小组，轮到输入再按。','色块、符号和四个音高同时提示，选择自己容易记忆的方式。','上一轮的序列会保留并增加一个音符，完整复现另有奖励。'],
 connect4:['先检查下一手能落到哪里，悬空的格子不能直接下。','中列能参与更多连线，但对方已有三连时先防守。','制造两个可立即成四的落点，对方通常只能挡住一个。'],
 tictactoe:['先争中心或角，观察每条只剩一格的连线。','两条进攻线相交就形成双威胁，防守时也要防这个交点。','双方都走对时可能和棋；大师模式适合练习不漏防守。'],
 hex:['蜜桃连上下，薄荷连左右，棋盘相邻共有六个方向。','用两步可连接的桥保持弹性，不必把棋子挤在一条直线上。','寻找对方网络中的窄口；守住关键连接比填满边线更有效。'],
 slide:['先稳定第一行，再处理剩余两行，不要反复打乱已完成部分。','数字只能与相邻空格交换；绕一圈可以改变多个数字的次序。','距离值只表示每块到目标的曼哈顿距离之和，并不等于最少步数。'],
 nim:['一回合只能拿一盘，但可以从这一盘拿任意正数。','想象拿完后对手能留下什么局面，避免只剩一盘给对手。','三盘数量的异或值为零是关键均衡局面；练习时可以观察变化。'],
 lights:['点击会翻转自身和上下左右，边缘的影响格数更少。','同一盏点两次会抵消；记录已操作位置比随意试更有效。','按行处理：用下一行修正上一行，再检查最后一行。'],
 billiards:['先选自己的合法目标球，瞄准虚影显示白球首先接触的位置。','拉杆使白球接触后回退，顺杆继续向前；力度会影响走位距离。','接触目标后必须有球碰库或进袋；先清己方球再打黑八，犯规给对方自由球。'],
 badminton:['先选近网、中场或后场落点，再选择高远或吊球组织回合。','靠脚步到位再挥拍，球高时先起跳；低球强扣会被规则拒绝。','观察对手站位，把球打到远离他的一端；冲刺救球消耗体力，别每拍都冲。'],
 tabletennis:['发球先弹己方再弹对方；接球也必须等一次己方弹台。','上旋落台后向前冲，下旋落台后减速，接球时要重新估计位置。','调上、下落点拉开球拍；高来球可快攻，低来球用普通回击更稳。'],
 archery:['风向对两人相同，向风来的方向修正准星。','中心是 10 环，横向风偏叠加在你选择的准星上。','双方射完才揭晓对方落点；每轮风会变化，不要照搬上一箭。'],
 penalty:['射门与扑救都暗选，锁定前不能看到对方方向。','轮流攻守，留意对方过去的落点分布，避免每脚同一个角。','各五次，领先到无法追平会提前结束；同分进入突然死亡。'],
 checkers:['有吃必吃，先看高亮的合法跳吃路径。','连续跳吃必须用同一枚棋子走到底，别误以为已经换手。','升王可以前后走与吃，但到达底线会结束当前跳吃。']
};
const count=(a,fn=Boolean)=>(a||[]).filter(fn).length;
const metric=(label,value)=>({label,value:String(value)});
const ratio=(n,d)=>d?Math.round(n/d*100)+'%':'—';
function lineLength(b,p,w,h){let best=0;for(let i=0;i<b.length;i++)if(b[i]===p)for(const[dx,dy]of[[1,0],[0,1],[1,1],[1,-1]]){let n=0,x=i%w,y=Math.floor(i/w);while(x>=0&&x<w&&y>=0&&y<h&&b[y*w+x]===p){n++;x+=dx;y+=dy;}best=Math.max(best,n);}return best;}
function wins(b,p,w,h,n,gravity=false){const out=[];for(let i=0;i<b.length;i++){if(b[i]!==-1||gravity&&i+w<b.length&&b[i+w]===-1)continue;let yes=false;for(const[dx,dy]of[[1,0],[0,1],[1,1],[1,-1]]){let total=1;for(const sign of[-1,1]){let x=i%w+dx*sign,y=Math.floor(i/w)+dy*sign;while(x>=0&&x<w&&y>=0&&y<h&&b[y*w+x]===p){total++;x+=dx*sign;y+=dy*sign;}}if(total>=n)yes=true;}if(yes)out.push(i);}return out;}
export function study(id,v,p){
 const own=v.players?.[p],score=v.scores[p],other=v.scores[1-p];let metrics=[],insight=playbooks[id][1],goal='',progress=0,target=1,marks=[];
 const set=(g,n,t,...ms)=>{goal=g;progress=n;target=t;metrics=ms.map(([a,b])=>metric(a,b));};
 if(['gomoku','connect4','tictactoe'].includes(id)){
  const [w,h,n]=id==='gomoku'?[15,15,5]:id==='connect4'?[7,6,4]:[3,3,3],mine=wins(v.board,p,w,h,n,id==='connect4'),danger=wins(v.board,1-p,w,h,n,id==='connect4'),chain=lineLength(v.board,p,w,h);
  set(`形成 ${n-1} 子连续进攻`,chain,n-1,['最长连线',chain],['我方制胜点',mine.length],['对方制胜点',danger.length]);marks=mine.length?mine:danger;insight=mine.length?'你有一步成线的机会；练习时可开启棋盘标记。':danger.length?'对方下一手可能成线，先检查防守；练习时可开启棋盘标记。':playbooks[id][1];
 }else switch(id){
 case'fleet':{const shots=count(v.targetBoard,n=>n>=0),hits=count(v.targetBoard,n=>n>0),sunk=count(v.enemyShips,s=>s.sunk);set('击沉三艘舰船',sunk,3,['命中率',ratio(hits,shots)],['已搜索',shots+'/64'],['击沉',sunk+'/3']);insight=hits?'沿已命中的相邻格确定船的方向，再追击剩余船段。':playbooks[id][0];break;}
 case'dots':{let gifts=0;for(let b=0;b<16;b++){const x=b%4,y=b>>2,edges=[y*4+x,(y+1)*4+x,20+y*5+x,21+y*5+x];if(v.boxes[b]===-1&&count(edges,i=>v.edges[i]>=0)===3)gifts++;}set('拿下半数以上领地',score,9,['待收三边格',gifts],['剩余方格',count(v.boxes,n=>n<0)],['领地差',score-other]);insight=gifts?'场上有可立即围出的三边格，围格后还能继续走。':playbooks.dots[0];break;}
 case'memory':set('配对七组图案',score,7,['我方配对',score],['剩余牌',count(v.owners,n=>n<0)],['当前翻开',v.open.length]);break;
 case'hockey':set('完成七次进球',score,7,['球速',Math.round(Math.hypot(v.puck.vx,v.puck.vy))],['离球距离',Math.round(Math.hypot(v.puck.x-v.paddles[p].x,v.puck.y-v.paddles[p].y))],['比分差',score-other]);insight=(p?v.puck.vx>0:v.puck.vx<0)?'球正飞向你，优先守住门前并迎球回击。':'球正飞向对面，及时回防，准备下一次反弹。';break;
 case'tanks':set('削掉对手五点装甲',5-v.tanks[1-p].hp,5,['剩余装甲',v.tanks[p].hp],['发射次数',v.tanks[p].shots],['对方装甲',v.tanks[1-p].hp]);break;
 case'bomber':set('在爆炸中存活并获胜',v.status==='finished'&&v.winner===p?1:0,1,['己方炸弹',count(v.bombs,b=>b.owner===p)+'/2'],['可破坏砖',v.grid.flat().filter(n=>n===2).length],['危险火格',v.flames.length]);insight=v.bombs.some(b=>Math.abs(b.x-own.x)+Math.abs(b.y-own.y)<=2)?'附近有炸弹：优先拐入墙后，直线撤退未必能离开爆炸范围。':playbooks.bomber[1];break;
 case'snake':set('吃到十颗星果',score,10,['蛇身长度',v.snakes[p].body.length],['食物数量',v.food.length],['对方长度',v.snakes[1-p].body.length]);break;
 case'tetris':set('累计消除十行',own.lines,10,['当前连击',Math.max(0,own.combo||0)],['待接收行',own.pending],['暂存方块',own.hold||'空']);insight=own.pending?'先消行抵消障碍，避免把待接收行推到危险高度。':playbooks.tetris[1];break;
 case'slingshot':set('摧毁对方城堡',100-v.castles[1-p].hp,100,['我方耐久',v.castles[p].hp],['风力',v.wind],['对方耐久',v.castles[1-p].hp]);break;
 case'maze':{const targetPos=v.flag.carrier===p?v.bases[p]:v.flag;set('成功带回三面旗',score,3,['旗帜归属',v.flag.carrier===null?'场中央':v.flag.carrier===p?'我方':'对方'],['目标直线格数',Math.abs(own.x-targetPos.x)+Math.abs(own.y-targetPos.y)],['回合差',score-other]);insight=v.flag.carrier===p?'你已持旗，绕开对方回基地；碰撞会把旗送回中央。':playbooks.maze[2];break;}
 case'quiz':set('答对六道题',score/100,6,['正确题数',score/100],['当前题',Math.min(8,v.round+1)+'/8'],['锁定状态',v.answered[p]?'已锁定':'可作答']);insight=v.question.explanation||playbooks.quiz[0];break;
 case'g2048':{const empty=count(own.cells,n=>!n);set('合出 2048',own.highest,2048,['最高数字',own.highest],['可用空位',empty],['有效步数',own.moves]);insight=empty<=3?'空位偏少，先寻找能合并并腾空的方向。':playbooks.g2048[0];break;}
 case'sudoku':set('完成所有空格',own.correct,v.total,['正确空格',own.correct+'/'+v.total],['错误次数',own.mistakes],['剩余空格',count(own.cells,n=>!n)]);break;
 case'reversi':{const corners=[0,7,56,63];set('占据两个角',count(corners,i=>v.board[i]===p),2,['我方角位',count(corners,i=>v.board[i]===p)],['当前合法步',v.legalMoves.length],['棋子差',score-other]);marks=v.turn===p?v.legalMoves.filter(i=>corners.includes(i)):[];insight=marks.length?'有可以直接占据的角位；角上的棋子不会再被翻转。':playbooks.reversi[1];break;}
 case'rps':set('先赢三轮',score,3,['本轮',v.round],['比分差',score-other],['暗选状态',v.ownChoice?'已锁定':'未锁定']);break;
 case'reaction':{const r=v.responses[p];set('本轮反应低于 350 ms',r!==null&&r>=0&&r<350?1:0,1,['本轮反应',r===null?'待记录':r<0?'抢跑':r+' ms'],['轮次',Math.min(5,v.round+1)+'/5'],['积分',score]);break;}
 case'mines':set('打开全部安全格',v.safeOpened[p],69,['安全格',v.safeOpened[p]+'/69'],['旗帜',count(v.flags)+'/12'],['踩雷次数',v.hits[p]]);break;
 case'typing':set('完整正确输入',own.correct,v.total,['正确字数',own.correct+'/'+v.total],['待修正长度',Math.max(0,own.length-own.correct)],['完成率',ratio(own.correct,v.total)]);insight=own.length>own.correct?`从第 ${own.correct+1} 个字或标点开始修正，后面的输入才会计入进度。`:playbooks.typing[1];break;
 case'simon':set('完整复现本轮旋律',own.position,v.length,['本轮长度',v.length],['已复现',own.position],['轮次',Math.min(8,v.round+1)+'/8']);break;
 case'hex':set('连接两岸获胜',v.status==='finished'&&v.winner===p?1:0,1,['我方棋子',score],['空位',count(v.board,n=>n<0)],['连接方向',p?'左 → 右':'上 → 下']);break;
 case'slide':{const dist=own.cells.reduce((n,x,i)=>n+(x?Math.abs((x-1)%3-i%3)+Math.abs(Math.floor((x-1)/3)-Math.floor(i/3)):0),0);set('八块数字全部归位',count(own.cells,(n,i)=>n>0&&n===i+1),8,['距离和',dist],['移动步数',own.moves],['已归位',count(own.cells,(n,i)=>n>0&&n===i+1)]);break;}
 case'nim':set('拿到最后一颗豆',v.status==='finished'&&v.winner===p?1:0,1,['剩余豆数',v.piles.reduce((a,b)=>a+b,0)],['非空盘数',count(v.piles)],['局面异或',v.piles.reduce((a,b)=>a^b,0)]);break;
 case'lights':set('点亮全部星灯',score,25,['亮灯',score+'/25'],['暗灯',25-score],['翻转次数',own.moves]);break;
 case'billiards':{const group=v.groups[p],left=v.balls.filter(b=>b.n&&b.n!==8&&!b.potted&&(group===null||Number(b.n>8)===group));set('清空己方七球',group===null?0:7-left.length,7,['己方球组',group===null?'未分组':group?'花色':'实色'],['剩余目标',left.length],['上一杆',v.lastShot?.reason||'准备开球']);insight=v.ballInHand?'自由球可摆到无遮挡的路线；先选球，再摆白球更容易进袋。':left.length?playbooks.billiards[1]:'己方球已清空，现在可以瞄准黑八。';break;}
 case'badminton':case'tabletennis':set('打出十拍连续回合',Math.max(v.longestRally||0,v.rallyHits||0),10,['本回合拍数',v.rallyHits||0],['甜点击球',v.stats?.[p]?.sweet||0],['上一分',v.lastPoint?.reason||'开局']);insight=id==='badminton'?(own.stamina<35?'体力偏低，先用高远球争取回位和恢复时间。':playbooks.badminton[2]):playbooks.tabletennis[1];break;
 case'archery':{const hits=v.hits[p];set('五箭得到 45 环',score,45,['已射箭数',hits.length+'/5'],['平均环数',hits.length?(score/hits.length).toFixed(1):'—'],['风偏',v.wind]);insight=`当前风向${v.wind>0?'向右':v.wind<0?'向左':'平稳'}，向${v.wind>0?'左':v.wind<0?'右':'中心'}修正准星。`;break;}
 case'penalty':{const kicks=v.history.filter(h=>h.attacker===p),saves=v.history.filter(h=>h.attacker!==p&&!h.goal&&h.shot>=0);set('完成一次有效扑救',saves.length,1,['我方射门',kicks.length],['进球率',ratio(count(kicks,h=>h.goal),kicks.length)],['有效扑救',saves.length]);break;}
 case'checkers':{const sign=p?-1:1,crowns=count(v.board,n=>n===sign*2);set('培养一枚王棋',crowns,1,['我方棋子',count(v.board,n=>Math.sign(n)===sign)],['王棋',crowns],['合法跳吃',count(v.legal,m=>m.capture!==null)]);insight=v.chain!==null?'本次跳吃尚未结束，继续移动同一枚棋子。':v.legal.some(m=>m.capture!==null)?'存在强制跳吃：先比较各条跳吃路线的后续风险。':playbooks.checkers[2];break;}
 }
 return {metrics,insight,goal,progress,target,marks};
}
