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
     * Navigate to woodle
     */
    this.$scope.switchRulesetTab = async (rulesettab) => {
      this.$scope.selectedRulesetTab = rulesettab;
      this.$scope.selectData;
      this.$scope.selectedItem = false;
      if (rulesettab === 'rules') {
        const data = await this.rulesetHandler.getLocalRules();
        const items = (((data || {}).data || {}).data || {}).items || false;
        this.$scope.selectData = items ? items.map(x => x.file) : [];
      }
      if (rulesettab === 'decoders') {
        const data = await this.rulesetHandler.getLocalDecoders();
        const items = (((data || {}).data || {}).data || {}).items || false;
        this.$scope.selectData = items ? items.map(x => x.file) : [];
      }
      if (rulesettab === 'cdblists') {
        const data = await this.rulesetHandler.getLocalDecoders();
        this.$scope.selectData = ((((data || {}).data || {}).data || {}).items | {}).map(x => x.file) || false;
      }
      if (!this.$scope.$$phase) this.$scope.$digest();
      //this.configurationHandler.switchWodle(wodleName, this.$scope);
    };
    this.$scope.switchRulesetTab('rules');
  }
}