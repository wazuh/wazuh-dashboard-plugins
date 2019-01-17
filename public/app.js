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

// Set up Wazuh app
const app = uiModules.get('app/wazuh', ['ngCookies', 'ngMaterial']);

app.config([
  '$compileProvider',
  function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(
      /^\s*(https?|ftp|mailto|data|blob):/
    );
  }
]);

app.config([
  '$httpProvider',
  function ($httpProvider) {
    $httpProvider.useApplyAsync(true);
  }
]);

app.run(function ($rootScope, $route, $location, appState, $window) {
  appState.setNavigation({ status: false });
  appState.setNavigation({ reloaded: false, discoverPrevious: false, discoverSections: ['/wazuh-discover/', '/overview/', '/agents'] });

  $rootScope.$on('$routeChangeSuccess', () => {
    appState.setNavigation({ prevLocation: $location.path() });
    if (!appState.getNavigation().reloaded) {
      appState.setNavigation({ status: true });
    } else {
      appState.setNavigation({ reloaded: false });
    }
  });
  $rootScope.$on('$locationChangeSuccess', () => {
    const setHistory = (navigation) => {
      $window.history.pushState({ page: 'wazuh#' + navigation.discoverPrevious }, '', 'wazuh#' + navigation.discoverPrevious);
      $window.history.pushState({ page: '/app/wazuh#' + $location.$$url }, '', '/app/wazuh#' + $location.$$url);
    }
    const navigation = appState.getNavigation();
    appState.setNavigation({ currLocation: $location.path() });
    if (!navigation.status && navigation.prevLocation) {
      if (navigation.currLocation === navigation.prevLocation) {
        if (!navigation.discoverSections.includes(navigation.currLocation)) {
          appState.setNavigation({ reloaded: true });
          $route.reload();
        } else if (navigation.discoverSections.includes(navigation.currLocation)) {
          setHistory(navigation);
        }
      }
    }
    if (navigation.currLocation !== navigation.prevLocation) {
      if (navigation.discoverSections.includes(navigation.currLocation)) {
        appState.setNavigation({ discoverPrevious: navigation.prevLocation })
      }
    }
    appState.setNavigation({ status: false });
  });
});


// Font Awesome, Kibana UI framework and others
import './utils/fontawesome/css/font-awesome.min.css';

// Dev tools
import './utils/codemirror';

// Material
import 'angular-material/angular-material.css';
import 'angular-aria/angular-aria';
import 'angular-animate/angular-animate';
import 'angular-material/angular-material';

// Cookies
import 'angular-cookies/angular-cookies';

import 'ui/autoload/all';
import 'ui/chrome';

// Wazuh
import './kibana-integrations';
import './services';
import './controllers';
import './factories';
import './directives';
import { runInContext } from 'vm';

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
