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
  constructor(
    $scope,
    wazuhConfig,
    rulesetHandler,
    errorHandler,
    appState,
    $location
  ) {
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

    this.$scope.mctrl.showFile = false;
    this.$scope.$on('editFile', (ev, params) => {
      this.$scope.editorReadOnly = false;
      this.editFile(params);
      this.$scope.$applyAsync();
    });

    this.$scope.$on('editFromTable', () => {
      if (this.$scope.mctrl.showFile) {
        this.$scope.editorReadOnly = !(
          this.$scope.mctrl.showFile.parameters.path === 'etc/rules' ||
          this.$scope.mctrl.showFile.parameters.path === 'etc/decoders'
        );
        this.editFile(
          this.$scope.mctrl.showFile.parameters,
          this.$scope.editorReadOnly
        );
        this.$scope.goBack = true;
        this.$scope.viewingDetail = this.$scope.mctrl.showFile.parameters.viewingDetail;
      }
      this.$scope.$applyAsync();
    });

    this.$scope.$on('viewFileOnly', (ev, params) => {
      this.$scope.editorReadOnly = true;
      this.editFile(params, true);
      this.$scope.$applyAsync();
    });

    this.$scope.closeEditingFile = (flag = false) => {
      this.$scope.viewingDetail = false;
      this.$scope.editingFile = false;
      this.$scope.editingFile = false;
      this.$scope.editorReadOnly = false;
      this.$scope.fetchedXML = null;
      if (this.$scope.goBack || this.$scope.mctrl.openedFileDirect) {
        if (this.$scope.viewingDetail) {
          this.$scope.mctrl.setCurrentRule({
            currentRule: this.$scope.mctrl.currentRule
          });
          this.$scope.mctrl.currentRule = null;
        }
        this.$scope.mctrl.setRulesTab(this.$scope.mctrl.globalRulesetTab, flag);
        this.$scope.goBack = false;
      }
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
        (isNewFile && this.$scope.type === 'rules') ||
        (!isNewFile && this.$scope.currentFile.type === 'rule')
          ? (objParam.rule = isNewFile
              ? this.selectedItem
              : this.$scope.currentFile)
          : (objParam.decoder = isNewFile
              ? this.selectedItem
              : this.$scope.currentFile);
        this.$scope.$broadcast('saveXmlFile', objParam);
        this.$scope.$applyAsync();
      }
    };

    this.$scope.toggleSaveConfig = () => {
      this.$scope.doingSaving = false;
      this.$scope.$applyAsync();
    };

    this.$scope.toggleRestartMsg = () => {
      this.$scope.restartBtn = false;
      this.$scope.$applyAsync();
    };

    this.$scope.cancelSaveAndOverwrite = newFileName => {
      this.$scope.$emit('changedInputFileName', { name: newFileName || 'new' });
      this.$scope.overwriteError = false;
      this.$scope.$applyAsync();
    };

    this.$scope.$on('showRestart', () => {
      this.$scope.restartBtn = true;
      this.$scope.$applyAsync();
    });

    this.$scope.$on('closeRulesetFile', () => {
      this.$scope.closeEditingFile(true);
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

    this.$scope.$on('addNewFile', (ev, params) => {
      this.addNewFile(params.type);
    });
  }

  async editFile(params, readonly = false) {
    this.$scope.editingFile = true;
    this.$scope.newFile = false;
    try {
      this.$scope.currentFile = params.file;
      this.$scope.currentFile.type = params.path.includes('decoder')
        ? 'decoder'
        : 'rule';
      this.$scope.type = `${this.$scope.currentFile.type}s`;
      this.$scope.fetchedXML =
        this.$scope.type === 'rules'
          ? await this.rulesetHandler.getRuleConfiguration(
              this.$scope.currentFile.file,
              readonly
            )
          : await this.rulesetHandler.getDecoderConfiguration(
              this.$scope.currentFile.file,
              readonly
            );
      this.$scope.$applyAsync();
      if (!readonly) {
        this.$scope.$broadcast('fetchedFile', { data: this.$scope.fetchedXML });
      } else {
        this.$scope.$broadcast('XMLContentReady', {
          data: this.$scope.fetchedXML
        });
      }
    } catch (error) {
      this.$scope.fetchedXML = null;
      this.errorHandler.handle(error, 'Fetch file error');
    }
  }

  addNewFile(type) {
    this.$scope.editingFile = true;
    this.$scope.newFile = true;
    this.$scope.newFileName = '';
    this.$scope.selectedFileName = this.$scope.selectedRulesetTab;
    this.$scope.selectedItem = { file: 'new file' };
    this.$scope.fetchedXML = '<!-- Modify it at your will. -->';
    this.$scope.type = type;
    this.$scope.cancelSaveAndOverwrite();
    this.$scope.$applyAsync();
    this.$location.search('editingFile', true);
    this.appState.setNavigation({ status: true });
    this.$scope.$emit('fetchedFile', { data: this.$scope.fetchedXML });
  }

  switchFilesSubTab(tab) {
    this.filesSubTab = tab;
    this.$scope.uploadFilesProps = {
      msg: this.$scope.mctrl.globalRulesetTab,
      path: `etc/${this.$scope.mctrl.globalRulesetTab}`,
      upload: (files, path) => this.uploadFile(files, path)
    };
  }

  search(term) {
    this.$scope.$broadcast('wazuhSearch', { term, removeFilters: 0 });
  }

  /**
   * Refresh the list of rules or decoders
   */
  refresh() {
    this.search();
  }
}
