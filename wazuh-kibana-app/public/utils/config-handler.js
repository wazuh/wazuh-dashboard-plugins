/*
 * Wazuh app - Configuration handler class
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import js2xmlparser from 'js2xmlparser';
import XMLBeautifier from './xml-beautifier';
import { queryConfig } from '../react-services/query-config';
import { objectWithoutProperties } from './remove-hash-key.js';
import { WzRequest } from '../react-services/wz-request';
import { ErrorHandler } from '../react-services/error-handler';

export class ConfigurationHandler {
  constructor(errorHandler) {
    this.errorHandler = errorHandler;
  }

  buildIntegrations(list, $scope) {
    if (!list || !list.length) return;
    for (const integration of list)
      $scope.integrations[integration.name] = integration;
  }

  parseWodle(config, wodleKey) {
    try {
      const wmodulesArray =
        ((config || {})['wmodules-wmodules'] || {}).wmodules || [];
      const result = wmodulesArray.filter(
        item => typeof item[wodleKey] !== 'undefined'
      );
      return result.length ? result[0][wodleKey] : false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Switchs between configuration tabs
   * @param {string} configurationTab The configuration tab to open
   * @param {Array<object>} sections Array that includes sections to be fetched
   */
  async switchConfigTab(
    configurationTab,
    sections,
    $scope,
    agentId = false,
    node = false
  ) {
    try {
      $scope.load = true;
      $scope.currentConfig = null;
      $scope.XMLContent = false;
      $scope.JSONContent = false;
      //$scope.configurationSubTab = false;
      $scope.configurationTab = configurationTab;
      $scope.currentConfig = await queryConfig(
        agentId || '000',
        sections,
        node
      );

      if ($scope.configurationSubTab === 'pm-sca') {
        $scope.currentConfig.sca = this.parseWodle($scope.currentConfig, 'sca');
      }

      if (sections[0].component === 'integrator') {
        this.buildIntegrations(
          $scope.currentConfig['integrator-integration'].integration,
          $scope
        );
      } else {
        $scope.integrations = {};
      }

      if (($scope.currentConfig['logcollector-localfile'] || {}).localfile) {
        const data = $scope.currentConfig['logcollector-localfile'].localfile;
        $scope.currentConfig['logcollector-localfile'][
          'localfile-logs'
        ] = data.filter(item => typeof item.file !== 'undefined');
        $scope.currentConfig['logcollector-localfile'][
          'localfile-commands'
        ] = data.filter(item => typeof item.file === 'undefined');

        const sanitizeLocalfile = file => {
          if (file.target) {
            file.targetStr = '';
            file.target.forEach(function(target, idx) {
              file.targetStr = file.targetStr.concat(target);
              if (idx != file.target.length - 1) {
                file.targetStr = file.targetStr.concat(', ');
              }
            });
          }
        };

        $scope.currentConfig['logcollector-localfile'][
          'localfile-logs'
        ].forEach(sanitizeLocalfile);
        $scope.currentConfig['logcollector-localfile'][
          'localfile-commands'
        ].forEach(sanitizeLocalfile);
      }
      $scope.load = false;
      $scope.$applyAsync();
    } catch (error) {
      ErrorHandler.handle(error.message || error);
      $scope.load = false;
    }
    return;
  }

  /**
   * Switchs to a wodle section
   * @param {string} wodleName The wodle to open
   */
  async switchWodle(wodleName, $scope, agentId = false, node = false) {
    try {
      $scope.load = true;
      $scope.currentConfig = null;
      $scope.XMLContent = false;
      $scope.JSONContent = false;
      //$scope.configurationSubTab = false;
      $scope.configurationTab = wodleName;

      $scope.currentConfig = await queryConfig(
        agentId || '000',
        [{ component: 'wmodules', configuration: 'wmodules' }],
        node
      );

      // Filter by provided wodleName
      let result = [];
      if (
        wodleName &&
        (($scope.currentConfig || {})['wmodules-wmodules'] || {}).wmodules
      ) {
        result = $scope.currentConfig['wmodules-wmodules'].wmodules.filter(
          item => typeof item[wodleName] !== 'undefined'
        );
      }

      if (result.length) {
        $scope.currentConfig =
          wodleName === 'command'
            ? { commands: result.map(item => item.command) }
            : result[0];
      }

      $scope.load = false;
      $scope.$applyAsync();
    } catch (error) {
      ErrorHandler.handle(error.message || error);
      $scope.load = false;
    }
    return;
  }

  /**
   * Determines if a wodle is enabled or not
   * @param {string} wodleName The wodle to check
   * @param {string} agentId The agent ID
   */
  async isWodleEnabled(wodleName, agentId = false) {
    try {
      // Get wodles configuration
      const wodlesConfig = await queryConfig(
        agentId || '000',
        [{ component: 'wmodules', configuration: 'wmodules' }],
      );

      // Filter by provided wodleName
      let result = [];
      if (
        wodleName &&
        wodleName !== 'command' &&
        ((wodlesConfig || {})['wmodules-wmodules'] || {}).wmodules
      ) {
        result = wodlesConfig['wmodules-wmodules'].wmodules.filter(
          item =>
            typeof item[wodleName] !== 'undefined' &&
            item[wodleName].disabled === 'no'
        );
      }

      return !!result.length;
    } catch (error) {
      return false;
    }
  }

  /**
   * Switchs between configuration tabs
   * @param {*} configurationTab
   */
  switchConfigurationTab(configurationTab, $scope) {
    $scope.selectedItem = 0;
    $scope.currentConfig = null;
    $scope.XMLContent = false;
    $scope.JSONContent = false;
    //$scope.configurationSubTab = false;
    $scope.configurationTab = configurationTab;
    $scope.$applyAsync();
  }

  /**
   * Switchs between configuration sub-tabs
   * @param {*} configurationSubTab
   */
  switchConfigurationSubTab(configurationSubTab, $scope) {
    $scope.selectedItem = 0;
    $scope.XMLContent = false;
    $scope.JSONContent = false;
    $scope.configurationSubTab = configurationSubTab;
    $scope.$applyAsync();
  }

  /**
   * Assigns XML raw content for specific configuration
   * @param {object} config Raw content to show in XML
   */
  getXML($scope) {
    const config = {};
    Object.assign(config, $scope.currentConfig);
    $scope.JSONContent = false;
    if ($scope.XMLContent) {
      $scope.XMLContent = false;
    } else {
      try {
        const cleaned = objectWithoutProperties(config);
        $scope.XMLContent = XMLBeautifier(
          js2xmlparser.parse('configuration', cleaned)
        );
        $scope.$broadcast('XMLContentReady', { data: $scope.XMLContent });
      } catch (error) {
        $scope.XMLContent = false;
      }
    }
    $scope.$applyAsync();
  }

  json2xml(data) {
    if (data) {
      const result = XMLBeautifier(js2xmlparser.parse('configuration', data));
      return result;
    }
    return false;
  }

  /**
   * Assigns JSON raw content for specific configuration
   * @param {object} config Raw content to show in JSON
   */
  getJSON($scope) {
    const config = {};
    Object.assign(config, $scope.currentConfig);
    $scope.XMLContent = false;
    if ($scope.JSONContent) {
      $scope.JSONContent = false;
    } else {
      try {
        const cleaned = objectWithoutProperties(config);
        $scope.JSONContent = JSON.stringify(cleaned, null, 2);
        $scope.$broadcast('JSONContentReady', { data: $scope.JSONContent });
      } catch (error) {
        $scope.JSONContent = false;
      }
    }
    $scope.$applyAsync();
  }

  reset($scope) {
    $scope.currentConfig = null;
    $scope.configurationTab = '';
    $scope.configurationSubTab = '';
    $scope.integrations = {};
    $scope.selectedItem = 0;
  }
}
