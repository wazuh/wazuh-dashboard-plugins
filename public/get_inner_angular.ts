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
import { i18nDirective, i18nFilter, I18nProvider } from '@kbn/i18n/angular';
import { CoreStart, PluginInitializerContext } from 'kibana/public';
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
import { getScopedHistory, setDiscoverModule } from './kibana-services';
import { createDiscoverLegacyDirective } from './kibana-integrations/discover/application/components/create_discover_legacy_directive';
import { createContextErrorMessageDirective } from './kibana-integrations/discover/application/components/context_error_message';
import { EuiIcon } from '@elastic/eui';

/**
 * returns the main inner angular module, it contains all the parts of Angular Discover
 * needs to render, so in the end the current plugin platform angular module is no longer necessary
 */
export function getInnerAngularModule(
  name: string,
  core: CoreStart,
  deps: AppPluginStartDependencies,
  context: PluginInitializerContext
) {
  initAngularBootstrap();
  const module = initializeInnerAngularModule(name, deps.navigation);
  configureAppAngularModule(module, { core, env: context.env }, true, getScopedHistory);
  return module;
}

let initialized = false;

export function initializeInnerAngularModule(name = 'app/wazuh', navigation: NavigationStart) {
  if (!initialized) {
    createLocalI18nModule();
    createLocalPrivateModule();
    createLocalPromiseModule();
    createLocalTopNavModule(navigation);
    createLocalStorageModule();
    initialized = true;
  }

  const discoverModule = angular.module('app/discover', [
    'discoverI18n',
    'discoverPrivate',
    'discoverPromise',
    'discoverTopNav',
    'discoverLocalStorageProvider',
  ]);

  setDiscoverModule(discoverModule);

  return angular
    .module(name, [
      'ngSanitize',
      'ngRoute',
      'react',
      'ngMaterial',
      'ui.bootstrap',
      'app/discover',
    ])
    .config(watchMultiDecorator)
    .run(registerListenEventListener)
    .directive('discoverLegacy', createDiscoverLegacyDirective)
    .directive('icon', (reactDirective) => reactDirective(EuiIcon))
    .directive('contextErrorMessage', createContextErrorMessageDirective);
}

function createLocalPromiseModule() {
  angular.module('discoverPromise', []).service('Promise', PromiseServiceCreator);
}

function createLocalPrivateModule() {
  angular.module('discoverPrivate', []).provider('Private', PrivateProvider);
}

function createLocalTopNavModule(navigation: NavigationStart) {
  angular
    .module('discoverTopNav', ['react'])
    .directive('kbnTopNav', createTopNavDirective)
    .directive('kbnTopNavHelper', createTopNavHelper(navigation.ui));
}

function createLocalI18nModule() {
  angular
    .module('discoverI18n', [])
    .provider('i18n', I18nProvider)
    .filter('i18n', i18nFilter)
    .directive('i18nId', i18nDirective);
}

function createLocalStorageModule() {
  angular
    .module('discoverLocalStorageProvider', ['discoverPrivate'])
    .service('localStorage', createLocalStorageService('localStorage'))
    .service('sessionStorage', createLocalStorageService('sessionStorage'));
}

const createLocalStorageService = function (type: string) {
  return function ($window: any) {
    return new Storage($window[type]);
  };
};
