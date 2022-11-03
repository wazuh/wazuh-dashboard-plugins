/*
 * Wazuh app - React component for build q queries.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiIcon,
  EuiButtonEmpty,
  EuiCallOut,
  EuiToolTip,
  EuiLoadingSpinner,
  EuiFormRow,
  EuiSelect,
  EuiSpacer
} from '@elastic/eui';
import { AppState } from '../../react-services/app-state';
import { PatternHandler } from '../../react-services/pattern-handler';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { connect } from 'react-redux';
import WzReduxProvider from '../../redux/wz-redux-provider';
import { updateCurrentAgentData, showExploreAgentModalGlobal } from '../../redux/actions/appStateActions';
import store from '../../redux/store';
import Management from './wz-menu-management';
import MenuSettings from './wz-menu-settings';
import MenuSecurity from './wz-menu-security';
import MenuTools from './wz-menu-tools';
import Overview from './wz-menu-overview';
import { getAngularModule, getHttp, getToasts } from '../../kibana-services';
import { GenericRequest } from '../../react-services/generic-request';
import { ApiCheck } from '../../react-services/wz-api-check';
import { WzGlobalBreadcrumbWrapper } from '../common/globalBreadcrumb/globalBreadcrumbWrapper';
import { AppNavigate } from '../../react-services/app-navigate';
import WzTextWithTooltipIfTruncated from '../../components/common/wz-text-with-tooltip-if-truncated';
import { getDataPlugin } from '../../kibana-services';
import { withWindowSize } from '../../components/common/hocs/withWindowSize';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services'
import { getThemeAssetURL, getAssetURL } from '../../utils/assets';
import { AgentStatus } from '../agents/agent_status';


const sections = {
  'overview': 'overview',
  'manager': 'manager',
  'agents-preview': 'agents-preview',
  'agents': 'agents-preview',
  'settings': 'settings',
  'wazuh-dev': 'wazuh-dev',
  'health-check': 'health-check',
  'security': 'security'
};

export const WzMenu = withWindowSize(class WzMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMenu: false,
      menuOpened: false,
      currentMenuTab: '',
      currentAPI: '',
      APIlist: [],
      showSelector: false,
      theresPattern: false,
      currentPattern: '',
      patternList: [],
      currentSelectedPattern: '',
      isManagementPopoverOpen: false,
      isOverviewPopoverOpen: false
    };
    this.store = store;
    this.genericReq = GenericRequest;
    this.wazuhConfig = new WazuhConfig();
    this.indexPatterns = getDataPlugin().indexPatterns;
    this.isLoading = false;
  }

  async componentDidMount() {
    const $injector = getAngularModule().$injector;
    this.router = $injector.get('$route');
    try {
      const result = await this.genericReq.request('GET', '/hosts/apis', {});
      const APIlist = (result || {}).data || [];
      if (APIlist.length) {
        const { id: apiId } = JSON.parse(AppState.getCurrentAPI());
        const filteredApi = APIlist.filter(api => api.id === apiId);
        const selectedApi = filteredApi[0];
        if (selectedApi) {
          const apiData = await ApiCheck.checkStored(selectedApi.id);
          //update cluster info
          const cluster_info = (((apiData || {}).data || {}).data || {})
            .cluster_info;
          if (cluster_info) {
            AppState.setClusterInfo(cluster_info);
          }
        }
      }
    } catch (error) { 
      const options = {
        context: `${WzMenu.name}.componentDidMount`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.CRITICAL,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

  getCurrentTab() {
    const currentWindowLocation = window.location.hash;
    let currentTab = '';
    Object.keys(sections).some((section) => {
      if (currentWindowLocation.match(`#/${section}`)) {
        currentTab = sections[section];
        return true;
      }
    });
    return currentTab;
  }

  loadApiList = async () => {
    const result = await this.genericReq.request('GET', '/hosts/apis', {});
    const APIlist = (result || {}).data || [];
    if (APIlist.length) this.setState({ APIlist });
  };

  loadIndexPatternsList = async () => {
    try {
      let list = await PatternHandler.getPatternList('api');
      if (!list) return;
      this.props?.appConfig?.data?.['ip.ignore']?.length && (list = list.filter(indexPattern => !this.props?.appConfig?.data?.['ip.ignore'].includes(indexPattern.title)));

      // Abort if we have disabled the pattern selector
      if (!AppState.getPatternSelector()) return;

      let filtered = false;
      // If there is no current pattern, fetch it
      if (!AppState.getCurrentPattern()) {
        AppState.setCurrentPattern(list[0].id);
      } else {
        // Check if the current pattern cookie is valid
        filtered = list.find(item =>
          item.id.includes(AppState.getCurrentPattern())
        );
        if (!filtered) AppState.setCurrentPattern(list[0].id);
      }

      const data = filtered
        ? filtered
        : await this.indexPatterns.get(AppState.getCurrentPattern());
      this.setState({ theresPattern: true, currentPattern: data.title });

      // Getting the list of index patterns
      if (list) {
        this.setState({
          patternList: list,
          currentSelectedPattern: AppState.getCurrentPattern()
        });
      }
    } catch (error) {
      throw error;
    }
  }


  async componentDidUpdate(prevProps) {

    if (this.state.APIlist && !this.state.APIlist.length) {
      this.loadApiList();
    }
    const { id: apiId } = JSON.parse(AppState.getCurrentAPI());
    const { currentAPI } = this.state;
    const currentTab = this.getCurrentTab();
    
    if (currentTab !== this.state.currentMenuTab) {
      this.setState({ currentMenuTab: currentTab });
    }

    if(this.props.windowSize){
      this.showSelectorsInPopover = this.props.windowSize.width < 1100;
    }

    if (
      prevProps.state.showMenu !== this.props.state.showMenu ||
      (this.props.state.showMenu === true && this.state.showMenu === false)
    ) {
      this.load();
    }
    if ((!currentAPI && apiId) || apiId !== currentAPI) {
      this.setState({ currentAPI: apiId });
    } else {
      if (
        currentAPI &&
        this.props.state.currentAPI &&
        currentAPI !== this.props.state.currentAPI
      ) {
        this.setState({ currentAPI: this.props.state.currentAPI });
      }
    }
    if(!_.isEqual(prevProps?.appConfig?.data?.['ip.ignore'], this.props?.appConfig?.data?.['ip.ignore'])){
      this.loadIndexPatternsList();
    }
  }

  async load() {
    try {
      this.setState({
        showMenu: true,
        isOverviewPopoverOpen: false,
        isManagementPopoverOpen: false,
        isSelectorsPopoverOpen: false
      });

      const currentTab = this.getCurrentTab();
      if (currentTab !== this.state.currentMenuTab) {
        this.setState({ currentMenuTab: currentTab, hover: currentTab });
      }
      let list = await PatternHandler.getPatternList('api');
      if (!list || (list && !list.length)) return;
      this.props?.appConfig?.data?.['ip.ignore']?.length && (list = list.filter(indexPattern => !this.props?.appConfig?.data?.['ip.ignore'].includes(indexPattern.title)));

      // Abort if we have disabled the pattern selector
      if (!AppState.getPatternSelector()) return;

      let filtered = false;
      // If there is no current pattern, fetch it
      if (!AppState.getCurrentPattern()) {
        AppState.setCurrentPattern(list[0].id);
      } else {
        // Check if the current pattern cookie is valid
        filtered = list.filter(item =>
          item.id.includes(AppState.getCurrentPattern())
        );
        if (!filtered.length) AppState.setCurrentPattern(list[0].id);
      }

      const data = filtered
        ? filtered
        : await this.indexPatterns.get(AppState.getCurrentPattern());
      this.setState({ theresPattern: true, currentPattern: data.title });

      // Getting the list of index patterns
      if (list) {
        this.setState({
          patternList: list,
          currentSelectedPattern: AppState.getCurrentPattern()
        });
      }
    } catch (error) {
      const options = {
        context: `${WzMenu.name}.load`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
    this.isLoading = false;
  }

  changePattern = async (event) => {
    try {
      const newPattern = event.target;
      if (!AppState.getPatternSelector()) return;
      await PatternHandler.changePattern(newPattern.value);
      this.setState({ currentSelectedPattern: newPattern.value });
      if (this.state.currentMenuTab !== 'wazuh-dev') {
        this.router.reload();
      }

      if (newPattern?.id === 'selectIndexPatternBar') {
        this.updatePatternAndApi();
      }
    } catch (error) {
      const options = {
        context: `${WzMenu.name}.changePattern`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: false,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error changing the Index Pattern`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  };

  updatePatternAndApi = () => {
    this.setState({ menuOpened: false, hover: this.state.currentMenuTab }, async () => {
      await this.loadApiList();
      await this.loadIndexPatternsList();
    });
  }

  /**
   * @param {String} id
   * @param {Object} clusterInfo
   * Updates the wazuh registry of an specific api id
   */
  updateClusterInfoInRegistry = async (id, clusterInfo) => {
    try {
      const url = `/hosts/update-hostname/${id}`;
      await this.genericReq.request('PUT', url, {
        cluster_info: clusterInfo
      });
    } catch (error) {
      return Promise.reject(error);
    }
  };

  changeAPI = async event => {
    try {
      const apiId = event.target[event.target.selectedIndex];
      const apiEntry = this.state.APIlist.filter(item => {
        return item.id === apiId.value;
      });
      const response = await ApiCheck.checkApi(apiEntry[0]);
      const clusterInfo = response.data || {};
      const apiData = this.state.APIlist.filter(item => {
        return item.id === apiId.value;
      });

      this.updateClusterInfoInRegistry(apiId.value, clusterInfo);
      apiData[0].cluster_info = clusterInfo;

      AppState.setClusterInfo(apiData[0].cluster_info);
      AppState.setCurrentAPI(
        JSON.stringify({ name: apiData[0].manager, id: apiId.value })
      );

      if (this.state.currentMenuTab !== 'wazuh-dev') {
        this.router.reload();
      }
    } catch (error) {
      const options = {
        context: `${WzMenu.name}.changePattern`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: `Error changing the selected API`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  };

  buildPatternSelector() {
    return (
      <EuiFormRow label="Selected index pattern">
        <EuiSelect
          id="selectIndexPattern"
          options={
            this.state.patternList.map((item) => {
              return { value: item.id, text: item.title }
            })
          }
          value={this.state.currentSelectedPattern}
          onChange={this.changePattern}
          aria-label="Index pattern selector"
        />
      </EuiFormRow>
    );
  }

  buildApiSelector() {
    return (
      <EuiFormRow label="Selected API">
        <EuiSelect
          id="selectAPI"
          options={
            this.state.APIlist.map((item) => {
              return { value: item.id, text: item.id }
            })
          }
          value={this.state.currentAPI}
          onChange={this.changeAPI}
          aria-label="API selector"
        />
      </EuiFormRow>
    );
  }

  buildWazuhNotReadyYet() {
    const container = document.getElementsByClassName('wazuhNotReadyYet');
    return ReactDOM.createPortal(
      <EuiCallOut title={this.props.state.wazuhNotReadyYet} color="warning">
        <EuiFlexGroup
          responsive={false}
          direction="row"
          style={{ maxHeight: '40px', marginTop: '-45px' }}
        >
          <EuiFlexItem>
            <p></p>
          </EuiFlexItem>
          {typeof this.props.state.wazuhNotReadyYet === "string" && this.props.state.wazuhNotReadyYet.includes('Restarting') && (
            <EuiFlexItem grow={false}>
              <p>
                {' '}
                <EuiLoadingSpinner size="l" /> &nbsp; &nbsp;{' '}
              </p>
            </EuiFlexItem>
          )}
          {this.props.state.wazuhNotReadyYet ===
            'Wazuh could not be recovered.' && (
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  grow={false}
                  onClick={() => location.reload()}
                  className="WzNotReadyButton"
                >
                  <span> Reload </span>
                </EuiButtonEmpty>
              </EuiFlexItem>
            )}
        </EuiFlexGroup>
      </EuiCallOut>,
      container[0]
    );
  }

  setMenuItem(item) {
    this.setState({ currentMenuTab: item });
  }

  toolsPopoverToggle() {
    if (!this.state.isToolsPopoverOpen) {
      this.setState(() => {
        return {
          isToolsPopoverOpen: true,
          currentMenuTab: 'wazuh-dev',
          isOverviewPopoverOpen: false,
          isManagementPopoverOpen: false,
          isSecurityPopoverOpen: false,
          isSettingsPopoverOpen: false,
          isSelectorsPopoverOpen: false
        };
      });
    }
  }

  settingsPopoverToggle() {
    if (!this.state.isSettingsPopoverOpen) {
      this.setState(() => {
        return {
          isSettingsPopoverOpen: true,
          currentMenuTab: 'settings',
          isOverviewPopoverOpen: false,
          isManagementPopoverOpen: false,
          isSecurityPopoverOpen: false,
          isToolsPopoverOpen: false,
          isSelectorsPopoverOpen: false
        };
      });
    }
  }

  securityPopoverToggle() {
    if (!this.state.isSecurityPopoverOpen) {
      this.setState(() => {
        return {
          isSecurityPopoverOpen: true,
          currentMenuTab: 'security',
          isOverviewPopoverOpen: false,
          isManagementPopoverOpen: false,
          isSettingsPopoverOpen: false,
          isToolsPopoverOpen: false,
          isSelectorsPopoverOpen: false
        };
      });
    }
  }

  managementPopoverToggle() {
    if (!this.state.isManagementPopoverOpen) {
      this.setState(() => {
        return {
          isManagementPopoverOpen: true,
          currentMenuTab: 'manager',
          isOverviewPopoverOpen: false,
          isSettingsPopoverOpen: false,
          isSecurityPopoverOpen: false,
          isToolsPopoverOpen: false,
          isSelectorsPopoverOpen: false
        };
      });
    }
  }

  overviewPopoverToggle() {
    if (!this.state.isOverviewPopoverOpen) {
      this.setState(state => {
        return {
          isOverviewPopoverOpen: true,
          currentMenuTab: 'overview',
          isManagementPopoverOpen: false,
          isSettingsPopoverOpen: false,
          isSecurityPopoverOpen: false,
          isToolsPopoverOpen: false,
          isSelectorsPopoverOpen: false
        };
      });
    }
  }

  onClickToolsButton() {
    this.setMenuItem('wazuh-dev');
    this.toolsPopoverToggle();
  }

  onClickSettingsButton() {
    this.setMenuItem('settings');
    this.settingsPopoverToggle();
  }

  onClickSecurityButton() {
    this.setMenuItem('security');
    this.securityPopoverToggle();
  }

  onClickManagementButton() {
    this.setMenuItem('manager');
    this.managementPopoverToggle();
  }

  onClickOverviewButton() {
    this.setMenuItem('overview');
    this.overviewPopoverToggle();
  }

  onClickAgentButton() {
    this.setState({ menuOpened: false });
    window.location.href = '#/agents-preview';

  }

  closeAllPopover() {
    this.setState({
      isOverviewPopoverOpen: false,
      isManagementPopoverOpen: false,
      isSettingsPopoverOpen: false,
      isToolsPopoverOpen: false,
      isSelectorsPopoverOpen: false
    });
  }

  isAnyPopoverOpen() {
    return (
      this.state.isOverviewPopoverOpen ||
      this.state.isManagementPopoverOpen ||
      this.state.isSettingsPopoverOpen ||
      this.state.isSecurityPopoverOpen ||
      this.state.isToolsPopoverOpen ||
      this.state.isSelectorsPopoverOpen
    );
  }

  switchMenuOpened = () => {
    const pluginPlatformMenuBlockedOrOpened = document.body.classList.contains('euiBody--collapsibleNavIsDocked') || document.body.classList.contains('euiBody--collapsibleNavIsOpen');
    if (!this.state.menuOpened && this.state.currentMenuTab === 'manager') {
      this.managementPopoverToggle();
    } else if (this.state.currentMenuTab === 'overview') {
      this.overviewPopoverToggle();
    } else if (this.state.currentMenuTab === 'wazuh-dev') {
      this.toolsPopoverToggle();
    } else if (this.state.currentMenuTab === 'settings') {
      this.settingsPopoverToggle();
    } else if (this.state.currentMenuTab === 'security') {
      this.securityPopoverToggle();
    } else {
      this.closeAllPopover()
    }

    this.setState({ menuOpened: !this.state.menuOpened, pluginPlatformMenuBlockedOrOpened, hover: this.state.currentMenuTab }, async () => {
      await this.loadApiList();
      await this.loadIndexPatternsList();
    });
  };

  removeSelectedAgent() {
    store.dispatch(updateCurrentAgentData({}));
    if (window.location.href.includes("/agents?")) {
      window.location.href = "#/agents-preview";
      this.router.reload();
      return;
    }
    const { filterManager } = getDataPlugin().query;
    const currentAppliedFilters = filterManager.getFilters();
    const agentFilters = currentAppliedFilters.filter(x => {
      return x.meta.key === 'agent.id';
    });
    agentFilters.map(x => {
      filterManager.removeFilter(x);
    });
  }

  thereAreSelectors() {
    return ((AppState.getAPISelector() && this.state.currentAPI && this.state.APIlist && this.state.APIlist.length > 1)
      || (!this.state.currentAPI)
      || (AppState.getPatternSelector() && this.state.theresPattern && this.state.patternList && this.state.patternList.length > 1))
  }

  getApiSelectorComponent() {
    let style = { minWidth: 100, textOverflow: 'ellipsis' };
    if (this.showSelectorsInPopover){
      style = { width: '100%', minWidth: 200 };
    }

    return (
      <>
        <EuiFlexItem grow={this.showSelectorsInPopover}>
          <p>API</p>
        </EuiFlexItem>
        <EuiFlexItem grow={this.showSelectorsInPopover}>
          <div style={style}>
            <EuiSelect
              id="selectAPIBar"
              fullWidth={true}
              options={
                this.state.APIlist.map((item) => {
                  return { value: item.id, text: item.id }
                })
              }
              value={this.state.currentAPI}
              onChange={this.changeAPI}
              aria-label="API selector"
            />
          </div>
        </EuiFlexItem>
      </>
    )
  }

  getIndexPatternSelectorComponent(){

    let style = { maxWidth: 200, maxHeight: 50 };
    if (this.showSelectorsInPopover){
      style = { width: '100%', maxHeight: 50, minWidth: 200 };
    }

    return(
      <>
        <EuiFlexItem grow={this.showSelectorsInPopover}>
          <p>Index pattern</p>
        </EuiFlexItem>

        <EuiFlexItem grow={this.showSelectorsInPopover}>
          <div style={style}>
            <EuiSelect
              id="selectIndexPatternBar"
              fullWidth={true}
              options={
                this.state.patternList.map((item) => {
                  return { value: item.id, text: item.title }
                })
              }
              value={this.state.currentSelectedPattern}
              onChange={this.changePattern}
              aria-label="Index pattern selector"
            />
          </div>
        </EuiFlexItem>

      </>
    )
  }

  switchSelectorsPopOver(){
    this.setState({ isSelectorsPopoverOpen: !this.state.isSelectorsPopoverOpen })
  }

  render() {
    const currentAgent = store.getState().appStateReducers.currentAgentData;
    const thereAreSelectors = this.thereAreSelectors();
    
    const menu = (
      <div className="wz-menu-wrapper">
        <div className="wz-menu-left-side">
          <div className="wz-menu-sections" style={!thereAreSelectors ? { height: "100%" } : {}}>
            <EuiButtonEmpty data-test-subj='menuModulesButton'
              onMouseEnter={() => { this.setState({ hover: "overview" }) }}
              className={
                'wz-menu-button ' +
                (this.state.currentMenuTab === "overview" && !this.isAnyPopoverOpen() || (this.state.isOverviewPopoverOpen)
                  ? 'wz-menu-active'
                  : '')
              }
              color="text"
              onClick={this.onClickOverviewButton.bind(this)}
            >
              <EuiIcon type="visualizeApp" color="primary" size="m" />
              <span className="wz-menu-button-title " >Modules</span>
              <span className="flex"></span>
              <span className="flex"></span>
              {/*this.state.hover === 'overview' */this.state.isOverviewPopoverOpen && (
                <EuiIcon color="subdued" type="arrowRight" />
              )}
            </EuiButtonEmpty>

            <EuiButtonEmpty data-test-subj='menuManagementButton'
              onMouseEnter={() => { this.setState({ hover: "manager" }) }}
              className={
                'wz-menu-button ' +
                (this.state.currentMenuTab === "manager" && !this.isAnyPopoverOpen() || (this.state.isManagementPopoverOpen)
                  ? 'wz-menu-active'
                  : '')
              }
              color="text"
              onClick={this.onClickManagementButton.bind(this)}
            >
              <EuiIcon type="managementApp" color="primary" size="m" />
              <span className="wz-menu-button-title ">Management</span>
              <span className="flex"></span>
              {/*this.state.hover === 'manager' */ this.state.isManagementPopoverOpen && (
                <EuiIcon color="subdued" type="arrowRight" />
              )}
            </EuiButtonEmpty>

            <EuiButtonEmpty data-test-subj='menuAgentsButton'
              className={
                'wz-menu-button ' +
                (this.state.currentMenuTab === "agents-preview" && !this.isAnyPopoverOpen()
                  ? 'wz-menu-active'
                  : '')}
              color="text"
              href="#/agents-preview"
              onClick={() => {
                this.setMenuItem('agents-preview');
                this.setState({ menuOpened: false });
              }}
            >
              <EuiIcon type="watchesApp" color="primary" size="m" />
              <span className="wz-menu-button-title ">Agents</span>
            </EuiButtonEmpty>

            <EuiButtonEmpty data-test-subj='menuToolsButton'
              className={
                'wz-menu-button ' +
                (this.state.currentMenuTab === "wazuh-dev" && !this.isAnyPopoverOpen() || (this.state.isToolsPopoverOpen)
                  ? 'wz-menu-active'
                  : '')}
              color="text"
              onClick={this.onClickToolsButton.bind(this)}
            >
              <EuiIcon type="console" color="primary" size="m" />
              <span className="wz-menu-button-title ">Tools</span>
              <span className="flex"></span>
              {this.state.isToolsPopoverOpen && (
                <EuiIcon color="subdued" type="arrowRight" />
              )}
            </EuiButtonEmpty>

            <EuiSpacer size='xl'></EuiSpacer>
            <EuiButtonEmpty data-test-subj='menuSecurityButton'
              className={
                'wz-menu-button ' +
                (this.state.currentMenuTab === "security" && !this.isAnyPopoverOpen() || (this.state.isSecurityPopoverOpen)
                  ? 'wz-menu-active'
                  : '')}
              color="text"
              aria-label="Security"
              onClick={this.onClickSecurityButton.bind(this)}
            >
              <EuiIcon type="securityApp" color="primary" size="m" />
              <span className="wz-menu-button-title ">Security</span>
              <span className="flex"></span>
              {this.state.isSecurityPopoverOpen && (
                <EuiIcon color="subdued" type="arrowRight" />
              )}
            </EuiButtonEmpty>
            <EuiButtonEmpty data-test-subj='menuSettingsButton'
              className={
                'wz-menu-button ' +
                (this.state.currentMenuTab === "settings" && !this.isAnyPopoverOpen() || (this.state.isSettingsPopoverOpen)
                  ? 'wz-menu-active'
                  : '')}
              color="text"
              aria-label="Settings"
              onClick={this.onClickSettingsButton.bind(this)}
            >
              <EuiIcon type="advancedSettingsApp" color="primary" size="m" />
              <span className="wz-menu-button-title ">Settings</span>
              <span className="flex"></span>
              {this.state.isSettingsPopoverOpen && (
                <EuiIcon color="subdued" type="arrowRight" />
              )}
            </EuiButtonEmpty>
          </div>
        </div>

        <div className="wz-menu-right-side">
          {/*this.state.hover === 'manager'*/ this.state.isManagementPopoverOpen && (
            <Management
              closePopover={() => this.setState({ menuOpened: false })}
            ></Management>
          )}

          {/*this.state.hover === 'settings'*/ this.state.isSettingsPopoverOpen && (
            <MenuSettings
              currentMenuTab={this.state.currentMenuTab}
              closePopover={() => this.setState({ menuOpened: false })}
            ></MenuSettings>
          )}

          {/*this.state.hover === 'security'*/ this.state.isSecurityPopoverOpen && (
            <MenuSecurity
              currentMenuTab={this.state.currentMenuTab}
              closePopover={() => this.setState({ menuOpened: false })}
            ></MenuSecurity>
          )}

          {this.state.isToolsPopoverOpen && (
            <MenuTools
              currentMenuTab={this.state.currentMenuTab}
              closePopover={() => this.setState({ menuOpened: false })}
            ></MenuTools>
          )}

          {/*this.state.hover === 'overview' */this.state.isOverviewPopoverOpen && currentAgent.id && (
            <EuiFlexGroup className="wz-menu-agent-info">
              <EuiFlexItem style={{ margin: "16px 16px 0 16px" }}>
                <AgentStatus status={currentAgent.status}>
                  <WzTextWithTooltipIfTruncated position='bottom' elementStyle={{ maxWidth: "400px", height: 16 }}>
                    {currentAgent.name}
                  </WzTextWithTooltipIfTruncated>
                </AgentStatus>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ margin: "12px 0 0 0" }}>
                <EuiToolTip position="top" content={`Open ${currentAgent.name} summary`}>
                  <EuiButtonEmpty
                    color="primary"
                    onMouseDown={(ev) => { AppNavigate.navigateToModule(ev, 'agents', { "tab": "welcome", "agent": currentAgent.id }); this.router.reload(); this.setState({ menuOpened: false }) }}>
                    <EuiIcon type="visualizeApp" color="primary" size="m" />
                  </EuiButtonEmpty>
                </EuiToolTip>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ margin: "12px 0 0 0" }}>
                <EuiToolTip position="top" content={"Change selected agent"}>
                  <EuiButtonEmpty
                    color="primary"
                    onClick={() => { store.dispatch(showExploreAgentModalGlobal({})); this.setState({ menuOpened: false }) }}>
                    <EuiIcon type="pencil" color="primary" size="m" />
                  </EuiButtonEmpty>
                </EuiToolTip>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ margin: "12px 16px 0 0" }}>
                <EuiToolTip position="top" content={"Unpin agent"}>
                  <EuiButtonEmpty
                    color="text"
                    onClick={() => { this.setState({ menuOpened: false }); this.removeSelectedAgent(); }}>
                    <EuiIcon type="pinFilled" color="danger" size="m" />
                  </EuiButtonEmpty>
                </EuiToolTip>
              </EuiFlexItem>

            </EuiFlexGroup>
          )}

          {this.state.isOverviewPopoverOpen && (
            <Overview
              closePopover={() => this.setState({ menuOpened: false })}
            ></Overview>
          )}
        </div>
      </div>
    );

    
    const logotypeURL = getHttp().basePath.prepend(this.wazuhConfig.getConfig()['customization.enabled'] && this.wazuhConfig.getConfig()['customization.logo.app'] ? getAssetURL(this.wazuhConfig.getConfig()['customization.logo.app']) : getThemeAssetURL('logo.svg'));
    const mainButton = (
      <button data-test-subj='menuWazuhButton' className="eui" onClick={() => this.switchMenuOpened()}>
        <EuiFlexGroup
          direction="row"
          responsive={false}
          style={{ paddingTop: 2 }}
        >
          <EuiFlexItem grow={false} className="navBarLogo-wrapper">
            <img src={logotypeURL} className="navBarLogo" alt="Menu logo" style={{width: '100%', height: 'auto'}}></img>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{
            margin: '0 6px',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
          >
            {this.state.menuOpened && (
              <EuiIcon color="subdued" type="arrowUp" size="l" />
            )}
            {!this.state.menuOpened && (
              <EuiIcon color="subdued" type="arrowDown" size="l" />
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      </button>
    );


    const openSelectorsButton = (
      <EuiToolTip position="bottom" content="Show selectors">
        <EuiButtonEmpty 
          iconType="boxesVertical"
          iconSide="right"
          style={{ position: 'relative', right: 0 }}
          onClick={()=> this.switchSelectorsPopOver()}
          size="s"
          aria-label="Open selectors"></EuiButtonEmpty>
      </EuiToolTip>
    )
   

    const container = document.getElementsByClassName('euiBreadcrumbs');
    return ReactDOM.createPortal(
      <WzReduxProvider>
        {this.state.showMenu && (
          <EuiFlexGroup alignItems="center" responsive={false}>

            <EuiFlexItem grow={false}>
              <EuiPopover
                panelClassName={
                  this.state.pluginPlatformMenuBlockedOrOpened ?
                    "wz-menu-popover wz-menu-popover-over" :
                    "wz-menu-popover wz-menu-popover-under"
                }
                button={mainButton}
                isOpen={this.state.menuOpened}
                closePopover={() => this.setState({ menuOpened: false })}
                anchorPosition="downLeft"
                panelPaddingSize='none'
                hasArrow={false}
              >
                <Fragment>{menu}</Fragment>
              </EuiPopover>
            </EuiFlexItem>

            <EuiFlexItem grow={false} style={{ marginLeft: 0 }}>
              <WzGlobalBreadcrumbWrapper></WzGlobalBreadcrumbWrapper>
            </EuiFlexItem>

            <EuiFlexItem>
              <></>
            </EuiFlexItem>

            { !this.showSelectorsInPopover && this.state.patternList.length > 1 &&
              this.getIndexPatternSelectorComponent()
            }

            { !this.showSelectorsInPopover && this.state.APIlist.length > 1 &&  
              this.getApiSelectorComponent()  
            }

            { this.showSelectorsInPopover && 
              (this.state.patternList.length > 1 || this.state.APIlist.length > 1) &&
              <>
                
                <EuiFlexItem grow={false}>
                  <EuiPopover
                        ownFocus
                        anchorPosition="downCenter"
                        button={openSelectorsButton}
                        isOpen={this.state.isSelectorsPopoverOpen}
                        closePopover={()=> this.switchSelectorsPopOver()}> 
                          { this.state.patternList.length > 1 &&
                            <EuiFlexGroup alignItems="center" style={{ paddingTop: 5 }}>
                              {this.getIndexPatternSelectorComponent()}
                            </EuiFlexGroup>
                          } 
                          { this.state.APIlist.length > 1 &&
                            <EuiFlexGroup alignItems="center" style={{ paddingTop: 5 }} direction="row">
                              {this.getApiSelectorComponent()}
                            </EuiFlexGroup>
                          } 
                  </EuiPopover>
                </EuiFlexItem>
                
              </>

            }
            {this.props.state.wazuhNotReadyYet && this.buildWazuhNotReadyYet()}
          </EuiFlexGroup>

        )}
      </WzReduxProvider>
      , container[0]);
  }
});

const mapStateToProps = state => {
  return {
    state: state.appStateReducers,
    appConfig: state.appConfig
  };
};

export default connect(
  mapStateToProps,
  null
)(WzMenu);
