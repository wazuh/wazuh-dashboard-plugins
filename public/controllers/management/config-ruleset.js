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
        if (!this.$scope.$$phase) this.$scope.$digest();
        this.$scope.$broadcast('fetchedFile', { data: this.$scope.fetchedXML });
      } catch (error) {
        this.$scope.fetchedXML = null;
        this.errorHandler.handle(error, 'Fetch file error');
      }
    };
    this.$scope.closeEditingFile = () => {
      this.$scope.editingFile = false;
      this.$scope.newFile = false;
      this.$scope.fetchedXML = null;
      this.appState.setNavigation({ status: true });
      this.$scope.$broadcast('closeEditXmlFile', {});
    };
    this.$scope.xmlIsValid = valid => {
      this.$scope.xmlHasErrors = valid;
      if (!this.$scope.$$phase) this.$scope.$digest();
    };

    this.$scope.doSaveConfig = (isNewFile, fileName) => {
      if (isNewFile && !fileName) {
        this.errorHandler.handle(
          'You need to specify a file name',
          'Error creating a new file.'
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
              'The filename can not contain numbers',
              'Error creating a new file.'
            );
            return false;
          }
          this.$scope.selectedItem = { file: fileName };
          if (this.$scope.type === 'rules') {
            this.$scope.$broadcast('saveXmlFile', {
              rule: this.$scope.selectedItem
            });
          } else if (this.$scope.type === 'decoders') {
            this.$scope.$broadcast('saveXmlFile', {
              decoder: this.$scope.selectedItem
            });
          }
        } else {
          const objParam =
            this.$scope.selectedRulesetTab === 'rules'
              ? { rule: this.$scope.selectedItem }
              : { decoder: this.$scope.selectedItem };
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
      if (!this.$scope.$$phase) this.$scope.$digest();
      this.$location.search('editingFile', true);
      this.appState.setNavigation({ status: true });
      this.$scope.$broadcast('fetchedFile', { data: this.$scope.fetchedXML });
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
      }
      if (!this.$scope.$$phase) this.$scope.$digest();
    };
    this.$scope.switchRulesetTab('rules');

    const stringToObj = string => {
      let result = {};
      const splitted = string.split('\n');
      splitted.forEach(function(element) {
        const keyValue = element.split(':');
        if (keyValue[0]) result[keyValue[0]] = keyValue[1];
      });
      return result;
    };
    this.$scope.cancelEditList = () => {
      this.appState.setNavigation({ status: true });
      this.$scope.viewingDetail = false;
      this.$scope.currentList = false;
    };
    //listeners
    this.$scope.$on('wazuhShowCdbList', async (ev, parameters) => {
      this.$scope.currentList = parameters.cdblist;
      try {
        const data = await this.rulesetHandler.getCdbList(
          `etc/lists/${this.$scope.currentList.name}`
        );
        this.$scope.currentList.list = stringToObj(data.data.data);
        this.$location.search('editingFile', true);
        this.appState.setNavigation({ status: true });
        this.$scope.viewingDetail = true;
      } catch (error) {
        this.$scope.currentList.list = [];
        this.errorHandler.handle(error, '');
      }
      this.$scope.$broadcast('changeCdbList', {
        currentList: this.$scope.currentList
      });
      if (!this.$scope.$$phase) this.$scope.$digest();
    });
    this.$scope.$on('wazuhShowRule', (event, parameters) => {
      this.$scope.selectedItem = parameters.rule;
      this.$scope.selectedFileName = 'rules';
      this.$scope.editConfig();
      if (!this.$scope.$$phase) this.$scope.$digest();
    });
    this.$scope.$on('wazuhShowDecoder', (event, parameters) => {
      this.$scope.selectedItem = parameters.decoder;
      this.$scope.selectedFileName = 'decoders';
      this.$scope.editConfig();
      if (!this.$scope.$$phase) this.$scope.$digest();
    });
  }
}
