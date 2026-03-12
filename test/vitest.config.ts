import { join } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: [
      { find: '~test', replacement: join(__dirname, './src') },
      { find: /^tosdk$/, replacement: join(__dirname, '../src/index.ts') },
      { find: /^tosdk\/accounts$/, replacement: join(__dirname, '../src/accounts/index.ts') },
      { find: /^tosdk\/chains$/, replacement: join(__dirname, '../src/chains/index.ts') },
      { find: /^tosdk\/clients$/, replacement: join(__dirname, '../src/clients/index.ts') },
      { find: /^tosdk\/transports$/, replacement: join(__dirname, '../src/transports/index.ts') },
      { find: /^tosdk\/surfaces$/, replacement: join(__dirname, '../src/surfaces/index.ts') },
      { find: /^tosdk\/schema$/, replacement: join(__dirname, '../src/schema/index.ts') },
    ],
    include: ['test/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    retry: 0,
  },
})
