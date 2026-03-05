import { defineConfig, globalIgnores } from 'eslint/config';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import filenamesSimple from 'eslint-plugin-filenames-simple';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
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
  globalIgnores([
    '**/node_modules/',
    'public/utils/codemirror/',
    'public/kibana-integrations/',
  ]),
  {
    extends: compat.extends(
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier',
    ),

    plugins: {
      react,
      'react-hooks': fixupPluginRules(reactHooks),
      '@typescript-eslint': typescriptEslint,
      prettier,
      'filenames-simple': filenamesSimple,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      'import/resolver': {
        typescript: {},
      },

      react: {
        version: '16.14.0',
      },
    },

    rules: {
      'filenames-simple/naming-convention': 'error',

      indent: [
        'error',
        2,
        {
          SwitchCase: 1,
        },
      ],

      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'react/react-in-jsx-scope': 'off',
      camelcase: 'error',
      'spaced-comment': 'error',
      'no-duplicate-imports': 'error',
      'no-await-in-loop': 'error',

      'no-use-before-define': [
        'error',
        {
          functions: true,
          classes: true,
          variables: true,
          allowNamedExports: false,
        },
      ],

      'block-scoped-var': 'error',
      curly: 'error',
      'default-case': 'error',
      'default-param-last': 'error',
      eqeqeq: 'error',
      'no-var': 'error',
      'require-await': 'error',
      'array-bracket-newline': ['error', 'consistent'],

      'array-bracket-spacing': [
        'error',
        'always',
        {
          singleValue: false,
        },
      ],

      'array-element-newline': ['error', 'always'],
      'arrow-parens': ['error', 'as-needed'],
      'arrow-spacing': 'error',
      'block-spacing': 'error',

      'comma-spacing': [
        'error',
        {
          before: false,
          after: true,
        },
      ],

      'func-call-spacing': ['error', 'never'],
      'function-call-argument-newline': ['error', 'consistent'],

      'max-len': [
        'error',
        {
          code: 100,
        },
      ],

      'no-trailing-spaces': 'error',
      'semi-spacing': 'error',
    },
  },
]);
