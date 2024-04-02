/*
 * Wazuh app - Settings controller
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { TabNames } from '../../utils/tab-names';
import { pluginPlatform } from '../../../package.json';
import { AppState } from '../../react-services/app-state';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { GenericRequest } from '../../react-services/generic-request';
import { WzMisc } from '../../factories/misc';
import { ApiCheck } from '../../react-services/wz-api-check';
import { SavedObject } from '../../react-services/saved-objects';
import { ErrorHandler } from '../../react-services/error-handler';
import { formatUIDate } from '../../react-services/time-service';
import store from '../../redux/store';
import { updateGlobalBreadcrumb } from '../../redux/actions/globalBreadcrumbActions';
import { UI_LOGGER_LEVELS, PLUGIN_APP_NAME } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { getAssetURL } from '../../utils/assets';
import { getHttp, getWzCurrentAppID } from '../../kibana-services';
import {
  Applications,
  serverApis,
  appSettings,
} from '../../utils/applications';

export class SettingsController {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} $window
   * @param {*} $location
   * @param {*} errorHandler
   */
  constructor($scope, $window, $location, errorHandler) {
    this.pluginPlatformVersion = (pluginPlatform || {}).version || false;
    this.pluginAppName = PLUGIN_APP_NAME;
    this.$scope = $scope;
    this.$window = $window;
    this.$location = $location;
    this.genericReq = GenericRequest;
    this.errorHandler = errorHandler;
    this.wzMisc = new WzMisc();
    this.wazuhConfig = new WazuhConfig();

    if (this.wzMisc.getWizard()) {
      $window.sessionStorage.removeItem('healthCheck');
      this.wzMisc.setWizard(false);
    }

    this.apiIsDown = this.wzMisc.getApiIsDown();
    this.currentApiEntryIndex = false;
    this.tab = 'api';
    this.load = true;
    this.loadingLogs = true;
    this.tabNames = TabNames;
    this.indexPatterns = [];
    this.apiEntries = [];
    this.$scope.googleGroupsSVG = getHttp().basePath.prepend(
      getAssetURL('images/icons/google_groups.svg'),
    );
    this.tabsConfiguration = [
      { id: 'configuration', name: 'Configuration' },
      { id: 'miscellaneous', name: 'Miscellaneous' },
    ];
  }

  /**
   * On controller loads
   */
  async $onInit() {
    try {
      const location = this.$location.search();
      if (location?.tab) {
        this.tab = location.tab;
        const tabActiveName = Applications.find(
          ({ id }) => getWzCurrentAppID() === id,
        ).breadcrumbLabel;
        const breadcrumb = [{ text: tabActiveName }];
        store.dispatch(updateGlobalBreadcrumb(breadcrumb));
      } else {
        const breadcrumb = [{ text: serverApis.breadcrumbLabel }];
        store.dispatch(updateGlobalBreadcrumb(breadcrumb));
      }

      // Set component props
      this.setComponentProps();
      // Loading data
      await this.getSettings();

      await this.getAppInfo();
    } catch (error) {
      const options = {
        context: `${SettingsController.name}.$onInit`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Cannot initialize Settings`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  /**
   * Sets the component props
   */
  setComponentProps() {
    this.apiTableProps = {
      currentDefault: this.currentDefault,
      apiEntries: this.apiEntries,
      compressed: true,
      setDefault: entry => this.setDefault(entry),
      checkManager: entry => this.checkManager(entry),
      getHosts: () => this.getHosts(),
      testApi: (entry, force) => ApiCheck.checkApi(entry, force),
      updateClusterInfoInRegistry: (id, clusterInfo) =>
        this.updateClusterInfoInRegistry(id, clusterInfo),
      copyToClipBoard: msg => this.copyToClipBoard(msg),
    };

    this.addApiProps = {
      closeAddApi: () => this.closeAddApi(),
    };

    this.settingsTabsProps = {
      clickAction: tab => {
        this.switchTab(tab, true);
      },
      selectedTab: this.tab || 'api',
      // Define tabs for Wazuh plugin settings application
      tabs:
        getWzCurrentAppID() === appSettings.id ? this.tabsConfiguration : null,
      wazuhConfig: this.wazuhConfig,
    };
  }

  /**
   * This switch to a selected tab
   * @param {Object} tab
   */
  switchTab(tab) {
    this.tab = tab;
    this.$location.search('tab', this.tab);
  }

  // Get current API index
  getCurrentAPIIndex() {
    if (this.apiEntries.length) {
      const idx = this.apiEntries
        .map(entry => entry.id)
        .indexOf(this.currentDefault);
      this.currentApiEntryIndex = idx;
    }
  }

  /**
   * Compare the string param with currentAppID
   * @param {string} appToCompare
   * It use into plugins/main/public/templates/settings/settings.html to show tabs into expecified App
   */
  compareCurrentAppID(appToCompare) {
    return getWzCurrentAppID() === appToCompare;
  }

  /**
   * Returns the index of the API in the entries array
   * @param {Object} api
   */
  getApiIndex(api) {
    return this.apiEntries.map(entry => entry.id).indexOf(api.id);
  }

  /**
   * Checks the API entries status in order to set if there are online, offline or unknown.
   */
  async checkApisStatus() {
    try {
      let numError = 0;
      for (let idx in this.apiEntries) {
        try {
          await this.checkManager(this.apiEntries[idx], false, true);
          this.apiEntries[idx].status = 'online';
        } catch (error) {
          const code = ((error || {}).data || {}).code;
          const downReason =
            typeof error === 'string'
              ? error
              : (error || {}).message ||
                ((error || {}).data || {}).message ||
                'Wazuh is not reachable';
          const status = code === 3099 ? 'down' : 'unknown';
          this.apiEntries[idx].status = { status, downReason };
          numError = numError + 1;
          if (this.apiEntries[idx].id === this.currentDefault) {
            // if the selected API is down, we remove it so a new one will selected
            AppState.removeCurrentAPI();
          }
        }
      }
      return numError;
    } catch (error) {
      const options = {
        context: `${SettingsController.name}.checkApisStatus`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  // Set default API
  async setDefault(item) {
    try {
      await this.checkManager(item, false, true);
      const index = this.getApiIndex(item);
      const api = this.apiEntries[index];
      const { cluster_info, id } = api;
      const { manager, cluster, status } = cluster_info;

      // Check the connection before set as default
      AppState.setClusterInfo(cluster_info);
      const clusterEnabled = status === 'disabled';
      AppState.setCurrentAPI(
        JSON.stringify({
          name: clusterEnabled ? manager : cluster,
          id: id,
        }),
      );

      this.$scope.$emit('updateAPI', {});

      const currentApi = AppState.getCurrentAPI();
      this.currentDefault = JSON.parse(currentApi).id;
      this.apiTableProps.currentDefault = this.currentDefault;
      this.$scope.$applyAsync();
      const idApi = api.id;

      ErrorHandler.info(`API with id ${idApi} set as default`);

      this.getCurrentAPIIndex();

      this.$scope.$applyAsync();
      return this.currentDefault;
    } catch (error) {
      const options = {
        context: `${SettingsController.name}.setDefault`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  // Get settings function
  async getSettings() {
    try {
      try {
        this.indexPatterns =
          await SavedObject.getListOfWazuhValidIndexPatterns();
      } catch (error) {
        this.wzMisc.setBlankScr('Sorry but no valid index patterns were found');
        this.$location.search('tab', null);
        this.$location.path('/blank-screen');
        return;
      }

      await this.getHosts();

      const currentApi = AppState.getCurrentAPI();

      if (currentApi) {
        const { id } = JSON.parse(currentApi);
        this.currentDefault = id;
      }

      this.$scope.$applyAsync();
      this.apiTableProps.currentDefault = this.currentDefault;
      this.getCurrentAPIIndex();

      if (!this.currentApiEntryIndex && this.currentApiEntryIndex !== 0) {
        return;
      }

      this.$scope.$applyAsync();
    } catch (error) {
      const options = {
        context: `${SettingsController.name}.getSettings`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Error getting API entries`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
    // Every time that the API entries are required in the settings the registry will be checked in order to remove orphan host entries
    await this.genericReq.request('POST', '/hosts/remove-orphan-entries', {
      entries: this.apiEntries,
    });
    return;
  }

  /**
   * @param {String} id
   * @param {Object} clusterInfo
   */
  async updateClusterInfoInRegistry(id, clusterInfo) {
    try {
      const url = `/hosts/update-hostname/${id}`;
      await this.genericReq.request('PUT', url, {
        cluster_info: clusterInfo,
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Check manager connectivity
  async checkManager(item, isIndex, silent = false) {
    try {
      // Get the index of the API in the entries
      const index = isIndex ? item : this.getApiIndex(item);

      // Get the Api information
      const api = this.apiEntries[index];
      const { username, url, port, id } = api;
      const tmpData = {
        username: username,
        url: url,
        port: port,
        cluster_info: {},
        insecure: 'true',
        id: id,
      };

      // Test the connection
      const data = await ApiCheck.checkApi(tmpData, true);
      tmpData.cluster_info = data.data;
      const { cluster_info } = tmpData;
      // Updates the cluster-information in the registry
      await this.updateClusterInfoInRegistry(id, cluster_info);
      this.$scope.$emit('updateAPI', { cluster_info });
      this.apiEntries[index].cluster_info = cluster_info;
      this.apiEntries[index].status = 'online';
      this.apiEntries[index].allow_run_as = data.data.allow_run_as;
      this.wzMisc.setApiIsDown(false);
      !silent && ErrorHandler.info('Connection success', 'Settings');
      this.$scope.$applyAsync();
    } catch (error) {
      this.load = false;
      this.$scope.$applyAsync();
      if (!silent) {
        const options = {
          context: `${SettingsController.name}.checkManager`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
      return Promise.reject(error);
    }
  }

  /**
   * This set the error, and checks if is updating
   * @param {*} error
   * @param {*} updating
   */
  printError(error, updating) {
    const text = ErrorHandler.handle(error, 'Settings');
    if (!updating) this.messageError = text;
    else this.messageErrorUpdate = text;
  }

  /**
   * Returns Wazuh app info
   */
  async getAppInfo() {
    try {
      const data = await this.genericReq.request('GET', '/api/setup');
      const response = data.data.data;
      this.appInfo = {
        'app-version': response['app-version'],
        installationDate: response['installationDate'],
        revision: response['revision'],
      };

      this.load = false;
      const config = this.wazuhConfig.getConfig();
      AppState.setPatternSelector(config['ip.selector']);
      const pattern = AppState.getCurrentPattern();
      this.selectedIndexPattern = pattern || config['pattern'];

      this.getCurrentAPIIndex();
      if (
        (this.currentApiEntryIndex || this.currentApiEntryIndex === 0) &&
        this.currentApiEntryIndex >= 0
      ) {
        await this.checkManager(this.currentApiEntryIndex, true, true);
      }
      this.$scope.$applyAsync();
    } catch (error) {
      AppState.removeNavigation();
      const options = {
        context: `${SettingsController.name}.getAppInfo`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  /**
   * Get the API hosts
   */
  async getHosts() {
    try {
      const result = await this.genericReq.request('GET', '/hosts/apis', {});
      const hosts = result.data || [];
      this.apiEntries = this.apiTableProps.apiEntries = hosts;
      return hosts;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Copy to the clickboard the string passed
   * @param {String} msg
   */
  copyToClipBoard(msg) {
    const el = document.createElement('textarea');
    el.value = msg;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    ErrorHandler.info('Error copied to the clipboard');
  }
}
