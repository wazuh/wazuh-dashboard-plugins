/*
 * Wazuh app - Integrity monitoring components
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
import ReactDOM from 'react-dom';
import {
  EuiFlexItem,
  EuiToolTip,
  EuiTab,
  EuiTabs,
  EuiIcon,
  EuiPopover,
  EuiButton,
  EuiButtonEmpty
} from '@elastic/eui';
import '../../common/modules/module.less';
import { ReportingService } from '../../../react-services/reporting';
import { TabDescription } from '../../../../server/reporting/tab-description';
import { ModulesDefaults } from './modules-defaults';
import { getServices } from 'plugins/kibana/discover/kibana_services';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import { MainModuleAgent } from './main-agent'
import { MainModuleOverview } from './main-overview'
import Overview from '../../wz-menu/wz-menu-overview';

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
  }

  async componentDidMount() {
    if (!(ModulesDefaults[this.props.section] || {}).notModule) {
      this.tabs = (ModulesDefaults[this.props.section] || {}).tabs || [{ id: 'dashboard', name: 'Dashboard' }, { id: 'events', name: 'Events' }];
      this.buttons = (ModulesDefaults[this.props.section] || {}).buttons || ['reporting', 'settings'];
      const init = (ModulesDefaults[this.props.section] || {}).init || 'dashboard';
      this.loadSection(this.canBeInit(init) ? init : 'dashboard');
    }
  }

  componentWillUnmount() {
    const { filterManager } = getServices();
    if (filterManager.filters && filterManager.filters.length) {
      filterManager.removeAll();
    }
  }

  canBeInit(tab){ //checks if the init table can be set
    let canInit = false;
    this.tabs.forEach(element => {
      if(element.id === tab && (!element.onlyAgent || (element.onlyAgent && this.props.agent))){
        canInit = true;
      }
     });
    return canInit;
  }

  renderTabs(agent = false) {
    const { selectView } = this.state;
    if(!agent){

    }
    return (
      <EuiFlexItem style={{ marginTop: 0 }}>
        <EuiTabs>
          {this.tabs.map((tab, index) =>{
            if(!tab.onlyAgent || (tab.onlyAgent && this.props.agent)){
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

  async startReport() {
    this.setState({ loadingReport: true });
    await this.reportingService.startVis2Png(this.props.section, this.props.agent.id);
    this.setState({ loadingReport: false });
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
      if (id === 'events' || id === 'dashboard') {
        if(this.props.switchSubTab) this.props.switchSubTab(id === 'events' ? 'discover' : 'panels')
        window.location.href = window.location.href.replace(
          new RegExp("tabView=" + "[^\&]*"),
          `tabView=${id === 'events' ? 'discover' : 'panels'}`);
        this.afterLoad = id;
        this.loadSection('loader');
      } else {
        this.loadSection(id);
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
      <Fragment>
        {agent &&
          <MainModuleAgent {...{ ...this.props, ...mainProps }}></MainModuleAgent>
          ||
          <MainModuleOverview {...{ ...this.props, ...mainProps }}></MainModuleOverview>
        }
      </Fragment>
    );
  }
}
