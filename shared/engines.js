import {games as board} from '../games/board-engines.js';
import {games as puzzle} from '../games/puzzle-engines.js';
import {games as arcade} from '../games/arcade-engines.js';
export const engines={...board,...puzzle,...arcade};
