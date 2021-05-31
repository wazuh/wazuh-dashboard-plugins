/*
 * Wazuh app - Integrity monitoring components
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import {
  EuiFlexItem,
  EuiToolTip,
  EuiTab,
  EuiTabs,
  EuiButton,
  EuiButtonEmpty
} from '@elastic/eui';
import '../../common/modules/module.scss';
import { ReportingService } from '../../../react-services/reporting';
import { AppNavigate } from '../../../react-services/app-navigate';
import { ModulesDefaults } from './modules-defaults';
import { getAngularModule, getDataPlugin, getUiSettings } from '../../../kibana-services';
import { MainModuleAgent } from './main-agent'
import { MainModuleOverview } from './main-overview';
import store from '../../../redux/store';
import WzReduxProvider from '../../../redux/wz-redux-provider.js';

export class MainModule extends Component {
  constructor(props) {
    super(props);
    this.reportingService = new ReportingService();
    this.state = {
      selectView: false,
      loadingReport: false,
      switchModule: false,
      showAgentInfo: false
    };
    const app = getAngularModule();
    this.$rootScope = app.$injector.get('$rootScope');
  }

  async componentDidMount() {
    if (!(ModulesDefaults[this.props.section] || {}).notModule) {
      this.tabs = (ModulesDefaults[this.props.section] || {}).tabs || [{ id: 'dashboard', name: 'Dashboard' }, { id: 'events', name: 'Events' }];
      this.buttons = (ModulesDefaults[this.props.section] || {}).buttons || ['reporting', 'settings'];
    }
  }

  componentWillUnmount() {
    const { filterManager } = getDataPlugin().query;
    if (filterManager.getFilters() && filterManager.getFilters().length) {
      filterManager.removeAll();
    }
  }

  canBeInit(tab) { //checks if the init table can be set
    let canInit = false;
    this.tabs.forEach(element => {
      if (element.id === tab && (!element.onlyAgent || (element.onlyAgent && this.props.agent))) {
        canInit = true;
      }
    });
    return canInit;
  }

  renderTabs(agent = false) {
    const { selectView } = this.state;
    if (!agent) {

    }
    return (
      <EuiFlexItem style={{ margin: '0 8px 0 8px' }}>
        <EuiTabs>
          {this.tabs.map((tab, index) => {
            if (!tab.onlyAgent || (tab.onlyAgent && this.props.agent)) {
              return <EuiTab
                onClick={() => this.onSelectedTabChanged(tab.id)}
                isSelected={selectView === tab.id}
                key={index}
              >
                {tab.name}
              </EuiTab>
            }
          }
          )}
        </EuiTabs>
      </EuiFlexItem>
    );
  }


  startVis2PngByAgent = async () => {
    const agent =
      (this.props.agent || store.getState().appStateReducers.currentAgentData || {}).id || false;
    await this.reportingService.startVis2Png(this.props.section, agent);
  };

  async startReport() {
    try {
      this.setState({ loadingReport: true });
      const isDarkModeTheme = getUiSettings().get('theme:darkMode');
      if (isDarkModeTheme) {

        //Patch to fix white text in dark-mode pdf reports
        const defaultTextColor = '#DFE5EF';

        //Patch to fix dark backgrounds in visualizations dark-mode pdf reports
        const $labels = $('.euiButtonEmpty__text, .echLegendItem');
        const $vizBackground = $('.echChartBackground');
        const defaultVizBackground = $vizBackground.css('background-color');

        try {
          $labels.css('color', 'black');
          $vizBackground.css('background-color', 'transparent');
          await this.startVis2PngByAgent();
          $vizBackground.css('background-color', defaultVizBackground);
          $labels.css('color', defaultTextColor);
        } catch (e) {
          $labels.css('color', defaultTextColor);
          $vizBackground.css('background-color', defaultVizBackground);
          this.setState({ loadingReport: false });
        }
      } else {
        await this.startVis2PngByAgent();
      }
    } finally {
      this.setState({ loadingReport: false });
    }
  }

  renderReportButton() {
    return (
      (this.props.disabledReport &&
        <EuiFlexItem grow={false} style={{ marginRight: 4, marginTop: 6 }}>
          <EuiToolTip position="top" content="No results match for this search criteria.">
            <EuiButtonEmpty
              iconType="document"
              isLoading={this.state.loadingReport}
              isDisabled={true}
              onClick={async () => this.startReport()}>
              Generate report
              </EuiButtonEmpty>
          </EuiToolTip>
        </EuiFlexItem>

        || (
          <EuiFlexItem grow={false} style={{ marginRight: 4, marginTop: 6 }}>
            <EuiButtonEmpty
              iconType="document"
              isLoading={this.state.loadingReport}
              onClick={async () => this.startReport()}>
              Generate report
            </EuiButtonEmpty>
          </EuiFlexItem>))
    );
  }

  renderDashboardButton() {
    const href = `#/overview?tab=${this.props.section}&agentId=${this.props.agent.id}`
    return (
      <EuiFlexItem grow={false} style={{ marginLeft: 0, marginTop: 6, marginBottom: 18 }}>
        <EuiButton
          fill={this.state.selectView === 'dashboard'}
          iconType="visLine"
          onClick={() => this.onSelectedTabChanged('dashboard')}>
          Dashboard
          </EuiButton>
      </EuiFlexItem>
    );
  }

  renderSettingsButton() {
    return (
      <EuiFlexItem grow={false} style={{ marginRight: 4, marginTop: 6 }}>
        <EuiButtonEmpty
          fill={this.state.selectView === 'settings'}
          iconType="wrench"
          onClick={() => this.onSelectedTabChanged('settings')}>
          Configuration
          </EuiButtonEmpty>
      </EuiFlexItem>
    );
  }

  loadSection(id) {
    this.setState({ selectView: id });
  }

  onSelectedTabChanged(id) {
    if (id !== this.state.selectView) {
      if (id === 'events' || id === 'dashboard' || id === 'inventory') {
        this.$rootScope.moduleDiscoverReady = false;
        if (this.props.switchSubTab) this.props.switchSubTab(id === 'events' ? 'discover' : id === 'inventory' ? 'inventory' : 'panels')
        window.location.href = window.location.href.replace(
          new RegExp("tabView=" + "[^\&]*"),
          `tabView=${id === 'events' ? 'discover' : id === 'inventory' ? 'inventory' : 'panels'}`);
        this.afterLoad = id;
        this.loadSection('loader');
      } else {
        this.loadSection(id === 'panels' ? 'dashboard' : id === 'discover' ? 'events' : id);
      }
    }
  }

  render() {
    const { agent } = this.props;
    const { selectView } = this.state;
    const mainProps = {
      selectView,
      afterLoad: this.afterLoad,
      buttons: this.buttons,
      tabs: this.tabs,
      renderTabs: () => this.renderTabs(),
      renderReportButton: () => this.renderReportButton(),
      renderDashboardButton: () => this.renderDashboardButton(),
      renderSettingsButton: () => this.renderSettingsButton(),
      loadSection: (id) => this.loadSection(id),
      onSelectedTabChanged: (id) => this.onSelectedTabChanged(id)
    }
    return (
      <WzReduxProvider>
        {agent &&
          <MainModuleAgent {...{ ...this.props, ...mainProps }}></MainModuleAgent>
          || ((this.props.section && this.props.section !== 'welcome') &&
            <MainModuleOverview {...{ ...this.props, ...mainProps }}></MainModuleOverview>)
        }
      </WzReduxProvider>
    );
  }
}
