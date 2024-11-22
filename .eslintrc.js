module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
    react: {
      version: '16.14.0',
    },
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
    'unicorn',
    'sort-class-members',
    'prettier',
    '@stylistic',
  ],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/strict',
    'plugin:@typescript-eslint/stylistic',
    // https://github.com/sindresorhus/eslint-plugin-unicorn?tab=readme-ov-file#rules
    'plugin:unicorn/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@stylistic/spaced-comment': ['error', 'always'],
    camelcase: 'error',
    'no-use-before-define': [
      'error',
      {
        functions: true,
        classes: true,
        variables: true,
        allowNamedExports: false,
      },
    ],
    'no-await-in-loop': 'error',
    'no-duplicate-imports': 'error',
    curly: 'error',
    'block-scoped-var': 'error',
    'default-case': 'error',
    'default-case-last': 'error',
    'default-param-last': 'error',
    eqeqeq: ['error', 'always'],
    'no-var': 'error',
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/custom-error-definition.md
    'unicorn/custom-error-definition': 'error',
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/better-regex.md
    'unicorn/better-regex': 'error',
    'unicorn/no-null': 'off',
    'unicorn/text-encoding-identifier-case': 'off',
    'unicorn/prevent-abbreviations': [
      'error',
      {
        extendDefaultReplacements: false,
        replacements: {
          e: {
            error: true,
          },
          err: {
            error: true,
          },
        },
      },
    ],
    // https://github.com/bryanrsmith/eslint-plugin-sort-class-members?tab=readme-ov-file#configuration
    'sort-class-members/sort-class-members': [
      'error',
      {
        order: [
          '[static-public-properties]',
          '[static-protected-properties]',
          '[static-private-properties]',
          '[public-properties]',
          '[protected-properties]',
          '[private-properties]',
          'constructor',
          '[accessor-pairs]',
          '[static-public-method]',
          '[static-protected-method]',
          '[static-private-method]',
          '[public-method]',
          '[protected-method]',
          '[private-method]',
          '[everything-else]',
        ],
        groups: {
          'static-public-properties': [
            { static: true, type: 'property', accessibility: 'public' },
          ],
          'static-protected-properties': [
            { static: true, type: 'property', accessibility: 'protected' },
          ],
          'static-private-properties': [
            { static: true, type: 'property', private: true },
            { static: true, type: 'property', accessibility: 'private' },
          ],
          'public-properties': [{ type: 'property', accessibility: 'public' }],
          'protected-properties': [
            { type: 'property', accessibility: 'protected' },
          ],
          'private-properties': [
            { type: 'property', private: true },
            { type: 'property', accessibility: 'private' },
          ],
          'static-public-method': [
            { static: true, type: 'method', accessibility: 'public' },
            {
              static: true,
              type: 'property',
              propertyType: 'ArrowFunctionExpression',
              accessibility: 'public',
            },
          ],
          'static-protected-method': [
            { static: true, type: 'method', accessibility: 'protected' },
            {
              static: true,
              type: 'property',
              propertyType: 'ArrowFunctionExpression',
              accessibility: 'protected',
            },
          ],
          'static-private-method': [
            { static: true, type: 'method', private: true },
            {
              static: true,
              type: 'property',
              propertyType: 'ArrowFunctionExpression',
              private: true,
            },
            { static: true, type: 'method', accessibility: 'private' },
            {
              static: true,
              type: 'property',
              propertyType: 'ArrowFunctionExpression',
              accessibility: 'private',
            },
          ],
          'public-method': [
            { type: 'method', accessibility: 'public' },
            {
              type: 'property',
              propertyType: 'ArrowFunctionExpression',
              accessibility: 'public',
            },
          ],
          'protected-method': [
            { type: 'method', accessibility: 'protected' },
            {
              type: 'property',
              propertyType: 'ArrowFunctionExpression',
              accessibility: 'protected',
            },
          ],
          'private-method': [
            { type: 'method', private: true },
            {
              type: 'property',
              propertyType: 'ArrowFunctionExpression',
              private: true,
            },
            { type: 'method', accessibility: 'private' },
            {
              type: 'property',
              propertyType: 'ArrowFunctionExpression',
              accessibility: 'private',
            },
          ],
        },
        accessorPairPositioning: 'setThenGet',
        sortInterfaces: true,
      },
    ],
  },
};
