/*
 * Wazuh app - Management configuration controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { ConfigurationHandler } from '../../utils/config-handler';

export class ConfigurationController {
  /**
   * Constructor
   * @param {*} $scope 
   * @param {*} $location 
   * @param {*} errorHandler 
   * @param {*} apiReq 
   * @param {*} appState 
   */
  constructor($scope, $location, errorHandler, apiReq, appState) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.appState = appState;
    this.$location = $location;
    this.$scope.load = false;
    this.$scope.isArray = Array.isArray;
    this.configurationHandler = new ConfigurationHandler(apiReq, errorHandler);
    this.$scope.currentConfig = null;
    this.$scope.configurationTab = '';
    this.$scope.configurationSubTab = '';
    this.$scope.integrations = {};
    this.$scope.selectedItem = 0;
  }

  /**
   * When controller loads
   */
  $onInit() {
    this.$scope.getXML = () => this.configurationHandler.getXML(this.$scope);
    this.$scope.getJSON = () => this.configurationHandler.getJSON(this.$scope);
    this.$scope.isString = item => typeof item === 'string';
    this.$scope.hasSize = obj =>
      obj && typeof obj === 'object' && Object.keys(obj).length;
    this.$scope.switchConfigTab = (configurationTab, sections, navigate = true) => {
      this.$scope.navigate = navigate;
      try {
        this.$scope.configSubTab = JSON.stringify({ 'configurationTab': configurationTab, 'sections': sections });
        if (!this.$location.search().configSubTab) {
          this.appState.setSessionStorageItem('configSubTab', this.$scope.configSubTab);
          this.$location.search('configSubTab', true);
        }
      } catch (error) {
        this.errorHandler.handle(error, 'Set configuration path');
      }
      this.configurationHandler.switchConfigTab(
        configurationTab,
        sections,
        this.$scope
      )
    };

    /**
     * Navigate to woodle
     */
    this.$scope.switchWodle = (wodleName, navigate = true) => {
      this.$scope.navigate = navigate;
      this.$scope.configWodle = wodleName;
      if (!this.$location.search().configWodle) {
        this.$location.search('configWodle', this.$scope.configWodle);
      }
      this.configurationHandler.switchWodle(wodleName, this.$scope);
    }

    /**
     * Navigate to configuration
     */
    this.$scope.switchConfigurationTab = (configurationTab, navigate) => {
      this.$scope.navigate = navigate;
      this.configurationHandler.switchConfigurationTab(
        configurationTab,
        this.$scope
      )
      if (!this.$scope.navigate) {
        let configSubTab = this.$location.search().configSubTab;
        if (configSubTab) {
          try {
            const config = this.appState.getSessionStorageItem('configSubTab');
            const configSubTabObj = JSON.parse(config);
            this.$scope.switchConfigTab(configSubTabObj.configurationTab, configSubTabObj.sections, false);
          } catch (error) {
            this.errorHandler.handle(error, 'Get configuration path');
          }
        } else {
          let configWodle = this.$location.search().configWodle;
          if (configWodle) {
            this.$scope.switchWodle(configWodle, false);
          }
        }
      } else {
        this.$location.search('configSubTab', null);
        this.appState.removeSessionStorageItem('configSubTab');
        this.$location.search('configWodle', null);
      }
    };

    /**
     * Navigate to configuration sub tab
     */
    this.$scope.switchConfigurationSubTab = configurationSubTab =>
      this.configurationHandler.switchConfigurationSubTab(
        configurationSubTab,
        this.$scope
      );
    this.$scope.updateSelectedItem = i => (this.$scope.selectedItem = i);
    this.$scope.getIntegration = list =>
      this.configurationHandler.getIntegration(list, this.$scope);

    this.$scope.$on('$routeChangeStart', () => this.appState.removeSessionStorageItem('configSubTab'));
  }
}
