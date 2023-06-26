/*
 * Wazuh app - Cluster monitoring controller
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { FilterHandler } from '../../utils/filter-handler';
import { AppState } from '../../react-services/app-state';
import { GenericRequest } from '../../react-services/generic-request';
import { WzRequest } from '../../react-services/wz-request';
import { ErrorHandler } from '../../react-services/error-handler';
import { TabVisualizations } from '../../factories/tab-visualizations';
import store from '../../redux/store';
import { updateGlobalBreadcrumb } from '../../redux/actions/globalBreadcrumbActions';
import { ModulesHelper } from '../../components/common/modules/modules-helper';
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../common/constants';
import { getDataPlugin } from '../../kibana-services';

export function ClusterController(
  $scope,
  $rootScope,
  $timeout,
  errorHandler,
  $window,
  $location,
  discoverPendingUpdates,
  rawVisualizations,
  loadedVisualizations,
  visHandlers
) {
  const tabVisualizations = new TabVisualizations();
  getDataPlugin().query.timefilter.timefilter.setRefreshInterval({ pause: true, value: 0 });
  $scope.search = term => {
    $scope.$broadcast('wazuhSearch', { term });
  };

  const clusterEnabled =
    AppState.getClusterInfo() && AppState.getClusterInfo().status === 'enabled';
  $scope.isClusterEnabled = clusterEnabled;
  $scope.isClusterRunning = true;
  $scope.authorized = true;
  $location.search('tabView', 'cluster-monitoring');
  $location.search('tab', 'monitoring');
  $location.search('_a', null);
  const filterHandler = new FilterHandler(AppState.getCurrentPattern());
  discoverPendingUpdates.removeAll();
  tabVisualizations.removeAll();
  rawVisualizations.removeAll();
  loadedVisualizations.removeAll();
  tabVisualizations.setTab('monitoring');
  tabVisualizations.assign({
    monitoring: 2
  });

  $scope.loading = true;
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
   * This navigates to configuration
   */
  $scope.goConfiguration = () => {
    setBooleans('showConfig');
    tabVisualizations.assign({
      monitoring: 1
    });
    assignFilters();
    $rootScope.$broadcast('updateVis');
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
    $scope.nodeProps = { goBack: () => $scope.goBack() }
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
      tabVisualizations.assign({
        monitoring: 1
      });
      $scope.currentNode = parameters.node;
      const data = await WzRequest.apiReq('GET', '/cluster/healthcheck', {
        node: $scope.currentNode.name
      });

      $scope.currentNode.healthCheck =
        data.data.data.affected_items[0];

      if (
        $scope.currentNode.healthCheck &&
        $scope.currentNode.healthCheck.status
      ) {
        $scope.currentNode.healthCheck.status.last_sync_integrity.duration =
          'n/a';
        $scope.currentNode.healthCheck.status.last_sync_agentinfo.duration =
          'n/a';
        $scope.currentNode.healthCheck.status.last_sync_agentgroups.duration =
          'n/a';

        if (
          $scope.currentNode.healthCheck.status.last_sync_integrity
            .date_start_master !== 'n/a' &&
          $scope.currentNode.healthCheck.status.last_sync_integrity
            .date_end_master !== 'n/a'
        ) {
          const end = new Date(
            $scope.currentNode.healthCheck.status.last_sync_integrity.date_end_master
          );
          const start = new Date(
            $scope.currentNode.healthCheck.status.last_sync_integrity.date_start_master
          );
          $scope.currentNode.healthCheck.status.last_sync_integrity.duration = `${(end -
            start) /
            1000}s`;
        }

        if (
          $scope.currentNode.healthCheck.status.last_sync_agentinfo
            .date_start_master !== 'n/a' &&
          $scope.currentNode.healthCheck.status.last_sync_agentinfo
            .date_end_master !== 'n/a'
        ) {
          const end = new Date(
            $scope.currentNode.healthCheck.status.last_sync_agentinfo.date_end_master
          );
          const start = new Date(
            $scope.currentNode.healthCheck.status.last_sync_agentinfo.date_start_master
          );
          $scope.currentNode.healthCheck.status.last_sync_agentinfo.duration = `${(end -
            start) /
            1000}s`;
        }

        if (
          $scope.currentNode.healthCheck.status.last_sync_agentgroups
            .date_start_master !== 'n/a' &&
          $scope.currentNode.healthCheck.status.last_sync_agentgroups
            .date_end_master !== 'n/a'
        ) {
          const end = new Date(
            $scope.currentNode.healthCheck.status.last_sync_agentgroups.date_end_master
          );
          const start = new Date(
            $scope.currentNode.healthCheck.status.last_sync_agentgroups.date_start_master
          );
          $scope.currentNode.healthCheck.status.last_sync_agentgroups.duration = `${(end -
            start) /
            1000}s`;
        }
      }

      assignFilters($scope.currentNode.name);
      $rootScope.$broadcast('updateVis');

      $scope.$applyAsync();
    } catch (error) {
      ErrorHandler.handle(error, 'Cluster');
    }
  });

  let filters = [];
  /**
   * This creatie custom filters for visualizations for a given node
   * @param {Object} node
   */
  const assignFilters = async (node = false) => {
    try {
      filters = [];
      filters.push(
        filterHandler.managerQuery(AppState.getClusterInfo().cluster, true)
      );
      if (node) {
        filters.push(filterHandler.nodeQuery(node));
      }
      const discoverScope = await ModulesHelper.getDiscoverScope();
      discoverScope.loadFilters(filters);
    } catch (error) {
      ErrorHandler.handle(
        'An error occurred while creating custom filters for visualizations',
        'Cluster',
        { warning: true }
      );
    }
  };

  const clusterStatus = async () => {
    try {
      const status = await WzRequest.apiReq('GET', '/cluster/status', {});
      $scope.authorized = true;
      return status;
    } catch (error) {
      if(error === '3013 - Permission denied: Resource type: *:*')
        $scope.authorized = false
    }
  }

  /**
   * This set some required settings at init
   */
  const load = async () => {

    try {
      visHandlers.removeAll();
      discoverPendingUpdates.removeAll();
      rawVisualizations.removeAll();
      loadedVisualizations.removeAll();
      const status = await clusterStatus();
      if (!status) {
        $scope.permissions = [{action: 'cluster:status', resource: "*:*:*"}];
        $scope.loading = false;
        $scope.$applyAsync()
        return;
      }
      $scope.status = status.data.data.running;
      if ($scope.status === 'no') {
        $scope.isClusterRunning = false;
        $scope.loading = false;
        return;
      }

      const data = await Promise.all([
        WzRequest.apiReq('GET', '/cluster/nodes', {}),
        WzRequest.apiReq('GET', '/cluster/local/config', {}),
        WzRequest.apiReq('GET', '/', {}),
        WzRequest.apiReq('GET', '/agents', { limit: 1 }),
        WzRequest.apiReq('GET', '/cluster/healthcheck', {})
      ]);

      const nodeList = (((data[0] || {}).data || {}).data || {}) || false;
      const clusterConfig = ((((data[1] || {}).data || {}).data || {}) || false);
      const version = (((data[2] || {}).data || {}).data || {}).api_version || false;
      const agents = ((((data[3] || {}).data || {}).data || {}) || false);


      $scope.nodesCount = nodeList.total_affected_items;
      $scope.configuration = clusterConfig.affected_items[0];
      $scope.version = version;
      $scope.agentsCount = agents.total_affected_items - 1;

      nodeList.name = $scope.configuration.name;
      nodeList.master_node = $scope.configuration.node_name;
      const {id, title} = await getDataPlugin().indexPatterns.get(AppState.getCurrentPattern());

      const visData = await GenericRequest.request(
        'POST',
        `/elastic/visualizations/cluster-monitoring/${AppState.getCurrentPattern()}`,
        { nodes: nodeList, pattern: {id, title} }
      );

      rawVisualizations.assignItems(visData.data.raw);
      assignFilters();
      $rootScope.$broadcast('updateVis');

      $scope.loading = false;
      $scope.$applyAsync();
      return;
    } catch (error) {
      $scope.loading = false;
      ErrorHandler.handle(error, 'Cluster');
    }
  };

  $scope.falseAllExpand = () => {
    $scope.expandArray = [false, false];
  };

  $scope.expand = i => {
    const oldValue = $scope.expandArray[i];
    $scope.falseAllExpand();
    $scope.expandArray[i] = !oldValue;
  };

  $scope.expandArray = [false, false];

  const breadcrumb = [
    { text: '' },
    { text: 'Management', href: '#/manager' },
    { text: 'Cluster' }
  ];
  store.dispatch(updateGlobalBreadcrumb(breadcrumb));
  if (clusterEnabled) load();

  //listeners
  $scope.$on('$destroy', () => {
    discoverPendingUpdates.removeAll();
    tabVisualizations.removeAll();
    rawVisualizations.removeAll();
    loadedVisualizations.removeAll();
    visHandlers.removeAll();
  });
}
