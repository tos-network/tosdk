import { join } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: [
      { find: '~test', replacement: join(__dirname, './src') },
      { find: /^tosdk$/, replacement: join(__dirname, '../src/index.ts') },
      { find: /^tosdk\/accounts$/, replacement: join(__dirname, '../src/accounts/index.ts') },
      { find: /^tosdk\/chains$/, replacement: join(__dirname, '../src/chains/index.ts') },
    ],
    include: ['test/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/_esm/**', '**/_cjs/**', '**/_types/**'],
    retry: 0,
  },
})
