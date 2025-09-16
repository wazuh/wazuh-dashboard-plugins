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
import React, { Component, Fragment } from 'react';
// Eui components
import { EuiFlexItem } from '@elastic/eui';

import { connect } from 'react-redux';

import { updateShowAddAgents } from '../../../../../redux/actions/groupsActions';

import GroupsHandler from './utils/groups-handler';
import { ExportConfiguration } from '../../../../../components/agents/export-configuration';
import { ReportingService } from '../../../../../react-services/reporting';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';

class WzGroupsActionButtonsAgents extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);
    this.reportingService = new ReportingService();

    this.groupsHandler = GroupsHandler;
  }

  showManageAgents() {
    this.props.updateShowAddAgents(true);
  }

  render() {
    // Add new group button
    const manageAgentsButton = (
      <WzButtonPermissions
        buttonType='empty'
        permissions={[
          {
            action: 'group:update_config',
            resource: `group:id:${this.props.state.itemDetail.name}`,
          },
          { action: 'cluster:status', resource: '*:*:*' },
        ]}
        iconSide='left'
        iconType='folderOpen'
        onClick={() => this.showManageAgents()}
      >
        Manage agents
      </WzButtonPermissions>
    );

    // Export PDF button
    const exportPDFButton = (
      <ExportConfiguration
        exportConfiguration={enabledComponents =>
          this.reportingService.startConfigReport(
            this.props.state.itemDetail,
            'groupConfig',
            enabledComponents,
          )
        }
        type='group'
      />
    );

    return (
      <Fragment>
        <EuiFlexItem grow={false}>{manageAgentsButton}</EuiFlexItem>
        <EuiFlexItem grow={false}>{exportPDFButton}</EuiFlexItem>
      </Fragment>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.groupsReducers,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateShowAddAgents: showAddAgents =>
      dispatch(updateShowAddAgents(showAddAgents)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(WzGroupsActionButtonsAgents);
