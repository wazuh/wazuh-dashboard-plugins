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
import { uiModules } from 'ui/modules';
import { ConfigurationHandler } from '../../utils/config-handler';

const app = uiModules.get('app/wazuh', []);

class ConfigurationController {
  constructor($scope, errorHandler, apiReq) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.$scope.load = false;
    this.$scope.isArray = Array.isArray;
    this.configurationHandler = new ConfigurationHandler(apiReq, errorHandler);
    this.$scope.currentConfig = null;
    this.$scope.configurationTab = '';
    this.$scope.configurationSubTab = '';
    this.$scope.integrations = {};
    this.$scope.selectedItem = 0;
  }

  $onInit() {
    this.$scope.getXML = () => this.configurationHandler.getXML(this.$scope);
    this.$scope.getJSON = () => this.configurationHandler.getJSON(this.$scope);
    this.$scope.isString = item => typeof item === 'string';
    this.$scope.hasSize = obj =>
      obj && typeof obj === 'object' && Object.keys(obj).length;
    this.$scope.switchConfigTab = (configurationTab, sections) =>
      this.configurationHandler.switchConfigTab(
        configurationTab,
        sections,
        this.$scope
      );
    this.$scope.switchWodle = wodleName =>
      this.configurationHandler.switchWodle(wodleName, this.$scope);
    this.$scope.switchConfigurationTab = configurationTab =>
      this.configurationHandler.switchConfigurationTab(
        configurationTab,
        this.$scope
      );
    this.$scope.switchConfigurationSubTab = configurationSubTab =>
      this.configurationHandler.switchConfigurationSubTab(
        configurationSubTab,
        this.$scope
      );
    this.$scope.updateSelectedItem = i => (this.$scope.selectedItem = i);
    this.$scope.getIntegration = list =>
      this.configurationHandler.getIntegration(list, this.$scope);
  }
}

app.controller('managementConfigurationController', ConfigurationController);
