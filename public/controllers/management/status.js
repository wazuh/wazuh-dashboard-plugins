/*
 * Wazuh app - Management status controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class StatusController {
  constructor($scope, errorHandler, apiReq, wazuhConfig, timeService) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.load = true;
    this.nodes = [];
    this.selectedNode = false;
    this.clusterError = false;
    this.wazuhConfig = wazuhConfig;
    this.timeService = timeService;
  }

  /**
   * Initialize
   */
  $onInit() {
    return this.init();
  }

  /**
   * Used to show green/red depending on daemon status
   * @param {*} daemonStatus
   */
  getDaemonStatusClass(daemonStatus) {
    return daemonStatus === 'running' ? 'status teal' : 'status red';
  }

  objToArr(obj) {
    const arr = [];
    for (const key in obj) arr.push({ key, value: obj[key] });
    return arr;
  }

  offsetTimestamp(time) {
    try {
      return this.timeService.offset(time);
    } catch (error) {
      return time === (!'-' && !undefined) ? `${time} (UTC)` : time || '-';
    }
  }

  /**
   * Fetchs all required data
   */
  async init() {
    try {
      const configuration = this.wazuhConfig.getConfig();
      this.$scope.adminMode = !!(configuration || {}).admin;

      const agSumm = await this.apiReq.request('GET', '/agents/summary', {});
      const clusStat = await this.apiReq.request('GET', '/cluster/status', {});
      const manInfo = await this.apiReq.request('GET', '/manager/info', {});

      const data = [];
      data.push(agSumm);
      data.push(clusStat);
      data.push(manInfo);

      const parsedData = data.map(
        item => ((item || {}).data || {}).data || false
      );
      const [stats, clusterStatus, managerInfo] = parsedData;

      // Once Wazuh core fixes agent 000 issues, this should be adjusted
      const active = stats.Active - 1;
      const total = stats.Total - 1;
      this.agentsCountActive = active;
      this.agentsCountDisconnected = stats.Disconnected;
      this.agentsCountNeverConnected = stats['Never connected'];
      this.agentsCountTotal = total;

      this.agentsCoverity = total ? (active / total) * 100 : 0;

      if (
        clusterStatus &&
        clusterStatus.enabled === 'yes' &&
        clusterStatus.running === 'yes'
      ) {
        const nodes = await this.apiReq.request('GET', '/cluster/nodes', {});
        this.nodes = nodes.data.data.items.reverse();
        const masterNode = nodes.data.data.items.filter(
          item => item.type === 'master'
        )[0];
        const daemons = await this.apiReq.request(
          'GET',
          `/cluster/${masterNode.name}/status`,
          {}
        );
        this.daemons = this.objToArr(daemons.data.data);
        this.selectedNode = masterNode.name;
        const nodeInfo = await this.apiReq.request(
          'GET',
          `/cluster/${masterNode.name}/info`,
          {}
        );
        this.managerInfo = nodeInfo.data.data;
      } else if (
        clusterStatus &&
        clusterStatus.enabled === 'yes' &&
        clusterStatus.running === 'no'
      ) {
        this.clusterError = `Cluster is enabled but it's not running, please check your cluster health.`;
      } else {
        const daemons = await this.apiReq.request('GET', '/manager/status', {});
        this.daemons = this.objToArr(daemons.data.data);
        this.managerInfo = managerInfo;
      }

      const lastAgentRaw = await this.apiReq.request('GET', '/agents', {
        limit: 1,
        sort: '-dateAdd'
      });
      const [lastAgent] = lastAgentRaw.data.data.items;

      this.agentInfo = lastAgent;
      this.load = false;

      this.$scope.$applyAsync();

      return;
    } catch (error) {
      this.load = false;
      return this.errorHandler.handle(error.message || error);
    }
  }

  /**
   * This change to a selected node
   * @param {String} node
   */
  async changeNode(node) {
    try {
      this.clusterError = false;
      this.load = true;
      const daemons = await this.apiReq.request(
        'GET',
        `/cluster/${node}/status`,
        {}
      );
      this.daemons = this.objToArr(daemons.data.data);

      const nodeInfo = await this.apiReq.request(
        'GET',
        `/cluster/${node}/info`,
        {}
      );
      this.managerInfo = nodeInfo.data.data;

      this.load = false;
      this.$scope.$applyAsync();
    } catch (error) {
      this.load = false;
      this.clusterError = `Node ${node} is down`;
    }

    this.$scope.$applyAsync();
    return;
  }
}
