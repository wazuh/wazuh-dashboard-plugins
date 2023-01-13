/*
 * Wazuh app - React component for registering agents.
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
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiSideNav,
  EuiIcon,
  EuiButtonEmpty,
  EuiToolTip,
} from '@elastic/eui';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';
import { AppNavigate } from '../../react-services/app-navigate';
import { WAZUH_MENU_MANAGEMENT_SECTIONS_ID } from '../../../common/constants';
import { WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID } from '../../../common/wazu-menu/wz-menu-management.cy';
import { i18n } from '@kbn/i18n';

const management = i18n.translate(
  'wazuh.public.components.wz.menu.management.',
  {
    defaultMessage: 'Management',
  },
);
const administration = i18n.translate(
  'wazuh.public.components.wz.menu.management.',
  {
    defaultMessage: 'Administration',
  },
);
const ruleset = i18n.translate('wazuh.public.components.wz.menu.management.', {
  defaultMessage: 'Ruleset',
});
const rules = i18n.translate('wazuh.public.components.wz.menu.management.', {
  defaultMessage: 'Rules',
});
const decoders = i18n.translate('wazuh.public.components.wz.menu.management.', {
  defaultMessage: 'Decoders',
});
const lists = i18n.translate('wazuh.public.components.wz.menu.management.', {
  defaultMessage: 'CDB lists',
});
const groups = i18n.translate('wazuh.public.components.wz.menu.management.', {
  defaultMessage: 'Groups',
});
const configuration = i18n.translate(
  'wazuh.public.components.wz.menu.management.',
  {
    defaultMessage: 'Configuration',
  },
);
const statusReport = i18n.translate(
  'wazuh.public.components.wz.menu.management.',
  {
    defaultMessage: 'Status and reports',
  },
);
const status1 = i18n.translate('wazuh.public.components.wz.menu.management.', {
  defaultMessage: 'Status',
});
const cluster = i18n.translate('wazuh.public.components.wz.menu.management.', {
  defaultMessage: 'Cluster',
});
const logs = i18n.translate('wazuh.public.components.wz.menu.management.', {
  defaultMessage: 'Logs',
});
const reporting = i18n.translate(
  'wazuh.public.components.wz.menu.management.',
  {
    defaultMessage: 'Reporting',
  },
);
const statistics = i18n.translate(
  'wazuh.public.components.wz.menu.management.',
  {
    defaultMessage: 'Statistics',
  },
);
const manager = i18n.translate('wazuh.public.components.wz.menu.management.', {
  defaultMessage: 'manager',
});
class WzMenuManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // TODO: Fix the selected section
      selectedItemName: null,
    };

    this.managementSections = {
      management: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.MANAGEMENT,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.MANAGEMENT,
        text: management,
      },
      administration: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.ADMINISTRATION,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.ADMINISTRATION,
        text: administration,
      },
      ruleset: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.RULESET,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.RULESET,
        text: ruleset,
      },
      rules: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.RULES,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.RULES,
        text: rules,
      },
      decoders: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.DECODERS,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.DECODERS,
        text: decoders,
      },
      lists: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.CDB_LISTS,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.CDB_LISTS,
        text: lists,
      },
      groups: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.GROUPS,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.GROUPS,
        text: groups,
      },
      configuration: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.CONFIGURATION,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.CONFIGURATION,
        text: configuration,
      },
      statusReports: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.STATUS_AND_REPORTS,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.STATUS_AND_REPORTS,
        text: statusReport,
      },
      status: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.STATUS,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.STATUS,
        text: status1,
      },
      cluster: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.CLUSTER,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.CLUSTER,
        text: cluster,
      },
      logs: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.LOGS,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.LOGS,
        text: logs,
      },
      reporting: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.REPORTING,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.REPORTING,
        text: reporting,
      },
      statistics: {
        id: WAZUH_MENU_MANAGEMENT_SECTIONS_ID.STATISTICS,
        cyTestId: WAZUH_MENU_MANAGEMENT_SECTIONS_CY_TEST_ID.STATISTICS,
        text: statistics,
      },
    };

    this.paths = {
      rules: '/rules',
      decoders: '/decoders',
      lists: '/lists/files',
    };

    this.wzReq = WzRequest;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.section !== this.state.selectedItemName) {
      this.setState({ selectedItemName: nextProps.section });
    }
  }

  clickMenuItem = (ev, section) => {
    this.props.closePopover();
    AppNavigate.navigateToModule(ev, manager, { tab: section });
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: item.id,
      name: item.text,
      'data-test-subj': item.cyTestId,
      isSelected: this.props.state.section === item.id,
      onClick: () => {},
      onMouseDown: ev => this.clickMenuItem(ev, item.id),
    };
  };

  render() {
    const sideNavAdmin = [
      {
        name: this.managementSections.administration.text,
        id: this.managementSections.administration.id,
        id: 0,
        disabled: true,
        icon: <EuiIcon type='managementApp' color='primary' />,
        items: [
          this.createItem(this.managementSections.rules),
          this.createItem(this.managementSections.decoders),
          this.createItem(this.managementSections.lists),
          this.createItem(this.managementSections.groups),
          this.createItem(this.managementSections.configuration),
        ],
      },
    ];

    const sideNavStatus = [
      {
        name: this.managementSections.statusReports.text,
        id: this.managementSections.statusReports.id,
        disabled: true,
        icon: <EuiIcon type='reportingApp' color='primary' />,
        items: [
          this.createItem(this.managementSections.status),
          this.createItem(this.managementSections.cluster),
          this.createItem(this.managementSections.statistics),
          this.createItem(this.managementSections.logs),
          this.createItem(this.managementSections.reporting),
        ],
      },
    ];

    return (
      <div className='WzManagementSideMenu'>
        <EuiFlexGroup>
          <EuiFlexItem grow={false} style={{ marginLeft: 14 }}>
            <EuiButtonEmpty
              iconType='apps'
              onClick={() => {
                this.props.closePopover();
                window.location.href = '#/manager';
              }}
            >
              {i18n.translate('wazuh.components.wz.menu.Managementdirectory', {
                defaultMessage: 'Management directory',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiSideNav items={sideNavAdmin} style={{ padding: '4px 12px' }} />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSideNav items={sideNavStatus} style={{ padding: '4px 12px' }} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers,
  };
};

export default connect(mapStateToProps)(WzMenuManagement);
