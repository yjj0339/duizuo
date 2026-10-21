import { io } from 'socket.io-client';

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitFor(predicate, timeout = 8000, label = 'condition') {
  const started = performance.now();
  while (performance.now() - started < timeout) {
    const value = await predicate();
    if (value) return value;
    await delay(15);
  }
  throw new Error(`等待超时：${label}`);
}

export class DuoClient {
  constructor(url, name) {
    this.name = name;
    this.seq = 1;
    this.snapshot = null;
    this.errors = [];
    this.pending = null;
    this.socket = io(url, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      timeout: 4000,
    });
    this.socket.on('snapshot', snapshot => {
      this.snapshot = snapshot;
    });
    this.socket.on('connect_error', error => {
      this.errors.push(error.message);
    });
  }

  connected() {
    return this.socket.connected;
  }

  request(event, payload = {}) {
    return new Promise(resolve => {
      this.socket.timeout(4000).emit(event, payload, (error, response) => {
        if (error) resolve({ ok: false, message: 'timeout', code: 'TIMEOUT' });
        else resolve(response || { ok: false, message: 'empty response' });
      });
    });
  }

  async action(action) {
    const seq = this.seq++;
    return this.request('action', { seq, action });
  }

  tryAction(action) {
    if (this.pending) return;
    this.pending = this.action(action).then(result => {
      this.pending = null;
      return result;
    });
  }

  async create(name = this.name, gameId = 'gomoku') {
    const result = await this.request('create', { name, gameId });
    if (result.ok) this.identity = result;
    return result;
  }

  async join(code, name = this.name) {
    const result = await this.request('join', { code, name });
    if (result.ok) this.identity = result;
    return result;
  }

  async ready(ready = true) {
    return this.request('ready', { ready });
  }

  async resume(token) {
    const result = await this.request('resume', { token });
    if (result.ok) {
      this.identity = result;
      this.seq = result.nextSeq;
    }
    return result;
  }

  close() {
    this.socket.removeAllListeners();
    this.socket.disconnect();
  }
}