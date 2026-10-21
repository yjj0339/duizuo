# Shared engine and renderer contract

All functions are ES modules. Exact game IDs: gomoku, fleet, dots, memory, hockey, tanks, bomber, snake, tetris, slingshot, maze, quiz, g2048, sudoku, reversi, rps, reaction, mines, typing, simon.

## Engine

Each group file `games/<group>-engines.js` exports `games`, an object mapping its game IDs to engine objects:

```js
create(seed, now) => state
action(state, player, action, now) => boolean // mutate, return true iff accepted
tick(state, dtSeconds, now) => void // optional; called at 30 Hz
view(state, player) => plain JSON object // clone/filter private information
```

player is exactly 0 or 1. now is server wall time in milliseconds (injected in tests). seed is a positive uint32. All states contain `{ status:'playing'|'finished', winner:null|0|1|-1, scores:[number,number], message:string }`. `-1` means a draw. Add `turn:0|1` for turn-based games and `endsAt:number` for timed ones. Game engines handle their own timeouts and update winner/status. State must be JSON serializable and every view must include common state fields. Never expose random seeds that reveal hidden state, unopened mine/ship/memory positions, quiz answers or sudoku solutions. `action` must reject illegal/non-finite/out-of-range data without throwing; action shape is an object with `type` plus relevant properties. Unknown action returns false. Tick ignores finished states. Use deterministic per-state PRNG, no real timers in engine modules. UI and server imports must have no Node-specific code in game modules.

## Renderer

Each group file `games/<group>-views.js` exports `renderers`, mapping each game ID to a mount function:

```js
(root, send, context) => ({ update(view), destroy() })
```

context `{ player:0|1, colors:['#ee827f','#40ae9a'], feedback(kind), reducedMotion:boolean }`. send(action) sends the player's input; no client scores. `root` is a DOM element owned by the renderer. Mount once, call update for snapshots (up to 15 Hz), destroy on exit. Preserve focus, IME composition, sliders and pointer capture during updates; don't rebuild the root every snapshot. Clean up ALL window listeners, intervals and animation frames on destroy. UI needs touch/mouse/keyboard equivalents; use textContent for server strings; never interpolate nicknames or user input into HTML.

Shared CSS classes supplied by app: `.game-surface`, `.game-note`, `.game-toolbar`, `.game-button`, `.game-button.primary`, `.game-button.secondary`, `.game-button.active`, `.game-grid`, `.game-cell`, `.game-score`, `.game-columns`, `.game-panel`, `.game-input`, `.touch-controls`, `.dpad`, `.action-pad`, `.player-0`, `.player-1`. Each group may add its own namespaced CSS in `games/<group>.css`; root imports it. Prefer DOM buttons for puzzles/grids. Canvas display scale must be responsive with pointer coordinates mapped through getBoundingClientRect; canvas has an accessible label. Direction keys must not scroll while playing, but typing inputs must retain normal keyboard behavior. Touch controls >=42px.

## Group ownership

- board: gomoku, fleet, dots, memory, reversi, rps, mines. Own `games/board-engines.js`, `games/board-views.js`, `games/board.css`, `tests/board.test.js`.
- puzzle: g2048, sudoku, quiz, reaction, typing, simon, tetris. Own `games/puzzle-engines.js`, `games/puzzle-views.js`, `games/puzzle.css`, `tests/puzzle.test.js`.
- arcade: hockey, tanks, bomber, snake, slingshot, maze. Own `games/arcade-engines.js`, `games/arcade-views.js`, `games/arcade.css`, `tests/arcade.test.js`.
- owner: catalog, frontend shell, room/protocol server, launchers, deployment, integration tests and final QA.

## Testing and product finish

Create meaningful node:test tests FIRST and observe red before code. Test authoritative rules and legal/illegal actions, timeouts, win/draw transitions, and hidden information where applicable. Every module should support an actual start-to-finish match, not just a lobby screen. Include helpful rule and control hints in each view. Record per-game action shapes and acceptance tests in a group report in `docs/<group>-report.md`. No worker publishes or commits. Use only D: executables and caches.
