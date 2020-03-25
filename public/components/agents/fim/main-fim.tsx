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
  EuiPanel,
  EuiSpacer,
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

export class MainFim extends Component {
  state: {
    selectView: 'states' | 'events' | 'settings'
  };

  tabs = [
    { id: 'states', name: i18n.translate('wazuh.fim.states', {defaultMessage: 'States'}) },
    { id: 'events', name: i18n.translate('wazuh.fim.events', {defaultMessage: 'Events'}) },
  ]

  constructor(props) {
    super(props);
    this.state = {
      selectView: 'states',
    };
  }

  renderTitle() {
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiTitle size="m">
            <EuiHealth color="success">
              <h1>Agent</h1>
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
        <EuiButton iconType="visLine">Dashboard</EuiButton>
      </EuiFlexItem>
    );
  }

  renderSettingsButton() {
    return (
      <EuiFlexItem grow={false}>
        <EuiButton iconType="wrench" ></EuiButton>
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
      <div>
        <div style={{
          backgroundColor:'white',
          boxShadow: '0 2px 2px -1px rgba(152, 162, 179, 0.3)', 
          borderBottom: '1px solid #D3DAE6',
          padding: 16
          }}>
          {title}
          <EuiFlexGroup>
            {tabs}
            {dashboardButton}
            {settingsButton}
          </EuiFlexGroup>
        </div>
        <EuiSpacer size="l" />
        <EuiPanel style={{ margin: 12 }}>
          {selectView === 'states' && <States {...this.props} />}
          {selectView === 'events' && <Events {...this.props} />}
          {selectView === 'settings' && <Settings {...this.props} />}
        </EuiPanel>
      </div>
    );
  }
}
