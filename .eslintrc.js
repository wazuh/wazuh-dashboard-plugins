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
         '**/**/**/*.{js,mjs,ts,tsx}',
       ],
       rules: {
         'max-len': ['error', 100, 2, { ignoreComments: true, ignoreUrls: true }],
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
 