/*
 * Wazuh app - React component for build q queries.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, Fragment } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiButtonEmpty, EuiCallOut, EuiLoadingSpinner, EuiToolTip } from '@elastic/eui';
import { AppState } from '../../react-services/app-state';
import { PatternHandler } from '../../react-services/pattern-handler';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { connect } from 'react-redux';
import WzReduxProvider from '../../redux/wz-redux-provider';
import store from '../../redux/store'
import WzManagementSideMenu from './management-side-menu';
import { npStart } from 'ui/new_platform'
import { toastNotifications } from 'ui/notify';
import { GenericRequest } from '../../react-services/generic-request';
import { ApiCheck } from '../../react-services/wz-api-check';
import chrome from 'ui/chrome';
import { WzGlobalBreadcrumbWrapper } from '../common/globalBreadcrumbWrapper';

class WzMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMenu: false,
      currentMenuTab: "",
      currentAPI: "",
      APIlist: [],
      showSelector: false,
      theresPattern: false,
      currentPattern: "",
      patternList: [],
      currentSelectedPattern: "",
      isManagementPopoverOpen: false,
      isVisualizePopoverOpen: false
    };
    this.store = store;
    this.genericReq = GenericRequest;
    this.wazuhConfig = new WazuhConfig();
    this.indexPatterns = npStart.plugins.data.indexPatterns;
  }

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  getCurrentTab() {
    const currentWindowLocation = window.location.hash;
    if (currentWindowLocation.match(/#\/overview/)) {
      return 'overview';
    }
    if (currentWindowLocation.match(/#\/manager/)) {
      return 'manager';
    }
    if (currentWindowLocation.match(/#\/agents-preview/) || currentWindowLocation.match(/#\/agents/)) {
      return 'agents-preview';
    }
    if (currentWindowLocation.match(/#\/settings/)) {
      return 'settings';
    }
    if (currentWindowLocation.match(/#\/wazuh-dev/)) {
      return 'wazuh-dev';
    }
    if (currentWindowLocation.match(/#\/health-check/)) {
      return 'health-check';
    }
    return "";

  }

  loadApiList = async () => {
    const result = await this.genericReq.request('GET', '/hosts/apis', {});
    const APIlist = ((result || {}).data || []);
    if (APIlist.length) this.setState({ APIlist });
  }


  async componentDidUpdate(prevProps) {
    if (this.state.APIlist && !this.state.APIlist.length) {
      this.loadApiList();
    }
    const { id: apiId } = JSON.parse(AppState.getCurrentAPI())
    const { currentAPI } = this.state;
    const currentTab = this.getCurrentTab();
    if (currentTab !== this.state.currentMenuTab) {
      this.setState({ currentMenuTab: currentTab })
    }

    if (prevProps.state.showMenu !== this.props.state.showMenu || this.props.state.showMenu === true && this.state.showMenu === false) {
      this.load();
    }
    if (!currentAPI && apiId || apiId !== currentAPI) {
      this.setState({ currentAPI: apiId })
    } else {
      if (currentAPI && this.props.state.currentAPI && currentAPI !== this.props.state.currentAPI) {
        this.setState({ currentAPI: this.props.state.currentAPI });
      }
    }
  }

  async load() {
    try {
      this.setState({ showMenu: true });

      const currentTab = this.getCurrentTab();
      if (currentTab !== this.state.currentMenuTab) {
        this.setState({ currentMenuTab: currentTab })
      }

      const list = await PatternHandler.getPatternList();
      if (!list) return;

      // Get the configuration to check if pattern selector is enabled
      const config = this.wazuhConfig.getConfig();
      AppState.setPatternSelector(config['ip.selector']);

      // Abort if we have disabled the pattern selector
      if (!AppState.getPatternSelector()) return;

      // Show the pattern selector
      this.setState({ showSelector: true });

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
        this.setState({ patternList: list, currentSelectedPattern: AppState.getCurrentPattern() })
      }
    } catch (error) {
      this.showToast('danger', 'Error', error, 4000);
    }
  }

  changePattern = (event) => {
    try {
      if (!AppState.getPatternSelector()) return;
      PatternHandler.changePattern(event.target.value);
      this.setState({ currentSelectedPattern: event.target.value });
      location.reload();
    } catch (error) {
      this.showToast('danger', 'Error', error, 4000);
    }
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
        cluster_info: clusterInfo,
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }



  changeAPI = async (event) => {
    try {
      const apiId = event.target.value;
      const apiEntry = this.state.APIlist.filter(item => {
        return item.id === apiId
      });
      const response = await ApiCheck.checkApi(apiEntry[0]);
      const clusterInfo = response.data || {};
      const apiData = this.state.APIlist.filter(item => {
        return item.id === apiId
      });

      if (!apiData[0].cluster_info) { //if apis have been modified we have to refresh the wazuhregistry
        this.updateClusterInfoInRegistry(apiId, clusterInfo);
        apiData[0].cluster_info = clusterInfo;
      }

      AppState.setCurrentAPI(
        JSON.stringify(
          { name: apiData[0].cluster_info.manager, id: apiId }
        ));
      if (this.state.currentMenuTab !== 'wazuh-dev') {
        const $injector = await chrome.dangerouslyGetActiveInjector();
        const tmpRouter = $injector.get('$route');
        tmpRouter.reload();
      }
    } catch (error) {
      this.showToast('danger', 'Error', error, 4000);
    }
  }


  buildPatternSelector() {
    return (
      <span className="small">
        <EuiToolTip position="bottom" content="Selected index pattern">
          <EuiIcon type='ip' color="primary" size='m'></EuiIcon>
        </EuiToolTip>
        <select className="wz-menu-select" value={this.state.currentSelectedPattern}
          onChange={this.changePattern} aria-label="Index pattern selector">

          {this.state.patternList.map((item, idx) => {
            return (
              <option className="wz-menu-select-option" key={idx} value={item.id}>
                {item.title}
              </option>)
          })}
        </select>
      </span>
    )
  }

  buildApiSelector() {
    return (
      <span className="small">
        <EuiToolTip position="bottom" content="Selected API">
          <EuiIcon type='starFilledSpace' color="primary" size='m'></EuiIcon>
        </EuiToolTip>
        <select onMouseEnter={async () => this.loadApiList()} className="wz-menu-select" value={this.state.currentAPI}
          onChange={this.changeAPI} aria-label="API selector">

          {this.state.APIlist.map((item, idx) => {
            return (
              <option className="wz-menu-select-option" key={idx} value={item.id}>
                {item.id}
              </option>)
          })}
        </select>
      </span>
    )
  }

  setMenuItem(item) {
    this.setState({ currentMenuTab: item })
  }

  managementPopoverToggle() {
    this.setState(state => {
      return { isManagementPopoverOpen: !state.isManagementPopoverOpen }
    });
  }

  onClickManagementButton() {
    this.setMenuItem('manager');
    this.managementPopoverToggle();
  }

  render() {
    const managementButton = (
      <EuiButtonEmpty
        className={"wz-menu-button " + (this.state.currentMenuTab === "manager" ? "wz-menu-active" : "")}
        color="text"
        onClick={this.onClickManagementButton.bind(this)}
        iconType="arrowDown"
        iconSide="right">
        <EuiIcon type='managementApp' color='primary' size='m' />Management
      </EuiButtonEmpty>);

    return (
      <WzReduxProvider>
        <Fragment>
          <WzGlobalBreadcrumbWrapper></WzGlobalBreadcrumbWrapper>
          {this.state.showMenu && (
            <div>
              <div className="wz-menu-wrapper">
                <EuiFlexGroup className="wz-menu" responsive={false} direction="row">
                  <EuiFlexItem >
                    <EuiFlexGroup style={{ marginLeft: "10px", marginTop: "-6px" }}>
                      <EuiButtonEmpty
                        className={"wz-menu-button " + (this.state.currentMenuTab === "overview" || this.state.currentMenuTab === "health-check" ? "wz-menu-active" : "")}
                        color="text"
                        href="#/overview"
                        onClick={() => this.setMenuItem('overview')} >
                        <EuiIcon type='visualizeApp' color='primary' size='m' />Overview
                    </EuiButtonEmpty>


                      <EuiButtonEmpty
                        className={"wz-menu-button " + (this.state.currentMenuTab === "manager" ? "wz-menu-active" : "")}
                        color="text"
                        href="#/manager"
                        onClick={() => this.setMenuItem('manager')}>
                        <EuiIcon type='managementApp' color='primary' size='m' />Management
                  </EuiButtonEmpty>

                      <EuiButtonEmpty
                        className={"wz-menu-button " + (this.state.currentMenuTab === "agents-preview" || this.state.currentMenuTab === 'agents' ? "wz-menu-active" : "")}
                        color="text"
                        href="#/agents-preview"
                        onClick={() => this.setMenuItem('agents-preview')}>
                        <EuiIcon type='watchesApp' color='primary' size='m' />
                        <span className="wz-menu-button-title ">Agents</span>
                      </EuiButtonEmpty>

                      <EuiButtonEmpty
                        className={"wz-menu-button " + (this.state.currentMenuTab === "wazuh-dev" ? "wz-menu-active" : "")}
                        color="text"
                        href="#/wazuh-dev"
                        onClick={() => this.setMenuItem('wazuh-dev')}>
                        <EuiIcon type='console' color='primary' size='m' />
                        <span className="wz-menu-button-title ">Dev Tools</span>
                      </EuiButtonEmpty>


                    </EuiFlexGroup>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false} style={{ paddingTop: "6px", marginRight: "-4px", display: "inline" }}>
                    {this.state.currentAPI && this.state.APIlist && this.state.APIlist.length > 1 &&
                      (
                        this.buildApiSelector()
                      )
                    }
                    {!this.state.currentAPI &&
                      (
                        <span> No API </span>
                      )
                    }
                    &nbsp; &nbsp;
                {this.state.showSelector && this.state.theresPattern && this.state.patternList && this.state.patternList.length > 1 &&
                      (
                        this.buildPatternSelector()
                      )
                    }
                  </EuiFlexItem>

                  <EuiFlexItem grow={false} style={{ marginTop: "6px", marginRight: "1px" }}>
                    <EuiButtonEmpty
                      className={"wz-menu-button" + (this.state.currentMenuTab === "settings" ? " wz-menu-active" : "")}
                      href="#/settings"
                      color="text"
                      aria-label="Settings"
                      onClick={() => this.setMenuItem('settings')}>
                      <EuiIcon type='advancedSettingsApp' color='primary' size='m' style={{ marginRight: 0 }} />
                      <span> </span>
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </div>
            </div>
          )}
          {this.props.state.wazuhNotReadyYet &&
            (
              <EuiCallOut title={this.props.state.wazuhNotReadyYet} color="warning" style={{ margin: "60px 8px -50px 8px", }}>
                <EuiFlexGroup responsive={false} direction="row" style={{ maxHeight: "40px", marginTop: "-45px" }}>

                  <EuiFlexItem>
                    <p></p>
                  </EuiFlexItem>
                  {this.props.state.wazuhNotReadyYet.includes("Restarting") &&
                    (
                      <EuiFlexItem grow={false}>
                        <p>
                          <EuiLoadingSpinner size="l" /> &nbsp; &nbsp;
                        </p>
                      </EuiFlexItem>
                    )
                  }
                  {this.props.state.wazuhNotReadyYet === "Wazuh could not be recovered." &&
                    (
                      <EuiFlexItem grow={false}>
                        <EuiButtonEmpty grow={false} onClick={() => location.reload()} className="WzNotReadyButton" >
                          <span> Reload </span>
                        </EuiButtonEmpty>
                      </EuiFlexItem>

                    )
                  }
                </EuiFlexGroup>
              </EuiCallOut>
            )
          }
        </Fragment>
      </WzReduxProvider>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.appStateReducers,
  };
};

export default connect(mapStateToProps, null)(WzMenu);
