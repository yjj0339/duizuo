export const catalog = [
  {id:'gomoku',name:'五子棋',en:'Five in a row',category:'策略棋盘',tag:'经典对弈',minutes:'3–10 分钟',icon:'◉',color:'#ddac78',summary:'一横一竖，先连成五子的你赢。',rules:'15×15 自由规则，黑方先行。轮流在空位落子，横、竖、斜方向连成至少五子获胜。',controls:'点击棋盘落子'},
  {id:'fleet',name:'隐藏海战',en:'Hidden fleet',category:'策略棋盘',tag:'猜猜我在哪',minutes:'3–6 分钟',icon:'⚓',color:'#80b8de',summary:'藏好舰队，从一片海里找到对手。',rules:'先随机布阵并锁定舰队，双方准备后轮流攻击。击沉对方全部舰船获胜，未发现的位置保持隐藏。',controls:'点击布阵按钮，再点击敌方海域'},
  {id:'dots',name:'点格夺地',en:'Little territories',category:'策略棋盘',tag:'步步为营',minutes:'2–4 分钟',icon:'⊞',color:'#c3a4dc',summary:'连一条线，圈住属于你的地盘。',rules:'轮流连接相邻圆点，完成方格的最后一条边就占领它，并再行动一次。领地最多者获胜。',controls:'点击圆点之间的边'},
  {id:'memory',name:'翻牌记忆',en:'Perfect pairs',category:'脑力益智',tag:'记性大比拼',minutes:'2–4 分钟',icon:'❖',color:'#eea3b1',summary:'见过一次的图案，还记得在哪吗？',rules:'轮流翻开两张牌，相同即可得分并继续翻。全部配对后比较得分，未揭开的牌面保密。',controls:'点击两张暗牌'},
  {id:'hockey',name:'迷你冰球',en:'Pocket hockey',category:'动作竞技',tag:'一击入魂',minutes:'1–3 分钟',icon:'◎',color:'#7bc6ce',summary:'守好球门，再给对方一个漂亮反击。',rules:'拖动你的球拍在己方半场击球，射入对方球门得分，先得 7 分获胜。',controls:'拖动球拍或使用方向键'},
  {id:'tanks',name:'口袋坦克',en:'Tiny tanks',category:'动作竞技',tag:'躲好再开炮',minutes:'2–4 分钟',icon:'✣',color:'#92bba0',summary:'绕过掩体，让这一发刚好命中。',rules:'控制坦克移动、瞄准和开炮，掩体会阻挡炮弹，击毁对方坦克获胜。',controls:'方向键移动、动作键开火，或触屏控制'},
  {id:'bomber',name:'泡泡炸弹人',en:'Bubble blast',category:'动作竞技',tag:'快乐连锁',minutes:'2–4 分钟',icon:'✹',color:'#ddad72',summary:'放下一个小惊喜，记得及时跑开。',rules:'放置倒计时炸弹，十字爆炸可以破坏砖块并触发连锁。最后存活者获胜，同时出局为和棋。',controls:'方向键移动，空格/动作键放炸弹'},
  {id:'snake',name:'贪吃蛇竞技场',en:'Snake together',category:'动作竞技',tag:'小心绕圈',minutes:'1–3 分钟',icon:'〰',color:'#a4c880',summary:'吃大一点，也给对手留一点难题。',rules:'吃食物增长身体，撞到墙壁或蛇身判负。不能直接反向，双方同时碰撞为和棋。',controls:'方向键、滑动或触屏方向键'},
  {id:'tetris',name:'方块攻防战',en:'Block battle',category:'动作竞技',tag:'消行反击',minutes:'3–6 分钟',icon:'▟',color:'#a39bd5',summary:'把方块摆整齐，把压力送给对方。',rules:'双方获得相同顺序的方块，移动、旋转、落下。消行会向对手发送障碍行；连续消行有额外反击，可暂存换块，封顶判负。',controls:'左右移动、上旋转、下加速、空格落下、C 暂存'},
  {id:'slingshot',name:'弹弓城堡',en:'Castle toss',category:'动作竞技',tag:'弧线刚刚好',minutes:'3–5 分钟',icon:'⌁',color:'#deb18a',summary:'看准风向，给城堡送去一条抛物线。',rules:'轮流选择角度和力度发射，风会影响弹道，命中造成伤害，摧毁对方城堡获胜。',controls:'调节角度、力度后发射'},
  {id:'maze',name:'迷宫夺旗',en:'Flag runners',category:'竞速挑战',tag:'转角遇到你',minutes:'2–4 分钟',icon:'⚑',color:'#92b5d9',summary:'穿过小迷宫，把旗帜带回家。',rules:'在对称可达的迷宫中争夺旗帜，将旗帜带回自己的基地得分，达到目标获胜。',controls:'方向键或触屏方向键'},
  {id:'quiz',name:'知识擂台',en:'Curious minds',category:'轻松互动',tag:'脑洞上线',minutes:'2–3 分钟',icon:'?',color:'#d2b973',summary:'一样的题目，不一样的灵光一闪。',rules:'同题限时选择答案，答对得分。每题结束揭晓，全部题目后按总分结算。',controls:'点击答案，或按对应数字键'},
  {id:'g2048',name:'2048 对决',en:'Merge & match',category:'脑力益智',tag:'经典回归',minutes:'3 分钟',icon:'2048',color:'#c8ae7b',summary:'从 2 开始，看谁先把数字合大。',rules:'同种子开局。相同数字相撞合并，一次移动只能合并一次，限时比较分数。',controls:'滑动棋盘或方向键'},
  {id:'sudoku',name:'数独竞速',en:'Number garden',category:'脑力益智',tag:'慢慢想也能赢',minutes:'10 分钟',icon:'9',color:'#9fbcae',summary:'同一道数独，看看谁先找到答案。',rules:'双方挑战相同的唯一解数独，行、列和九宫内数字不可重复。先完成或限时正确格数更多者获胜。',controls:'选择格子，再点数字键盘'},
  {id:'reversi',name:'黑白棋',en:'Turning tides',category:'策略棋盘',tag:'绝地翻盘',minutes:'3–8 分钟',icon:'◑',color:'#9aaebd',summary:'这一刻的落后，也许是下一步的反转。',rules:'合法落子必须夹住至少一枚敌方棋子，夹住的棋子翻为己方颜色。无路可下自动跳过，最后数量多者获胜。',controls:'点击高亮的合法落点'},
  {id:'rps',name:'石头剪刀布',en:'Rock, paper, us',category:'轻松互动',tag:'猜猜你会出什么',minutes:'1 分钟',icon:'✌',color:'#d6a5b9',summary:'三种选择，藏着一点点小心思。',rules:'双方暗选，同时揭晓，胜一轮得一分，先得 3 分获胜，平局重赛。',controls:'选择石头、剪刀或布'},
  {id:'reaction',name:'反应力对决',en:'Ready, set, tap',category:'竞速挑战',tag:'别抢跑',minutes:'1 分钟',icon:'ϟ',color:'#dfbe78',summary:'等灯亮起，再看谁先出手。',rules:'等待随机信号后点击，抢跑受罚，多轮积分决胜。网络延迟可能影响结果。',controls:'看到信号后点击或按空格'},
  {id:'mines',name:'扫雷竞速',en:'Safe steps',category:'脑力益智',tag:'小心脚下',minutes:'3 分钟',icon:'✳',color:'#b5bc87',summary:'一样的雷区，比一比谁走得更稳。',rules:'双方同图竞速，数字代表周围雷数。可插旗，安全格越多得分越高，踩雷受罚。',controls:'点击开格，切换插旗或右键'},
  {id:'typing',name:'打字竞速',en:'Words in motion',category:'竞速挑战',tag:'指尖小跑',minutes:'1 分钟',icon:'Aa',color:'#9cb7d3',summary:'把同一句话，一字不差送到终点。',rules:'输入相同中文句子，服务器验证正确进度，先正确完成者获胜。支持中文输入法。',controls:'点击输入框开始输入'},
  {id:'simon',name:'节奏记忆',en:'Echo notes',category:'轻松互动',tag:'记住这段旋律',minutes:'2 分钟',icon:'♫',color:'#b3a2d5',summary:'听一听、看一看，再把节奏接下去。',rules:'记住依次亮起的颜色序列并按顺序复现，序列逐轮增长，按正确输入积分。',controls:'点击色块或对应数字键'}
];
catalog.push(
 {id:'connect4',name:'四子连珠',en:'Four together',category:'策略棋盘',tag:'重力棋盘',minutes:'2–4 分钟',icon:'4',color:'#b1a6d8',summary:'把棋子投进一列，等一条线慢慢成形。',rules:'双方轮流从七列中投入棋子，棋子落到最低空格。先横、竖或斜连成四枚获胜。每回合 45 秒。',controls:'点击棋盘任意列，或按 1–7'},
 {id:'tictactoe',name:'井字棋',en:'Three little marks',category:'策略棋盘',tag:'九格巧思',minutes:'1 分钟',icon:'×',color:'#d5ad9c',summary:'九个位置，藏着一个漂亮的先手。',rules:'双方轮流落子，先横、竖或斜连成三个标记获胜。棋盘已满则和棋。',controls:'点击空格落子'},
 {id:'hex',name:'六边连线',en:'Two shores',category:'策略棋盘',tag:'连接两岸',minutes:'2–5 分钟',icon:'⬡',color:'#a0bdad',summary:'一条属于你的路，连接棋盘的两岸。',rules:'六边形棋盘相邻六向连通。蜜桃连接上边与下边，薄荷连接左边与右边。谁先形成完整路径谁赢。',controls:'点击六边形空位'},
 {id:'slide',name:'数字华容道',en:'Sliding afternoon',category:'脑力益智',tag:'挪一步',minutes:'3 分钟',icon:'8',color:'#cdb38c',summary:'给空格让个位置，把数字送回家。',rules:'相同的可解乱序棋盘。点击与空格相邻的数字移动，把 1–8 按行排好、空格留右下角，先完成获胜。',controls:'点击相邻数字，或用方向键移动空格'},
 {id:'nim',name:'拿豆博弈',en:'The last bean',category:'策略棋盘',tag:'最后一颗',minutes:'1–3 分钟',icon:'●',color:'#adc29f',summary:'一盘、几颗豆，想好再拿走。',rules:'初始三盘分别有 3、5、7 颗豆。每回合只能从一盘拿走至少一颗，拿到最后一颗豆的人获胜。',controls:'点豆选择数量，再确认拿走'},
 {id:'lights',name:'星灯棋阵',en:'A little constellation',category:'脑力益智',tag:'点亮星图',minutes:'3 分钟',icon:'✧',color:'#d0bc87',summary:'轻点一颗星，把整片小星空点亮。',rules:'每次点击会翻转自己和上下左右的星灯。相同可解棋盘，先点亮全部 25 盏灯获胜，超时按亮灯数结算。',controls:'点击星灯翻转十字范围'}
);
catalog.push(
 {id:'billiards',name:'迷你台球',en:'Pocket eight',category:'体育对决',tag:'清台时刻',minutes:'5–8 分钟',icon:'8',color:'#6aa88d',summary:'看准角度，一杆把漂亮的球送进口袋。',rules:'简化八球：首次合法进球分配实色或花色；清空己方球后打黑八。先碰错球、空杆、白球入袋或碰球后无球碰库及入袋均犯规，对手自由放白球。提前进黑八判负。未采用完整比赛的开球与指袋规则。',controls:'拖动瞄准、调力度与杆法；犯规后点球台放白球'},
 {id:'badminton',name:'羽毛球对决',en:'Shuttle afternoon',category:'体育对决',tag:'吊球与扣杀',minutes:'3–5 分钟',icon:'♧',color:'#abc391',summary:'左手跑位，右手打出漂亮的一拍。',rules:'横版羽毛球，选择近网／中场／后场落点，靠近羽球挥拍；跳跃高度影响触球，扣杀需高点。冲刺与跳跃消耗可恢复体力。球落对方场内得分。触网、出界或落在己方场内失分。11 分且净胜 2 分获胜，15 分封顶，采用休闲快局。',controls:'左右摇杆移动、击球与起跳；菜单中设置球路和落点，横竖屏均可玩'},
 {id:'tabletennis',name:'乒乓球对决',en:'Little rallies',category:'体育对决',tag:'来回才过瘾',minutes:'2–5 分钟',icon:'◒',color:'#83b6b2',summary:'接住这一拍，把落点送到另一角。',rules:'发球先弹己方台再过网；球在己方弹台一次后才能回击，不能连击。上旋前冲、下旋减速，低球不能快攻。触网、出界或二次弹台失分。11 分且净胜 2 分，15 分封顶；每两分换发，10 平后每分换发。采用简化的自动发球动作，发球轻擦网重发。',controls:'拖动或上下键移动球拍；空格回击、2 挑高、3 快攻'},
 {id:'archery',name:'微风射箭',en:'Five arrows',category:'体育对决',tag:'瞄准这一环',minutes:'2–3 分钟',icon:'◎',color:'#d4b06d',summary:'同一阵微风，看谁的准星更稳。',rules:'每人五箭，每轮相同风向。准星加上风偏决定落点，中心 10 环，越偏环数越低。双方落箭后揭晓，五箭总分决定胜负。',controls:'拖动靶面或调准星滑块；方向键微调，空格放箭'},
 {id:'penalty',name:'点球大战',en:'One brave kick',category:'体育对决',tag:'一脚定胜负',minutes:'2–4 分钟',icon:'⚽',color:'#a0bf89',summary:'你猜他的落点，他猜你猜的落点。',rules:'轮流射门与守门，六个方向同时暗选，同方向扑救成功。各五次，提前锁定胜负即可结算。同分进入最多五轮突然死亡，仍同分则和棋。15 秒未选判失误。',controls:'选择六个方向之一，或按 1–6'},
 {id:'checkers',name:'跳吃棋',en:'Crown & capture',category:'策略棋盘',tag:'跳出一步好棋',minutes:'3–8 分钟',icon:'♛',color:'#bca48c',summary:'连跳吃子，把小棋子送成一位国王。',rules:'8×8 棋盘，棋子向前斜走一格，有吃必吃，跳过对方棋子并吃掉，可连续跳吃。到达底线升王并结束该次跳吃，王棋可向前或后走与吃。无合法步判负，80 步未吃子和棋。',controls:'点棋子，再点高亮落点；方向键选格，Enter 确认'}
);
export const byId = Object.fromEntries(catalog.map(g=>[g.id,g]));
