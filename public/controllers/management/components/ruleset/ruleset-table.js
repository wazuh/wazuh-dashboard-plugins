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
import React, { Component } from 'react';
import {
  EuiInMemoryTable
} from '@elastic/eui';

import { WzRequest } from '../../../../react-services/wz-request';

import { connect } from 'react-redux';

class WzRulesetTable extends Component {
  constructor(props) {
    super(props);

    this.wzReq = WzRequest;

    this.columns = {
      rules: [{ field: 'id', name: 'ID', align: 'left', sortable: true }, { field: 'description', name: 'Description', align: 'left', sortable: true }, { field: 'groups', name: 'Groups', align: 'left', sortable: true }, { field: 'pci', name: 'PCI', align: 'left', sortable: true }, { field: 'gdpr', name: 'GDPR', align: 'left', sortable: true }, { field: 'hipaa', name: 'HIPAA', align: 'left', sortable: true }, { field: 'nist-800-53', name: 'NIST 800-53', align: 'left', sortable: true }, { field: 'level', name: 'Level', align: 'left', sortable: true }, { field: 'field', name: 'Field', align: 'left', sortable: true }],
      decoders: [{ field: 'name', name: 'Name', align: 'left', sortable: true }, { field: 'details.program_name', name: 'Program name', align: 'left', sortable: true }, { field: 'details.order', name: 'Order', align: 'left', sortable: true }, { field: 'file', name: 'File', align: 'left', sortable: true }, { field: 'path', name: 'Path', align: 'left', sortable: true }],
      lists: [{ field: 'name', name: 'Name', align: 'left', sortable: true }, { field: 'path', name: 'Path', align: 'left', sortable: true }]
    }
  }

  render() {
    const reduxData = this.props.state
    const columns = this.columns[reduxData.section];
    return (
      <EuiInMemoryTable
        itemId="id"
        items={reduxData.items}
        columns={columns}
        pagination={true}
        loading={reduxData.isLoading}
        sorting={true}
        message={false}
      />
    )
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};

export default connect(mapStateToProps)(WzRulesetTable);
