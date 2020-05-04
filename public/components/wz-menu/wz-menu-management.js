/*
 * Wazuh app - React component for registering agents.
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
import { EuiFlexItem, EuiFlexGroup, EuiSideNav, EuiIcon } from '@elastic/eui';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';
import { checkAdminMode } from '../../controllers/management/components/management/configuration/utils/wz-fetch';
import { updateAdminMode } from '../../redux/actions/appStateActions';

class WzMenuManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // TODO: Fix the selected section
      selectedItemName: null
    };

    this.managementSections = {
      management: { id: 'management', text: 'Management' },
      administration: { id: 'administration', text: 'Administration' },
      ruleset: { id: 'ruleset', text: 'Ruleset' },
      rules: { id: 'rules', text: 'Rules' },
      decoders: { id: 'decoders', text: 'Decoders' },
      lists: { id: 'lists', text: 'CDB lists' },
      groups: { id: 'groups', text: 'Groups' },
      configuration: { id: 'configuration', text: 'Configuration' },
      statusReports: { id: 'statusReports', text: 'Status and reports' },
      status: { id: 'status', text: 'Status' },
      cluster: { id: 'monitoring', text: 'Cluster' },
      logs: { id: 'logs', text: 'Logs' },
      reporting: { id: 'reporting', text: 'Reporting' },
      statistics: { id: 'statistics', text: 'Statistics' },
      add_data_to_modules: { id: 'add_data_to_modules', text: 'Add data to modules' },
    };

    this.paths = {
      rules: '/rules',
      decoders: '/decoders',
      lists: '/lists/files'
    };

    this.wzReq = WzRequest;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.section !== this.state.selectedItemName) {
      this.setState({ selectedItemName: nextProps.section });
    }
  }

  async componentDidMount() {
    try{
      const adminMode = await checkAdminMode();
      if(this.props.adminMode !== adminMode){
        this.props.updateAdminMode(adminMode);
      };
    }catch(error){}
  }

  clickMenuItem = section => {
    this.props.closePopover();
    window.location.href = `#/manager/${section}?tab=${section}`;
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: item.id,
      name: item.text,
      isSelected: this.props.state.section === item.id,
      onClick: () => this.clickMenuItem(item.id)
    };
  };

  render() {
    const sideNavAdmin = [
      this.createItem(this.managementSections.administration, {
        disabled: true,
        icon: <EuiIcon type="managementApp" color="primary" />,
        items: [
          this.createItem(this.managementSections.rules),
          this.createItem(this.managementSections.decoders),
          this.createItem(this.managementSections.lists),
          this.createItem(this.managementSections.groups),
          this.createItem(this.managementSections.configuration),
          ...(this.props.adminMode ? [this.createItem(this.managementSections.add_data_to_modules)] : [])
        ],
      })
    ];

    const sideNavStatus = [
      this.createItem(this.managementSections.statusReports, {
        disabled: true,
        icon: <EuiIcon type="reportingApp" color="primary" />,
        items: [
          this.createItem(this.managementSections.status),
          this.createItem(this.managementSections.cluster),
          this.createItem(this.managementSections.statistics),
          this.createItem(this.managementSections.logs),
          this.createItem(this.managementSections.reporting)
        ]
      })
    ];

    return (
      <div className="WzManagementSideMenu">
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
    adminMode: state.appStateReducers.adminMode
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateAdminMode: adminMode => dispatch(updateAdminMode(adminMode))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzMenuManagement);
