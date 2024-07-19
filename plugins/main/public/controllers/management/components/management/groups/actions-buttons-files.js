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

  autoFormat = xml => {
    var reg = /(>)\s*(<)(\/*)/g;
    var wsexp = / *(.*) +\n/g;
    var contexp = /(<.+>)(.+\n)/g;
    xml = xml
      .replace(reg, '$1\n$2$3')
      .replace(wsexp, '$1\n')
      .replace(contexp, '$1\n$2');
    var formatted = '';
    var lines = xml.split('\n');
    var indent = 0;
    var lastType = 'other';
    var transitions = {
      'single->single': 0,
      'single->closing': -1,
      'single->opening': 0,
      'single->other': 0,
      'closing->single': 0,
      'closing->closing': -1,
      'closing->opening': 0,
      'closing->other': 0,
      'opening->single': 1,
      'opening->closing': 0,
      'opening->opening': 1,
      'opening->other': 1,
      'other->single': 0,
      'other->closing': -1,
      'other->opening': 0,
      'other->other': 0,
    };

    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (ln.match(/\s*<\?xml/)) {
        formatted += ln + '\n';
        continue;
      }
      var single = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
      var closing = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
      var opening = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
      var type = single
        ? 'single'
        : closing
        ? 'closing'
        : opening
        ? 'opening'
        : 'other';
      var fromTo = lastType + '->' + type;
      lastType = type;
      var padding = '';

      indent += transitions[fromTo];
      for (var j = 0; j < indent; j++) {
        padding += '\t';
      }
      if (fromTo == 'opening->closing')
        formatted = formatted.substr(0, formatted.length - 1) + ln + '\n';
      // substr removes line break (\n) from prev loop
      else formatted += padding + ln + '\n';
    }
    return formatted.trim();
  };

  async showGroupConfiguration() {
    const { itemDetail } = this.props.state;
    let result = await this.groupsHandler.getFileContent(
      `/groups/${itemDetail.name}/files/agent.conf?raw=true`,
    );

    if (Object.keys(result).length == 0) {
      result = '';
    }

    const data = this.autoFormat(result);

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
