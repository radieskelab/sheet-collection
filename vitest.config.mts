import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@adapters': fileURLToPath(new URL('./src/adapters', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@interfaces': fileURLToPath(new URL('./src/interfaces', import.meta.url)),
      '@mappers': fileURLToPath(new URL('./src/mappers', import.meta.url)),
      '@sources': fileURLToPath(new URL('./src/sources', import.meta.url)),
      '@shared-types': fileURLToPath(new URL('./src/types', import.meta.url))
    }
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 90,
        lines: 80
      }
    }
  }
});
