/*
 * Wazuh app - Agents preview controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import * as FileSaver from '../../services/file-saver';
import { timefilter } from 'ui/timefilter';

export class AgentsPreviewController {
  /**
   * Class constructor
   * @param {Object} $scope
   * @param {Object} genericReq
   * @param {Object} appState
   * @param {Object} $location
   * @param {Object} errorHandler
   * @param {Object} csvReq
   * @param {Object} shareAgent
   * @param {Object} wzTableFilter
   */
  constructor(
    $scope,
    genericReq,
    appState,
    $location,
    errorHandler,
    csvReq,
    shareAgent,
    wzTableFilter,
    commonData,
    wazuhConfig,
    $window,
    timeService
  ) {
    this.$scope = $scope;
    this.genericReq = genericReq;
    this.appState = appState;
    this.$location = $location;
    this.errorHandler = errorHandler;
    this.csvReq = csvReq;
    this.shareAgent = shareAgent;
    this.wzTableFilter = wzTableFilter;
    this.commonData = commonData;
    this.wazuhConfig = wazuhConfig;
    this.errorInit = false;
    this.$window = $window;
    this.timeService = timeService;
  }

  /**
   * On controller loads
   */
  $onInit() {
    this.init = true;
    const loc = this.$location.search();
    if ((loc || {}).agent && (loc || {}).agent !== '000') {
      this.commonData.setTimefilter(timefilter.getTime());
      return this.showAgent({ id: loc.agent });
    }

    this.isClusterEnabled =
      this.appState.getClusterInfo() &&
      this.appState.getClusterInfo().status === 'enabled';

    this.loading = true;
    this.osPlatforms = [];
    this.versions = [];
    this.groups = [];
    this.nodes = [];
    this.mostActiveAgent = {
      name: '',
      id: ''
    };

    // Load URL params
    if (loc && loc.tab) {
      this.submenuNavItem = loc.tab;
    }

    // Watcher for URL params
    this.$scope.$watch('submenuNavItem', () => {
      this.$location.search('tab', this.submenuNavItem);
    });

    this.$scope.$on('wazuhFetched', (ev, parameters) => {
      ev.stopPropagation();
      this.$scope.showNoAgents =
        !parameters.items.length > 0 && !parameters.filters.length;
    });

    this.init = false;
    //Load
    this.load();
  }

  /**
   * Searches by a query and term
   * @param {String} query
   * @param {String} search
   */
  query(query, search) {
    this.$scope.$broadcast('wazuhQuery', { query, search });
  }

  /**
   * Selects an agent
   * @param {String} agent
   */
  showAgent(agent) {
    this.shareAgent.setAgent(agent);
    this.$location.path('/agents');
  }

  /**
   * Exports the table in CSV format
   */
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

  /**
   * On controller loads
   */
  async load() {
    try {
      this.errorInit = false;

      const configuration = this.wazuhConfig.getConfig();
      this.$scope.adminMode = !!(configuration || {}).admin;

      const api = JSON.parse(this.appState.getCurrentAPI()).id;
      const clusterInfo = this.appState.getClusterInfo();
      const firstUrlParam =
        clusterInfo.status === 'enabled' ? 'cluster' : 'manager';
      const secondUrlParam = clusterInfo[firstUrlParam];

      const pattern = this.appState.getCurrentPattern();

      const data = await Promise.all([
        this.genericReq.request('GET', '/api/agents-unique/' + api, {}),
        this.genericReq.request(
          'GET',
          `/elastic/top/${firstUrlParam}/${secondUrlParam}/agent.name/${pattern}`
        )
      ]);
      const [agentsUnique, agentsTop] = data;
      const unique = agentsUnique.data.result;

      this.searchBarModel = {
        name: [],
        status: ['Active', 'Disconnected', 'Never connected'],
        group: unique.groups,
        version: unique.versions,
        'os.platform': unique.osPlatforms.map(x => x.platform),
        'os.version': unique.osPlatforms.map(x => x.version),
        'os.name': unique.osPlatforms.map(x => x.name)
      };

      if (clusterInfo.status === 'enabled' && unique.nodes) {
        this.searchBarModel.node_name = unique.nodes;
      }

      this.searchBarModel['os.name'] = Array.from(
        new Set(this.searchBarModel['os.name'])
      );
      this.searchBarModel['os.version'] = Array.from(
        new Set(this.searchBarModel['os.version'])
      );
      this.searchBarModel['os.platform'] = Array.from(
        new Set(this.searchBarModel['os.platform'])
      );
      this.groups = unique.groups;
      this.nodes = unique.nodes.map(item => ({ id: item }));
      this.versions = unique.versions.map(item => ({ id: item }));
      this.osPlatforms = unique.osPlatforms;
      this.lastAgent = unique.lastAgent;
      this.agentsCountActive = unique.summary.agentsCountActive;
      this.agentsCountDisconnected = unique.summary.agentsCountDisconnected;
      this.agentsCountNeverConnected = unique.summary.agentsCountNeverConnected;
      this.agentsCountTotal = unique.summary.agentsCountTotal;
      this.agentsCoverity = unique.summary.agentsCoverity;

      if (agentsTop.data.data === '') {
        this.mostActiveAgent.name = this.appState.getClusterInfo().manager;
        this.mostActiveAgent.id = '000';
      } else {
        this.mostActiveAgent.name = agentsTop.data.data;
        const info = await this.genericReq.request(
          'GET',
          `/elastic/top/${firstUrlParam}/${secondUrlParam}/agent.id/${pattern}`
        );
        if (info.data.data === '' && this.mostActiveAgent.name !== '') {
          this.mostActiveAgent.id = '000';
        } else {
          this.mostActiveAgent.id = info.data.data;
        }
      }
    } catch (error) {
      this.errorInit = this.errorHandler.handle(error, false, false, true);
    }
    this.loading = false;
    this.$scope.$applyAsync();
    return;
  }

  registerNewAgent(flag) {
    this.$scope.registerNewAgent = flag;
  }

  reloadList() {
    this.$scope.$broadcast('wazuhSearch', { term: '' });
  }

  openRegistrationDocs() {
    this.$window.open(
      'https://documentation.wazuh.com/current/user-manual/registering/index.html',
      '_blank'
    );
  }
}
