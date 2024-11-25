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
  overrides: [
    {
      files: ['plugins/**/*.{js,jsx,ts,tsx}'],
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
        'no-unreachable': 'error',
        'no-fallthrough': [
          'error',
          {
            allowEmptyCase: true,
          },
        ],
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
        'unicorn/filename-case': [
          'error',
          {
            case: 'kebabCase',
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
              '[static-public-method]',
              '[static-protected-method]',
              '[static-private-method]',
              '[public-properties]',
              '[protected-properties]',
              '[private-properties]',
              'constructor',
              '[accessor-pairs]',
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
                { static: true, type: 'property', name: '/_.+/' },
              ],
              'public-properties': [
                { type: 'property', accessibility: 'public' },
              ],
              'protected-properties': [
                { type: 'property', accessibility: 'protected' },
              ],
              'private-properties': [
                { type: 'property', private: true },
                { type: 'property', accessibility: 'private' },
                { type: 'property', name: '/_.+/' },
              ],
              'static-public-method': [
                {
                  static: true,
                  type: 'property',
                  propertyType: 'ArrowFunctionExpression',
                  accessibility: 'public',
                },
                { static: true, type: 'method', accessibility: 'public' },
              ],
              'static-protected-method': [
                {
                  static: true,
                  type: 'property',
                  propertyType: 'ArrowFunctionExpression',
                  accessibility: 'protected',
                },
                { static: true, type: 'method', accessibility: 'protected' },
              ],
              'static-private-method': [
                {
                  static: true,
                  type: 'property',
                  propertyType: 'ArrowFunctionExpression',
                  private: true,
                },
                { static: true, type: 'method', private: true },
                {
                  static: true,
                  type: 'property',
                  propertyType: 'ArrowFunctionExpression',
                  accessibility: 'private',
                },
                { static: true, type: 'method', accessibility: 'private' },
                {
                  static: true,
                  type: 'property',
                  propertyType: 'ArrowFunctionExpression',
                  name: '/_.+/',
                },
                { static: true, type: 'method', name: '/_.+/' },
              ],
              'public-method': [
                {
                  type: 'property',
                  propertyType: 'ArrowFunctionExpression',
                  accessibility: 'public',
                },
                { type: 'method', accessibility: 'public' },
              ],
              'protected-method': [
                {
                  type: 'property',
                  propertyType: 'ArrowFunctionExpression',
                  accessibility: 'protected',
                },
                { type: 'method', accessibility: 'protected' },
              ],
              'private-method': [
                {
                  type: 'property',
                  propertyType: 'ArrowFunctionExpression',
                  private: true,
                },
                { type: 'method', private: true },
                {
                  type: 'property',
                  propertyType: 'ArrowFunctionExpression',
                  accessibility: 'private',
                },
                { type: 'method', accessibility: 'private' },
                {
                  type: 'property',
                  propertyType: 'ArrowFunctionExpression',
                  name: '/_.+/',
                },
                { type: 'method', name: '/_.+/' },
              ],
            },
            accessorPairPositioning: 'setThenGet',
            sortInterfaces: true,
          },
        ],
        '@stylistic/no-multiple-empty-lines': [
          'error',
          {
            max: 1,
            maxEOF: 1,
            maxBOF: 0,
          },
        ],
        // https://eslint.style/rules/js/padding-line-between-statements
        '@stylistic/padding-line-between-statements': [
          'error',
          // imports
          { blankLine: 'always', prev: 'import', next: '*' },
          { blankLine: 'never', prev: 'import', next: 'import' },

          // var
          { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
          { blankLine: 'always', prev: '*', next: ['const', 'let', 'var'] },
          {
            blankLine: 'never',
            prev: ['const', 'let', 'var'],
            next: ['const', 'let', 'var'],
          },

          // function
          { blankLine: 'always', prev: '*', next: 'function' },
          { blankLine: 'always', prev: 'function', next: '*' },

          // block-like
          { blankLine: 'always', prev: '*', next: 'block-like' },
          { blankLine: 'always', prev: 'block-like', next: '*' },

          // return
          { blankLine: 'always', prev: '*', next: 'return' },

          // directive
          { blankLine: 'always', prev: 'directive', next: '*' },
          { blankLine: 'never', prev: 'directive', next: 'directive' },

          // switch
          { blankLine: 'always', prev: ['case', 'default'], next: '*' },
        ],
        // https://eslint.style/rules/js/lines-between-class-members
        '@stylistic/lines-between-class-members': [
          'error',
          {
            enforce: [
              { blankLine: 'always', prev: '*', next: '*' },
              { blankLine: 'never', prev: 'field', next: 'field' },
            ],
          },
        ],
      },
    },
  ],
};
