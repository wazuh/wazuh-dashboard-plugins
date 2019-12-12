/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { EuiSideNav, EuiIcon, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { WzConfigurationSettings } from './configuration/configuration';

export default class WzSettingsSideMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTab: this.props.selectedTab,
    };
    this.settingsSections = {
      settings: { id: 'settings', text: 'App Settings' },
      api: { id: 'api', text: 'API Hosts' },
      configuration: { id: 'configuration', text: 'Configuration' },
      logs: { id: 'logs', text: 'Logs' },
      about: { id: 'about', text: 'About' },
    };
  }

  clickMenuItem = name => {
    this.setState({
      selectedTab: name,
    });
    this.props.clickAction(name);
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: item.id,
      name: item.text,
      isSelected: this.state.selectedTab === item.id,
      onClick: () => this.clickMenuItem(item.id),
    };
  };

  render() {
    const sideNav = [
      this.createItem(this.settingsSections.settings, {
        disabled: true,
        icon: <EuiIcon type="advancedSettingsApp" color="primary" />,
        items: [
          this.createItem(this.settingsSections.api, {
            icon: <EuiIcon type="link" color="primary" />,
          }),
          this.createItem(this.settingsSections.configuration, {
            icon: <EuiIcon type="devToolsApp" color="primary" />,
          }),
          this.createItem(this.settingsSections.logs, {
            icon: <EuiIcon type="filebeatApp" color="primary" />,
          }),
          this.createItem(this.settingsSections.about, {
            icon: <EuiIcon type="questionInCircle" color="primary" />,
          }),
        ],
      }),
    ];

    const { selectedTab } = this.state;
    return (
      <EuiFlexGroup>
        <EuiFlexItem grow={false} style={{ width: 190 }}>
          <EuiSideNav items={sideNav} style={{ padding: 16 }} />
        </EuiFlexItem>
        {selectedTab === 'configuration' && (
          <EuiFlexItem>
            <WzConfigurationSettings {...this.props}/>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    );
  }
}
