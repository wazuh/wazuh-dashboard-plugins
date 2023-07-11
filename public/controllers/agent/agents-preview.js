/*
 * Wazuh app - Agents preview controller
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import { version } from '../../../package.json';
import { clickAction } from '../../services/click-action';
import { AppState } from '../../react-services/app-state';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { GenericRequest } from '../../react-services/generic-request';
import { WzRequest } from '../../react-services/wz-request';
import { ShareAgent } from '../../factories/share-agent';
import { formatUIDate } from '../../react-services/time-service';
import { ErrorHandler } from '../../react-services/error-handler';
import { getDataPlugin, getToasts } from '../../kibana-services';
import store from '../../redux/store';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { webDocumentationLink } from '../../../common/services/web_documentation';

export class AgentsPreviewController {
  /**
   * Class constructor
   * @param {Object} $scope
   * @param {Object} $location
   * @param {Object} errorHandler
   * @param {Object} csvReq
   */
  constructor(
    $scope,
    $location,
    $route,
    errorHandler,
    csvReq,
    commonData,
    $window,
  ) {
    this.$scope = $scope;
    this.genericReq = GenericRequest;
    this.$location = $location;
    this.$route = $route;
    this.errorHandler = errorHandler;
    this.csvReq = csvReq;
    this.shareAgent = new ShareAgent();
    this.commonData = commonData;
    this.wazuhConfig = new WazuhConfig();
    this.errorInit = false;
    this.$window = $window;
  }

  /**
   * On controller loads
   */
  async $onInit() {
    this.init = true;
    this.api = JSON.parse(AppState.getCurrentAPI()).id;
    const loc = this.$location.search();
    if ((loc || {}).agent && (loc || {}).agent !== '000') {
      this.commonData.setTimefilter(
        getDataPlugin().timefilter.timefilter.getTime(),
      );
      return this.showAgent({ id: loc.agent });
    }

    this.isClusterEnabled =
      AppState.getClusterInfo() &&
      AppState.getClusterInfo().status === 'enabled';
    this.loading = true;
    this.osPlatforms = [];
    this.versions = [];
    this.groups = [];
    this.nodes = [];
    this.mostActiveAgent = {
      name: '',
      id: '',
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
      hasAgents: () => this.hasAgents,
      reload: () => this.$route.reload(),
      getWazuhVersion: () => this.getWazuhVersion(),
      getCurrentApiAddress: () => this.getCurrentApiAddress(),
    };
    this.hasAgents = true;
    this.init = false;
    const instance = new DataFactory(WzRequest.apiReq, '/agents', false, false);
    //Props
    this.tableAgentsProps = {
      updateSummary: summary => {
        this.summary = summary;
        if (this.summary.total === 0) {
          if (this.addingNewAgent === undefined) {
            this.addNewAgent(true);
          }
          this.hasAgents = false;
        } else {
          this.hasAgents = true;
        }
      },
      wzReq: (method, path, body) => WzRequest.apiReq(method, path, body),
      addingNewAgent: () => {
        this.addNewAgent(true);
        this.$scope.$applyAsync();
      },
      downloadCsv: (filters = []) => {
        this.downloadCsv(filters);
        this.$scope.$applyAsync();
      },
      showAgent: agent => {
        this.showAgent(agent);
        this.$scope.$applyAsync();
      },
      getMostActive: async () => {
        return await this.getMostActive();
      },
      clickAction: (item, openAction = false) => {
        clickAction(
          item,
          openAction,
          instance,
          this.shareAgent,
          this.$location,
          this.$scope,
        );
        this.$scope.$applyAsync();
      },
      formatUIDate: date => formatUIDate(date),
      summary: this.summary,
    };
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
      ErrorHandler.info('Your download should begin automatically...', 'CSV');
      const output = await this.csvReq.fetch('/agents', this.api, filters);
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, 'agents.csv');

      return;
    } catch (error) {
      const options = {
        context: `${AgentsPreviewController.name}.downloadCsv`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: `Error exporting CSV: ${error.message || error}`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  async getMostActive() {
    try {
      const data = await this.genericReq.request(
        'GET',
        `/elastic/top/${this.firstUrlParam}/${this.secondUrlParam}/agent.name/${
          this.pattern
        }?agentsList=${store
          .getState()
          .appStateReducers.allowedAgents.toString()}`,
      );
      this.mostActiveAgent.name = data.data.data;
      const info = await this.genericReq.request(
        'GET',
        `/elastic/top/${this.firstUrlParam}/${this.secondUrlParam}/agent.id/${
          this.pattern
        }?agentsList=${store
          .getState()
          .appStateReducers.allowedAgents.toString()}`,
      );
      if (info.data.data === '' && this.mostActiveAgent.name !== '') {
        this.mostActiveAgent.id = '000';
      } else {
        this.mostActiveAgent.id = info.data.data;
      }
      return this.mostActiveAgent;
    } catch (error) {
      const options = {
        context: `${AgentsPreviewController.name}.getMostActive`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `An error occurred while trying to get the most active agent: ${
            error.message || error
          }`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  /**
   * On controller loads
   */
  async load() {
    try {
      this.errorInit = false;
      const clusterInfo = AppState.getClusterInfo();
      this.firstUrlParam =
        clusterInfo.status === 'enabled' ? 'cluster' : 'manager';
      this.secondUrlParam = clusterInfo[this.firstUrlParam];
      this.pattern = (
        await getDataPlugin().indexPatterns.get(AppState.getCurrentPattern())
      ).title;
    } catch (error) {
      const options = {
        context: `${AgentsPreviewController.name}.load`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.CRITICAL,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.message || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
    this.loading = false;
    this.$scope.$applyAsync();
  }

  addNewAgent(flag) {
    this.addingNewAgent = flag;
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
      const options = {
        context: `${AgentsPreviewController.name}.getCurrentApiAddress`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        error: {
          error: error,
          message: error.message || error,
          title: `Could not get the Wazuh API address: ${
            error.message || error
          }`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  /**
   * Returns the Wazuh version as x.y.z
   */
  async getWazuhVersion() {
    try {
      const data = await WzRequest.apiReq('GET', '/', {});
      const result = ((data || {}).data || {}).data || {};
      return result.api_version;
    } catch (error) {
      const options = {
        context: `${AgentsPreviewController.name}.getWazuhVersion`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: `Could not get the Wazuh version: ${error.message || error}`,
        },
      };
      getErrorOrchestrator().handleError(options);
      return version;
    }
  }
}
