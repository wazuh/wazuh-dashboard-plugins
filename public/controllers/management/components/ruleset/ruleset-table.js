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
  EuiInMemoryTable,
  EuiButtonIcon
} from '@elastic/eui';

import { WzRequest } from '../../../../react-services/wz-request';

import { connect } from 'react-redux';

import columns from './columns';

class WzRulesetTable extends Component {
  constructor(props) {
    super(props);

    this.wzReq = WzRequest;

    this.columns = columns;
  }

  render() {
    const { section, isLoading, items } = this.props.state;
    const columns = this.columns[section];
    return (
      <EuiInMemoryTable
        itemId="id"
        items={items}
        columns={columns}
        pagination={true}
        loading={isLoading}
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
