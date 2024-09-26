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
import { EuiFlexItem, EuiButtonEmpty } from '@elastic/eui';

import { connect } from 'react-redux';

import { updateFileContent } from '../../../../../redux/actions/groupsActions';

import GroupsHandler from './utils/groups-handler';
import { ExportConfiguration } from '../../../../../components/agents/export-configuration';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';
import { ReportingService } from '../../../../../react-services/reporting';

class WzGroupsActionButtonsFiles extends Component {
  constructor(props) {
    super(props);
    this.reportingService = new ReportingService();

    this.groupsHandler = GroupsHandler;
    this.refreshTimeoutId = null;
  }

  async showGroupConfiguration() {
    const { itemDetail } = this.props.state;
    let result = await this.groupsHandler.getFileContent(
      `/groups/${itemDetail.name}/files/agent.conf?raw=true`,
    );

    if (Object.keys(result).length == 0) {
      result = '';
    }

    const data = result?.toString();

    const file = {
      name: 'agent.conf',
      content: data,
      isEditable: true,
      groupName: itemDetail.name,
    };
    this.props.updateFileContent(file);
  }

  render() {
    // Add new group button
    const groupConfigurationButton = (
      <WzButtonPermissions
        buttonType='empty'
        permissions={[
          {
            action: 'group:read',
            resource: `group:id:${this.props.state.itemDetail.name}`,
          },
        ]}
        iconSide='left'
        iconType='documentEdit'
        onClick={() => this.showGroupConfiguration()}
      >
        Edit group configuration
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
        <EuiFlexItem grow={false}>{groupConfigurationButton}</EuiFlexItem>
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
    updateFileContent: content => dispatch(updateFileContent(content)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(WzGroupsActionButtonsFiles);
