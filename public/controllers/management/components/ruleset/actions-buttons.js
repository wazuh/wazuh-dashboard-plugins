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
import { EuiFlexItem, EuiButtonEmpty } from '@elastic/eui';

import { connect } from 'react-redux';

import {

  updateItems,
} from '../../../../redux/actions/rulesetActions';

import { WzRequest } from '../../../../react-services/wz-request';

class WzRulesetActionButtons extends Component {
  constructor(props) {
    super(props);

    this.paths = {
      rules: '/rules/files',
      decoders: '/decoders/files',
      lists: '/lists/files'
    }

    this.wzReq = WzRequest;
  }

  /**
   * Fetch the data for a section: rules, decoders, lists...
   * @param {String} section 
   */
  async fetchData(section) {
    try {
      this.props.updateLoadingStatus(true);
      const result = await this.wzReq.apiReq('GET', this.paths[section], {})
      const items = result.data.data.items;
      this.props.updateItems(items);
      this.props.changeSection(section);
      this.props.updateLoadingStatus(false);
    } catch (error) {
      console.error('Error updating sections an data ', error);
    }
  }

  render() {
    const { section } = this.props.state;

    // Export button
    const exportButton = (
      <EuiButtonEmpty
        iconType="exportAction"
        onClick={async () => await this.wzReq.csvReq('/rules', {})}
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
        {`Add new ${section} files`}
      </EuiButtonEmpty>
    );

    // Manage files
    const manageFiles = (
      <EuiButtonEmpty
        iconType="folderClosed"
        onClick={async () => console.log('managing files')}
      >
        {`Manage ${section} files`}
      </EuiButtonEmpty>
    );
    return (
      <Fragment>
        <EuiFlexItem grow={false}>
          {manageFiles}
        </EuiFlexItem>
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
    updateItems: items => dispatch(updateItems(items))
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(WzRulesetActionButtons);
