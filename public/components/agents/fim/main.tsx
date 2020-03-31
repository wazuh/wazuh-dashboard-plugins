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

import React, { Component } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiHealth,
  EuiTab,
  EuiTabs,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import {
  States,
  Events,
  Settings
} from './index';
import { Dashboard } from '../../common/modulesDashboards/dashboard';
import '../../../less/components/module.less';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import store from '../../../redux/store';

export class MainFim extends Component {
  state: {
    selectView: 'states' | 'events' | 'dashboard' | 'settings'
  };

  tabs = [
    { id: 'states', name: i18n.translate('wazuh.fim.states', { defaultMessage: 'States' }) },
    { id: 'events', name: i18n.translate('wazuh.fim.events', { defaultMessage: 'Events' }) },
  ]

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

  renderTitle() {
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiTitle size="s">
            <EuiHealth color="success">
              <h1>{this.props.agent.name} - <b>Integrity monitoring</b></h1>
            </EuiHealth>
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

  renderDashboardButton() {
    return (
      <EuiFlexItem grow={false}>
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

  onSelectedTabChanged(id) {
    this.setState({
      selectView: id,
    });
  }

  render() {
    const { selectView } = this.state;
    const title = this.renderTitle();
    const tabs = this.renderTabs();
    const dashboardButton = this.renderDashboardButton();
    const settingsButton = this.renderSettingsButton();
    return (
      <div className='wz-module'>
        <div className='wz-module-header-wrapper'>
          <div className='wz-module-header'>
            {title}
            <EuiFlexGroup>
              {tabs}
              {dashboardButton}
              {settingsButton}
            </EuiFlexGroup>
          </div>
        </div>
        <div className='wz-module-body'>
          {selectView === 'states' && <States {...this.props} />}
          {selectView === 'events' && <Events {...this.props} />}
          {selectView === 'dashboard' && <Dashboard {...this.props} section='fim' />}
          {selectView === 'settings' && <Settings {...this.props} />}
        </div>
      </div>
    );
  }
}
