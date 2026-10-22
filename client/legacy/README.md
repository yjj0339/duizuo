# 旧项目复用

- `gomoku/ai-core.js`、`ai-client.js`、`ai.worker.js` 来自用户的 Aurora Gomoku，GPL-3.0。与 `public/rapfi-worker.js`、`public/engine/` 一起提供 Rapfi / 官方 mix9svq NNUE。上游版本、作者与模型来源见 `public/engine/SOURCE.md`。引擎仅接收本地公开棋盘。首次启用大师五子棋需下载约 11 MB 资源。
- `mint/` 来自用户的 MINT 1024，保留 MIT 来源说明。复用带缓存、行评估和概率剪枝的 Expectimax，不读取比赛随机种子。
- `sudoku/engine.js` 来自用户的 Sudoku Atelier。保留原逻辑核心，将 UMD 出口转换为 ESM 导出；用于候选、笔记和解释式提示，提示只在自由练习启用。
- 本合集按根目录 GPL-3.0 发布，保留原第三方许可。完整对应源码随本仓库提供；旧项目、旧存档均不修改。
