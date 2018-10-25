/*
 * Wazuh app - Management status controller
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

const app = uiModules.get('app/wazuh', []);

class StatusController {
  constructor($scope, errorHandler, apiReq) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.$scope.load = true;
    this.$scope.nodes = [];
    this.$scope.selectedNode = false;
    this.$scope.clusterError = false;
    this.$scope.getDaemonStatusClass = daemonStatus =>
      this.getDaemonStatusClass(daemonStatus);
    this.$scope.changeNode = node => this.changeNode(node);
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

  /**
   * Fetchs all required data
   */
  async init() {
    try {
      const data = await Promise.all([
        this.apiReq.request('GET', '/agents/summary', {}),
        this.apiReq.request('GET', '/cluster/status', {}),
        this.apiReq.request('GET', '/manager/info', {})
      ]);

      const parsedData = data.map(
        item => (item && item.data && item.data.data ? item.data.data : false)
      );
      const [stats, clusterStatus, managerInfo] = parsedData;

      // Once Wazuh core fixes agent 000 issues, this should be adjusted
      const active = stats.Active - 1;
      const total = stats.Total - 1;
      this.$scope.agentsCountActive = active;
      this.$scope.agentsCountDisconnected = stats.Disconnected;
      this.$scope.agentsCountNeverConnected = stats['Never connected'];
      this.$scope.agentsCountTotal = total;

      this.$scope.agentsCoverity = total ? (active / total) * 100 : 0;

      if (
        clusterStatus &&
        clusterStatus.enabled === 'yes' &&
        clusterStatus.running === 'yes'
      ) {
        const nodes = await this.apiReq.request('GET', '/cluster/nodes', {});
        this.$scope.nodes = nodes.data.data.items.reverse();
        const masterNode = nodes.data.data.items.filter(
          item => item.type === 'master'
        )[0];
        const daemons = await this.apiReq.request(
          'GET',
          `/cluster/${masterNode.name}/status`,
          {}
        );
        this.$scope.daemons = daemons.data.data;
        this.$scope.selectedNode = masterNode.name;
        const nodeInfo = await this.apiReq.request(
          'GET',
          `/cluster/${masterNode.name}/info`,
          {}
        );
        this.$scope.managerInfo = nodeInfo.data.data;
      } else if (
        clusterStatus &&
        clusterStatus.enabled === 'yes' &&
        clusterStatus.running === 'no'
      ) {
        this.$scope.clusterError = `Cluster is enabled but it's not running, please check your cluster health.`;
      } else {
        const daemons = await this.apiReq.request('GET', '/manager/status', {});
        this.$scope.daemons = daemons.data.data;
        this.$scope.managerInfo = managerInfo;
      }

      const lastAgentRaw = await this.apiReq.request('GET', '/agents', {
        limit: 1,
        sort: '-dateAdd'
      });
      const [lastAgent] = lastAgentRaw.data.data.items;
      const agentInfo = await this.apiReq.request(
        'GET',
        `/agents/${lastAgent.id}`,
        {}
      );

      this.$scope.agentInfo = agentInfo.data.data;
      this.$scope.load = false;

      if (!this.$scope.$$phase) this.$scope.$digest();

      return;
    } catch (error) {
      this.$scope.load = false;
      return this.errorHandler.handle(error, 'Manager');
    }
  }

  async changeNode(node) {
    try {
      this.$scope.clusterError = false;
      this.$scope.load = true;
      const daemons = await this.apiReq.request(
        'GET',
        `/cluster/${node}/status`,
        {}
      );
      this.$scope.daemons = daemons.data.data;

      const nodeInfo = await this.apiReq.request(
        'GET',
        `/cluster/${node}/info`,
        {}
      );
      this.$scope.managerInfo = nodeInfo.data.data;

      this.$scope.load = false;
      if (!this.$scope.$$phase) this.$scope.$digest();
    } catch (error) {
      this.$scope.load = false;
      this.$scope.clusterError = `Node ${node} is down`;
    }

    if (!this.$scope.$$phase) this.$scope.$digest();
    return;
  }
}

app.controller('managerStatusController', StatusController);
