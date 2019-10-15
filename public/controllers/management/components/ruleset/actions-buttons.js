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
import React, { Component, Fragment } from 'react';
// Eui components
import {
  EuiFlexItem,
  EuiButtonEmpty,
  EuiGlobalToastList
} from '@elastic/eui';

import { connect } from 'react-redux';

import { toggleShowFiles } from '../../../../redux/actions/rulesetActions';

import {
  updateItems,
  updateColumns,
  updateLoadingStatus
} from '../../../../redux/actions/rulesetActions';

import { WzRequest } from '../../../../react-services/wz-request';
import exportCsv from '../../../../react-services/wz-csv';
import columns from './columns';

class WzRulesetActionButtons extends Component {
  constructor(props) {
    super(props);

    this.state = { generatingCsv: false };
    this.exportCsv = exportCsv;

    this.wzReq = WzRequest;
    this.paths = {
      rules: '/rules',
      decoders: '/decoders',
      lists: '/lists/files'
    }
    this.columns = columns;
  }

  /**
   * Generates a CSV
   */
  async generateCsv() {
    try {
      this.setState({ generatingCsv: true });
      const { section, filters } = this.props.state; //TODO get filters from the search bar from the REDUX store
      await this.exportCsv(`/${section}`, filters, section);
    } catch (error) {
      console.error('Error exporting as CSV ', error);
    }
    this.setState({ generatingCsv: false });
  }

  /**
   * Toggle between files and rules or decoders
   */
  async toggleFiles() {
    try {
      this.props.updateLoadingStatus(true);
      const { showingFiles, section } = this.props.state;
      this.props.toggleShowFiles(!showingFiles)
      const path = !showingFiles ? `${this.paths[section]}/files` : this.paths[section];
      const result = await this.wzReq.apiReq('GET', path, {});
      const items = result.data.data.items;
      const columns = !showingFiles ? this.columns.files : this.columns[section]
      this.props.updateColumns(columns);
      this.props.updateItems(items);
      this.props.updateLoadingStatus(false);
    } catch (error) {
      console.error('error toggling ', error)
    }
  }

  render() {
    const { section, showingFiles } = this.props.state;

    // Export button
    const exportButton = (
      <EuiButtonEmpty
        iconType="exportAction"
        onClick={async () => await this.generateCsv()}
        isLoading={this.state.generatingCsv}
      >
        Export formatted
      </EuiButtonEmpty>
    );

    // Add new rule button
    const addNewRuleButton = (
      <EuiButtonEmpty
        iconType="plusInCircle"
        onClick={async () => console.log('adding new')}
      >
        {`Add new ${section} file`}
      </EuiButtonEmpty>
    );

    // Manage files
    const manageFiles = (
      <EuiButtonEmpty
        iconType={showingFiles ? 'apmTrace' : 'folderClosed'}
        onClick={async () => await this.toggleFiles()}
      >
        {showingFiles ? `Manage ${section}` : `Manage ${section} files`}
      </EuiButtonEmpty>
    );
    return (
      <Fragment>
        {section !== 'lists' && (
          <EuiFlexItem grow={false}>
            {manageFiles}
          </EuiFlexItem>
          )
        }
        <EuiFlexItem grow={false}>
          {addNewRuleButton}
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          {exportButton}
        </EuiFlexItem>
      </Fragment>
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
    updateItems: items => dispatch(updateItems(items)),
    updateColumns: columns => dispatch(updateColumns(columns)),
    toggleShowFiles: status => dispatch(toggleShowFiles(status)),
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status))
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(WzRulesetActionButtons);
