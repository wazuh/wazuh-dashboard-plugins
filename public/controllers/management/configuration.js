/*
 * Wazuh app - Management configuration controller
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { ConfigurationHandler } from '../../utils/config-handler';
import { DynamicHeight } from '../../utils/dynamic-height';
import { AppState } from '../../react-services/app-state';
import { ApiRequest } from '../../react-services/api-request';

export class ConfigurationController {
  /**
   * Constructor
   * @param {*} $scope
   * @param {*} $location
   * @param {*} errorHandler
   */
  constructor($scope, $location, errorHandler) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.apiReq = ApiRequest;
    this.$location = $location;
    this.load = false;
    this.isArray = Array.isArray;
    this.configurationHandler = new ConfigurationHandler(apiReq, errorHandler);
    this.currentConfig = null;
    this.configurationTab = '';
    this.configurationSubTab = '';
    this.integrations = {};
    this.$scope.integrations = {};
    this.$scope.selectedItem = 0;
    this.showHelp = false;
    this.mctrl = this.$scope.mctrl;
  }

  /**
   * When controller loads
   */
  $onInit() {
    this.$scope.getXML = () => this.configurationHandler.getXML(this.$scope);

    this.$scope.getJSON = () => this.configurationHandler.getJSON(this.$scope);

    this.$scope.switchConfigTab = (
      configurationTab,
      sections,
      navigate = true
    ) => this.switchConfigTab(configurationTab, sections, navigate);

    this.$scope.switchConfigurationSubTab = configurationSubTab =>
      this.switchConfigurationSubTab(configurationSubTab);

    this.$scope.switchWodle = (wodleName, navigate = true) =>
      this.switchWodle(wodleName, navigate);

    this.$scope.isString = item => typeof item === 'string';

    this.$scope.hasSize = obj =>
      obj && typeof obj === 'object' && Object.keys(obj).length;

    this.$scope.updateSelectedItem = i => (this.$scope.selectedItem = i);

    this.getIntegration = list =>
      this.configurationHandler.getIntegration(list, this.$scope);

    this.$scope.$on('$routeChangeStart', () =>
      AppState.removeSessionStorageItem('configSubTab')
    );

    this.$scope.$on('configurationIsReloaded', (event, params) => {
      this.reloadConfig(params);
    });

    this.$scope.$on('configNodeChanged', () => {
      if (!this.configurationTab || !this.configurationTab.length) {
        this.configurationTab = 'welcome';
      }
      this.switchConfigurationTab(this.configurationTab, false, true);
    });

    this.$scope.configurationTabsProps = {};
    this.$scope.buildProps = tabs => {
      this.$scope.configurationTabsProps = {
        clickAction: tab => {
          this.$scope.switchConfigurationSubTab(tab);
        },
        selectedTab:
          this.$scope.configurationSubTab || (tabs && tabs.length)
            ? tabs[0].id
            : '',
        tabs
      };
    };

    //Adding props to configurationProps
    this.mctrl.managementProps.configurationProps = this.mctrl.managementProps.configurationProps || {};
    this.mctrl.managementProps.configurationProps.switchWodle = this.switchWodle;
    this.mctrl.managementProps.configurationProps.switchConfigTab = this.switchConfigTab;

    $(window).on('resize', () => {
      DynamicHeight.dynamicHeight('d-height', 50);
    });
  }

  switchConfigurationSubTab(configurationSubTab) {
    this.$scope.selectedItem = 0;
    this.configurationHandler.switchConfigurationSubTab(
      configurationSubTab,
      this.$scope
    );

    if (configurationSubTab === 'pm-sca') {
      this.$scope.currentConfig.sca = this.configurationHandler.parseWodle(
        this.$scope.currentConfig,
        'sca'
      );
    }
    DynamicHeight.dynamicHeight('d-height', 50);
  }

  /**
   * Navigate to woodle
   */
  switchWodle(wodleName, navigate = true) {
    AppState.setNavigation({ status: true });
    this.navigate = navigate;
    this.configWodle = wodleName;
    if (!this.$location.search().configWodle) {
      this.$scope.$emit('setCurrentConfiguration', {
        currentConfiguration: wodleName
      });
      this.$location.search('configWodle', this.configWodle);
    }
    this.configurationHandler.switchWodle(
      wodleName,
      this.$scope,
      false,
      (this.$scope.mctrl || {}).selectedNode
    );
    DynamicHeight.dynamicHeight('d-height', 50);
  }

  /**
   * Navigate to configuration
   */
  switchConfigurationTab(configurationTab, navigate) {
    this.$scope.mctrl.editionTab = '';
    this.navigate = navigate;
    this.configurationHandler.switchConfigurationTab(
      configurationTab,
      this.$scope
    );

    if (!this.navigate) {
      let configSubTab = this.$location.search().configSubTab;
      if (configSubTab) {
        try {
          const config = AppState.getSessionStorageItem('configSubTab');
          const configSubTabObj = JSON.parse(config);
          if (!configSubTabObj) return;
          this.$scope.$emit('setCurrentConfiguration', {
            currentConfiguration: configSubTabObj.configurationTab
          });
          this.switchConfigTab(
            configSubTabObj.configurationTab,
            configSubTabObj.sections,
            false
          );
        } catch (error) {
          this.errorHandler.handle(error.message || error);
        }
      } else {
        let configWodle = this.$location.search().configWodle;
        if (configWodle) {
          this.$scope.$emit('setCurrentConfiguration', {
            currentConfiguration: configWodle
          });
          this.switchWodle(configWodle, false);
        }
      }
    } else {
      this.$location.search('configSubTab', null);
      AppState.removeSessionStorageItem('configSubTab');
      this.$location.search('configWodle', null);
    }
  }

  reloadConfig(params) {
    if ((params || {}).globalConfigTab) {
      this.configurationTab = '';
      this.$scope.mctrl.editionTab = params.globalConfigTab;
      if ((params || {}).reloadConfigSubTab) {
        this.$location.search('configSubTab', null);
        AppState.removeSessionStorageItem('configSubTab');
      }
      this.$scope.$emit('removeCurrentConfiguration', {});
    } else {
      this.$scope.mctrl.editionTab = '';
      this.switchConfigurationTab('welcome', true);
    }
    this.$scope.$applyAsync();
  }

  switchConfigTab(configurationTab, sections, navigate = true) {
    AppState.setNavigation({ status: true });
    this.navigate = navigate;
    try {
      this.configSubTab = JSON.stringify({ configurationTab, sections });
      if (!this.$location.search().configSubTab) {
        AppState.setSessionStorageItem('configSubTab', this.configSubTab);
        this.$scope.$emit('setCurrentConfiguration', {
          currentConfiguration: configurationTab
        });
        this.$location.search('configSubTab', true);
      }
      DynamicHeight.dynamicHeight('d-height', 50);
    } catch (error) {
      this.errorHandler.handle(error, 'Set configuration path');
    }

    this.configurationHandler.switchConfigTab(
      configurationTab,
      sections,
      this.$scope,
      false,
      (this.$scope.mctrl || {}).selectedNode
    );
  }
}
