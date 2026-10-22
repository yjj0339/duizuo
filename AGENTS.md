# DUIZUO workspace

- All project execution, executable runtimes, dependencies, downloads, browser profiles, caches, temporary files and logs must live on D:. Use `D:/codexAI/.toolchains/emsdk/node/24.19.0_64bit/node.exe`, never the C: Node installation.
- Shared workspace: only edit the files explicitly assigned to you. Do not undo other work or dispatch child agents.
- Read `docs/CONTRACT.md` before implementing game modules. Keep server rules authoritative; never accept client scores, clocks or winners.
- Write meaningful engine tests first, observe failure, implement and verify. Use the D: Node executable to run `--test`.
- Do not publish, commit, alter global settings or install dependencies from worker tasks. The project owner handles integration and deployment.
