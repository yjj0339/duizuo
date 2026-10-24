export const release={version:'3.2.0',id:'gameplay-v7',date:'2026-10-24',title:'每一拍，都有讲究',highlights:[
 '羽毛球重做跳跃触球、落点弧线、冲刺体力与预测接球 AI；动作对应真实击球位置。',
 '乒乓球加入发球先落己方台、上下旋弹跳差异、击球高度限制和回合记录。',
 '台球加入拉杆／顺杆白球走位，补齐碰库犯规与明确的判罚原因。',
 '方块对战新增暂存换块、连续消行加成与障碍抵消反馈。',
 '32 款游戏各有进阶手册、实时局势观察和训练目标；棋类练习可显示战术标记。',
 '修复暂停恢复后的跳跃判定与按键残留，保留分层菜单、独立存档和 3 分钟联机保护。'
]};
export function isNewerRelease(candidate,current=release.version){
 const valid=v=>typeof v==='string'&&/^\d+\.\d+\.\d+$/.test(v);
 if(!valid(candidate?.version)||!valid(current))return false;
 const a=candidate.version.split('.').map(Number),b=current.split('.').map(Number);
 for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;
}
