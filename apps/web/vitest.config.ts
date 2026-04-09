import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir),
    },
  },
  test: {
    environmentMatchGlobs: [['app/**/*.test.tsx', 'jsdom']],
    environment: 'node',
    include: [
      'app/**/*.test.ts',
      'app/**/*.test.tsx',
      'lib/**/*.test.ts',
      'lib/**/*.test.tsx',
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
})
