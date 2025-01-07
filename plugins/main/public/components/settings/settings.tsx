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
import { EuiProgress, EuiTabs, EuiTab } from '@elastic/eui';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { AppState } from '../../react-services/app-state';
import { GenericRequest } from '../../react-services/generic-request';
import { WzMisc } from '../../factories/misc';
import { ApiCheck } from '../../react-services/wz-api-check';
import { SavedObject } from '../../react-services/saved-objects';
import { ErrorHandler } from '../../react-services/error-handler';
import { updateGlobalBreadcrumb } from '../../redux/actions/globalBreadcrumbActions';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { getAssetURL } from '../../utils/assets';
import { getHttp, getWzCurrentAppID } from '../../kibana-services';
import { ApiTable } from '../settings/api/api-table';
import { WzConfigurationSettings } from '../settings/configuration';
import { SettingsMiscellaneous } from '../settings/miscellaneous/miscellaneous';
import { WzSampleDataWrapper } from '../add-modules-data/WzSampleDataWrapper';
import { SettingsAbout } from '../settings/about/index';
import {
  Applications,
  serverApis,
  appSettings,
} from '../../utils/applications';
import { withErrorBoundary, withRouteResolvers } from '../common/hocs';
import {
  enableMenu,
  ip,
  nestedResolve,
  savedSearch,
} from '../../services/resolves';
import { Route, Switch } from '../router-search';
import { useRouterSearch } from '../common/hooks';
import NavigationService from '../../react-services/navigation-service';

const CONFIGURATION_TAB_ID = 'configuration';
const mapStateToProps = state => ({
  configurationUIEditable:
    state.appConfig.data['configuration.ui_api_editable'],
  configurationIPSelector: state.appConfig.data['ip.selector'],
});
const mapDispatchToProps = dispatch => ({
  updateGlobalBreadcrumb: breadcrumb =>
    dispatch(updateGlobalBreadcrumb(breadcrumb)),
});

interface SettingsComponentProps {
  configurationUIEditable: boolean;
  configurationIPSelector: string;
  updateGlobalBreadcrumb: (breadcrumb: string) => void;
  tab: string;
}

class SettingsComponent extends React.Component<SettingsComponentProps> {
  state: {
    tabs: { id: string; name: string }[] | null;
    load: boolean;
    currentApiEntryIndex;
    indexPatterns;
    apiEntries;
  };

  constructor(props: SettingsComponentProps) {
    super(props);

    this.wzMisc = new WzMisc();

    if (this.wzMisc.getWizard()) {
      globalThis.sessionStorage.removeItem('healthCheck');
      this.wzMisc.setWizard(false);
    }

    this.apiIsDown = this.wzMisc.getApiIsDown();
    this.state = {
      currentApiEntryIndex: false,
      tabs: null,
      load: true,
      indexPatterns: [],
      apiEntries: [],
    };

    this.googleGroupsSVG = getHttp().basePath.prepend(
      getAssetURL('images/icons/google_groups.svg'),
    );
    this.tabsConfiguration = [
      { id: CONFIGURATION_TAB_ID, name: 'Configuration' },
      { id: 'miscellaneous', name: 'Miscellaneous' },
    ];
  }

  async componentDidMount(): Promise<void> {
    try {
      const urlTab = this.props.tab;

      if (urlTab) {
        const tabActiveName = Applications.find(
          ({ id }) => getWzCurrentAppID() === id,
        ).breadcrumbLabel;
        const breadcrumb = [{ text: tabActiveName }];

        this.props.updateGlobalBreadcrumb(breadcrumb);
      } else {
        const breadcrumb = [{ text: serverApis.breadcrumbLabel }];

        this.props.updateGlobalBreadcrumb(breadcrumb);
      }

      // Set component props
      this.setComponentProps(urlTab);

      // Loading data
      await this.getSettings();

      await this.getAppInfo();
    } catch (error) {
      const options = {
        // eslint-disable-next-line no-use-before-define
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

  wzMisc: WzMisc;
  tabsConfiguration: { id: string; name: string }[];
  apiIsDown;
  googleGroupsSVG;
  currentDefault;
  appInfo;

  isConfigurationUIEditable() {
    return this.props.configurationUIEditable;
  }

  /**
   * Sets the component props
   */
  setComponentProps(currentTab = 'api') {
    const isConfigurationUIEditable = this.isConfigurationUIEditable();

    if (currentTab === CONFIGURATION_TAB_ID && !isConfigurationUIEditable) {
      // Change the inaccessible configuration to another accessible
      NavigationService.getInstance().replace(
        `/settings?tab=${
          this.tabsConfiguration.find(({ id }) => id !== CONFIGURATION_TAB_ID)
            .id
        }`,
      );
    }

    this.setState({
      tabs:
        getWzCurrentAppID() === appSettings.id
          ? // WORKAROUND: This avoids the configuration tab is displayed
            this.tabsConfiguration.filter(({ id }) =>
              isConfigurationUIEditable ? true : id !== CONFIGURATION_TAB_ID,
            )
          : null,
    });
  }

  // Get current API index
  getCurrentAPIIndex() {
    if (this.state.apiEntries.length > 0) {
      const idx = this.state.apiEntries
        .map(entry => entry.id)
        .indexOf(this.currentDefault);

      this.setState({ currentApiEntryIndex: idx });
    }
  }

  /**
   * Returns the index of the API in the entries array
   * @param {Object} api
   */
  getApiIndex(api) {
    return this.state.apiEntries.map(entry => entry.id).indexOf(api.id);
  }

  // Get settings function
  async getSettings() {
    try {
      try {
        this.setState({
          indexPatterns: await SavedObject.getListOfWazuhValidIndexPatterns(),
        });
      } catch {
        this.wzMisc.setBlankScr('Sorry but no valid index patterns were found');
        NavigationService.getInstance().navigate('/blank-screen');

        return;
      }

      await this.getHosts();

      const currentApi = AppState.getCurrentAPI();

      if (currentApi) {
        const { id } = JSON.parse(currentApi);

        this.currentDefault = id;
      }

      this.getCurrentAPIIndex();

      // TODO: what is the purpose of this?
      if (
        !this.state.currentApiEntryIndex &&
        this.state.currentApiEntryIndex !== 0
      ) {
        return;
      }
    } catch (error) {
      const options = {
        // eslint-disable-next-line no-use-before-define
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
  async checkManager(item, isIndex?, silent = false) {
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

      const { cluster_info: clusterInfo } = tmpData;

      // Updates the cluster-information in the registry
      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.apiEntries[index].cluster_info = clusterInfo;
      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.apiEntries[index].status = 'online';
      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.apiEntries[index].allow_run_as = data.data.allow_run_as;
      this.wzMisc.setApiIsDown(false);

      if (!silent) {
        ErrorHandler.info('Connection success', 'Settings');
      }
    } catch (error) {
      this.setState({ load: false });

      if (!silent) {
        const options = {
          // eslint-disable-next-line no-use-before-define
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

      throw error;
    }
  }

  /**
   * Returns Wazuh app info
   */
  async getAppInfo() {
    try {
      const data = await GenericRequest.request('GET', '/api/setup');
      const response = data.data.data;

      this.appInfo = {
        'app-version': response['app-version'],
        revision: response['revision'],
      };

      this.setState({ load: false });

      AppState.getCurrentPattern();

      this.getCurrentAPIIndex();

      if (
        (this.state.currentApiEntryIndex ||
          this.state.currentApiEntryIndex === 0) &&
        this.state.currentApiEntryIndex >= 0
      ) {
        await this.checkManager(this.state.currentApiEntryIndex, true, true);
      }
    } catch (error) {
      AppState.removeNavigation();

      const options = {
        // eslint-disable-next-line no-use-before-define
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
    const result = await GenericRequest.request('GET', '/hosts/apis', {});
    const hosts = result.data || [];

    this.setState({
      apiEntries: hosts,
    });

    return hosts;
  }

  renderView() {
    // WORKAROUND: This avoids the configuration view is displayed
    if (
      this.props.tab === CONFIGURATION_TAB_ID &&
      !this.isConfigurationUIEditable()
    ) {
      return null;
    }

    return (
      <Switch>
        <Route path='?tab=api'>
          <div>
            <div>
              <ApiTable />
            </div>
          </div>
        </Route>
        <Route path='?tab=configuration'>
          <div>
            <WzConfigurationSettings />
          </div>
        </Route>
        <Route path='?tab=miscellaneous'>
          <div>
            <SettingsMiscellaneous />
          </div>
        </Route>
        <Route path='?tab=about'>
          <div>
            <SettingsAbout appInfo={this.appInfo} />
          </div>
        </Route>
        <Route path='?tab=sample_data'>
          <div>
            <WzSampleDataWrapper />
          </div>
        </Route>
      </Switch>
    );
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
        {!this.state.load && (
          <>
            {!this.apiIsDown && this.state.tabs && (
              <div className='wz-margin-top-16 md-margin-h'>
                <EuiTabs>
                  {this.state.tabs.map(tab => (
                    <EuiTab
                      key={`settings-tab-${tab.name}`}
                      isSelected={tab.id === this.props.tab}
                      onClick={() =>
                        NavigationService.getInstance().navigate(
                          `/settings?tab=${tab.id}`,
                        )
                      }
                    >
                      {tab.name}
                    </EuiTab>
                  ))}
                </EuiTabs>
              </div>
            )}
            {this.renderView()}
          </>
        )}
      </div>
    );
  }
}

export const Settings = compose(
  withErrorBoundary,
  withRouteResolvers({ enableMenu, ip, nestedResolve, savedSearch }),
  connect(mapStateToProps, mapDispatchToProps),
)(props => {
  const { tab } = useRouterSearch();

  return <SettingsComponent {...props} tab={tab} />;
});
