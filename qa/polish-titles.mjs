import { readFileSync, writeFileSync } from 'node:fs';
const edits = [
  ['README.md', '# DUIZUO · 面对面的小游戏', '# 对座 DUIZUO · 面对面的小游戏'],
  ['docs/制作提示词.md', '名称为「DUIZUO · 面对面的小游戏」', '名称为「对座 DUIZUO · 面对面的小游戏」'],
  ['docs/项目说明.md', '# DUIZUO · 项目说明', '# 对座 DUIZUO · 项目说明'],
  ['docs/验收记录.md', '# DUIZUO 验收记录', '# 对座 DUIZUO 验收记录'],
  ['docs/VISUAL-SPEC.md', 'DUIZUO · 视觉规范', '对座 DUIZUO · 视觉规范'],
  ['docs/制作提示词.md', '# DUIZUO 面对面的小游戏：完整制作提示词', '# 对座 DUIZUO · 面对面的小游戏：完整制作提示词'],
  ['AGENTS.md', '# DUIZUO workspace', '# 对座 DUIZUO workspace'],
];
for (const [f, from, to] of edits) {
  const t = readFileSync(f, 'utf8');
  if (!t.includes(from)) { console.log('跳过(未找到): ' + f + '  ' + from); continue; }
  writeFileSync(f, t.split(from).join(to), 'utf8');
  console.log('✔ ' + f);
}
