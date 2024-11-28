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
    projectService: true,
    tsconfigRootDir: __dirname,
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
        'no-restricted-syntax': [
          'error',
          {
            selector:
              'ClassBody > PropertyDefinition > ArrowFunctionExpression',
            message:
              "Don't use arrow functions in class properties. Use a function instead.",
          },
        ],
        'prefer-arrow-callback': 'error',
        'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
        'arrow-body-style': [
          'error',
          'as-needed',
          { requireReturnForObjectLiteral: true },
        ],
        'no-unreachable': 'error',
        'no-fallthrough': [
          'error',
          {
            allowEmptyCase: true,
          },
        ],
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
        /* -------------------------------------------------------------------------- */
        /*                                 @stylistic                                 */
        /* -------------------------------------------------------------------------- */
        '@stylistic/no-multiple-empty-lines': [
          'error',
          {
            max: 1,
            maxEOF: 1,
            maxBOF: 0,
          },
        ],
        '@stylistic/spaced-comment': ['error', 'always'],
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
        /* -------------------------------------------------------------------------- */
        /*                                   unicorn                                  */
        /* -------------------------------------------------------------------------- */
        'unicorn/prefer-ternary': 'off',
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
                event: true,
              },
              err: {
                error: true,
              },
              ev: {
                event: true,
              },
              evt: {
                event: true,
              },
              fn: {
                callback: true,
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
        /* -------------------------------------------------------------------------- */
        /*                             @typescript-eslint                             */
        /* -------------------------------------------------------------------------- */
        '@typescript-eslint/prefer-readonly': 'error',
        '@typescript-eslint/no-extraneous-class': 'off',
        '@typescript-eslint/method-signature-style': ['error', 'property'],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/naming-convention': [
          'error',
          { selector: 'default', format: ['camelCase'] },
          {
            selector: 'objectLiteralProperty',
            format: ['camelCase', 'snake_case'],
          },
          {
            selector: ['class', 'interface', 'typeLike'],
            format: ['PascalCase'],
          },
          {
            selector: ['enum', 'enumMember'],
            format: ['UPPER_CASE'],
          },
          {
            selector: ['variable'],
            modifiers: ['global'],
            format: ['UPPER_CASE'],
          },
          {
            selector: ['memberLike'],
            modifiers: ['readonly'],
            types: ['number', 'string'],
            format: ['UPPER_CASE'],
          },
        ],
      },
    },
    {
      files: ['plugins/**/*.{ts}'],
      rules: {
        '@typescript-eslint/member-ordering': [
          'error',
          {
            default: [
              'static-field',
              'static-set',
              'static-get',
              'static-method',
              'abstract-field',
              'instance-field',
              ['abstract-set', 'abstract-get'],
              ['instance-set', 'instance-get'],
              'constructor',
              'abstract-method',
              'instance-method',
            ],
          },
        ],
      },
    },
    {
      files: ['plugins/**/*.{js,jsx,tsx}'],
      rules: {
        'react/sort-comp': [
          'error',
          {
            // https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/sort-comp.md#rule-options
            order: [
              'static-methods',
              'lifecycle',
              'everything-else',
              '/^on.+$/',
              '/^render.+$/',
              'render',
            ],
            groups: {
              lifecycle: [
                'displayName',
                'propTypes',
                'contextTypes',
                'childContextTypes',
                'mixins',
                'statics',
                'defaultProps',
                'props',
                'state',
                'constructor',
                'getDefaultProps',
                'getInitialState',
                'getChildContext',
                'getDerivedStateFromProps',
                'componentWillMount',
                'UNSAFE_componentWillMount',
                'componentDidMount',
                'componentWillReceiveProps',
                'UNSAFE_componentWillReceiveProps',
                'shouldComponentUpdate',
                'componentWillUpdate',
                'UNSAFE_componentWillUpdate',
                'getSnapshotBeforeUpdate',
                'componentDidUpdate',
                'componentDidCatch',
                'componentWillUnmount',
              ],
            },
          },
        ],
      },
    },
  ],
};
