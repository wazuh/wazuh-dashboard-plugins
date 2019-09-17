/*
 * Wazuh app - File for app requirements and set up
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import 'ui/autoload/styles';
import 'uiExports/visTypes';
import 'uiExports/visResponseHandlers';
import 'uiExports/visRequestHandlers';
import 'uiExports/visEditorTypes';
import 'uiExports/savedObjectTypes';
import 'uiExports/spyModes';
import 'uiExports/fieldFormats';
import 'uiExports/fieldFormatEditors';
import 'uiExports/navbarExtensions';
import 'uiExports/managementSections';
import 'uiExports/devTools';
import 'uiExports/docViews';
import 'uiExports/embeddableFactories';
import 'uiExports/autocompleteProviders';

// Require CSS
import './less/loader';
import { uiModules } from 'ui/modules';
import chrome from 'ui/chrome';

// EUI React components wrapper
import './components';

// angular-charts.js
import 'angular-chart.js';

// pin-wz-menu.js
import { changeWazuhNavLogo } from './utils/wz-logo-menu';

// Font Awesome, Kibana UI framework and others
import './utils/fontawesome/css/font-awesome.min.css';

// Dev tools
import './utils/codemirror';

import './utils/jquery-ui';

// Material
import 'angular-material/angular-material.css';
import 'angular-aria/angular-aria';
import 'angular-animate/angular-animate';
import 'angular-material/angular-material';

// Cookies
import 'angular-cookies/angular-cookies';

import 'ui/autoload/all';

// Wazuh
import './kibana-integrations';
import './services';
import './controllers';
import './factories';
import './directives';

// Set up Wazuh app
const app = uiModules.get('app/wazuh', ['ngCookies', 'ngMaterial', 'chart.js']);

app.config([
  '$compileProvider',
  function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(
      /^\s*(https?|ftp|mailto|data|blob):/
    );
  }
]);

app.config([
  '$httpProvider',
  function($httpProvider) {
    $httpProvider.useApplyAsync(true);
  }
]);

app.run(function($rootScope, $route, $location, appState, $window) {
  chrome
    .setRootTemplate('<wz-menu></wz-menu><div ng-view></div>')
    .setRootController(() => require('./app'));
  changeWazuhNavLogo();
  appState.setNavigation({ status: false });
  appState.setNavigation({
    reloaded: false,
    discoverPrevious: false,
    discoverSections: [
      '/wazuh-discover/',
      '/overview/',
      '/agents',
      '/wazuh-dev'
    ]
  });

  $rootScope.$on('$routeChangeSuccess', () => {
    appState.setNavigation({ prevLocation: $location.path() });
    if (!appState.getNavigation().reloaded) {
      appState.setNavigation({ status: true });
    } else {
      appState.setNavigation({ reloaded: false });
    }
  });

  $rootScope.$on('$locationChangeSuccess', () => {
    const navigation = appState.getNavigation();
    appState.setNavigation({ currLocation: $location.path() });
    if (navigation.currLocation !== navigation.prevLocation) {
      if (navigation.discoverSections.includes(navigation.currLocation)) {
        appState.setNavigation({ discoverPrevious: navigation.prevLocation });
      }
    } else {
      if (!navigation.status && navigation.prevLocation) {
        if (
          !navigation.discoverSections.includes(navigation.currLocation) &&
          $location.search().tabView !== 'cluster-monitoring'
        ) {
          appState.setNavigation({ reloaded: true });
          $location.search('configSubTab', null);
          $location.search('editingFile', null);
          $route.reload();
          //discover sections
        } else if (
          navigation.discoverSections.includes(navigation.currLocation)
        ) {
          if (navigation.currLocation === navigation.discoverSections[1]) {
            $window.history.pushState(
              {
                page: chrome.addBasePath(
                  'wazuh#' + navigation.discoverPrevious + '/'
                )
              },
              '',
              chrome.addBasePath('wazuh#' + navigation.discoverPrevious + '/')
            );
          } else if (
            navigation.currLocation === navigation.discoverSections[2]
          ) {
            if (
              $location.search().tab &&
              $location.search().tab !== 'welcome'
            ) {
              $window.history.pushState(
                {
                  page: chrome.addBasePath(
                    'wazuh#' + navigation.discoverPrevious
                  )
                },
                '',
                chrome.addBasePath('wazuh#' + navigation.discoverPrevious)
              );
              $window.history.pushState(
                {
                  page: chrome.addBasePath(
                    'wazuh#' +
                      navigation.discoverPrevious +
                      '?agent=' +
                      $location.search().agent
                  )
                },
                '',
                chrome.addBasePath(
                  'wazuh#' +
                    navigation.discoverPrevious +
                    '?agent=' +
                    $location.search().agent
                )
              );
            } else {
              $window.history.pushState(
                {
                  page: chrome.addBasePath(
                    'wazuh#' + navigation.discoverPrevious
                  )
                },
                '',
                chrome.addBasePath('wazuh#' + navigation.discoverPrevious)
              );
            }
          } else if (
            navigation.currLocation === navigation.discoverSections[0] ||
            navigation.currLocation === navigation.discoverSections[3]
          ) {
            $window.history.pushState(
              {
                page: chrome.addBasePath('wazuh#' + navigation.discoverPrevious)
              },
              '',
              chrome.addBasePath('wazuh#' + navigation.discoverPrevious)
            );
          }
          $window.history.pushState(
            { page: chrome.addBasePath('wazuh#' + $location.$$url) },
            '',
            chrome.addBasePath('wazuh#' + $location.$$url)
          );
        } else if ($location.search().tabView === 'cluster-monitoring') {
          $window.history.pushState(
            { page: chrome.addBasePath('wazuh#/manager/') },
            '',
            chrome.addBasePath('wazuh#/manager/')
          );
          $window.history.pushState(
            { page: 'wazuh#' + $location.$$url },
            '',
            chrome.addBasePath('wazuh#' + $location.$$url)
          );
        }
      }
    }
    appState.setNavigation({ status: false });
  });
});

// Added due to Kibana 6.3.0. Do not modify.
uiModules.get('kibana').provider('dashboardConfig', () => {
  let hideWriteControls = false;

  return {
    /**
     * Part of the exposed plugin API - do not remove without careful consideration.
     * @type {boolean}
     */
    turnHideWriteControlsOn() {
      hideWriteControls = true;
    },
    $get() {
      return {
        getHideWriteControls() {
          return hideWriteControls;
        }
      };
    }
  };
});
