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
  constructor($scope, $location, errorHandler, apiReq, appState, configHandler) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.appState = appState;
    this.configHandler = configHandler;
    this.$location = $location;
    this.$scope.load = false;
    this.configurationHandler = new ConfigurationHandler(apiReq, errorHandler);
    this.$scope.selectedNode = false;
    this.$scope.nodes = [];
    this.$scope.editingFile = false;
    this.$scope.fetchedXML = false;
  }

  /**
   * When controller loads
   */
  $onInit() {
    this.init();

    /**
     * Edit master/worker node configuration if cluster is enabled, otherwise edit manager configuration
     */
    const fetchFile = async () => {
      try {
        let data = false;
        let xml = false;
        if (this.$scope.clusterStatus.data.data.enabled === 'yes' && this.$scope.clusterStatus.data.data.running === 'yes') {
          data = await this.apiReq.request(
            'GET',
            `/cluster/${this.$scope.selectedNode}/files`,
            { path: 'etc/ossec.conf' }
          );
        } else {
          data = await this.apiReq.request('GET', `/manager/files`, {
            path: 'etc/ossec.conf'
          });
        }

        xml = ((data || {}).data || {}).data || false;
        if (!xml) {
          throw new Error('Could not fetch configuration file');
        }
        xml = xml.replace(/..xml.+\?>/, '');
        return xml;
      } catch (error) {
        return Promise.reject(error);
      }
    };

    this.$scope.editConf = async () => {
      this.$scope.editingFile = true;
      this.$scope.fetchedXML = false;
      try {
        this.$scope.fetchedXML = await fetchFile();
        this.$scope.$broadcast('fetchedFile', { data: this.$scope.fetchedXML });
      } catch (error) {
        this.$scope.fetchedXML = null;
        this.errorHandler.handle(error, 'Fetch file error');
      }
      if (!this.$scope.$$phase) this.$scope.$digest();
    };

    this.$scope.restartNode = async (selectedNode) => {
      try {
        this.$scope.$emit('setRestarting', {});
        this.$scope.isRestarting = true;
        this.$scope.clusterStatus = await this.apiReq.request(
          'GET',
          '/cluster/status',
          {}
        );
        let data;
        if (this.$scope.clusterStatus.data.data.enabled === 'yes' && this.$scope.clusterStatus.data.data.running === 'yes') {
          data = await this.configHandler.restartNode(selectedNode);
        } else {
          data = await this.configHandler.restartManager();
        }
        this.$scope.$emit('removeRestarting', {});
        this.$scope.isRestarting = false;
        this.errorHandler.info('It may take a few seconds...', data.data.data);
        this.$scope.$applyAsync();
      } catch (error) {
        this.errorHandler.handle(error.message || error, 'Error restarting node');
        this.$scope.$emit('removeRestarting', {});
        this.$scope.isRestarting = false;
      }
    }
    this.$scope.saveConfiguration = async () => {
      try {
        if (this.$scope.clusterStatus.data.data.enabled === 'yes' && this.$scope.clusterStatus.data.data.running === 'yes') {
          this.$scope.$broadcast('saveXmlFile', {
            node: this.$scope.selectedNode,
            showRestartManager: 'cluster'
          });
        } else {
          this.$scope.$broadcast('saveXmlFile', {
            manager: this.$scope.selectedNode,
            showRestartManager: 'manager'
          });
        }
      } catch (error) {
        this.$scope.fetchedXML = null;
        this.errorHandler.handle(error, 'Save file error');
      }
    };

    this.$scope.xmlIsValid = valid => {
      this.$scope.xmlHasErrors = valid;
      if (!this.$scope.$$phase) this.$scope.$digest();
    };

    this.$scope.edit = node => {
      this.$scope.selectedNode = node.name;
      return this.$scope.editConf();
    };

    this.$scope.changeNode = () => {
      this.$scope.editConf();
    };

    this.$scope.closeEditingFile = () => { };

    //listeners
    this.$scope.$on('wazuhShowNode', (event, parameters) => {
      return this.$scope.edit(parameters.node);
    });
  }

  async init() {
    try {
      this.$scope.clusterStatus = await this.apiReq.request(
        'GET',
        '/cluster/status',
        {}
      );
      if (
        this.$scope.clusterStatus &&
        this.$scope.clusterStatus.data.data.enabled === 'yes' &&
        this.$scope.clusterStatus.data.data.running === 'yes'
      ) {
        const nodes = await this.apiReq.request('GET', '/cluster/nodes', {});
        this.$scope.nodes = nodes.data.data.items.reverse();
        const masterNode = nodes.data.data.items.filter(
          item => item.type === 'master'
        )[0];
        this.$scope.selectedNode = masterNode.name;
      } else {
        this.$scope.selectedNode = 'manager';
      }
    } catch (error) {
      this.errorHandler.handle(error, 'Error getting cluster status');
    }

    this.$scope.editConf();
    if (!this.$scope.$$phase) this.$scope.$digest();
  }
}
