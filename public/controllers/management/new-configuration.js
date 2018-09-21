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
import angular from 'angular';
import js2xmlparser from 'js2xmlparser';
import XMLBeautifier from '../../utils/xml-beautifier';
import beautifier from '../../utils/json-beautifier';
import { queryConfig } from '../../services/query-config';

const app = uiModules.get('app/wazuh', []);

class NewConfigurationController {
  constructor($scope, errorHandler, apiReq) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.$scope.load = false;
    this.$scope.isArray = Array.isArray;
    this.configRaw = {};
    this.$scope.currentConfig = null;

    this.$scope.configurationTab = '';
    this.$scope.configurationSubTab = '';

    this.$scope.getXML = name => this.getXML(name);
    this.$scope.getJSON = name => this.getJSON(name);
    this.$scope.isString = item => typeof item === 'string';
    this.$scope.switchConfigTab = (configurationTab, sections) => this.switchConfigTab(configurationTab, sections);
    this.$scope.switchConfigurationTab = configurationTab => this.switchConfigurationTab(configurationTab);
    this.$scope.switchConfigurationSubTab = configurationSubTab => this.switchConfigurationSubTab(configurationSubTab);
  }

  /**
   * Switchs between configuration tabs
   * @param {string} configurationTab The configuration tab to open
   * @param {Array<object>} sections Array that includes sections to be fetched
   */
  async switchConfigTab(configurationTab, sections) {
    try {
      this.$scope.load = true;
      this.$scope.currentConfig = null;
      this.$scope.XMLContent = false;
      this.$scope.JSONContent = false;
      this.$scope.configurationSubTab = false;
      this.$scope.configurationTab = configurationTab;
      this.$scope.currentConfig = await queryConfig('000', sections, this.apiReq, this.errorHandler);
      this.$scope.load = false;
      if (!this.$scope.$$phase) this.$scope.$digest();
    } catch (error) {
      this.errorHandler.handle(error, 'Manager');
      this.$scope.load = false;
    }
    return;
  }

  /**
   * Switchs between configuration tabs
   * @param {*} configurationTab
   */
  switchConfigurationTab(configurationTab) {
    this.$scope.currentConfig = null;
    this.$scope.XMLContent = false;
    this.$scope.JSONContent = false;
    this.$scope.configurationSubTab = false;
    this.$scope.configurationTab = configurationTab;
    if (!this.$scope.$$phase) this.$scope.$digest();
  }

  /**
   * Switchs between configuration sub-tabs
   * @param {*} configurationSubTab
   */
  switchConfigurationSubTab(configurationSubTab) {
    this.$scope.XMLContent = false;
    this.$scope.JSONContent = false;
    this.$scope.configurationSubTab = configurationSubTab;
    if (!this.$scope.$$phase) this.$scope.$digest();
  }

  /**
   * Assigns XML raw content for specific configuration
   * @param {object} config Raw content to show in XML
   */
  getXML(config) {
    this.$scope.JSONContent = false;
    if (this.$scope.XMLContent) {
      this.$scope.XMLContent = false;
    } else {
      try {
        if(Array.isArray(config)) {
          config.map(item => delete item['$$hashKey']);
        }
        this.$scope.XMLContent = XMLBeautifier(js2xmlparser.parse('configuration', config));
      } catch (error) {
        this.$scope.XMLContent = false;
      }
    }
    if (!this.$scope.$$phase) this.$scope.$digest();
  }

  /**
   * Assigns JSON raw content for specific configuration
   * @param {object} config Raw content to show in JSON
   */
  getJSON(config) {
    this.$scope.XMLContent = false;
    if (this.$scope.JSONContent) {
      this.$scope.JSONContent = false;
    } else {
      try {
        if(Array.isArray(config)) {
          config.map(item => delete item['$$hashKey']);
        }
        this.$scope.JSONContent = beautifier.prettyPrint(config);
      } catch (error) {
        this.$scope.JSONContent = false;
      }
    }
    if (!this.$scope.$$phase) this.$scope.$digest();
  }
}

app.controller(
  'managementNewConfigurationController',
  NewConfigurationController
);
