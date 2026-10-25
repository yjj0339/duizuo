export const release={
 "version": "3.4.0",
 "id": "mobile-v9",
 "date": "2026-10-26",
 "title": "把画面，还给游戏",
 "highlights": [
  "横竖屏直接开玩，取消强制横屏拦截和自动方向锁定；旋转手机不中断同一场对局。",
  "羽毛球改为画面内的移动摇杆、击球、起跳；乒乓球保留移动、回击、挑高，台球保留力度与击球。",
  "立体球场按可用宽高重新取景，两侧刘海、底部手势区域和场内按键各留位置；画面不再被横屏压矮裁切。",
  "松开摇杆就在当前位置停步；暂停清除按住与待发击球，避免回来后继续走或误挥拍。",
  "32 款统一使用轻量比分和返回菜单；球路、画质、技巧观察收进菜单，练习换人、撤销仍可使用。",
  "海战布阵、翻牌、数独、方块、扫雷和拿豆等按横竖屏分别排布；动作游戏的控制区并入场地外框。",
  "保留单人 AI、独立存档、双通道联机及 3 分钟暂离保护；手机默认流畅画质。"
 ]
};
export function isNewerRelease(candidate,current=release.version){
 const valid=v=>typeof v==='string'&&/^\d+\.\d+\.\d+$/.test(v);
 if(!valid(candidate?.version)||!valid(current))return false;
 const a=candidate.version.split('.').map(Number),b=current.split('.').map(Number);
 for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;
}
