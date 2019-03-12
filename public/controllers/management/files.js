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
  constructor($scope, wazuhConfig, rulesetHandler, errorHandler, appState, $location) {
    this.$scope = $scope;
    this.wazuhConfig = wazuhConfig;
    this.rulesetHandler = rulesetHandler;
    this.errorHandler = errorHandler;
    this.appState = appState;
    this.$location = $location;
    this.appliedFilters = [];
    this.searchTerm = '';
    this.overwriteError = false;
  }

  $onInit() {
    const configuration = this.wazuhConfig.getConfig();
    this.adminMode = !!(configuration || {}).admin;

    this.$scope.$on('editFile', (ev, params) => {
      this.editFile(params);
      this.$scope.$applyAsync();
    });

    this.$scope.closeEditingFile = () => {
      this.$scope.editingFile = false;
      this.$scope.fetchedXML = null;
      this.search();
      this.$scope.$applyAsync();
    };

    this.$scope.doSaveConfig = (isNewFile, fileName) => {
      const clusterInfo = this.appState.getClusterInfo();
      const showRestartManager =
        clusterInfo.status === 'enabled' ? 'cluster' : 'manager';
      if (isNewFile && !fileName) {
        this.errorHandler.handle(
          'Error creating a new file. You need to specify a file name',
          ''
        );
        return false;
      } else {
        if (isNewFile) {
          const validFileName = /(.+).xml/;
          const containsBlanks = /.*[ ].*/;
          if (fileName && !validFileName.test(fileName)) {
            fileName = fileName + '.xml';
          }
          if (containsBlanks.test(fileName)) {
            this.errorHandler.handle(
              'Error creating a new file. The filename can not contain white spaces.',
              ''
            );
            return false;
          }
          this.selectedItem = { file: fileName };
        }
        this.$scope.doingSaving = true;
        const objParam = {
          showRestartManager,
          isNewFile: !!isNewFile,
          isOverwrite: !!this.overwriteError
        };
        (isNewFile && this.$scope.type === 'rules') || (!isNewFile && this.$scope.currentFile.type === 'rule') ?
          objParam.rule = isNewFile ? this.selectedItem : this.$scope.currentFile :
          objParam.decoder = isNewFile ? this.selectedItem : this.$scope.currentFile;
        this.$scope.$broadcast('saveXmlFile', objParam);
        this.$scope.$applyAsync();
      }
    };

    this.$scope.toggleSaveConfig = () => {
      this.$scope.doingSaving = false;
      this.$scope.$applyAsync();
    };

    this.$scope.toggleRestartMsg = () => {
      this.$scope.restartMsg = false;
      this.$scope.$applyAsync();
    };

    this.$scope.cancelSaveAndOverwrite = () => {
      this.$scope.overwriteError = false;
      this.$scope.$applyAsync();
    };

    this.$scope.$on('showRestartMsg', () => {
      this.$scope.restartMsg = true;
      this.$scope.$applyAsync();
    });

    this.$scope.$on('showFileNameInput', () => {
      this.newFile = true;
      this.selectedItem = { file: 'new file' };
      this.$scope.$applyAsync();
    });

    this.$scope.restart = () => {
      this.$scope.$emit('performRestart', {});
    };
  }

  async editFile(params) {
    this.$scope.editingFile = true;
    this.$scope.newFile = false;
    try {
      this.$scope.currentFile = params.file;
      this.$scope.currentFile.type = params.path.includes('rules') ? 'rule' : 'decoder';
      this.$scope.type = `${this.$scope.currentFile.type}s`;
      this.$scope.fetchedXML = this.$scope.type === 'rules' ?
        await this.rulesetHandler.getRuleConfiguration(this.$scope.currentFile.file) :
        await this.rulesetHandler.getDecoderConfiguration(this.$scope.currentFile.file);
      this.$scope.$applyAsync();
      this.$scope.$broadcast('fetchedFile', { data: this.$scope.fetchedXML });
    } catch (error) {
      this.$scope.fetchedXML = null;
      this.errorHandler.handle(error, 'Fetch file error');
    }
  }

  addNewFile = type => {
    this.$scope.editingFile = true;
    this.$scope.newFile = true;
    this.$scope.newFileName = '';
    this.$scope.selectedFileName = this.$scope.selectedRulesetTab;
    this.$scope.selectedItem = { file: 'new file' };
    this.$scope.fetchedXML = '<!-- Modify it at your will. -->';
    this.$scope.type = type;
    this.$scope.cancelSaveAndOverwrite();
    if (!this.$scope.$$phase) $scope.$digest();
    this.$location.search('editingFile', true);
    this.appState.setNavigation({ status: true });
    this.$scope.$emit('fetchedFile', { data: this.$scope.fetchedXML });
  };

  switchFilesSubTab(tab) {
    this.filesSubTab = tab;
  }

  search(term) {
    this.$scope.$broadcast('wazuhSearch', { term, removeFilters: 0 });
  }
}
