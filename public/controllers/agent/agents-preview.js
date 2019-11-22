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
import { DataFactory } from '../../services/data-factory';
import { timefilter } from 'ui/timefilter';
import { version } from '../../../package.json';
import { clickAction } from '../../directives/wz-table/lib/click-action';

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
    apiReq,
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
    this.apiReq = apiReq;
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
    this.api = JSON.parse(this.appState.getCurrentAPI()).id;
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
    this.prevSearch = false;

    // Load URL params
    if (loc && loc.tab) {
      this.submenuNavItem = loc.tab;
    }

    // Watcher for URL params
    this.$scope.$watch('submenuNavItem', () => {
      this.$location.search('tab', this.submenuNavItem);
    });

    this.$scope.$on('wazuhFetched', evt => {
      evt.stopPropagation();
    });

    this.registerAgentsProps = {
      addNewAgent: flag => this.addNewAgent(flag),
      getWazuhVersion: () => this.getWazuhVersion(),
      getCurrentApiAddress: () => this.getCurrentApiAddress(),
      needsPassword: () => this.needsPassword()
    };
    this.hasAgents = true;
    this.init = false;
    const instance = new DataFactory(
      this.apiReq,
      '/agents',
      false,
      false
    )
    //Props
    this.tableAgentsProps = {
      wzReq: (method, path, body) => this.apiReq.request(method, path, body),
      addingNewAgent: () => { this.addNewAgent(true); this.$scope.$applyAsync() },
      downloadCsv: (filters = []) => { this.downloadCsv(filters); this.$scope.$applyAsync() },
      showAgent: (agent) => { this.showAgent(agent); this.$scope.$applyAsync() },
      getMostActive: async () => { return await this.getMostActive() },
      clickAction: (item, openAction = false) => {
        clickAction(
          item,
          openAction,
          instance,
          this.shareAgent,
          this.$location,
          this.$scope,
          this.appState
        );
        this.$scope.$applyAsync()
      },
      timeService: (date) => this.timeService.offset(date),
    }
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
    this.prevSearch = search || false;
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
  async downloadCsv(filters) {
    try {
      this.errorHandler.info(
        'Your download should begin automatically...',
        'CSV'
      );
      const output = await this.csvReq.fetch(
        '/agents',
        this.api,
        filters
      );
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, 'agents.csv');

      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Download CSV');
    }
    return;
  }

  async getMostActive() {
    try {
      const data = await this.genericReq.request(
        'GET',
        `/elastic/top/${this.firstUrlParam}/${this.secondUrlParam}/agent.name/${this.pattern}`
      )
      this.mostActiveAgent.name = data.data.data;
      const info = await this.genericReq.request(
        'GET',
        `/elastic/top/${this.firstUrlParam}/${this.secondUrlParam}/agent.id/${this.pattern}`
      );
      if (info.data.data === '' && this.mostActiveAgent.name !== '') {
        this.mostActiveAgent.id = '000';
      } else {
        this.mostActiveAgent.id = info.data.data;
      }
      return this.mostActiveAgent;
    } catch (error) { }
  }

  /**
   * On controller loads
   */
  async load() {
    try {
      this.errorInit = false;

      const configuration = this.wazuhConfig.getConfig();
      this.$scope.adminMode = !!(configuration || {}).admin;

      const clusterInfo = this.appState.getClusterInfo();
      this.firstUrlParam =
        clusterInfo.status === 'enabled' ? 'cluster' : 'manager';
      this.secondUrlParam = clusterInfo[this.firstUrlParam];

      this.pattern = this.appState.getCurrentPattern();
    } catch (error) {
      this.errorInit = this.errorHandler.handle(error, false, false, true);
    }
    this.loading = false;
    this.$scope.$applyAsync();

    return;
  }

  addNewAgent(flag) {
    this.addingNewAgent = flag;
  }

  openRegistrationDocs() {
    this.$window.open(
      'https://documentation.wazuh.com/current/user-manual/registering/index.html',
      '_blank'
    );
  }

  /**
   * Returns if the password is neccesary to register a new agent
   */
  async needsPassword() {
    try {
      const result = await this.apiReq.request(
        'GET',
        '/agents/000/config/auth/auth',
        {}
      );
      const auth = ((result.data || {}).data || {}).auth || {};
      const usePassword = auth.use_password === 'yes';
      return usePassword;
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns the current API address
   */
  async getCurrentApiAddress() {
    try {
      const result = await this.genericReq.request('GET', '/hosts/apis');
      const entries = result.data || [];
      const host = entries.filter(e => {
        return e.id == this.api;
      });
      const url = host[0].url;
      const numToClean = url.startsWith('https://') ? 8 : 7;
      return url.substr(numToClean);
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns the Wazuh version as x.y.z
   */
  async getWazuhVersion() {
    try {
      const data = await this.apiReq.request('GET', '/version', {});
      const result = ((data || {}).data || {}).data;
      return result ? result.substr(1) : version;
    } catch (error) {
      return version;
    }
  }
}
