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
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiHealth,
  EuiTab,
  EuiTabs,
  EuiTitle,
  EuiToolTip,
  EuiCallOut
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import { States, Settings } from './index';
import { Events, Dashboard, Loader } from '../../common/modules';
import '../../../less/components/module.less';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import store from '../../../redux/store';

export class MainFim extends Component {
  state: {
    selectView: 'states' | 'events' | 'loader' | 'dashboard' | 'settings'
  };
  tabs = [
    { id: 'states', name: i18n.translate('wazuh.fim.states', { defaultMessage: 'States' }) },
    { id: 'events', name: i18n.translate('wazuh.fim.events', { defaultMessage: 'Events' }) },
  ]
  afterLoad = false;

  constructor(props) {
    super(props);
    this.state = {
      selectView: 'states',
    };
  }

  setGlobalBreadcrumb() {
    const breadcrumb = [
      {
        text: '',
      },
      {
        text: 'Agents',
        href: "#/agents-preview"
      },
      {
        text: `${this.props.agent.name} (${this.props.agent.id})`,
        href: `/app/wazuh#/agents?agent=${this.props.agent.id}`,
        truncate: true,
      },
      {
        text: 'Integrity monitoring',
      },
    ];
    store.dispatch(updateGlobalBreadcrumb(breadcrumb));
  }

  componentDidMount() {
    this.setGlobalBreadcrumb();
  }

  color = (status) => {
    if (status.toLowerCase() === 'active') { return 'success'; }
    else if (status.toLowerCase() === 'disconnected') { return 'danger'; }
    else if (status.toLowerCase() === 'never connected') { return 'subdued'; }
  }

  renderTitle() {
    return (
      <EuiFlexGroup>
        <EuiFlexItem className="wz-module-header-title">
          <EuiTitle size="s">
            <h1>
              <EuiToolTip position="right" content={this.props.agent.status}>
                <EuiHealth color={this.color(this.props.agent.status)}></EuiHealth>
              </EuiToolTip>
              {this.props.agent.name} ({this.props.agent.id}) - <b>Integrity monitoring</b>
            </h1>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  renderTabs() {
    const { selectView } = this.state;
    return (
      <EuiFlexItem>
        <EuiTabs display="condensed">
          {this.tabs.map((tab, index) =>
            <EuiTab
              onClick={() => this.onSelectedTabChanged(tab.id)}
              isSelected={selectView === tab.id}
              key={index}
            >
              {tab.name}
            </EuiTab>
          )}
        </EuiTabs>
      </EuiFlexItem>
    );
  }

  renderReportButton() {
    return (
      <EuiFlexItem grow={false}>
        <EuiButton
          iconType="document"
          onClick={() => this.onSelectedTabChanged('dashboard')}>
          Generate report
          </EuiButton>
      </EuiFlexItem>
    );
  }

  renderDashboardButton() {
    return (
      <EuiFlexItem grow={false} style={{ marginLeft: 0 }}>
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
      <EuiFlexItem grow={false} style={{ marginLeft: 0 }}>
        <EuiButton
          fill={this.state.selectView === 'settings'}
          iconType="wrench"
          onClick={() => this.onSelectedTabChanged('settings')}>
          Configuration
          </EuiButton>
      </EuiFlexItem>
    );
  }

  loadSection(id) {
    this.setState({ selectView: id });
  }

  onSelectedTabChanged(id) {
    if (id === 'events' || id === 'dashboard') {
      window.location.href = window.location.href.replace(
        new RegExp("tabView=" + "[^\&]*"),
        `tabView=${id === 'events' ? 'discover' : 'panels'}`);
      this.afterLoad = id;
      this.loadSection('loader');
    } else {
      this.loadSection(id);
    }
  }

  render() {
    const { selectView } = this.state;
    const title = this.renderTitle();
    const tabs = this.renderTabs();
    const reportButton = this.renderReportButton();
    const dashboardButton = this.renderDashboardButton();
    const settingsButton = this.renderSettingsButton();
    return (
      <Fragment>
        {(this.props.agent && this.props.agent.os) &&
          <div className='wz-module'>
            <div className='wz-module-header-wrapper'>
              <div className='wz-module-header'>
                {title}
                <EuiFlexGroup>
                  {tabs}
                  {selectView === 'dashboard' && <Fragment>{reportButton}</Fragment>}
                  {dashboardButton}
                  {settingsButton}
                </EuiFlexGroup>
              </div>
            </div>
            <div className='wz-module-body'>
              {selectView === 'states' && <States {...this.props} />}
              {selectView === 'events' && <Events {...this.props} section='fim' />}
              {selectView === 'loader' &&
                <Loader {...this.props}
                  loadSection={(section) => this.loadSection(section)}
                  redirect={this.afterLoad}>
                </Loader>}
              {selectView === 'dashboard' && <Dashboard {...this.props} section='fim' />}
              {selectView === 'settings' && <Settings {...this.props} />}
            </div>
          </div>
        }
        {(!this.props.agent || !this.props.agent.os) &&
          <EuiCallOut title=" This agent has never connected" color="warning" iconType="alert">
          </EuiCallOut>
        }
      </Fragment>
    );
  }
}
