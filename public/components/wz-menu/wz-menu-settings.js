/*
 * Wazuh app - React component for Settings submenu.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { EuiFlexItem, EuiFlexGroup, EuiSideNav, EuiIcon, EuiButtonEmpty, EuiToolTip } from '@elastic/eui';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';
import { AppNavigate } from '../../react-services/app-navigate';
import { getAngularModule } from '../../kibana-services';
import { WAZUH_MENU_SETTINGS_SECTIONS_ID } from '../../../common/constants';
import { WAZUH_MENU_SETTINGS_SECTIONS_CY_TEST_ID } from '../../../common/wazu-menu/wz-menu-settings.cy';

class WzMenuSettings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // TODO: Fix the selected section
      selectedItemName: null
    };
    this.wzReq = WzRequest;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.section !== this.state.selectedItemName) {
      this.setState({ selectedItemName: nextProps.section });
    }
  }

  availableSettings() {
    let auxSettings = {
      settings: {
        id: WAZUH_MENU_SETTINGS_SECTIONS_ID.SETTINGS,
        cyTestId: WAZUH_MENU_SETTINGS_SECTIONS_CY_TEST_ID.SETTINGS,
        text: 'Settings',
      },
      api: {
        id: WAZUH_MENU_SETTINGS_SECTIONS_ID.API_CONFIGURATION,
        cyTestId: WAZUH_MENU_SETTINGS_SECTIONS_CY_TEST_ID.API_CONFIGURATION,
        text: 'API configuration',
      },
      modules: {
        id: WAZUH_MENU_SETTINGS_SECTIONS_ID.MODULES,
        cyTestId: WAZUH_MENU_SETTINGS_SECTIONS_CY_TEST_ID.MODULES,
        text: 'Modules',
      },
      sample_data: {
        id: WAZUH_MENU_SETTINGS_SECTIONS_ID.SAMPLE_DATA,
        cyTestId: WAZUH_MENU_SETTINGS_SECTIONS_CY_TEST_ID.SAMPLE_DATA,
        text: 'Sample data',
      },
      configuration: {
        id: WAZUH_MENU_SETTINGS_SECTIONS_ID.CONFIGURATION,
        cyTestId: WAZUH_MENU_SETTINGS_SECTIONS_CY_TEST_ID.CONFIGURATION,
        text: 'Configuration',
      },
      logs: {
        id: WAZUH_MENU_SETTINGS_SECTIONS_ID.LOGS,
        cyTestId: WAZUH_MENU_SETTINGS_SECTIONS_CY_TEST_ID.LOGS,
        text: 'Logs' },
      miscellaneous: {
        id: WAZUH_MENU_SETTINGS_SECTIONS_ID.MISCELLANEOUS,
        cyTestId: WAZUH_MENU_SETTINGS_SECTIONS_CY_TEST_ID.MISCELLANEOUS,
        text: 'Miscellaneous',
      },
      about: {
        id: WAZUH_MENU_SETTINGS_SECTIONS_ID.ABOUT,
        cyTestId: WAZUH_MENU_SETTINGS_SECTIONS_CY_TEST_ID.ABOUT,
        text: 'About',
      },
    };
    return (auxSettings);
  }

  avaibleRenderSettings() {
    const availableSettings = this.availableSettings()
    let auxItems = [
      this.createItem(availableSettings.api),
      this.createItem(availableSettings.modules),
      this.createItem(availableSettings.sample_data),
      this.createItem(availableSettings.configuration),
      this.createItem(availableSettings.logs),
      this.createItem(availableSettings.miscellaneous),
      this.createItem(availableSettings.about),
    ]
    return (auxItems);
  }

  clickMenuItem = async (ev, section) => {
    this.props.closePopover();
    AppNavigate.navigateToModule(ev, 'settings', { tab: section });
    if (this.props.currentMenuTab === 'settings') {
      const $injector = getAngularModule().$injector;
      const router = $injector.get('$route');
      router.reload();
    }
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: item.id,
      name: item.text,
      'data-test-subj': item.cyTestId,
      isSelected: window.location.href.includes('/settings') && this.props.state.selected_settings_section === item.id,
      onClick: () => { },
      onMouseDown: (ev) => this.clickMenuItem(ev, item.id)
    };
  };

  render() {
    const availableSettings = this.availableSettings()
    const renderSettings = this.avaibleRenderSettings()
    const sideNavAdmin = [
      {
        name: availableSettings.settings.text,
        id: availableSettings.settings.id,
        disabled: true,
        icon: <EuiIcon type="gear" color="primary"/>,
        items: renderSettings
      }
    ];


    return (
      <div className="WzManagementSideMenu" style={{ width: 200 }}>
        <EuiFlexGroup responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiSideNav items={sideNavAdmin} style={{ padding: '4px 12px' }} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.appStateReducers,
  };
};

export default connect(
  mapStateToProps,
)(WzMenuSettings);
