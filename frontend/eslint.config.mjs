import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
