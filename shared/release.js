export const release={
 "version": "3.3.0",
 "id": "dimension-v8",
 "date": "2026-10-25",
 "title": "横过来，认真打一场",
 "highlights": [
  "羽毛球、乒乓球、台球升级固定视角的立体球场，人物关节、球拍、球网和球台都有真实厚度。",
  "羽毛球常用操作简化为移动、击球、起跳；高球自动扣杀，球路与落点收进进阶面板。",
  "手机横屏优先，球场铺满可用空间；竖屏等待与调整进阶设置时保护暂停，返回与菜单始终可用。",
  "手机默认流畅画质，可切换精细模式；按显示尺寸分配分辨率，退出游戏释放图形资源。",
  "触屏瞄准与物理坐标统一；修正入袋球动画、球号对应和暂停后的击球动作。",
  "保留 32 款游戏、单人 AI、独立存档以及双通道联机与 3 分钟暂离保护。"
 ]
};
export function isNewerRelease(candidate,current=release.version){
 const valid=v=>typeof v==='string'&&/^\d+\.\d+\.\d+$/.test(v);
 if(!valid(candidate?.version)||!valid(current))return false;
 const a=candidate.version.split('.').map(Number),b=current.split('.').map(Number);
 for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;
}
