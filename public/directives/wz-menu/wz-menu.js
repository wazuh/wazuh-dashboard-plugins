/*
 * Wazuh app - Top nav bar directive
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import menuTemplate from './wz-menu.html';
import { uiModules } from 'ui/modules';
import $ from 'jquery';

const app = uiModules.get('app/wazuh', []);

class WzMenu {
  /**
   * Class constructor
   */
  constructor() {
    this.template = menuTemplate;
  }

  controller(
    $scope,
    $rootScope,
    $window,
    appState,
    genericReq,
    patternHandler,
    indexPatterns,
    errorHandler,
    wazuhConfig,
    $controller,
    $route
  ) {
    const settings = $controller('settingsController', { $scope });
    $scope.showSelector = appState.getPatternSelector();
    $scope.showAPISelector = appState.getAPISelector();
    $scope.root = $rootScope;
    $scope.settedMenuHeight = false;

    $scope.goToClick = path => {
      $window.location.href = path;
    };

    $scope.setMenuNavItem = item => {
      $scope.menuNavItem = item;
    };

    /**
     * When controller loads
     */
    const load = async () => {
      try {
        const config = wazuhConfig.getConfig();
        $scope.showAPISelector = config['api.selector'];
        appState.setAPISelector($scope.showAPISelector);

        if ($scope.showAPISelector) {
          const result = await genericReq.request('GET', '/hosts/apis', {});
          if (result.data) {
            if ($scope.APIList && $scope.APIList.length && result.data.length !== $scope.APIList.length) {
              location.reload();
            }
            $scope.APIList = result.data;
            $scope.currentSelectedAPI = $scope.APIList.find(x => x.id === $rootScope.currentAPIid);
          }
        }

        const list = await patternHandler.getPatternList();
        if (!list) return;

        // Get the configuration to check if pattern selector is enabled
        appState.setPatternSelector(config['ip.selector']);

        // Abort if we have disabled the pattern selector
        if (!appState.getPatternSelector()) return;

        // Show the pattern selector
        $scope.showSelector = true;
        let filtered = false;
        // If there is no current pattern, fetch it
        if (!appState.getCurrentPattern()) {
          appState.setCurrentPattern(list[0].id);
        } else {
          // Check if the current pattern cookie is valid
          filtered = list.filter(item =>
            item.id.includes(appState.getCurrentPattern())
          );
          if (!filtered.length) appState.setCurrentPattern(list[0].id);
        }

        const data = filtered
          ? filtered
          : await indexPatterns.get(appState.getCurrentPattern());
        $scope.theresPattern = true;
        $scope.currentPattern = data.title;

        // Getting the list of index patterns
        if (list) {
          $scope.patternList = list;
          $scope.currentSelectedPattern = appState.getCurrentPattern();
        }
        if (!$scope.menuNavItem) {
          $scope.menuNavItem = (appState
            .getNavigation()
            .currLocation || '').replace(/\//g, '');
        }

        if (appState.getCurrentAPI()) {
          $rootScope.theresAPI = true;
        } else {
          $rootScope.theresAPI = false;
        }
        calcHeight();
        $scope.$applyAsync();
        return;
      } catch (error) {
        errorHandler.handle(error.message || error);
        $scope.theresPattern = false;
      }
    };

    const calcHeight = () => {
      let height = false;
      try {
        height = $('#navDrawerMenu > ul:nth-child(2)')[0].clientHeight;
      } catch (error) {} // eslint-disable-line
      const barHeight = (height || 51) + 2;
      $scope.settedMenuHeight = true;
      $('.md-toolbar-tools, md-toolbar')
        .css('height', barHeight, 'important')
        .css('max-height', barHeight, 'important');
    };

    $($window).on('resize', function() {
      calcHeight();
    });

    $scope.root.$on('loadWazuhMenu', () => {
      load();
    });

    const setCurrentApi = () => {
      if (appState.getCurrentAPI()) {
        const apiId = $rootScope.currentAPIid ;
        if ($scope.APIList && $scope.APIList.length) {
          if ($scope.updateFromEvent) {
            $scope.currentSelectedAPI = $scope.APIList.find(x => x.id === apiId);
            $scope.updateFromEvent = false;
          }
        }
        $scope.$applyAsync();
      }
    }

    $scope.root.$on('currentAPIsetted', () => {
      $scope.updateFromEvent = true;
      setCurrentApi();
    });

    // Function to change the current index pattern on the app
    $scope.changePattern = async selectedPattern => {
      try {
        if (!appState.getPatternSelector()) return;
        $scope.currentSelectedPattern = await patternHandler.changePattern(
          selectedPattern
        );
        $scope.$applyAsync();
        $route.reload();
        return;
      } catch (error) {
        errorHandler.handle(error.message || error);
      }
    };

    $scope.refresh = () => $window.location.reload();

    //listeners
    $scope.$on('updateAPI', (evt, params) => {
      const current = appState.getCurrentAPI();
      if (current) {
        const parsed = JSON.parse(current);

        // If we've received cluster info as parameter, it means we must update our stored cookie
        if (params && params.cluster_info) {
          if (params.cluster_info.status === 'enabled') {
            parsed.name = params.cluster_info.cluster;
          } else {
            parsed.name = params.cluster_info.manager;
          }
          appState.setCurrentAPI(JSON.stringify(parsed));
        }

        $rootScope.theresAPI = true;
      } else {
        $rootScope.theresAPI = false;
      }
    });

    $scope.$on('updatePattern', () => {
      if (!appState.getPatternSelector()) return;
      indexPatterns
        .get(appState.getCurrentPattern())
        .then(() => {
          $scope.theresPattern = true;
          $scope.currentSelectedPattern = appState.getCurrentPattern();
        })
        .catch(error => {
          errorHandler.handle(error.message || error);
          $scope.theresPattern = false;
        });
    });

    // Set default API
    $scope.changeAPI = async (api) => {
      if (appState.getCurrentAPI()) {
        const current = JSON.parse(appState.getCurrentAPI());
        if (api && current.id !== api.id) {
          $scope.currentSelectedAPI = false;
          $scope.$applyAsync();
          if (!settings.apiEntries.length || settings.apiEntries.length !== $scope.APIList.length) {
            await settings.getHosts();
          }
          await settings.setDefault($scope.APIList.find(x => x.id === api.id));
          if (!location.href.includes('/wazuh-dev'))
            $route.reload();
        }
      }
    }
  }
}
app.directive('wzMenu', () => new WzMenu());