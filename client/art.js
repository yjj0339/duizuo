/* =============================================================
   DUO PLAY · 图形库
   统一的浅色插画语言：柔光、圆润、蜜桃粉 × 薄荷绿 × 淡紫
   所有图形在 200 × 180 画布内绘制，底座带柔和投影
   ============================================================= */

const PEACH = ['#FF9E8A', '#FF7E6B', '#E2553F'];
const MINT = ['#4FD3B0', '#1FBE9C', '#0E9576'];
const LIL = ['#B7ABF5', '#9A8BEE', '#7462DE'];

/* 每个图形使用独立 id，避免同页多张 SVG 的渐变互相覆盖 */
function defs(id, a, b, c) {
  return `<defs>
    <linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </linearGradient>
    <linearGradient id="gd${id}" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${c}"/>
    </linearGradient>
    <linearGradient id="gs${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#EEF2F8"/>
    </linearGradient>
    <linearGradient id="gw${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF6EC"/><stop offset="1" stop-color="#F4E2CE"/>
    </linearGradient>
    <filter id="sd${id}" x="-40%" y="-40%" width="180%" height="190%">
      <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#5A6B85" flood-opacity=".20"/>
    </filter>
    <filter id="sb${id}" x="-40%" y="-40%" width="180%" height="190%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#5A6B85" flood-opacity=".22"/>
    </filter>
    <radialGradient id="gl${id}" cx=".5" cy=".38" r=".62">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#E7ECF4"/>
    </radialGradient>
  </defs>`;
}

const shapes = {

  /* 1. 五子棋 —— 木纹棋盘，五子连线，最后一手高亮 */
  gomoku: id => `<rect x="34" y="32" width="132" height="120" rx="14" fill="url(#gw${id})" filter="url(#sd${id})"/>
    <g stroke="#D7C0A0" stroke-width="1.4">
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<path d="M${46 + i * 13.5} 44v96M34 44h132"/>`).join('')}
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M46 ${44 + i * 13.5}h108M34 44h132"/>`).join('')}
    </g>
    <g stroke="#CDB294" stroke-width="1.4">
      <path d="M46 44v96M46 44h108M59.5 44v96M59.5 44h108M73 44v96M73 44h108M86.5 44v96M86.5 44h108M100 44v96M100 44h108M113.5 44v96M113.5 44h108M127 44v96M127 44h108M140.5 44v96M140.5 44h108M154 44v96M154 44h108"/>
    </g>
    <g stroke="#CDB294" stroke-width="1.2" stroke-linecap="round">
      <path d="M46 44v96M59.5 44v96M73 44v96M86.5 44v96M100 44v96M113.5 44v96M127 44v96M140.5 44v96M154 44v96"/>
    </g>
    <g stroke="#CDB294" stroke-width="1.2" stroke-linecap="round">
      <path d="M46 44h108M46 57.5h108M46 71h108M46 84.5h108M46 98h108M46 111.5h108M46 125h108M46 138.5h108"/>
    </g>
    <g fill="#3C4A57">
      <circle cx="73" cy="84.5" r="7.4"/><circle cx="86.5" cy="84.5" r="7.4"/>
      <circle cx="100" cy="84.5" r="7.4"/><circle cx="113.5" cy="84.5" r="7.4"/>
    </g>
    <circle cx="127" cy="84.5" r="7.4" fill="url(#g${id})" filter="url(#sb${id})"/>
    <circle cx="127" cy="84.5" r="11.6" fill="none" stroke="${PEACH[1]}" stroke-width="2" opacity=".85"/>
    <circle cx="73" cy="111.5" r="7.4" fill="url(#gd${id})" filter="url(#sb${id})"/>
    <circle cx="100" cy="57.5" r="7.4" fill="url(#gs${id})" stroke="#D7C0A0" stroke-width="1.2"/>
    <circle cx="59.5" cy="57.5" r="7.4" fill="url(#gs${id})" stroke="#D7C0A0" stroke-width="1.2"/>`,

  /* 2. 隐藏海战 —— 舰艇与海面 */
  fleet: id => `<g opacity=".95">
    <path d="M26 122q12-8 24 0t24 0t24 0t24 0t24 0" fill="none" stroke="url(#gd${id})" stroke-width="4" stroke-linecap="round" opacity=".75"/>
    <path d="M22 138q12-8 24 0t24 0t24 0t24 0t24 0" fill="none" stroke="url(#g${id})" stroke-width="4" stroke-linecap="round" opacity=".5"/>
  </g>
  <g filter="url(#sd${id})">
    <path d="M54 108h96l-14 22H70Z" fill="url(#gd${id})"/>
    <rect x="80" y="74" width="44" height="34" rx="6" fill="url(#gs${id})"/>
    <rect x="80" y="74" width="44" height="34" rx="6" fill="none" stroke="#C8D4E2" stroke-width="1.4"/>
    <rect x="88" y="83" width="11" height="9" rx="2.5" fill="#BBD4E4"/>
    <rect x="105" y="83" width="11" height="9" rx="2.5" fill="#BBD4E4"/>
  </g>
  <path d="M100 74V46" stroke="#8FA5B8" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M100 46l30 11-30 9Z" fill="url(#g${id})" filter="url(#sb${id})"/>
  <circle cx="150" cy="52" r="4.6" fill="none" stroke="${MINT[1]}" stroke-width="2.4" opacity=".85"/>
  <circle cx="150" cy="52" r="9" fill="none" stroke="${MINT[1]}" stroke-width="1.4" opacity=".45"/>
  <circle cx="150" cy="52" r="14" fill="none" stroke="${MINT[1]}" stroke-width="1.2" opacity=".22"/>`,

  /* 3. 点格夺地 —— 已占领的格子 */
  dots: id => `<g stroke="#B9C4D2" stroke-width="2.6" stroke-linecap="round">
    <path d="M46 40h108M46 90h108M46 140h108M46 40v100M100 40v100M154 40v100"/>
  </g>
  <path d="M46 40h54v50H46Z" fill="${PEACH[1]}" opacity=".26"/>
  <path d="M46 40h54v50H46Z" fill="none" stroke="${PEACH[1]}" stroke-width="2.4" opacity=".8"/>
  <path d="M100 90h54v50h-54Z" fill="${MINT[1]}" opacity=".26"/>
  <path d="M100 90h54v50h-54Z" fill="none" stroke="${MINT[1]}" stroke-width="2.4" opacity=".8"/>
  <path d="M46 90h54v50H46Z" fill="${LIL[1]}" opacity=".14"/>
  <g fill="#44586A">
    ${[46, 100, 154].flatMap(x => [40, 90, 140].map(y => `<circle cx="${x}" cy="${y}" r="4.6"/>`)).join('')}
  </g>
  <circle cx="154" cy="40" r="7" fill="url(#g${id})"/>
  <circle cx="154" cy="40" r="11.5" fill="none" stroke="${PEACH[1]}" stroke-width="1.8" opacity=".6"/>`,

  /* 4. 翻牌记忆 —— 翻开的卡与背面 */
  memory: id => `<g transform="rotate(-13 76 92)" filter="url(#sd${id})">
    <rect x="44" y="42" width="66" height="94" rx="13" fill="url(#gs${id})" stroke="#E3E9F2" stroke-width="1.4"/>
    <path d="M77 74c-20-21-31 6 7 24 32-29 16-45-7-24" fill="url(#g${id})"/>
  </g>
  <g transform="rotate(12 128 88)" filter="url(#sd${id})">
    <rect x="96" y="40" width="64" height="92" rx="13" fill="url(#gd${id})"/>
    <path d="M108 58h40M108 74h40M108 90h40M108 106h28" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".55"/>
  </g>
  <circle cx="128" cy="88" r="15" fill="#fff" opacity=".92"/>
  <path d="M128 80a8 8 0 100 16 6 6 0 110-16z" fill="url(#gd${id})"/>`,

  /* 5. 迷你冰球 —— 冰场、球拍与冰球 */
  hockey: id => `<rect x="40" y="26" width="120" height="128" rx="30" fill="url(#gl${id})" filter="url(#sd${id})"/>
    <rect x="40" y="26" width="120" height="128" rx="30" fill="none" stroke="#CFE0EA" stroke-width="2"/>
    <path d="M42 90h116" stroke="#C6D9E4" stroke-width="2" stroke-dasharray="7 7"/>
    <circle cx="100" cy="90" r="19" fill="none" stroke="#C6D9E4" stroke-width="2"/>
    <path d="M40 58h14M40 122h14M146 58h14M146 122h14" stroke="#C6D9E4" stroke-width="2" stroke-linecap="round"/>
    <g filter="url(#sb${id})"><circle cx="88" cy="56" r="15" fill="url(#g${id})"/><circle cx="113" cy="124" r="15" fill="url(#gd${id})"/></g>
    <circle cx="88" cy="56" r="6" fill="#fff" opacity=".45"/>
    <circle cx="113" cy="124" r="6" fill="#fff" opacity=".45"/>
    <g filter="url(#sb${id})"><rect x="104" y="82" width="17" height="17" rx="5" fill="#3E4C5C" transform="rotate(18 112 90)"/></g>
    <circle cx="108" cy="86" r="3.4" fill="#fff" opacity=".55"/>`,

  /* 6. 口袋坦克 —— 坦克与炮口火光 */
  tanks: id => `<g filter="url(#sd${id})">
    <rect x="50" y="86" width="98" height="44" rx="19" fill="url(#gd${id})"/>
    <rect x="46" y="90" width="20" height="50" rx="9" fill="#3F5A48"/>
    <rect x="132" y="90" width="20" height="50" rx="9" fill="#3F5A48"/>
    <rect x="76" y="72" width="46" height="42" rx="16" fill="url(#g${id})"/>
  </g>
  <path d="M99 80l30-30" stroke="#4C6B58" stroke-width="11" stroke-linecap="round"/>
  <path d="M129 50l14-14" stroke="#3C4C42" stroke-width="7" stroke-linecap="round"/>
  <g stroke="${PEACH[1]}" stroke-width="3.2" stroke-linecap="round" opacity=".95">
    <path d="M150 30l7-9M156 42l11-3M142 24l1-11"/>
  </g>
  <circle cx="149" cy="31" r="6.5" fill="${PEACH[0]}"/>
  <circle cx="149" cy="31" r="12" fill="${PEACH[0]}" opacity=".28"/>`,

  /* 7. 泡泡炸弹人 —— 炸弹角色与引信 */
  bomber: id => `<g filter="url(#sd${id})">
    <circle cx="96" cy="104" r="40" fill="url(#gd${id})"/>
    <ellipse cx="80" cy="86" rx="12" ry="8" fill="#fff" opacity=".38" transform="rotate(-28 80 86)"/>
  </g>
  <path d="M116 70l10-18q10-14 19-3" fill="none" stroke="#9A8465" stroke-width="6" stroke-linecap="round"/>
  <g stroke="${PEACH[1]}" stroke-width="3.6" stroke-linecap="round">
    <path d="M147 44l6-11M153 56l13-3M140 32l-3-10"/>
  </g>
  <circle cx="147" cy="44" r="6" fill="${PEACH[0]}"/>
  <circle cx="147" cy="44" r="12" fill="${PEACH[0]}" opacity=".3"/>
  <circle cx="84" cy="102" r="5" fill="#3C4A57"/>
  <circle cx="108" cy="102" r="5" fill="#3C4A57"/>
  <path d="M84 120q12 10 24 0" stroke="#3C4A57" stroke-width="3.4" fill="none" stroke-linecap="round"/>
  <g fill="${MINT[1]}" opacity=".85">
    <rect x="44" y="52" width="22" height="22" rx="5"/>
    <rect x="40" y="130" width="22" height="22" rx="5"/>
  </g>`,

  /* 8. 贪吃蛇竞技场 —— 蛇与果实 */
  snake: id => `<path d="M48 124h44q22 0 22-22V62q0-18 19-18h18" fill="none" stroke="url(#g${id})" stroke-width="22" stroke-linecap="round" filter="url(#sb${id})"/>
    <path d="M52 118h40q18 0 18-18V62q0-14 15-14h14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".28"/>
    <circle cx="150" cy="38" r="3.4" fill="#2F3E4A"/>
    <circle cx="158" cy="38" r="3.4" fill="#2F3E4A"/>
    <g filter="url(#sb${id})"><circle cx="58" cy="64" r="14" fill="url(#gd${id})"/></g>
    <circle cx="54" cy="60" r="3.6" fill="#fff" opacity=".6"/>
    <g filter="url(#sb${id})"><circle cx="152" cy="96" r="10" fill="url(#gp${id})"/></g>
    <path d="M152 88c0-4 6-6 8-2" stroke="#4C6B58" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M46 152h108" stroke="#D6DEE8" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,

  /* 9. 方块攻防战 —— 俄罗斯方块堆叠 */
  tetris: id => `<g filter="url(#sb${id})">
    <g fill="url(#gl${id})" stroke="#fff" stroke-width="2.4">
      <rect x="44" y="106" width="28" height="28" rx="5"/><rect x="74" y="106" width="28" height="28" rx="5"/><rect x="104" y="106" width="28" height="28" rx="5"/>
    </g>
    <rect x="104" y="76" width="28" height="28" rx="5" fill="url(#gd${id})" stroke="#fff" stroke-width="2.4"/>
    <rect x="74" y="76" width="28" height="28" rx="5" fill="url(#gd${id})" stroke="#fff" stroke-width="2.4"/>
    <rect x="44" y="76" width="28" height="28" rx="5" fill="url(#g${id})" stroke="#fff" stroke-width="2.4"/>
    <rect x="74" y="46" width="28" height="28" rx="5" fill="url(#g${id})" stroke="#fff" stroke-width="2.4"/>
    <rect x="104" y="46" width="28" height="28" rx="5" fill="url(#g${id})" stroke="#fff" stroke-width="2.4"/>
    <rect x="134" y="106" width="28" height="28" rx="5" fill="url(#g${id})" stroke="#fff" stroke-width="2.4"/>
  </g>
  <path d="M160 60l6-11M168 72l12-2M158 48l-2-11" stroke="${MINT[1]}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,

  /* 10. 弹弓城堡 —— 弹弓、抛物线与城堡 */
  slingshot: id => `<path d="M30 148h140" stroke="#CFD8E4" stroke-width="3.4" stroke-linecap="round"/>
    <g filter="url(#sd${id})">
      <path d="M54 140V74M54 100L34 76M54 100l22-24" stroke="#A8875F" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M34 76q20 34 42 0" stroke="${PEACH[1]}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
    </g>
    <circle cx="55" cy="88" r="10" fill="url(#g${id})" filter="url(#sb${id})"/>
    <path d="M64 80q56-56 100 4" fill="none" stroke="${MINT[1]}" stroke-width="2.2" stroke-dasharray="5 7" opacity=".75"/>
    <g filter="url(#sd${id})">
      <path d="M124 142V96h13v11h13V96h13v11h13V96h13v46Z" fill="url(#gl${id})" stroke="#C8D3E0" stroke-width="1.6"/>
    </g>
    <path d="M118 142h78" stroke="#C8D3E0" stroke-width="3" stroke-linecap="round"/>
    <rect x="138" y="118" width="14" height="24" rx="3" fill="${PEACH[0]}" opacity=".85"/>`,

  /* 11. 迷宫夺旗 —— 迷宫、旗帜与基地 */
  maze: id => `<g filter="url(#sd${id})">
    <rect x="34" y="30" width="132" height="122" rx="14" fill="url(#gl${id})" stroke="#D6E0EC" stroke-width="1.6"/>
  </g>
  <path d="M46 42h44v26h34V42h40v98h-40v-24H90v24H46V98h28V76H46Z" fill="none" stroke="#93B4D2" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M100 56v34" stroke="${PEACH[1]}" stroke-width="3" stroke-linecap="round"/>
  <path d="M100 56h22l-7 10 7 10h-22Z" fill="url(#g${id})" filter="url(#sb${id})"/>
  <circle cx="58" cy="126" r="9" fill="url(#gd${id})" filter="url(#sb${id})"/>
  <circle cx="58" cy="126" r="3.4" fill="#fff" opacity=".7"/>`,

  /* 12. 知识擂台 —— 灯泡与对撞的答案 */
  quiz: id => `<g filter="url(#sd${id})">
    <path d="M100 34a34 34 0 00-20 61c6 4 8 9 8 15h24c0-6 2-11 8-15a34 34 0 00-20-61Z" fill="url(#g${id})"/>
    <rect x="88" y="110" width="24" height="7" rx="3.5" fill="#B9C4D2"/>
    <rect x="92" y="119" width="16" height="7" rx="3.5" fill="#CBD5E1"/>
  </g>
  <path d="M100 52v14M76 66l9 9M124 66l-9 9" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".65"/>
  <circle cx="150" cy="44" r="9" fill="none" stroke="${MINT[1]}" stroke-width="2.6" opacity=".8"/>
  <circle cx="52" cy="46" r="6" fill="none" stroke="${LIL[1]}" stroke-width="2.4" opacity=".8"/>
  <path d="M60 126h80" stroke="#DCE3EC" stroke-width="3" stroke-linecap="round"/>`,

  /* 13. 2048 —— 数字方块 */
  g2048: id => `<g filter="url(#sb${id})">
    <rect x="40" y="34" width="56" height="56" rx="13" fill="#F6EAD4"/>
    <rect x="104" y="34" width="56" height="56" rx="13" fill="#F2D9B4"/>
    <rect x="40" y="96" width="56" height="56" rx="13" fill="#EFC38F"/>
    <rect x="104" y="96" width="56" height="56" rx="13" fill="url(#gd${id})"/>
  </g>
  <g font-family="system-ui, -apple-system, Segoe UI, sans-serif" text-anchor="middle" font-weight="800" fill="#8A7355">
    <text x="68" y="72" font-size="28">2</text>
    <text x="132" y="72" font-size="28">4</text>
    <text x="68" y="134" font-size="28">8</text>
  </g>
  <text x="132" y="132" font-size="23" font-family="system-ui, -apple-system, Segoe UI, sans-serif" text-anchor="middle" font-weight="800" fill="#fff">16</text>`,

  /* 14. 数独竞速 —— 九宫格 */
  sudoku: id => `<g filter="url(#sd${id})">
    <rect x="42" y="28" width="116" height="116" rx="13" fill="url(#gs${id})" stroke="#CBD9D2" stroke-width="1.6"/>
  </g>
  <g stroke="#DCE8E2" stroke-width="1.8">
    <path d="M80.7 28v116M119.3 28v116M42 66.7h116M42 105.3h116"/>
  </g>
  <g stroke="#9FBFB2" stroke-width="2.6">
    <path d="M42 28v116M158 28v116M42 28h116M42 144h116"/>
  </g>
  <g font-family="system-ui, -apple-system, Segoe UI, sans-serif" text-anchor="middle" font-weight="700" fill="#5B8B77">
    <text x="61" y="58" font-size="26">3</text>
    <text x="100" y="96" font-size="26">9</text>
    <text x="139" y="134" font-size="26">1</text>
    <text x="61" y="134" font-size="26">5</text>
  </g>
  <rect x="134" y="30" width="22" height="22" rx="6" fill="${MINT[0]}" opacity=".35"/>`,

  /* 15. 黑白棋 —— 棋盘与翻转 */
  reversi: id => `<g filter="url(#sd${id})">
    <rect x="40" y="30" width="120" height="120" rx="16" fill="url(#gd${id})"/>
  </g>
  <g stroke="#ffffff" stroke-width="1.6" opacity=".42">
    <path d="M40 75h120M40 105h120M85 30v120M115 30v120"/>
  </g>
  <g filter="url(#sb${id})">
    <circle cx="70" cy="58" r="17" fill="#37444F"/>
    <circle cx="130" cy="112" r="17" fill="#37444F"/>
    <circle cx="130" cy="58" r="17" fill="url(#gl${id})"/>
    <circle cx="70" cy="112" r="17" fill="url(#gl${id})"/>
  </g>
  <circle cx="66" cy="53" r="5" fill="#fff" opacity=".3"/>
  <path d="M100 42a26 26 0 010 36" fill="none" stroke="${PEACH[1]}" stroke-width="2.6" stroke-dasharray="4 5" opacity=".85"/>
  <path d="M100 78l-6-6h12Z" fill="${PEACH[1]}"/>`,

  /* 16. 石头剪刀布 —— 三种手势 */
  rps: id => `<g filter="url(#sd${id})">
    <path d="M46 138V96q0-12 11-12t11 12v42Z" fill="url(#g${id})"/>
  </g>
  <g fill="url(#g${id})" filter="url(#sb${id})">
    <rect x="50" y="78" width="9" height="30" rx="4.5"/>
    <rect x="62" y="72" width="9" height="36" rx="4.5"/>
    <rect x="74" y="80" width="9" height="28" rx="4.5"/>
  </g>
  <g filter="url(#sd${id})">
    <path d="M118 138V84q0-11 10-11t10 11v54Z" fill="url(#gd${id})"/>
  </g>
  <g fill="url(#gd${id})" filter="url(#sb${id})">
    <rect x="122" y="64" width="9" height="34" rx="4.5"/>
    <rect x="134" y="72" width="9" height="26" rx="4.5"/>
  </g>
  <path d="M136 72l14-20" stroke="url(#gd${id})" stroke-width="9" stroke-linecap="round"/>
  <g filter="url(#sd${id})">
    <path d="M96 138v-24q0-10 9-10t9 10v24Z" fill="url(#gl${id})" stroke="#C8D3E0" stroke-width="1.4"/>
  </g>
  <path d="M60 148h96" stroke="#D6DEE8" stroke-width="3" stroke-linecap="round"/>`,

  /* 17. 反应力对决 —— 信号灯与扩散波 */
  reaction: id => `<g filter="url(#sd${id})">
    <rect x="60" y="26" width="80" height="34" rx="17" fill="url(#gl${id})" stroke="#D6DEE8" stroke-width="1.6"/>
  </g>
  <circle cx="100" cy="43" r="12" fill="url(#g${id})"/>
  <circle cx="100" cy="43" r="5" fill="#fff" opacity=".6"/>
  <g fill="none" stroke="${PEACH[1]}" stroke-linecap="round">
    <path d="M74 82a38 38 0 0152 0" stroke-width="3" opacity=".85"/>
    <path d="M64 100a52 52 0 0172 0" stroke-width="2.4" opacity=".55"/>
    <path d="M54 118a66 66 0 0192 0" stroke-width="2" opacity=".3"/>
  </g>
  <circle cx="100" cy="124" r="9" fill="url(#gd${id})" filter="url(#sb${id})"/>
  <path d="M100 96v14" stroke="#3E4C5C" stroke-width="5" stroke-linecap="round"/>`,

  /* 18. 扫雷竞速 —— 雷区与插旗 */
  mines: id => `<g filter="url(#sd${id})">
    <rect x="38" y="30" width="124" height="124" rx="15" fill="#F1F4E9" stroke="#CBD4B4" stroke-width="1.6"/>
  </g>
  <g stroke="#CBD4B4" stroke-width="1.6">
    <path d="M79.3 30v124M120.7 30v124M38 71.3h124M38 112.7h124"/>
  </g>
  <rect x="84" y="76" width="32" height="32" rx="6" fill="#E3EAD2"/>
  <text x="100" y="99" font-size="24" font-family="system-ui, -apple-system, Segoe UI, sans-serif" text-anchor="middle" font-weight="700" fill="#6E9A8E">2</text>
  <g filter="url(#sb${id})">
    <path d="M142 104V46" stroke="#8A93A8" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M142 46l-24 10 24 11Z" fill="url(#g${id})"/>
  </g>
  <circle cx="142" cy="104" r="3.4" fill="#8A93A8"/>`,

  /* 19. 打字竞速 —— 键盘与光标 */
  typing: id => `<g filter="url(#sd${id})">
    <rect x="34" y="52" width="132" height="82" rx="16" fill="url(#gl${id})" stroke="#D3DCE8" stroke-width="1.6"/>
  </g>
  <g fill="#C3CEDC">
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<rect x="${44 + (i % 5) * 24}" y="${62 + Math.floor(i / 5) * 19}" width="19" height="14" rx="4"/>`).join('')}
  </g>
  <rect x="44" y="100" width="132" height="24" rx="7" fill="#E8EDF4"/>
  <rect x="82" y="100" width="56" height="24" rx="7" fill="url(#gd${id})"/>
  <g filter="url(#sb${id})">
    <rect x="86" y="24" width="30" height="26" rx="7" fill="url(#g${id})"/>
  </g>
  <path d="M101 30v14" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>
  <path d="M96 39h10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>
  <path d="M158 100v14" stroke="${MINT[1]}" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>`,

  /* 20. 节奏记忆 —— 四色音板 */
  simon: id => `<g filter="url(#sd${id})">
    <rect x="34" y="32" width="132" height="120" rx="22" fill="url(#gl${id})" stroke="#DCE3EC" stroke-width="1.6"/>
  </g>
  <g filter="url(#sb${id})">
    <rect x="48" y="46" width="50" height="42" rx="12" fill="url(#g${id})"/>
    <rect x="106" y="46" width="50" height="42" rx="12" fill="url(#gd${id})"/>
    <rect x="48" y="96" width="50" height="42" rx="12" fill="url(#gp${id})"/>
    <rect x="106" y="96" width="50" height="42" rx="12" fill="url(#gl${id})"/>
  </g>
  <circle cx="131" cy="67" r="26" fill="none" stroke="${MINT[1]}" stroke-width="2.4" opacity=".5"/>
  <circle cx="131" cy="67" r="34" fill="none" stroke="${MINT[1]}" stroke-width="1.6" opacity=".25"/>
  <path d="M64 78v-18l10 12 10-12v18" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
  <circle cx="73" cy="117" r="9" fill="#fff" opacity=".8"/>`,
};

/* 蛇的果实渐变（绿色系） */
const extraDefs = id => `<defs><linearGradient id="gp${id}" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#7ED6A0"/><stop offset="1" stop-color="#3E9E6B"/>
</linearGradient></defs>`;

const palettes = {
  gomoku: [PEACH[1], PEACH[2], '#C9A277'],
  fleet: ['#8FC7E8', '#4E8FB8', '#2F6A90'],
  dots: [PEACH[1], PEACH[2], '#C05A44'],
  memory: ['#F7A8BC', '#E87C9C', '#C65C7E'],
  hockey: ['#7FD5DD', '#3FB4C0', '#2A8E9A'],
  tanks: ['#9CC7A8', '#5E9A76', '#3F7355'],
  bomber: ['#F2C182', '#DDA057', '#B87C36'],
  snake: [MINT[1], MINT[2], '#0B7A5F'],
  tetris: [LIL[1], LIL[2], '#6450CC'],
  slingshot: [PEACH[1], PEACH[2], '#C85B45'],
  maze: ['#8FB6DE', '#5C8DBE', '#3E6E9C'],
  quiz: [LIL[1], LIL[2], '#5F4CC4'],
  g2048: ['#EFC38F', '#D79A5C', '#B87A3E'],
  sudoku: [MINT[1], MINT[2], '#0B7A5F'],
  reversi: ['#8A9AAB', '#5C6B7C', '#3A4654'],
  rps: [PEACH[1], PEACH[2], '#C05A44'],
  reaction: [PEACH[1], PEACH[2], '#C05A44'],
  mines: ['#B9C98A', '#93A868', '#71854B'],
  typing: ['#8FB6DE', '#5C8DBE', '#3E6E9C'],
  simon: [LIL[1], LIL[2], '#6450CC'],
};

export function gameArt(game) {
  const id = game.id;
  const pal = palettes[id] || [game.color, game.color, game.color];
  const build = shapes[id];
  const body = build
    ? build(id)
    : `<rect x="50" y="38" width="100" height="106" rx="26" fill="url(#gs${id})" filter="url(#sd${id})"/>
       <text x="100" y="112" font-size="62" font-family="system-ui, -apple-system, Segoe UI, sans-serif" text-anchor="middle" font-weight="700" fill="url(#g${id})">${game.icon}</text>
       <circle cx="156" cy="48" r="9" fill="url(#g${id})" opacity=".6"/>`;
  return `<svg aria-hidden="true" viewBox="0 22 200 142" role="presentation">
    ${defs(id, pal[0], pal[1], pal[2])}${extraDefs(id)}
    <ellipse cx="100" cy="155" rx="58" ry="7" fill="${pal[1]}" opacity=".16"/>
    ${body}
  </svg>`;
}

/* —— 主视觉 —— */
export const heroArt = `<svg viewBox="0 0 460 268" aria-hidden="true" role="presentation">
  <defs>
    <linearGradient id="hTileA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EDF1F7"/></linearGradient>
    <linearGradient id="hTileB" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#FFC7B6"/><stop offset="1" stop-color="#FF8B77"/></linearGradient>
    <linearGradient id="hTileC" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#9FEBD8"/><stop offset="1" stop-color="#31C1A0"/></linearGradient>
    <linearGradient id="hTileD" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#C6BCFA"/><stop offset="1" stop-color="#8E7BEE"/></linearGradient>
    <filter id="hSd" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="10" stdDeviation="11" flood-color="#6C7C96" flood-opacity=".20"/></filter>
    <filter id="hSd2" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#6C7C96" flood-opacity=".18"/></filter>
  </defs>

  <!-- 2048 方块塔 -->
  <g transform="translate(268 12) rotate(9 76 76)" filter="url(#hSd)">
    <rect width="152" height="152" rx="30" fill="url(#hTileA)"/>
    <rect x="13" y="13" width="58" height="58" rx="14" fill="#FFF4E4"/>
    <rect x="81" y="13" width="58" height="58" rx="14" fill="#FDE7CE"/>
    <rect x="13" y="81" width="58" height="58" rx="14" fill="url(#hTileC)"/>
    <rect x="81" y="81" width="58" height="58" rx="14" fill="url(#hTileB)"/>
    <g font-family="system-ui, -apple-system, Segoe UI, sans-serif" text-anchor="middle" font-weight="800" fill="#8E7A5C">
      <text x="42" y="52" font-size="30">2</text>
      <text x="110" y="52" font-size="30">4</text>
    </g>
    <text x="42" y="120" font-size="30" font-family="system-ui, -apple-system, Segoe UI, sans-serif" text-anchor="middle" font-weight="800" fill="#fff">8</text>
    <text x="110" y="120" font-size="23" font-family="system-ui, -apple-system, Segoe UI, sans-serif" text-anchor="middle" font-weight="800" fill="#fff">16</text>
  </g>

  <!-- 棋盘与棋子 -->
  <g transform="translate(46 74) rotate(-11 78 68)" filter="url(#hSd)">
    <rect width="156" height="136" rx="24" fill="#FFFDF8" stroke="#EDE3D2" stroke-width="1.6"/>
    <g stroke="#E4DAC6" stroke-width="1.6">
      <path d="M20 22h116M20 46h116M20 70h116M20 94h116M20 118h116"/>
      <path d="M20 22v96M43 22v96M66 22v96M89 22v96M112 22v96M135 22v96"/>
    </g>
    <circle cx="43" cy="46" r="10" fill="#3B4956"/>
    <circle cx="66" cy="70" r="10" fill="#3B4956"/>
    <circle cx="89" cy="94" r="10" fill="url(#hTileC)"/>
    <circle cx="112" cy="46" r="10" fill="url(#hTileA)" stroke="#DCD2BF" stroke-width="1.2"/>
    <circle cx="89" cy="46" r="10" fill="url(#hTileB)" filter="url(#hSd2)"/>
    <circle cx="89" cy="46" r="15" fill="none" stroke="#FF8B77" stroke-width="2" opacity=".8"/>
  </g>

  <!-- 骰子 -->
  <g transform="translate(318 168) rotate(16 42 40)" filter="url(#hSd)">
    <rect width="84" height="80" rx="22" fill="url(#hTileB)"/>
    <g fill="#fff">
      <circle cx="24" cy="24" r="5.4"/><circle cx="60" cy="24" r="5.4"/>
      <circle cx="42" cy="40" r="5.4"/>
      <circle cx="24" cy="56" r="5.4"/><circle cx="60" cy="56" r="5.4"/>
    </g>
  </g>

  <!-- 星星与光点 -->
  <path d="M196 26l5.4 12.6L214 44l-12.6 5.4L196 62l-5.4-12.6L178 44l12.6-5.4Z" fill="#F0BE7A" opacity=".9"/>
  <path d="M392 56l4 9.4 9.4 4-9.4 4-4 9.4-4-9.4-9.4-4 9.4-4Z" fill="#7ED9C0" opacity=".9"/>
  <path d="M262 236l3.4 8 8 3.4-8 3.4-3.4 8-3.4-8-8-3.4 8-3.4Z" fill="#B7ABF5" opacity=".85"/>
  <circle cx="120" cy="38" r="7" fill="#FFC9B8" opacity=".75"/>
  <circle cx="432" cy="150" r="5" fill="#9A8BEE" opacity=".55"/>
  <circle cx="246" cy="196" r="4.6" fill="#7ED9C0" opacity=".6"/>
  <circle cx="60" cy="226" r="4" fill="#FFC9B8" opacity=".6"/>
</svg>`;
