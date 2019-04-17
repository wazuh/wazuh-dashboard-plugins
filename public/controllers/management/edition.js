/*
 * Wazuh app - Management configuration controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { ConfigurationHandler } from '../../utils/config-handler';

export class EditionController {
  /**
   * Constructor
   * @param {*} $scope
   * @param {*} $location
   * @param {*} errorHandler
   * @param {*} apiReq
   * @param {*} appState
   * @param {*} wazuhConfig
   */
  constructor(
    $scope,
    $location,
    errorHandler,
    apiReq,
    appState,
    configHandler,
    $rootScope,
    checkDaemonsStatus
  ) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.appState = appState;
    this.configHandler = configHandler;
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.checkDaemonsStatus = checkDaemonsStatus;
    this.load = false;
    this.configurationHandler = new ConfigurationHandler(apiReq, errorHandler);
    this.selectedNode = false;
    this.nodes = [];
    this.editingFile = false;
    this.fetchedXML = false;
  }

  /**
   * When controller loads
   */
  $onInit() {
    this.init();
    this.$scope.$on('showRestart', () => {
      this.restartBtn = true;
      this.$scope.$applyAsync();
    });
  }

  xmlIsValid(valid) {
    this.xmlHasErrors = valid;
    this.$scope.$applyAsync();
  }

  changeNode(refresh = false) {
    this.restartBtn = false;
    refresh ? this.init() : this.editConf();
  }

  async saveConfiguration() {
    try {
      this.doingSaving = true;
      const clusterStatus = ((this.clusterStatus || {}).data || {}).data || {};
      const enabledAndRunning =
        clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
      const parameters = enabledAndRunning
        ? {
            node: this.selectedNode,
            showRestartManager: 'cluster'
          }
        : {
            manager: this.selectedNode,
            showRestartManager: 'manager'
          };
      this.$scope.$applyAsync();
      this.$scope.$broadcast('saveXmlFile', parameters);
    } catch (error) {
      this.fetchedXML = null;
      this.doingSaving = false;
      this.errorHandler.handle(error.message || error);
    }
  }

  toggleSaveConfig() {
    this.doingSaving = false;
    this.$scope.$applyAsync();
  }

  async restartNode(selectedNode) {
    try {
      this.$scope.$emit('setRestarting', {});
      this.$scope.$broadcast('removeRestartMsg', {});
      this.isRestarting = true;
      this.clusterStatus = await this.apiReq.request(
        'GET',
        '/cluster/status',
        {}
      );

      const clusterStatus = ((this.clusterStatus || {}).data || {}).data || {};

      const isCluster =
        clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';

      isCluster
        ? await this.configHandler.restartNode(selectedNode)
        : await this.configHandler.restartManager();
      this.$rootScope.wazuhNotReadyYet = `Restarting ${
        isCluster ? selectedNode : 'manager'
      }, please wait. `;
      this.checkDaemonsStatus.makePing();
      this.isRestarting = false;
      this.$scope.$applyAsync();
    } catch (error) {
      this.errorHandler.handle(error.message || error);
      this.$scope.$emit('removeBlockEdition', {});
      this.$scope.$emit('removeRestarting', {});
      this.isRestarting = false;
    }
  }

  async editConf() {
    this.editingFile = true;
    this.fetchedXML = false;
    try {
      this.fetchedXML = await this.fetchFile();
      this.$scope.$broadcast('fetchedFile', { data: this.$scope.fetchedXML });
    } catch (error) {
      const doNotShow =
        typeof error === 'string' &&
        error.includes('Wazuh API error') &&
        error.includes('3022');
      this.fetchedXML = null;
      !doNotShow && this.errorHandler.handle(error.message || error);
    }
    this.$scope.$applyAsync();
  }

  /**
   * Edit master/worker node configuration if cluster is enabled, otherwise edit manager configuration
   */
  async fetchFile() {
    try {
      this.failedNode = false;
      const clusterStatus = ((this.clusterStatus || {}).data || {}).data || {};

      const clusterEnabled =
        clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';

      const data = await this.apiReq.request(
        'GET',
        clusterEnabled
          ? `/cluster/${this.selectedNode}/files`
          : `/manager/files`,
        { path: 'etc/ossec.conf' }
      );

      let xml = ((data || {}).data || {}).data || false;

      if (!xml) {
        throw new Error('Could not fetch configuration file');
      }

      xml = xml.replace(/..xml.+\?>/, '');

      return xml;
    } catch (error) {
      this.failedNode = true;
      return Promise.reject(error);
    }
  }

  async init() {
    try {
      this.clusterStatus = await this.apiReq.request(
        'GET',
        '/cluster/status',
        {}
      );
      const clusterStatus = ((this.clusterStatus || {}).data || {}).data || {};
      if (clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes') {
        const nodes = await this.apiReq.request('GET', '/cluster/nodes', {});
        const items = nodes.data.data.items;
        this.nodes = items.reverse();
        const masterNode = items.filter(item => item.type === 'master')[0];
        this.selectedNode = masterNode.name;
      } else {
        this.selectedNode = 'manager';
      }
    } catch (error) {
      this.errorHandler.handle(error.message || error);
    }

    this.editConf();
    this.$scope.$applyAsync();
  }
}
