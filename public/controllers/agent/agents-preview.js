/*
 * Wazuh app - Agents preview controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';
import * as FileSaver from '../../services/file-saver';

const app = uiModules.get('app/wazuh', []);

class AgentsPreviewController {
  constructor(
    $scope,
    $routeParams,
    genericReq,
    appState,
    $location,
    errorHandler,
    csvReq,
    shareAgent,
    wzTableFilter
  ) {
    this.$scope = $scope;
    this.$routeParams = $routeParams;
    this.genericReq = genericReq;
    this.appState = appState;
    this.$location = $location;
    this.errorHandler = errorHandler;
    this.csvReq = csvReq;
    this.shareAgent = shareAgent;
    this.wzTableFilter = wzTableFilter;
  }

  $onInit() {
    this.$scope.init = true;
    const loc = this.$location.search();
    if(loc && loc.agent && loc.agent !== '000') return this.showAgent({id:loc.agent})

    this.$scope.search = term => {
      this.$scope.$broadcast('wazuhSearch', { term });
    };

    this.$scope.filter = filter => {
      this.$scope.$broadcast('wazuhFilter', { filter });
    };

    this.$scope.isClusterEnabled =
      this.appState.getClusterInfo() &&
      this.appState.getClusterInfo().status === 'enabled';

    this.$scope.loading = true;
    this.$scope.status = 'all';
    this.$scope.osPlatform = 'all';
    this.$scope.version = 'all';
    this.$scope.osPlatforms = [];
    this.$scope.versions = [];
    this.$scope.groups = [];
    this.$scope.nodes = [];
    this.$scope.node_name = 'all';
    this.$scope.mostActiveAgent = {
      name: '',
      id: ''
    };

    // Load URL params
    if (this.$routeParams.tab) {
      this.$scope.submenuNavItem = this.$routeParams.tab;
    }

    // Watcher for URL params
    this.$scope.$watch('submenuNavItem', () => {
      this.$location.search('tab', this.$scope.submenuNavItem);
    });

    this.$scope.downloadCsv = async () => this.downloadCsv();
    this.$scope.showAgent = agent => this.showAgent(agent);
    this.$scope.init = false;
    //Load
    this.load();
  }

  showAgent(agent) {
    this.shareAgent.setAgent(agent);
    this.$location.path('/agents');
  }

  async downloadCsv() {
    try {
      this.errorHandler.info(
        'Your download should begin automatically...',
        'CSV'
      );
      const currentApi = JSON.parse(this.appState.getCurrentAPI()).id;
      const output = await this.csvReq.fetch(
        '/agents',
        currentApi,
        this.wzTableFilter.get()
      );
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, 'agents.csv');

      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Download CSV');
    }
    return;
  }

  async load() {
    try {
      const api = JSON.parse(this.appState.getCurrentAPI()).id;
      const clusterInfo = this.appState.getClusterInfo();
      const firstUrlParam =
        clusterInfo.status === 'enabled' ? 'cluster' : 'manager';
      const secondUrlParam = clusterInfo[firstUrlParam];

      const pattern = this.appState.getCurrentPattern();

      const data = await Promise.all([
        this.genericReq.request(
          'GET',
          '/api/wazuh-api/agents-unique/' + api,
          {}
        ),
        this.genericReq.request(
          'GET',
          `/api/wazuh-elastic/top/${firstUrlParam}/${secondUrlParam}/agent.name/${pattern}`
        )
      ]);
      const [agentsUnique, agentsTop] = data;
      const unique = agentsUnique.data.result;

      this.$scope.groups = unique.groups;
      this.$scope.nodes = unique.nodes.map(item => ({ id: item }));
      this.$scope.versions = unique.versions.map(item => ({ id: item }));
      this.$scope.osPlatforms = unique.osPlatforms;
      this.$scope.lastAgent = unique.lastAgent;
      this.$scope.agentsCountActive = unique.summary.agentsCountActive;
      this.$scope.agentsCountDisconnected =
        unique.summary.agentsCountDisconnected;
      this.$scope.agentsCountNeverConnected =
        unique.summary.agentsCountNeverConnected;
      this.$scope.agentsCountTotal = unique.summary.agentsCountTotal;
      this.$scope.agentsCoverity = unique.summary.agentsCoverity;

      if (agentsTop.data.data === '') {
        this.$scope.mostActiveAgent.name = this.appState.getClusterInfo().manager;
        this.$scope.mostActiveAgent.id = '000';
      } else {
        this.$scope.mostActiveAgent.name = agentsTop.data.data;
        const info = await this.genericReq.request(
          'GET',
          `/api/wazuh-elastic/top/${firstUrlParam}/${secondUrlParam}/agent.id/${pattern}`
        );
        if (info.data.data === '' && this.$scope.mostActiveAgent.name !== '') {
          this.$scope.mostActiveAgent.id = '000';
        } else {
          this.$scope.mostActiveAgent.id = info.data.data;
        }
      }

      this.$scope.loading = false;
      if (!this.$scope.$$phase) this.$scope.$digest();
      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Agents Preview');
    }
    return;
  }
}

app.controller('agentsPreviewController', AgentsPreviewController);
