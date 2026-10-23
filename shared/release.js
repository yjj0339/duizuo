export const release={version:'3.1.0',id:'navigation-v6',date:'2026-10-23',title:'进得去，也回得来',highlights:[
 '32 款游戏共用常驻返回栏与分层菜单，支持浏览器返回和 Esc。',
 '单人及同屏进度按游戏保存；返回游乐场、刷新后都能继续。',
 '联机可暂离回房间，保留对局 3 分钟；继续按钮带你回到原局。',
 '菜单与规则页隔离操作并暂停对局，认输和重新开始需要明确确认。',
 '新增版本说明与更新检查，有新版本时由你决定何时更新。'
]};
export function isNewerRelease(candidate,current=release.version){
 const valid=v=>typeof v==='string'&&/^\d+\.\d+\.\d+$/.test(v);
 if(!valid(candidate?.version)||!valid(current))return false;
 const a=candidate.version.split('.').map(Number),b=current.split('.').map(Number);
 for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;
}
