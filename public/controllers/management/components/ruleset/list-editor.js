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
  EuiCallOut
} from '@elastic/eui';

import { connect } from 'react-redux';

import {
  updateLoadingStatus
} from '../../../../redux/actions/rulesetActions';


class WzListEditor extends Component {
  constructor(props) {
    super(props);
    this.colums = [
      {
        field: 'name',
        name: 'Name',
        align: 'left',
        sortable: true
      },
      {
        field: 'path',
        name: 'Path',
        align: 'left',
        sortable: true
      }
    ];
  }

  render() {
    const { listInfo } = this.props.state;
    const { name, path, content } = listInfo;
    return (
      <div>{content}</div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status))
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(WzListEditor);