/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

 
 const allMochaRulesOff = {};
 Object.keys(require('eslint-plugin-mocha').rules).forEach((k) => {
   allMochaRulesOff['mocha/' + k] = 'off';
 });
 
 module.exports = {
   root: true,
 
   extends: ['@elastic/eslint-config-kibana', 'plugin:@elastic/eui/recommended'],
 
   overrides: [

    /**
     * Restricted paths
     */
     {
      files: ['**/*.{js,mjs,ts,tsx}'],
      rules: {
        '@osd/eslint/no-restricted-paths': [
          'error',
          {
            basePath: __dirname,
            zones: [
              {
                target: ['(src)/**/*', '!src/core/**/*'],
                from: ['src/core/utils/**/*'],
                errorMessage: `Plugins may only import from src/core/server and src/core/public.`,
              },
              {
                target: ['(src)/plugins/*/server/**/*'],
                from: ['(src)/plugins/*/public/**/*'],
                errorMessage: `Server code can not import from public, use a common directory.`,
              },
              {
                target: ['(src)/plugins/*/common/**/*'],
                from: ['(src)/plugins/*/(server|public)/**/*'],
                errorMessage: `Common code can not import from server or public, use a common directory.`,
              },
              {
                target: [
                  'src/legacy/**/*',
                  '(src)/plugins/**/(public|server)/**/*',
                  'examples/**/*',
                ],
                from: [
                  'src/core/public/**/*',
                  '!src/core/public/index.ts', // relative import
                  '!src/core/public/mocks{,.ts}',
                  '!src/core/server/types{,.ts}',
                  '!src/core/public/utils/**/*',
                  '!src/core/public/*.test.mocks{,.ts}',

                  'src/core/server/**/*',
                  '!src/core/server/index.ts', // relative import
                  '!src/core/server/mocks{,.ts}',
                  '!src/core/server/types{,.ts}',
                  '!src/core/server/test_utils{,.ts}',
                  '!src/core/server/utils', // ts alias
                  '!src/core/server/utils/**/*',
                  // for absolute imports until fixed in
                  // https://github.com/elastic/kibana/issues/36096
                  '!src/core/server/*.test.mocks{,.ts}',

                  'target/types/**',
                ],
                allowSameFolder: true,
                errorMessage:
                  'Plugins may only import from top-level public and server modules in core.',
              },
              {
                target: [
                  'src/legacy/**/*',
                  '(src)/plugins/**/(public|server)/**/*',
                  'examples/**/*',
                  '!(src)/**/*.test.*',
                ],
                from: [
                  '(src)/plugins/**/(public|server)/**/*',
                  '!(src)/plugins/**/(public|server)/mocks/index.{js,mjs,ts}',
                  '!(src)/plugins/**/(public|server)/(index|mocks).{js,mjs,ts,tsx}',
                ],
                allowSameFolder: true,
                errorMessage: 'Plugins may only import from top-level public and server modules.',
              },
              {
                target: [
                  '(src)/plugins/**/*',
                  '!(src)/plugins/**/server/**/*',

                  'examples/**/*',
                  '!examples/**/server/**/*',
                ],
                from: [
                  'src/core/server',
                  'src/core/server/**/*',
                  '(src)/plugins/*/server/**/*',
                  'examples/**/server/**/*',
                ],
                errorMessage:
                  'Server modules cannot be imported into client modules or shared modules.',
              },
              {
                target: ['src/core/**/*'],
                from: ['plugins/**/*', 'src/plugins/**/*', 'src/legacy/ui/**/*'],
                errorMessage: 'The core cannot depend on any plugins.',
              },
              {
                target: ['(src)/plugins/*/public/**/*'],
                from: ['ui/**/*'],
                errorMessage: 'Plugins cannot import legacy UI code.',
              },
              {
                from: ['src/legacy/ui/**/*', 'ui/**/*'],
                target: [
                  'test/plugin_functional/plugins/**/public/np_ready/**/*',
                  'test/plugin_functional/plugins/**/server/np_ready/**/*',
                ],
                allowSameFolder: true,
                errorMessage:
                  'NP-ready code should not import from /src/legacy/ui/** folder. ' +
                  'Instead of importing from /src/legacy/ui/** deeply within a np_ready folder, ' +
                  'import those things once at the top level of your plugin and pass those down, just ' +
                  'like you pass down `core` and `plugins` objects.',
              },
            ],
          },
        ],
      },
    },
 
     /**
      * Allow default exports
      */
     {
       files: [
         'test/*/config.ts',
         'test/*/config_open.ts',
         'test/*/{tests,test_suites,apis,apps}/**/*',
         'test/visual_regression/tests/**/*',
       ],
       rules: {
         'import/no-default-export': 'off',
         'import/no-named-as-default': 'off',
       },
     },
 
     /**
      * Files that are allowed to import webpack-specific stuff
      */
     {
       files: [
         '**/public/**/*.js',
         'src/fixtures/**/*.js', // TODO: this directory needs to be more obviously "public" (or go away)
       ],
       settings: {
         // instructs import/no-extraneous-dependencies to treat certain modules
         // as core modules, even if they aren't listed in package.json
         'import/core-modules': ['plugins'],
 
         'import/resolver': {
           '@osd/eslint-import-resolver-opensearch-dashboards': {
             forceNode: false,
             rootPackageName: 'opensearch-dashboards',
             opensearchDashboardsPath: '.',
             pluginMap: {},
           },
         },
       },
     },
 
     /**
      * Files that run AFTER node version check
      * and are not also transpiled with babel
      */
     {
       files: [
         '.eslintrc.js',
       ],
       excludedFiles: ['**/integration_tests/**/*'],
       rules: {
         'import/no-commonjs': 'off',
         'prefer-object-spread/prefer-object-spread': 'off',
         'no-restricted-syntax': [
           'error',
           'ImportDeclaration',
           'ExportNamedDeclaration',
           'ExportDefaultDeclaration',
           'ExportAllDeclaration',
         ],
       },
     },
 
     /**
      * Jest specific rules
      */
     {
       files: ['**/*.test.{js,mjs,ts,tsx}'],
       rules: {
         'jest/valid-describe-callback': 'error',
       },
     },
 

     /**
      * Prettier disables all conflicting rules, listing as last override so it takes precedence
      */
     {
       files: ['**/*'],
       rules: {
         ...require('eslint-config-prettier').rules,
         ...require('eslint-config-prettier/react').rules,
         ...require('eslint-config-prettier/@typescript-eslint').rules,
       },
     },
     {
       files: [
         '**/public/**/*.{js,mjs,ts,tsx}',
         '**/common/**/*.{js,mjs,ts,tsx}',
       ],
       rules: {
         'no-restricted-imports': [
           'error',
           {
             patterns: ['lodash/*', '!lodash/fp'],
           },
         ],
       },
     },
     {
       files: ['cypress/**/*.js'],
       rules: {
         'import/no-unresolved': 'off',
         'no-undef': 'off',
       },
     },
   ],
 };
 