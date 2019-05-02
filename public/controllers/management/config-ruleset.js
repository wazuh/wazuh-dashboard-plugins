/*
 * Wazuh app - Management edit ruleset configuration controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { stringToObj } from '../../utils/cdblist-to-object';
export class ConfigurationRulesetController {
  /**
   * Constructor
   * @param {*} $scope
   * @param {*} $location
   * @param {*} errorHandler
   * @param {*} apiReq
   * @param {*} appState
   */
  constructor(
    $scope,
    $location,
    errorHandler,
    apiReq,
    appState,
    rulesetHandler
  ) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.appState = appState;
    this.$location = $location;
    this.$scope.load = false;
    this.$scope.isArray = Array.isArray;
    this.rulesetHandler = rulesetHandler;
    this.$scope.currentConfig = null;
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
      this.$scope.newFile = false;
      try {
        this.$scope.fetchedXML =
          this.$scope.selectedRulesetTab === 'rules'
            ? await this.rulesetHandler.getRuleConfiguration(
                this.$scope.selectedItem.file
              )
            : await this.rulesetHandler.getDecoderConfiguration(
                this.$scope.selectedItem.file
              );
        this.$location.search('editingFile', true);
        this.appState.setNavigation({ status: true });
        this.$scope.$applyAsync();
        this.$scope.$broadcast('fetchedFile', { data: this.$scope.fetchedXML });
      } catch (error) {
        this.$scope.fetchedXML = null;
        this.errorHandler.handle(error, 'Fetch file error');
      }
    };

    this.$scope.closeEditingFile = (reload = false) => {
      this.$scope.editingFile = false;
      this.$scope.newFile = false;
      this.$scope.fetchedXML = null;
      if (reload) this.$scope.search();
      this.appState.setNavigation({ status: true });
      this.$scope.$applyAsync();
    };

    this.$scope.xmlIsValid = valid => {
      this.$scope.xmlHasErrors = valid;
      this.$scope.$applyAsync();
    };

    this.$scope.doSaveConfig = (isNewFile, fileName) => {
      if (isNewFile && !fileName) {
        this.errorHandler.handle(
          'Error creating a new file. You need to specify a file name',
          ''
        );
        return false;
      } else {
        if (isNewFile) {
          const validFileName = /(.+).xml/;
          const containsNumber = /.*[0-9].*/;
          if (fileName && !validFileName.test(fileName)) {
            fileName = fileName + '.xml';
          }
          if (containsNumber.test(fileName)) {
            this.errorHandler.handle(
              'Error creating a new file. The filename can not contain numbers',
              ''
            );
            return false;
          }
          this.$scope.selectedItem = { file: fileName };
          if (this.$scope.type === 'rules') {
            this.$scope.$broadcast('saveXmlFile', {
              rule: this.$scope.selectedItem,
              showRestartManager:
                this.clusterInfo.status === 'enabled' ? 'cluster' : 'manager'
            });
          } else if (this.$scope.type === 'decoders') {
            this.$scope.$broadcast('saveXmlFile', {
              decoder: this.$scope.selectedItem,
              showRestartManager:
                this.clusterInfo.status === 'enabled' ? 'cluster' : 'manager'
            });
          }
        } else {
          const objParam =
            this.$scope.selectedRulesetTab === 'rules'
              ? {
                  rule: this.$scope.selectedItem,
                  showRestartManager:
                    this.clusterInfo.status === 'enabled'
                      ? 'cluster'
                      : 'manager'
                }
              : {
                  decoder: this.$scope.selectedItem,
                  showRestartManager:
                    this.clusterInfo.status === 'enabled'
                      ? 'cluster'
                      : 'manager'
                };
          this.$scope.$broadcast('saveXmlFile', objParam);
        }
        this.$scope.editingFile = false;
        this.$scope.fetchedXML = null;
      }
    };
    this.$scope.addNewFile = type => {
      this.$scope.editingFile = true;
      this.$scope.newFile = true;
      this.$scope.newFileName = '';
      this.$scope.selectedFileName = this.$scope.selectedRulesetTab;
      this.$scope.selectedItem = { file: 'new file' };
      this.$scope.fetchedXML = '<!-- Modify it at your will. -->';
      this.$scope.type = type;
      this.$scope.$applyAsync();
      this.$location.search('editingFile', true);
      this.appState.setNavigation({ status: true });
      this.$scope.$broadcast('fetchedFile', { data: this.$scope.fetchedXML });
    };

    this.$scope.addNewList = () => {
      this.$scope.currentList = {
        name: '',
        path: 'etc/lists/',
        list: [],
        new: true
      };
      this.$scope.viewingDetail = true;
      this.$scope.$applyAsync();
      this.$scope.$broadcast('changeCdbList', {
        currentList: this.$scope.currentList
      });
    };

    /**
     * Navigate to woodle
     */
    this.$scope.switchRulesetTab = async rulesettab => {
      this.$scope.closeEditingFile();
      this.$scope.viewingDetail = false;
      this.$scope.selectedRulesetTab = rulesettab;
      this.$scope.selectData;
      this.$scope.custom_search = '';
      $('#config-ruleset-input-search').val('');
      this.$scope.selectedItem = false;
      if (rulesettab === 'rules') {
        this.$scope.searchPlaceholder = 'Filter local rules...';
      }
      if (rulesettab === 'decoders') {
        this.$scope.searchPlaceholder = 'Filter local decoders...';
      }
      if (rulesettab === 'cdblists') {
        this.$scope.searchPlaceholder = 'Filter CDB lists...';
        this.$scope.currentList = false;
        this.$scope.search();
      }
      this.$scope.$applyAsync();
    };

    this.$scope.switchRulesetTab('rules');

    this.$scope.cancelEditList = () => {
      this.appState.setNavigation({ status: true });
      this.$scope.viewingDetail = false;
      this.$scope.currentList = false;
    };

    //listeners
    this.$scope.$on('wazuhShowCdbList', async (ev, parameters) => {
      ev.stopPropagation();
      this.$scope.currentList = parameters.cdblist;
      try {
        const data = await this.rulesetHandler.getCdbList(
          `${this.$scope.currentList.path}/${this.$scope.currentList.name}`
        );
        this.$scope.currentList.list = stringToObj(data.data.data);
        this.$location.search('editingFile', true);
        this.appState.setNavigation({ status: true });
        this.$scope.viewingDetail = true;
      } catch (error) {
        this.$scope.currentList.list = [];
        this.errorHandler.handle(error);
      }
      this.$scope.$broadcast('changeCdbList', {
        currentList: this.$scope.currentList
      });
      this.$scope.$applyAsync();
    });
    this.$scope.$on('wazuhShowRule', (ev, parameters) => {
      ev.stopPropagation();
      this.$scope.selectedItem = parameters.rule;
      this.$scope.selectedFileName = 'rules';
      this.$scope.editConfig();
      this.$scope.$applyAsync();
    });

    this.$scope.$on('wazuhShowDecoder', (ev, parameters) => {
      ev.stopPropagation();
      this.$scope.selectedItem = parameters.decoder;
      this.$scope.selectedFileName = 'decoders';
      this.$scope.editConfig();
      this.$scope.$applyAsync();
    });
  }
}
