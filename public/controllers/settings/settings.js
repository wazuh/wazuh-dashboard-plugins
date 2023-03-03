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
import { updateSelectedSettingsSection } from '../../redux/actions/appStateActions';
import {
  UI_LOGGER_LEVELS,
  PLUGIN_PLATFORM_NAME,
} from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { getAssetURL } from '../../utils/assets';
import { getHttp } from '../../kibana-services';
import { i18n } from '@kbn/i18n';

const iniSetting = i18n.translate(
  'wazuh.public.controllers.setting.iniSetting',
  {
    defaultMessage: 'Cannot initialize Settings',
  },
);
const api = i18n.translate('wazuh.public.controllers.setting.API', {
  defaultMessage: 'API',
});
const modules = i18n.translate('wazuh.public.controllers.setting.Modules', {
  defaultMessage: 'Modules',
});
const sampleData = i18n.translate(
  'wazuh.public.controllers.setting.sampleData',
  {
    defaultMessage: 'Sample data',
  },
);
const configuration = i18n.translate(
  'wazuh.public.controllers.setting.configuration',
  {
    defaultMessage: 'Configuration',
  },
);
const logs = i18n.translate('wazuh.public.controllers.setting.logs', {
  defaultMessage: 'Logs',
});
const miscellaneous = i18n.translate(
  'wazuh.public.controllers.setting.miscellaneous',
  {
    defaultMessage: 'Miscellaneous',
  },
);
const about = i18n.translate('wazuh.public.controllers.setting.about', {
  defaultMessage: 'About',
});
const wazuhNot = i18n.translate('wazuh.public.controllers.setting.wazuhNot', {
  defaultMessage: 'Wazuh is not reachable',
});
const validIndex = i18n.translate(
  'wazuh.public.controllers.setting.validIndex',
  {
    defaultMessage: 'Sorry but no valid index patterns were found',
  },
);
const errorApi = i18n.translate('wazuh.public.controllers.setting.errorApi', {
  defaultMessage: 'Error getting API entries',
});
const loadingError = i18n.translate(
  'wazuh.public.controllers.setting.loadingError',
  {
    defaultMessage: 'Error when loading Wazuh app logs',
  },
);
const msg1 = i18n.translate('wazuh.public.controllers.setting.msg1', {
  defaultMessage: 'There were not found any API entry in the wazuh.yml',
});
const msg2 = i18n.translate('wazuh.public.controllers.setting.msg2', {
  defaultMessage: 'Wazuh API not recheable, please review your configuration',
});
const msg3 = i18n.translate('wazuh.public.controllers.setting.msg3', {
  defaultMessage:
    'Some of the API entries are not reachable. You can still use the Wazuh APP but please, review your hosts configuration.',
});
const textarea = i18n.translate('wazuh.public.controllers.setting.textarea', {
  defaultMessage: 'textarea',
});
const clipboard = i18n.translate('wazuh.public.controllers.setting.clipboard', {
  defaultMessage: 'Error copied to the clipboard',
});
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
    this.pluginPlatformName = PLUGIN_PLATFORM_NAME;
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
  }

  /**
   * On controller loads
   */
  async $onInit() {
    try {
      const breadcrumb = [
        { text: '' },
        {
          text: i18n.translate('wazuh.public.controllers.setting.Settings1', {
            defaultMessage: 'Settings',
          }),
        },
      ];
      store.dispatch(updateGlobalBreadcrumb(breadcrumb));

      const location = this.$location.search();
      if (location && location.tab) {
        this.tab = location.tab;
        if (this.tab === 'about')
          store.dispatch(updateSelectedSettingsSection('about'));
      }
      // Set component props
      this.setComponentProps();
      // Loading data
      await this.getSettings();
      const down = await this.checkApisStatus();
      //Checks if all the API entries are down
      this.apiIsDown =
        down >= this.apiEntries.length && this.apiEntries.length > 0;

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
          title: `${error.name}: ${iniSetting}`,
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
      showAddApi: () => this.showAddApi(),
      getHosts: () => this.getHosts(),
      testApi: (entry, force) => ApiCheck.checkApi(entry, force),
      showAddApiWithInitialError: error =>
        this.showAddApiWithInitialError(error),
      updateClusterInfoInRegistry: (id, clusterInfo) =>
        this.updateClusterInfoInRegistry(id, clusterInfo),
      showApiIsDown: () => this.showApiIsDown(),
      copyToClipBoard: msg => this.copyToClipBoard(msg),
    };

    this.addApiProps = {
      checkForNewApis: () => this.checkForNewApis(),
      closeAddApi: () => this.closeAddApi(),
    };

    this.apiIsDownProps = {
      apiEntries: this.apiEntries,
      setDefault: entry => this.setDefault(entry),
      testApi: (entry, force) => ApiCheck.checkApi(entry, force),
      closeApiIsDown: () => this.closeApiIsDown(),
      getHosts: () => this.getHosts(),
      updateClusterInfoInRegistry: (id, clusterInfo) =>
        this.updateClusterInfoInRegistry(id, clusterInfo),
      copyToClipBoard: msg => this.copyToClipBoard(msg),
    };

    let tabs = [
      { id: 'api', name: api },
      { id: 'modules', name: modules },
      { id: 'sample_data', name: sampleData },
      { id: 'configuration', name: configuration },
      { id: 'logs', name: logs },
      { id: 'miscellaneous', name: miscellaneous },
      { id: 'about', name: about },
    ];
    this.settingsTabsProps = {
      clickAction: tab => {
        this.switchTab(tab, true);
        if (tab === 'logs') {
          this.refreshLogs();
        }
      },
      selectedTab: this.tab || 'api',
      tabs,
      wazuhConfig: this.wazuhConfig,
    };

    this.settingsLogsProps = {
      getLogs: async () => {
        return await this.getAppLogs();
      },
    };
  }

  /**
   * This switch to a selected tab
   * @param {Object} tab
   */
  switchTab(tab) {
    if (tab === 'about') store.dispatch(updateSelectedSettingsSection('about'));
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
                wazuhNot;
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
      const extensions = await AppState.getExtensions(id);
      if (currentApi && !extensions) {
        const { id, extensions } = this.apiEntries[this.currentApiEntryIndex];
        AppState.setExtensions(id, extensions);
      }

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
        this.wzMisc.setBlankScr(validIndex);
        this.$location.search('tab', null);
        this.$location.path('/blank-screen');
        return;
      }

      await this.getHosts();

      // Set the addingApi flag based on if there is any API entry
      this.addingApi = !this.apiEntries.length;
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
      const extensions = await AppState.getExtensions(this.currentDefault);
      if (currentApi && !extensions) {
        const { id, extensions } = this.apiEntries[this.currentApiEntryIndex];
        const apiExtensions = extensions || {};
        AppState.setExtensions(id, apiExtensions);
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
          title: `${error.name}: ${errorApi} `,
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
      this.apiIsDown = false;
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
   * Returns Wazuh app logs
   */
  async getAppLogs() {
    try {
      const logs = await this.genericReq.request('GET', '/utils/logs', {});
      this.$scope.$applyAsync();
      return logs.data.lastLogs.map(item => JSON.parse(item));
    } catch (error) {
      const options = {
        context: `${SettingsController.name}.getAppLogs`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);

      return [
        {
          date: new Date(),
          level: 'error',
          message: loadingError,
        },
      ];
    }
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
        installationDate: formatUIDate(response['installationDate']),
        revision: response['revision'],
      };

      this.load = false;
      const config = this.wazuhConfig.getConfig();
      AppState.setPatternSelector(config['ip.selector']);
      const pattern = AppState.getCurrentPattern();
      this.selectedIndexPattern = pattern || config['pattern'];

      if (this.tab === 'logs') {
        this.getAppLogs();
      }

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
   * This ask again for wazuh logs
   */
  refreshLogs() {
    return this.getAppLogs();
  }

  /**
   * Checks if there are new APIs entries in the wazuh.yml
   */
  async checkForNewApis() {
    try {
      this.addingApi = true;
      this.addApiProps.errorsAtInit = false;
      const hosts = await this.getHosts();
      //Tries to check if there are new APIs entries in the wazuh.yml also, checks if some of them have connection
      if (!hosts.length)
        throw {
          message: msg1,
          type: 'warning',
          closedEnabled: false,
        };
      const notRecheable = await this.checkApisStatus();
      if (notRecheable) {
        if (notRecheable >= hosts.length) {
          this.apiIsDown = true;
          throw {
            message: msg2,
            type: 'danger',
            closedEnabled: true,
          };
        }
        throw {
          message: msg3,
          type: 'warning',
          closedEnabled: true,
        };
      }
    } catch (error) {
      const options = {
        context: `${SettingsController.name}.checkForNewApis`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
      return Promise.reject(error);
    }
  }

  /**
   * Get the hosts in the wazuh.yml
   */
  async getHosts() {
    try {
      const result = await this.genericReq.request('GET', '/hosts/apis', {});
      const hosts = result.data || [];
      this.apiEntries =
        this.apiTableProps.apiEntries =
        this.apiIsDownProps.apiEntries =
          hosts;
      if (!hosts.length) {
        this.apiIsDown = false;
        this.addingApi = true;
        this.$scope.$applyAsync();
      }
      return hosts;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Closes the add API component
   */
  closeAddApi() {
    this.addingApi = false;
    this.$scope.$applyAsync();
  }

  /**
   * Shows the add API component
   */
  showAddApi() {
    this.addingApi = true;
    this.addApiProps.enableClose = true;
    this.$scope.$applyAsync();
  }

  /**
   * Shows the add API component
   */
  showApiIsDown() {
    this.apiIsDown = true;
    this.$scope.$applyAsync();
  }

  /**
   * Closes the API is down component
   */
  closeApiIsDown() {
    this.apiIsDown = false;
    this.$scope.$applyAsync();
  }

  /**
   * Shows the add api component with an initial error
   */
  showAddApiWithInitialError(error) {
    this.addApiProps.errorsAtInit = error;
    this.apiEntries = [];
    this.addingApi = true;
    this.$scope.$applyAsync();
  }

  /**
   * Refresh the API entries
   */
  async refreshApiEntries() {
    try {
      this.apiEntries = await this.getHosts();
      const down = await this.checkApisStatus();
      //Checks if all the API entries are down
      this.apiIsDown =
        down >= this.apiEntries.length && this.apiEntries.length > 0;
      this.$scope.$applyAsync();
      return this.apiEntries;
    } catch (error) {
      this.showAddApiWithInitialError(error);
      const options = {
        context: `${SettingsController.name}.refreshApiEntries`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
      return Promise.reject(error);
    }
  }

  /**
   * Copy to the clickboard the string passed
   * @param {String} msg
   */
  copyToClipBoard(msg) {
    const el = document.createElement(textarea);
    el.value = msg;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    ErrorHandler.info(clipboard);
  }
}
