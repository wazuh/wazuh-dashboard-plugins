import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintConfigPrettier from 'eslint-config-prettier';
import filenamesSimple from 'eslint-plugin-filenames-simple';

const createFilenameProxy = context => {
  if (typeof context.getFilename === 'function') {
    return context;
  }
  const fallbackPath = context.filename ?? '';
  return new Proxy(context, {
    get(target, property, receiver) {
      if (property === 'getFilename') {
        return () => fallbackPath;
      }
      return Reflect.get(target, property, receiver);
    },
  });
};

const createFilenamesSimplePlugin = plugin => {
  const namingRule = plugin.rules?.['naming-convention'];
  if (!namingRule) {
    return plugin;
  }
  return {
    ...plugin,
    rules: {
      ...plugin.rules,
      'naming-convention': {
        ...namingRule,
        create(context) {
          return namingRule.create(createFilenameProxy(context));
        },
      },
    },
  };
};

const filenamesSimplePlugin = createFilenamesSimplePlugin(filenamesSimple);

export default defineConfig([
  // Global ignores (replaces .eslintignore and ignorePatterns)
  globalIgnores([
    'node_modules/',
    'build/',
    'target/',
    'public/utils/codemirror/',
    'public/kibana-integrations/',
  ]),

  // Base recommended config
  js.configs.recommended,

  // TypeScript recommended config
  tseslint.configs.recommended,

  // React recommended config (flat config format)
  react.configs.flat.recommended,

  // Prettier - disables formatting rules that conflict with Prettier.
  // Must be last among the "extends" to properly override.
  eslintConfigPrettier,

  // Project configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'filenames-simple': filenamesSimplePlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    settings: {
      react: {
        version: '16.14.0',
      },
    },
    rules: {
      // React
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Naming
      'filenames-simple/naming-convention': 'error',
      camelcase: 'error',

      // Best practices
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
    },
  },
]);
