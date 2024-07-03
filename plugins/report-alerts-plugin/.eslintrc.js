/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

 const LICENSE_HEADER = `/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */`;

module.exports = {
  root: true,
  extends: [
    '@elastic/eslint-config-kibana',
    'plugin:@elastic/eui/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jest/recommended',
    'plugin:prettier/recommended',
  ],
  
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@osd/eslint/no-restricted-paths': [
      'error',
      {
        basePath: __dirname,
        zones: [
          {
            target: ['(public|server)/**/*'],
            from: ['../../packages/**/*','packages/**/*'],
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.{js,ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-console': 0,
        '@osd/eslint/require-license-header': [
          'error',
          {
            licenses: [LICENSE_HEADER],
          },
        ],
      },
    },
  ],
  "ignorePatterns": ["**/*.d.ts"]
};
