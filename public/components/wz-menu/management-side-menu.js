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
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiSideNav,
  EuiIcon
} from '@elastic/eui';
import {
  updateRulesetSection,
  updateLoadingStatus,
  toggleShowFiles,
  cleanFilters,
  updateAdminMode,
  updateError,
  updateIsProcessing,
  updatePageIndex,
  updateSortDirection,
  updateSortField,
  cleanInfo,
} from '../../redux/actions/rulesetActions';
import {
  updateManagementSection,
} from '../../redux/actions/managementActions';
import checkAdminMode from '../../controllers/management/components/management/ruleset/utils/check-admin-mode';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';

class WzManagementSideMenu extends Component {
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
    };

    this.paths = {
      rules: '/rules',
      decoders: '/decoders',
      lists: '/lists/files'
    }

    this.wzReq = WzRequest;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.section !== this.state.selectedItemName) {
      this.setState({ selectedItemName: nextProps.section });
    }
  }

  componentDidMount() {
    // Fetch the data in the first mount
    if (['rules', 'decoders', 'lists'].includes(this.state.selectedItemName)) {
      this.fetchData(this.managementSections.rules.id);
    }
    this.props.updateManagementSection(this.state.selectedItemName);
  }

  /**
 * Fetch the data for a section: rules, decoders, lists...
 * @param {String} newSection
 */
  async fetchData(newSection) {
    try {
      const currentSection = this.props.state.section;
      if (Object.keys(this.props.state.filters).length && newSection === currentSection) return; // If there's any filter and the section is de same doesn't fetch again
      this.props.changeRulesetSection(newSection);
      this.props.changeSection(newSection);
      this.props.cleanInfo();
      this.props.updateLoadingStatus(true);
      //Set the admin mode
      const admin = await checkAdminMode();
      this.props.updateAdminMode(admin);
      this.props.toggleShowFiles(false);
      this.props.changeRulesetSection(newSection);
      this.props.changeSection(newSection);
    } catch (error) {
      this.props.updateError(error);
    }
  }

  clickMenuItem = section => {
    this.props.managementPopoverToggle();
    window.location.href = `#/manager/${section}?tab=${section}`;
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: item.id,
      name: item.text,
      isSelected: this.state.selectedItemName === item.id,
      onClick: () => this.clickMenuItem(item.id),
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
          this.createItem(this.managementSections.configuration)
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
        ],
      })
    ];

    return (
      <div className="WzManagementSideMenu">
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiSideNav
              items={sideNavAdmin}
              style={{ padding: '4px 12px' }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSideNav
              items={sideNavStatus}
              style={{ padding: '4px 12px' }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeRulesetSection: section => dispatch(updateRulesetSection(section)),
    changeSection: section => dispatch(updateManagementSection(section)),
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    toggleShowFiles: status => dispatch(toggleShowFiles(status)),
    cleanFilters: () => dispatch(cleanFilters()),
    updateAdminMode: status => dispatch(updateAdminMode(status)),
    updateError: error => dispatch(updateError(error)),
    updateIsProcessing: isPorcessing => dispatch(updateIsProcessing(isPorcessing)),
    updatePageIndex: pageIndex => dispatch(updatePageIndex(pageIndex)),
    updateSortDirection: sortDirection => dispatch(updateSortDirection(sortDirection)),
    updateSortField: sortField => dispatch(updateSortField(sortField)),
    updateManagementSection: section => dispatch(updateManagementSection(section)),
    cleanInfo: () => dispatch(cleanInfo()),
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(WzManagementSideMenu);
