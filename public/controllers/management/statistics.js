/*
 * Wazuh app - Statistics monitoring controller
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { AppState } from '../../react-services/app-state';
import { GenericRequest } from '../../react-services/generic-request';
import { FilterHandler } from '../../utils/filter-handler';
import { timefilter } from 'ui/timefilter';

export function StatisticsController(
    $scope,
    $rootScope,
    $timeout,
    errorHandler,
    apiReq,
    $window,
    $location,
    discoverPendingUpdates,
    WzStatistics,
    rawVisualizations,
    loadedVisualizations,
    visHandlers,
    tabVisualizations,
) {
  timefilter.setRefreshInterval({ pause: true, value: 0 });
  const filterHandler = new FilterHandler(AppState.getCurrentPattern());
  tabVisualizations.setTab('statistics');
  $location.search('tabView', 'statistics');
  const clusterEnabled = AppState.getClusterInfo()
    && AppState.getClusterInfo().status === 'enabled';
  $scope.isClusterEnabled = clusterEnabled;
  $scope.IsClusterRunning = true;
  $scope.tabView = 'statistics';
  $scope.showConfig = false;
  $scope.showNodes = false;
  $scope.currentNode = null;
  $scope.nodeSearchTerm = '';

  /**
   * This set default boolean flags for a given component
   * @param {String} component
   */
  const setBooleans = component => {
    $scope.showConfig = component === 'showConfig';
    $scope.showNodes = component === 'showNodes';
    $scope.currentNode = null;
  };

  /**
   * This navigates to agents preview
   */
  $scope.goAgents = () => {
    $window.location.href = '#/agents-preview';
  };


  /**
   * This navigates to nodes
   */
  $scope.goNodes = () => {
    setBooleans('showNodes');
    tabVisualizations.assign({
      monitoring: 1
    });
    assignFilters();
    $rootScope.$broadcast('updateVis');
  };

  /**
   * This navigates back
   */
  $scope.goBack = () => {
    setBooleans(null);
    tabVisualizations.assign({
      monitoring: 2
    });
    assignFilters();
    $rootScope.$broadcast('updateVis');
  };

  //listeners
  $scope.$on('wazuhShowClusterNode', async (event, parameters) => {
    try {
      $rootScope.$broadcast('updateVis');

      $scope.$applyAsync();
    } catch (error) {
      errorHandler.handle(error, 'Cluster');
    }
  });

  let filters = discoverPendingUpdates.getList()[1];
  /**
   * This creatie custom filters for visualizations for a given node
   * @param {Object} node
   */
  const assignFilters = (node = false) => {
    try {
      filters = discoverPendingUpdates.getList()[1];

      $rootScope.$emit('wzEventFilters', { filters, localChange: false });
      if (!$rootScope.$$listenerCount['wzEventFilters']) {
        $timeout(100).then(() => assignFilters(node));
      }
    } catch (error) {
      errorHandler.handle(
        'An error occurred while creating custom filters for visualizations',
        'Cluster',
        true
      );
    }
  };

  /**
   * This set some required settings at init
   */
  const load = async () => {
    try {
      visHandlers.removeAll();
      discoverPendingUpdates.removeAll();
      rawVisualizations.removeAll();
      loadedVisualizations.removeAll();

 
      assignFilters();
      $rootScope.$broadcast('updateVis');

      $scope.loading = false;
      $scope.$applyAsync();
      return;
    } catch (error) {
      $scope.loading = false;
      errorHandler.handle(error, 'Cluster');
    }
  };

  load();

  //listeners
  $scope.$on('$destroy', () => {
    discoverPendingUpdates.removeAll();
    tabVisualizations.removeAll();
    rawVisualizations.removeAll();
    loadedVisualizations.removeAll();
    visHandlers.removeAll();
  });
}
