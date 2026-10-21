import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 600 },
  publicDir: 'public',
  resolve: {
    // 服务端正式题库（含答案）只留在 Node 侧。
    // 浏览器打包时改用 client/trivia.js 的本地演示题库，
    // 保证正式题库的答案不会出现在任何前端产物里。
    alias: [
      {
        find: /^\.\.\/shared\/trivia\.js$/,
        replacement: resolve(root, 'client/trivia.js'),
      },
    ],
  },
});
