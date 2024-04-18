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
import React from 'react';
import { EuiProgress } from '@elastic/eui';
import { Tabs } from '../common/tabs/tabs';
import { TabNames } from '../../utils/tab-names';
import { pluginPlatform } from '../../../package.json';
import { AppState } from '../../react-services/app-state';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { GenericRequest } from '../../react-services/generic-request';
import { WzMisc } from '../../factories/misc';
import { ApiCheck } from '../../react-services/wz-api-check';
import { SavedObject } from '../../react-services/saved-objects';
import { ErrorHandler } from '../../react-services/error-handler';
import store from '../../redux/store';
import { updateGlobalBreadcrumb } from '../../redux/actions/globalBreadcrumbActions';
import { UI_LOGGER_LEVELS, PLUGIN_APP_NAME } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { getAssetURL } from '../../utils/assets';
import { getHttp, getWzCurrentAppID } from '../../kibana-services';
import { ApiTable } from '../settings/api/api-table';
import { WzConfigurationSettings } from '../settings/configuration/configuration';
import { SettingsMiscellaneous } from '../settings/miscellaneous/miscellaneous';
import { WzSampleDataWrapper } from '../add-modules-data/WzSampleDataWrapper';
import { SettingsAbout } from '../settings/about/index';
import {
  Applications,
  serverApis,
  appSettings,
} from '../../utils/applications';

export class Settings extends React.Component {
  state: {
    tab: string;
    load: boolean;
    loadingLogs: boolean;
    settingsTabsProps?;
    apiTableProps?;
    currentApiEntryIndex;
    indexPatterns;
    apiEntries;
  };
  pluginAppName: string;
  pluginPlatformVersion: string | boolean;
  genericReq;
  wzMisc;
  wazuhConfig;
  tabNames;
  tabsConfiguration;
  apiIsDown;
  messageError;
  messageErrorUpdate;
  googleGroupsSVG;
  currentDefault;
  appInfo;

  constructor(props) {
    super(props);

    this.pluginPlatformVersion = (pluginPlatform || {}).version || false;
    this.pluginAppName = PLUGIN_APP_NAME;

    this.genericReq = GenericRequest;
    this.wzMisc = new WzMisc();
    this.wazuhConfig = new WazuhConfig();

    if (this.wzMisc.getWizard()) {
      window.sessionStorage.removeItem('healthCheck');
      this.wzMisc.setWizard(false);
    }

    this.tabNames = TabNames;
    this.apiIsDown = this.wzMisc.getApiIsDown();
    this.state = {
      currentApiEntryIndex: false,
      tab: 'api',
      load: true,
      loadingLogs: true,
      indexPatterns: [],
      apiEntries: [],
    };

    this.googleGroupsSVG = getHttp().basePath.prepend(
      getAssetURL('images/icons/google_groups.svg'),
    );
    this.tabsConfiguration = [
      { id: 'configuration', name: 'Configuration' },
      { id: 'miscellaneous', name: 'Miscellaneous' },
    ];
  }

  /**
   * Parses the tab query param and returns the tab value
   * @returns string
   */
  _getTabFromUrl() {
    const regex = new RegExp('tab=' + '[^&]*');
    const match = window.location.href.match(regex);
    return match?.[0]?.split('=')?.[1] ?? '';
  }

  componentDidMount(): void {
    this.onInit();
  }
  /**
   * On load
   */
  async onInit() {
    try {
      const tab = this._getTabFromUrl();

      if (tab) {
        this.setState({ tab });
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
        context: `${Settings.name}.onInit`,
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
    const apiTableProps = {
      currentDefault: this.currentDefault,
      apiEntries: this.state.apiEntries,
      compressed: true,
      setDefault: entry => this.setDefault(entry),
      checkManager: entry => this.checkManager(entry),
      getHosts: () => this.getHosts(),
      testApi: (entry, force) => ApiCheck.checkApi(entry, force),
      copyToClipBoard: msg => this.copyToClipBoard(msg),
    };

    const addApiProps = {
      closeAddApi: () => this.closeAddApi(),
    };

    const settingsTabsProps = {
      clickAction: tab => {
        this.switchTab(tab, true);
      },
      selectedTab: this.state.tab || 'api',
      // Define tabs for Wazuh plugin settings application
      tabs:
        getWzCurrentAppID() === appSettings.id ? this.tabsConfiguration : null,
      wazuhConfig: this.wazuhConfig,
    };

    this.setState({
      apiTableProps,
      addApiProps,
      settingsTabsProps,
    });
  }

  /**
   * This switch to a selected tab
   * @param {Object} tab
   */
  switchTab(tab) {
    const regex = new RegExp('tab=' + '[^&]*');
    this.setState({ tab });
    window.location.href = window.location.href.replace(regex, `tab=${tab}`);
    // location?.search('tab', this.tab);
  }

  // Get current API index
  getCurrentAPIIndex() {
    if (this.state.apiEntries.length) {
      const idx = this.state.apiEntries
        .map(entry => entry.id)
        .indexOf(this.currentDefault);
      this.setState({ currentApiEntryIndex: idx });
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
        context: `${Settings.name}.checkApisStatus`,
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
      const api = this.state.apiEntries[index];
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

      // this.$scope.$emit('updateAPI', {}); CHECK THIS

      const currentApi = AppState.getCurrentAPI();
      this.currentDefault = JSON.parse(currentApi).id;
      this.state.apiTableProps.currentDefault = this.currentDefault;
      const idApi = api.id;

      ErrorHandler.info(`API with id ${idApi} set as default`);

      this.getCurrentAPIIndex();

      return this.currentDefault;
    } catch (error) {
      const options = {
        context: `${Settings.name}.setDefault`,
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
        location?.search('tab', null);
        location?.path('/blank-screen');
        return;
      }

      await this.getHosts();

      const currentApi = AppState.getCurrentAPI();

      if (currentApi) {
        const { id } = JSON.parse(currentApi);
        this.currentDefault = id;
      }

      this.state.apiTableProps.currentDefault = this.currentDefault;
      this.getCurrentAPIIndex();

      if (
        !this.state.currentApiEntryIndex &&
        this.state.currentApiEntryIndex !== 0
      ) {
        return;
      }
    } catch (error) {
      const options = {
        context: `${Settings.name}.getSettings`,
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
    return;
  }

  // Check manager connectivity
  async checkManager(item, isIndex, silent = false) {
    try {
      // Get the index of the API in the entries
      const index = isIndex ? item : this.getApiIndex(item);

      // Get the Api information
      const api = this.state.apiEntries[index];
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
      tmpData.cluster_info = data?.data;
      const { cluster_info } = tmpData;
      // Updates the cluster-information in the registry
      // this.$scope.$emit('updateAPI', { cluster_info }); <---- CHECK THIS
      this.state.apiEntries[index].cluster_info = cluster_info;
      this.state.apiEntries[index].status = 'online';
      this.state.apiEntries[index].allow_run_as = data?.data.allow_run_as;
      this.wzMisc.setApiIsDown(false);
      !silent && ErrorHandler.info('Connection success', 'Settings');
    } catch (error) {
      this.setState({ load: false });
      if (!silent) {
        const options = {
          context: `${Settings.name}.checkManager`,
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
        revision: response['revision'],
      };

      this.setState({ load: false });
      const config = this.wazuhConfig.getConfig();
      AppState.setPatternSelector(config['ip.selector']);
      const pattern = AppState.getCurrentPattern();

      this.getCurrentAPIIndex();
      if (
        (this.state.currentApiEntryIndex ||
          this.state.currentApiEntryIndex === 0) &&
        this.state.currentApiEntryIndex >= 0
      ) {
        await this.checkManager(this.state.currentApiEntryIndex, true, true);
      }
      // this.$scope.$applyAsync();
    } catch (error) {
      AppState.removeNavigation();
      const options = {
        context: `${Settings.name}.getAppInfo`,
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
      this.setState({
        apiEntries: hosts,
        apiTableProps: { ...this.state.apiTableProps, apiEntries: hosts },
      });
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

  render() {
    return (
      <div>
        {this.state.load ? (
          <div style={{ padding: '16px' }}>
            <EuiProgress size='xs' color='primary' />
          </div>
        ) : null}
        {/* It must get renderized only in configuration app to show Miscellaneous tab in configuration App */}
        {!this.state.load &&
        this.state.settingsTabsProps &&
        !this.apiIsDown &&
        this.state.apiTableProps.apiEntries.length &&
        this.state.settingsTabsProps.tabs ? (
          <div className='wz-margin-top-16 md-margin-h'>
            <Tabs props={{ ...this.state.settingsTabsProps }} />
          </div>
        ) : null}
        {/* end head */}

        {/* api */}
        {this.state.tab === 'api' && !this.state.load ? (
          <div>
            {/* API table section */}
            <div>
              <ApiTable props={{ ...this.state.apiTableProps }} />
            </div>
          </div>
        ) : null}
        {/* End API configuration card section */}
        {/* end api */}

        {/* configuration */}
        {this.state.tab === 'configuration' && !this.state.load ? (
          <div>
            <WzConfigurationSettings
              props={{ ...this.state.settingsTabsProps }}
            />
          </div>
        ) : null}
        {/* end configuration */}
        {/* miscellaneous */}
        {this.state.tab === 'miscellaneous' && !this.state.load ? (
          <div>
            <SettingsMiscellaneous />
          </div>
        ) : null}
        {/* end miscellaneous */}
        {/* about */}
        {this.state.tab === 'about' && !this.state.load ? (
          <div>
            <SettingsAbout
              appInfo={this.appInfo}
              pluginAppName={this.pluginAppName}
            />
          </div>
        ) : null}
        {/* end about */}
        {/* sample data */}
        {this.state.tab === 'sample_data' && !this.state.load ? (
          <div>
            <WzSampleDataWrapper />
          </div>
        ) : null}
        {/* end sample data */}
      </div>
    );
  }
}
