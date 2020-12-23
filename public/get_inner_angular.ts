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

// inner angular imports
// these are necessary to bootstrap the local angular.
// They can stay even after NP cutover
import angular from 'angular';
// required for `ngSanitize` angular module
import 'angular-sanitize';
import { EuiIcon } from '@elastic/eui';
import { i18nDirective, i18nFilter, I18nProvider } from '@kbn/i18n/angular';
import { CoreStart, PluginInitializerContext } from 'kibana/public';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';
import { Storage } from '../../../src/plugins/kibana_utils/public';
import { NavigationPublicPluginStart as NavigationStart } from '../../../src/plugins/navigation/public';
import {
  initAngularBootstrap,
  configureAppAngularModule,
  PrivateProvider,
  PromiseServiceCreator,
  registerListenEventListener,
  watchMultiDecorator,
  createTopNavDirective,
  createTopNavHelper,
} from '../../../src/plugins/kibana_legacy/public';
import { AppPluginStartDependencies } from './types';
import { getScopedHistory } from './kibana-services';

/**
 * returns the main inner angular module, it contains all the parts of Angular Discover
 * needs to render, so in the end the current 'kibana' angular module is no longer necessary
 */
export function getInnerAngularModule(
  name: string,
  core: CoreStart,
  deps: AppPluginStartDependencies,
  context: PluginInitializerContext
) {
  initAngularBootstrap();
  const module = initializeInnerAngularModule(name, core, deps.navigation, deps.data);
  configureAppAngularModule(module, { core, env: context.env }, true, getScopedHistory);
  return module;
}

/**
 * returns a slimmer inner angular module for embeddable rendering
 */
export function getInnerAngularModuleEmbeddable(
  name: string,
  core: CoreStart,
  deps: AppPluginStartDependencies
) {
  return initializeInnerAngularModule(name, core, deps.navigation, deps.data, true);
}

let initialized = false;

export function initializeInnerAngularModule(
  name = 'app/wazuh',
  core: CoreStart,
  navigation: NavigationStart,
  data: DataPublicPluginStart,
  embeddable = false
) {
   if (!initialized) {
    createLocalI18nModule();
    createLocalPrivateModule();
    createLocalPromiseModule();
 /*    createLocalTopNavModule(navigation);
    createLocalStorageModule();
    createPagerFactoryModule();
    createDocTableModule(); */
    initialized = true;
  } 

  if (embeddable) {
    return angular
      .module(name, [
        'ngSanitize',
        'react',
        'ngMaterial',
        'chart.js',
        'ui.bootstrap',
        'wazuhI18n',
        'wazuhPrivate',
        'wazuhPromise',        
        //'wazuhDocTable',
        //'wazuhPagerFactory',
      ])
      .config(watchMultiDecorator)
      .directive('icon', (reactDirective) => reactDirective(EuiIcon));
    //.directive('renderComplete', createRenderCompleteDirective);
  }

  return angular
    .module(name, [
      'ngSanitize',
      'ngRoute',
      'react',
      'ngMaterial',
      'chart.js',
      'ui.bootstrap',
      'wazuhI18n',
      'wazuhPrivate',
      'wazuhPromise',
      /* 'wazuhTopNav',
      'wazuhLocalStorageProvider',
      'wazuhDocTable',
      'wazuhPagerFactory', */
    ])
    .config(watchMultiDecorator)
    .run(registerListenEventListener);
  //.directive('renderComplete', createRenderCompleteDirective)
  //.directive('discoverLegacy', createDiscoverLegacyDirective)
  //.directive('contextErrorMessage', createContextErrorMessageDirective);
}

function createLocalPromiseModule() {
  angular.module('wazuhPromise', []).service('Promise', PromiseServiceCreator);
}

function createLocalPrivateModule() {
  angular.module('wazuhPrivate', []).provider('Private', PrivateProvider);
}

function createLocalTopNavModule(navigation: NavigationStart) {
  angular
    .module('wazuhTopNav', ['react'])
    .directive('kbnTopNav', createTopNavDirective)
    .directive('kbnTopNavHelper', createTopNavHelper(navigation.ui));
}

function createLocalI18nModule() {
  angular
    .module('wazuhI18n', [])
    .provider('i18n', I18nProvider)
    .filter('i18n', i18nFilter)
    .directive('i18nId', i18nDirective);
}

function createLocalStorageModule() {
  angular
    .module('wazuhLocalStorageProvider', ['wazuhPrivate'])
    .service('localStorage', createLocalStorageService('localStorage'))
    .service('sessionStorage', createLocalStorageService('sessionStorage'));
}

const createLocalStorageService = function (type: string) {
  return function ($window: any) {
    return new Storage($window[type]);
  };
};

function createPagerFactoryModule() {
  //angular.module('discoverPagerFactory', []).factory('pagerFactory', createPagerFactory);
}

function createDocTableModule() {
  angular.module('wazuhDocTable', ['discoverPagerFactory', 'react']);
  /*.directive('docTable', createDocTableDirective)
    .directive('kbnTableHeader', createTableHeaderDirective)
    .directive('toolBarPagerText', createToolBarPagerTextDirective)
    .directive('kbnTableRow', createTableRowDirective)
    .directive('toolBarPagerButtons', createToolBarPagerButtonsDirective)
    .directive('kbnInfiniteScroll', createInfiniteScrollDirective)
    .directive('docViewer', createDocViewerDirective);*/
}
