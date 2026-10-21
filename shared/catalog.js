export const catalog = [
  {id:'gomoku',name:'五子棋',en:'Five in a row',category:'策略棋盘',tag:'经典对弈',minutes:'3–10 分钟',icon:'◉',color:'#ddac78',summary:'一横一竖，先连成五子的你赢。',rules:'15×15 自由规则，黑方先行。轮流在空位落子，横、竖、斜方向连成至少五子获胜。',controls:'点击棋盘落子'},
  {id:'fleet',name:'隐藏海战',en:'Hidden fleet',category:'策略棋盘',tag:'猜猜我在哪',minutes:'3–6 分钟',icon:'⚓',color:'#80b8de',summary:'藏好舰队，从一片海里找到对手。',rules:'先随机布阵并锁定舰队，双方准备后轮流攻击。击沉对方全部舰船获胜，未发现的位置保持隐藏。',controls:'点击布阵按钮，再点击敌方海域'},
  {id:'dots',name:'点格夺地',en:'Little territories',category:'策略棋盘',tag:'步步为营',minutes:'2–4 分钟',icon:'⊞',color:'#c3a4dc',summary:'连一条线，圈住属于你的地盘。',rules:'轮流连接相邻圆点，完成方格的最后一条边就占领它，并再行动一次。领地最多者获胜。',controls:'点击圆点之间的边'},
  {id:'memory',name:'翻牌记忆',en:'Perfect pairs',category:'脑力益智',tag:'记性大比拼',minutes:'2–4 分钟',icon:'❖',color:'#eea3b1',summary:'见过一次的图案，还记得在哪吗？',rules:'轮流翻开两张牌，相同即可得分并继续翻。全部配对后比较得分，未揭开的牌面保密。',controls:'点击两张暗牌'},
  {id:'hockey',name:'迷你冰球',en:'Pocket hockey',category:'动作竞技',tag:'一击入魂',minutes:'1–3 分钟',icon:'◎',color:'#7bc6ce',summary:'守好球门，再给对方一个漂亮反击。',rules:'拖动你的球拍在己方半场击球，射入对方球门得分，先得 7 分获胜。',controls:'拖动球拍或使用方向键'},
  {id:'tanks',name:'口袋坦克',en:'Tiny tanks',category:'动作竞技',tag:'躲好再开炮',minutes:'2–4 分钟',icon:'✣',color:'#92bba0',summary:'绕过掩体，让这一发刚好命中。',rules:'控制坦克移动、瞄准和开炮，掩体会阻挡炮弹，击毁对方坦克获胜。',controls:'方向键移动、动作键开火，或触屏控制'},
  {id:'bomber',name:'泡泡炸弹人',en:'Bubble blast',category:'动作竞技',tag:'快乐连锁',minutes:'2–4 分钟',icon:'✹',color:'#ddad72',summary:'放下一个小惊喜，记得及时跑开。',rules:'放置倒计时炸弹，十字爆炸可以破坏砖块并触发连锁。最后存活者获胜，同时出局为和棋。',controls:'方向键移动，空格/动作键放炸弹'},
  {id:'snake',name:'贪吃蛇竞技场',en:'Snake together',category:'动作竞技',tag:'小心绕圈',minutes:'1–3 分钟',icon:'〰',color:'#a4c880',summary:'吃大一点，也给对手留一点难题。',rules:'吃食物增长身体，撞到墙壁或蛇身判负。不能直接反向，双方同时碰撞为和棋。',controls:'方向键、滑动或触屏方向键'},
  {id:'tetris',name:'方块攻防战',en:'Block battle',category:'动作竞技',tag:'消行反击',minutes:'3–6 分钟',icon:'▟',color:'#a39bd5',summary:'把方块摆整齐，把压力送给对方。',rules:'双方获得相同顺序的方块，移动、旋转、落下。消行会向对手发送障碍行，封顶判负。',controls:'左右移动、上旋转、下加速、空格落下'},
  {id:'slingshot',name:'弹弓城堡',en:'Castle toss',category:'动作竞技',tag:'弧线刚刚好',minutes:'3–5 分钟',icon:'⌁',color:'#deb18a',summary:'看准风向，给城堡送去一条抛物线。',rules:'轮流选择角度和力度发射，风会影响弹道，命中造成伤害，摧毁对方城堡获胜。',controls:'调节角度、力度后发射'},
  {id:'maze',name:'迷宫夺旗',en:'Flag runners',category:'竞速挑战',tag:'转角遇到你',minutes:'2–4 分钟',icon:'⚑',color:'#92b5d9',summary:'穿过小迷宫，把旗帜带回家。',rules:'在对称可达的迷宫中争夺旗帜，将旗帜带回自己的基地得分，达到目标获胜。',controls:'方向键或触屏方向键'},
  {id:'quiz',name:'知识擂台',en:'Curious minds',category:'轻松互动',tag:'脑洞上线',minutes:'2–3 分钟',icon:'?',color:'#d2b973',summary:'一样的题目，不一样的灵光一闪。',rules:'同题限时选择答案，答对得分。每题结束揭晓，全部题目后按总分结算。',controls:'点击答案，或按对应数字键'},
  {id:'g2048',name:'2048 对决',en:'Merge & match',category:'脑力益智',tag:'经典回归',minutes:'3 分钟',icon:'2048',color:'#c8ae7b',summary:'从 2 开始，看谁先把数字合大。',rules:'同种子开局。相同数字相撞合并，一次移动只能合并一次，限时比较分数。',controls:'滑动棋盘或方向键'},
  {id:'sudoku',name:'数独竞速',en:'Number garden',category:'脑力益智',tag:'慢慢想也能赢',minutes:'5 分钟',icon:'9',color:'#9fbcae',summary:'同一道数独，看看谁先找到答案。',rules:'双方挑战相同的唯一解数独，行、列和九宫内数字不可重复。先完成或限时正确格数更多者获胜。',controls:'选择格子，再点数字键盘'},
  {id:'reversi',name:'黑白棋',en:'Turning tides',category:'策略棋盘',tag:'绝地翻盘',minutes:'3–8 分钟',icon:'◑',color:'#9aaebd',summary:'这一刻的落后，也许是下一步的反转。',rules:'合法落子必须夹住至少一枚敌方棋子，夹住的棋子翻为己方颜色。无路可下自动跳过，最后数量多者获胜。',controls:'点击高亮的合法落点'},
  {id:'rps',name:'石头剪刀布',en:'Rock, paper, us',category:'轻松互动',tag:'猜猜你会出什么',minutes:'1 分钟',icon:'✌',color:'#d6a5b9',summary:'三种选择，藏着一点点小心思。',rules:'双方暗选，同时揭晓，胜一轮得一分，先得 3 分获胜，平局重赛。',controls:'选择石头、剪刀或布'},
  {id:'reaction',name:'反应力对决',en:'Ready, set, tap',category:'竞速挑战',tag:'别抢跑',minutes:'1 分钟',icon:'ϟ',color:'#dfbe78',summary:'等灯亮起，再看谁先出手。',rules:'等待随机信号后点击，抢跑受罚，多轮积分决胜。网络延迟可能影响结果。',controls:'看到信号后点击或按空格'},
  {id:'mines',name:'扫雷竞速',en:'Safe steps',category:'脑力益智',tag:'小心脚下',minutes:'3 分钟',icon:'✳',color:'#b5bc87',summary:'一样的雷区，比一比谁走得更稳。',rules:'双方同图竞速，数字代表周围雷数。可插旗，安全格越多得分越高，踩雷受罚。',controls:'点击开格，切换插旗或右键'},
  {id:'typing',name:'打字竞速',en:'Words in motion',category:'竞速挑战',tag:'指尖小跑',minutes:'1 分钟',icon:'Aa',color:'#9cb7d3',summary:'把同一句话，一字不差送到终点。',rules:'输入相同中文句子，服务器验证正确进度，先正确完成者获胜。支持中文输入法。',controls:'点击输入框开始输入'},
  {id:'simon',name:'节奏记忆',en:'Echo notes',category:'轻松互动',tag:'记住这段旋律',minutes:'2 分钟',icon:'♫',color:'#b3a2d5',summary:'听一听、看一看，再把节奏接下去。',rules:'记住依次亮起的颜色序列并按顺序复现，序列逐轮增长，按正确输入积分。',controls:'点击色块或对应数字键'}
];
export const byId = Object.fromEntries(catalog.map(g=>[g.id,g]));
