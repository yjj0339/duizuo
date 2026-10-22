# DUIZUO 视觉规范 v2「云间糖屋」

所有前端代码必须遵守本规范。目标是**浅色毛玻璃**、轻松精致的双人对战体验。

## 一、硬性约束

1. **禁止深色主题**。不出现大面积深色背景、深色卡片、深色文字块。
2. 所有面板使用**浅色毛玻璃**：`rgba(255,255,255,.58~.86)` 底 + `backdrop-filter: blur(22~28px) saturate(1.4~1.6)` + `1px solid rgba(255,255,255,.82)` 描边 + 柔和冷调阴影。
3. 文字颜色只用 `--ink` / `--ink-2` / `--muted` / `--faint` 四级，不要自定义灰。
4. 触控目标 ≥ 42px 高。
5. 尊重 `prefers-reduced-motion`（渲染器已收到 `context.reducedMotion`）。
6. 不得修改 `client/style.css`、`client/art.js`、`client/main.js`——那是 owner 的文件。
7. 不得修改引擎文件 `games/*-engines.js` 与 `tests/*`——规则由 owner 锁定。
8. 不得新增依赖，不得改动 `package.json`。

## 二、设计令牌（直接用 CSS 变量，不要写死颜色）

全局已在 `client/style.css` 定义，组内 CSS 直接引用：

```css
/* 底色与墨色 */
--cloud:#F6F7FC;  --cloud-warm:#FBF8FA;  --paper:#FFFFFF;
--ink:#25313D;    --ink-2:#495868;      --muted:#8A97A6;  --faint:#B3BDC8;

/* 玩家一 · 蜜桃粉 */
--p1:#FF7E6B;  --p1-soft:#FFE2DB;  --p1-wash:#FFF3EF;  --p1-deep:#E2553F;  --p1-glow:rgba(255,126,107,.30);

/* 玩家二 · 薄荷绿 */
--p2:#1FBE9C;  --p2-soft:#D2F4EA;  --p2-wash:#F0FBF7;  --p2-deep:#0E9576;  --p2-glow:rgba(31,190,156,.28);

/* 点缀 · 淡紫（仅用于中性/装饰/第三色，不要抢双人主色） */
--lil:#9A8BEE;  --lil-soft:#EAE6FF;  --lil-deep:#7462DE;  --lil-glow:rgba(154,139,238,.26);

/* 毛玻璃与描边 */
--glass:rgba(255,255,255,.60);  --glass-strong:rgba(255,255,255,.80);  --glass-line:rgba(255,255,255,.82);
--hairline:rgba(37,49,61,.07);   --hairline-2:rgba(37,49,61,.11);

/* 阴影 */
--sh-1:0 1px 2px rgba(58,76,100,.05), 0 4px 12px -6px rgba(58,76,100,.12);
--sh-2:0 2px 6px -2px rgba(58,76,100,.10), 0 16px 34px -18px rgba(58,76,100,.26);
--sh-3:0 4px 10px -4px rgba(58,76,100,.12), 0 34px 68px -30px rgba(58,76,100,.34);
--sh-inner:inset 0 1px 0 rgba(255,255,255,.92);

/* 圆角与节奏 */
--r-sm:12px; --r-md:18px; --r-lg:26px; --r-xl:34px;
--ease:cubic-bezier(.22,.68,.32,1); --ease-spring:cubic-bezier(.34,1.4,.52,1);
```

**Canvas 绘图**没有 CSS 变量，请直接用这两个常量：
`PEACH = '#FF7E6B'`（玩家一）、`MINT = '#1FBE9C'`（玩家二）、`LIL = '#9A8BEE'`（点缀）。
渲染器已经通过 `context.colors = ['#FF7E6B','#1FBE9C']` 拿到双人色，**优先使用 `context.colors[player]`**，这样换配色只需改一处。

## 三、棋盘/面板质感参考

- 棋盘类面板：`background: linear-gradient(155deg, rgba(255,255,255,.88), rgba(255,255,255,.58))`，外加 `box-shadow: var(--sh-2), var(--sh-inner)`。
- 格子 hover：`transform: scale(1.05)` + 柔和外发光（`--p1-glow` / `--p2-glow`）。
- 不可用/禁用：不要用深灰遮罩，用 `opacity:.42` + `filter: saturate(.4)`。
- 己方元素用蜜桃粉系，对手元素用薄荷绿系，第三方/中性元素用淡紫。
- 棋盘木纹/冰面等拟物底色必须**很浅**（如 `#FFF6EC → #F4E2CE`），不要深棕。

## 四、共享类（`client/style.css` 已提供，不要重复定义）

`.game-surface` `.game-note` `.game-toolbar` `.game-button`（`.primary` `.secondary` `.active`）`.game-grid` `.game-cell` `.game-score` `.game-columns` `.game-panel` `.game-input` `.touch-controls` `.dpad` `.action-pad` `.player-0` `.player-1`

组内只写自己命名空间的类（现有 `board-` / `puzzle-` / `arcade-` 前缀），不要覆写上面的共享类。

## 五、渲染器契约（不可破坏）

```js
mount(root, send, context) => { update(view), destroy() }
context = { player:0|1, colors:['#FF7E6B','#1FBE9C'], feedback(kind), reducedMotion:boolean }
```

- `update(view)` 会被高频调用（最高 15Hz），**不得重建 root**，不得丢焦点、不得打断 IME 合成（打字竞速尤其重要）。
- `destroy()` 必须清理**所有** window 监听、interval、requestAnimationFrame、pointer capture。
- Canvas 指针坐标必须经 `getBoundingClientRect()` 映射；canvas 要有 `aria-label`。
- 方向键在游戏中要 `preventDefault`（但打字输入框要保留正常键盘行为）。
- 不得在客户端计算分数、生命、胜负——服务端给什么就显示什么。
- 昵称/用户输入必须用 `textContent`，不得拼进 HTML。

## 六、验收

1. `node --test tests/board.test.js`（或对应组）必须全绿。
2. 桌面 1440×1000 与移动 390×844、320×568 下都不溢出、不遮挡、无横向滚动。
3. 控制台无 error。
4. 每款游戏必须能从开局玩到结算，保留完整可玩性。
