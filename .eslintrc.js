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
    '@stylistic/spaced-comment': 'error',
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
    'require-await': 'error',
    'import/no-unused-modules': [
      1,
      {
        missingExports: true,
        unusedExports: true,
      },
    ],
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/custom-error-definition.md
    'unicorn/custom-error-definition': 'error',
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/better-regex.md
    'unicorn/better-regex': 'error',
  },
};
