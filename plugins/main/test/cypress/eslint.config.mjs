import { defineConfig, globalIgnores } from 'eslint/config';
import cypress from 'eslint-plugin-cypress';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(['**/node_modules/']),
  {
    extends: compat.extends('plugin:cypress/recommended'),

    plugins: {
      cypress,
    },

    languageOptions: {
      globals: {
        ...cypress.environments.globals.globals,
      },
    },

    rules: {
      'cypress/no-assigning-return-values': 'error',
      'cypress/no-unnecessary-waiting': 'error',
      'cypress/assertion-before-screenshot': 'warn',
      'cypress/no-force': 'warn',
      'cypress/no-async-tests': 'error',
    },
  },
]);
