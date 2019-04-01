/*
 * Wazuh app - Management edit groups configuration controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class ConfigurationGroupsController {
  /**
   * Constructor
   * @param {*} $scope
   * @param {*} $location
   * @param {*} errorHandler
   * @param {*} apiReq
   * @param {*} appState
   */
  constructor($scope, $location, errorHandler, apiReq, appState, groupHandler) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.appState = appState;
    this.$location = $location;
    this.$scope.load = false;
    this.$scope.isArray = Array.isArray;
    this.groupHandler = groupHandler;
    this.$scope.currentConfig = null;
    this.$scope.addingGroup = false;
  }

  async fetchFile() {
    try {
      const data = await this.apiReq.request(
        'GET',
        `/agents/groups/${this.$scope.selectedItem.name}/files/agent.conf`,
        { format: 'xml' }
      );
      const xml = ((data || {}).data || {}).data || false;

      if (!xml) {
        throw new Error('Could not fetch agent.conf file');
      }
      return xml;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * When controller loads
   */
  $onInit() {
    /**
     * This perfoms a search by a given term
     * @param {String} term
     */
    this.$scope.search = term => {
      this.$scope.$broadcast('wazuhSearch', { term });
    };
    this.clusterInfo = this.appState.getClusterInfo();
    this.$scope.editConfig = async () => {
      this.$scope.editingFile = true;
      try {
        this.$scope.fetchedXML = await this.fetchFile();
        this.$location.search('editingFile', true);
        this.appState.setNavigation({ status: true });
        this.$scope.$applyAsync();
        this.$scope.$broadcast('fetchedFile', { data: this.$scope.fetchedXML });
      } catch (error) {
        this.$scope.fetchedXML = null;
        this.errorHandler.handle(error, 'Fetch file error');
      }
    };
    this.$scope.closeEditingFile = () => {
      this.$scope.editingFile = false;
      this.$scope.fetchedXML = null;
      this.appState.setNavigation({ status: true });
      this.$scope.$broadcast('closeEditXmlFile', {});
      this.$scope.$applyAsync();
    };
    this.$scope.xmlIsValid = valid => {
      this.$scope.xmlHasErrors = valid;
      this.$scope.$applyAsync();
    };
    this.$scope.doSaveConfig = () => {
      this.$scope.editingFile = false;
      this.$scope.$broadcast('saveXmlFile', {
        group: this.$scope.selectedItem.name,
        showRestartManager:
          this.clusterInfo.status === 'enabled' ? 'cluster' : 'manager'
      });
    };
    this.$scope.switchAddingGroup = () => {
      this.$scope.addingGroup = !this.$scope.addingGroup;
    };
    this.$scope.createGroup = async name => {
      try {
        this.$scope.addingGroup = false;
        await this.groupHandler.createGroup(name);
        this.errorHandler.info(`Group ${name} has been created`);
      } catch (error) {
        this.errorHandler.handle(error.message || error);
      }
      this.$scope.$broadcast('wazuhSearch', {});
    };

    this.$scope.closeEditingFile();
    this.$scope.selectData;
    this.$scope.custom_search = '';
    this.$scope.selectedItem = false;

    this.$scope.$applyAsync();

    //listeners
    this.$scope.$on('wazuhShowGroup', (ev, parameters) => {
      ev.stopPropagation();
      this.$scope.selectedItem = parameters.group;
      this.$scope.editConfig();
      this.$scope.$applyAsync();
    });
  }
}
