import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintConfigPrettier from 'eslint-config-prettier';
import filenamesSimple from 'eslint-plugin-filenames-simple';
import { globalIgnores } from 'eslint/config';

// Same compatibility shim as plugins/wazuh-core/eslint.config.mjs: the
// filenames-simple plugin still calls context.getFilename(), removed in
// recent ESLint versions.
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
  // Lint the plugin source (common/public/server), including its colocated
  // *.test.ts unit tests. eval/*.js, eval/*.mjs, eval/*.py and eval/*.json are
  // the zero-dependency integration/measurement harness (plain Node JS/Python,
  // its own style, no TypeScript there) and scripts/ + test/jest are
  // platform-convention shims copied from the sibling plugins.
  globalIgnores([
    'node_modules/',
    'build/',
    'target/',
    'eval/*.js',
    'eval/*.mjs',
    'eval/*.py',
    'eval/*.json',
    'scripts/',
    'test/',
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
        version: '18.2.0',
      },
    },
    rules: {
      // React
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Naming. Deviation from wazuh-core: property names are exempt from
      // camelcase because this plugin implements snake_case wire contracts it
      // does not control — LLM tool-calling schemas (tool names/params like
      // search_wazuh_data, agent_identifier), provider wire fields
      // (tool_choice, parallel_tool_calls), and OpenSearch DSL/document
      // fields (track_total_hits, wazuh.rule.mitre.technique.id). Local variables and
      // declarations stay camelCase-enforced.
      'filenames-simple/naming-convention': 'error',
      camelcase: ['error', { properties: 'never', ignoreDestructuring: true }],

      // TS components: prop shapes come from TypeScript, not PropTypes.
      'react/prop-types': 'off',

      // OSD plugin convention: Setup/Start contracts start as empty
      // interfaces (see every sibling plugin's types.ts) and grow later.
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'always' },
      ],

      // Underscore prefix marks intentionally unused parameters kept for
      // interface conformance (e.g. adapter methods, OSD lifecycle hooks).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Best practices
      'spaced-comment': 'error',
      'no-duplicate-imports': 'error',
      'no-await-in-loop': 'error',
      // Deviation from wazuh-core: `functions: false` — hoisted function
      // declarations are safe to reference before their definition, and this
      // codebase deliberately orders files public-API-first with helpers
      // below (plus mutually recursive validators in schema-validator.ts).
      'no-use-before-define': [
        'error',
        {
          functions: false,
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
