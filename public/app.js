/*
 * Wazuh app - File for app requirements and set up
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import { AppState } from './react-services/app-state';

// Set up Wazuh app
const app = uiModules.get('app/wazuh', ['ngCookies', 'ngMaterial', 'chart.js']);

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

app.run(function ($rootScope, $route, $location) {
  chrome
  .setRootTemplate('<react-component name="WzMenuWrapper" props="" /><div ng-view class="mainView"></div>')
    .setRootController(() => require('./app'));
  changeWazuhNavLogo();
  AppState.setNavigation({ status: false });
  AppState.setNavigation({
    reloaded: false,
    discoverPrevious: false,
    discoverSections: ['/overview/', '/agents', '/wazuh-dev']
  });

  $rootScope.$on('$routeChangeSuccess', () => {
    AppState.setNavigation({ prevLocation: $location.path() });
    if (!AppState.getNavigation().reloaded) {
      AppState.setNavigation({ status: true });
    } else {
      AppState.setNavigation({ reloaded: false });
    }
  });

  $rootScope.$on('$locationChangeSuccess', () => {
    const navigation = AppState.getNavigation();
    AppState.setNavigation({ currLocation: $location.path() });
    if (navigation.currLocation !== navigation.prevLocation) {
      if (navigation.discoverSections.includes(navigation.currLocation)) {
        AppState.setNavigation({ discoverPrevious: navigation.prevLocation });
      }
    } else {
      if (!navigation.status && navigation.prevLocation) {
        if (
          !navigation.discoverSections.includes(navigation.currLocation) &&
          $location.search().tabView !== 'cluster-monitoring'
        ) {
          AppState.setNavigation({ reloaded: true });
          $location.search('configSubTab', null);
          $location.search('editingFile', null);
          $route.reload();
        }
      }
    }
    AppState.setNavigation({ status: false });
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
