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
  constructor($scope, $location, errorHandler, apiReq, appState, rulesetHandler) {
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
      try {
        this.$scope.fetchedXML = this.$scope.selectedRulesetTab === 'rules' ?
          await this.rulesetHandler.getRuleConfiguration(this.$scope.selectedItem.file) :
          await this.rulesetHandler.getDecoderConfiguration(this.$scope.selectedItem.file)
        if (!this.$scope.$$phase) this.$scope.$digest();
        this.$scope.$broadcast('fetchedFile', { data: this.$scope.fetchedXML });
      } catch (error) {
        this.$scope.fetchedXML = null;
        this.errorHandler.handle(error, 'Fetch file error');
      }
    }
    this.$scope.closeEditingFile = () => {
      this.$scope.editingFile = false;
      this.$scope.fetchedXML = null;
      this.$scope.$broadcast('closeEditXmlFile', {});
    };
    this.$scope.xmlIsValid = valid => {
      this.$scope.xmlHasErrors = valid;
      if (!this.$scope.$$phase) this.$scope.$digest();
    };
    this.$scope.doSaveConfig = () => {
      this.$scope.editingFile = false;
      const objParam = this.$scope.selectedRulesetTab === 'rules' ? { rule: this.$scope.selectedItem } : { decoder: this.$scope.selectedItem };
      this.$scope.$broadcast('saveXmlFile', objParam);
    };

    /**
     * Navigate to woodle
     */
    this.$scope.switchRulesetTab = async (rulesettab) => {
      this.$scope.closeEditingFile();
      this.$scope.selectedRulesetTab = rulesettab;
      this.$scope.selectData;
      this.$scope.custom_search = '';
      this.$scope.selectedItem = false;
      if (rulesettab === 'rules') {
        this.$scope.searchPlaceholder = 'Filter rules...'
      }
      if (rulesettab === 'decoders') {
        this.$scope.searchPlaceholder = 'Filter decoders...'
      }
      if (rulesettab === 'cdblists') {
        const data = await this.rulesetHandler.getLocalDecoders();
        this.$scope.selectData = ((((data || {}).data || {}).data || {}).items | {}).map(x => x.file) || false;
      }
      if (!this.$scope.$$phase) this.$scope.$digest();
      //this.configurationHandler.switchWodle(wodleName, this.$scope);
    };
    this.$scope.switchRulesetTab('rules');

    //listeners
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