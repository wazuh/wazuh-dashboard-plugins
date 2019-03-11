/*
 * Wazuh app - Ruleset controllers
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export class FilesController {
  constructor($scope, wazuhConfig, rulesetHandler, errorHandler, appState) {
    this.$scope = $scope;
    this.wazuhConfig = wazuhConfig;
    this.rulesetHandler = rulesetHandler;
    this.errorHandler = errorHandler;
    this.appState = appState;
    this.appliedFilters = [];
    this.searchTerm = '';
  }

  $onInit() {
    const configuration = this.wazuhConfig.getConfig();
    this.adminMode = !!(configuration || {}).admin;
    this.filesSubTab = 'rules';

    this.$scope.$on('editFile', (ev, params) => {
      this.editFile(params);
      this.$scope.$applyAsync();
    });

    this.$scope.closeEditingFile = () => {
      this.$scope.editingFile = false;
      this.$scope.fetchedXML = null;
      this.$scope.$applyAsync();
    };

    this.$scope.doSaveConfig = () => {
      const clusterInfo = this.appState.getClusterInfo();
      const showRestartManager =
        clusterInfo.status === 'enabled' ? 'cluster' : 'manager';
      this.$scope.doingSaving = true;
      const objParam = { showRestartManager };
      this.$scope.currentFile.type === 'rule' ?
        objParam.rule = this.$scope.currentFile :
        objParam.decoder = this.$scope.currentFile;
      this.$scope.$broadcast('saveXmlFile', objParam);
      this.$scope.$applyAsync();
    };

    this.$scope.toggleSaveConfig = () => {
      this.$scope.doingSaving = false;
      this.$scope.$applyAsync();
    };

    this.$scope.toggleRestartMsg = () => {
      this.$scope.restartMsg = false;
      this.$scope.$applyAsync();
    };

    this.$scope.$on('showRestartMsg', () => {
      this.$scope.restartMsg = true;
      this.$scope.$applyAsync();
    });

    this.$scope.restart = () => {
      this.$scope.$emit('performRestart', {});
    };
  }

  async editFile(params) {
    this.$scope.editingFile = true;
    try {
      this.$scope.currentFile = params.file;
      this.$scope.currentFile.type = params.path.includes('rules') ? 'rule' : 'decoder';
      this.$scope.fetchedXML = this.$scope.currentFile.type === 'rule' ?
        await this.rulesetHandler.getRuleConfiguration(this.$scope.currentFile.file) :
        await this.rulesetHandler.getDecoderConfiguration(this.$scope.currentFile.file);
      this.$scope.$applyAsync();
      this.$scope.$broadcast('fetchedFile', { data: this.$scope.fetchedXML });
    } catch (error) {
      this.$scope.fetchedXML = null;
      this.errorHandler.handle(error, 'Fetch file error');
    }
  }

  switchFilesSubTab(tab) {
    this.filesSubTab = tab;
  }

  search(term) {
    this.$scope.$broadcast('wazuhSearch', { term, removeFilters: 0 });
  }
}
