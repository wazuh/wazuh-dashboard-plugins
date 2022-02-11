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
import { EuiFlexItem, EuiFlexGroup, EuiSideNav, EuiIcon } from '@elastic/eui';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';
import { AppNavigate } from '../../react-services/app-navigate';
import { WAZUH_MENU_SECURITY_SECTIONS_ID } from '../../../common/constants';
import { WAZUH_MENU_SECURITY_SECTIONS_CY_TEST_ID } from '../../../common/wazu-menu/wz-menu-security.cy';

class WzMenuSecurity extends Component {
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

  avaibleRenderSettings() {
    return [
      this.createItem({
        id: WAZUH_MENU_SECURITY_SECTIONS_ID.USERS,
        cyTestId: WAZUH_MENU_SECURITY_SECTIONS_CY_TEST_ID.USERS,
        text: 'Users',
      }),
      this.createItem({
        id: WAZUH_MENU_SECURITY_SECTIONS_ID.ROLES,
        cyTestId: WAZUH_MENU_SECURITY_SECTIONS_CY_TEST_ID.ROLES,
        text: 'Roles',
      }),
      this.createItem({
        id: WAZUH_MENU_SECURITY_SECTIONS_ID.POLICIES,
        cyTestId: WAZUH_MENU_SECURITY_SECTIONS_CY_TEST_ID.POLICIES,
        text: 'Policies',
      }),
      this.createItem({
        id: WAZUH_MENU_SECURITY_SECTIONS_ID.ROLES_MAPPING,
        cyTestId: WAZUH_MENU_SECURITY_SECTIONS_CY_TEST_ID.ROLES_MAPPING,
        text: 'Roles mapping',
      }),
    ];
  }

  clickMenuItem = async (ev, section) => {
    this.props.closePopover();
    AppNavigate.navigateToModule(ev, 'security', { tab: section });
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: item.id,
      name: item.text,
      'data-test-subj': item.cyTestId,
      isSelected: window.location.href.includes('/security') && this.props.state.selected_security_section === item.id,
      onClick: () => { },
      onMouseDown: (ev) => this.clickMenuItem(ev, item.id)
    };
  };

  render() {
    const renderSettings = this.avaibleRenderSettings()
    const sideNavAdmin = [
      {
        name: 'Security',
        id: 0,
        icon: <EuiIcon type="securityApp" color="primary" />,
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
    state: state.securityReducers
  };
};

export default connect(mapStateToProps, null)(WzMenuSecurity);
