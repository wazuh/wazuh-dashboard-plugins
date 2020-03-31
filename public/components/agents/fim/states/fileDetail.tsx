/*
 * Wazuh app - Integrity monitoring table component
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
  EuiFlexGrid,
  EuiFlexItem,
  EuiText
} from '@elastic/eui';

export class FileDetails extends Component {
  state: {
  };

  props!: {
    currentFile: {}
  }

  constructor(props) {
    super(props);

    this.state = {
    }
  }


  columns() {
    // TODO -- add all the columns we need to show in the specific order
    return [
      {
        field: 'file',
        name: 'File',
      },
      {
        field: 'date',
        name: 'Last Modified',
      },
      {
        field: 'uname',
        name: 'User',
      },
      {
        field: 'uid',
        name: 'User ID',
      },
      {
        field: 'gname',
        name: 'Group',
      },
      {
        field: 'gid',
        name: 'Group ID',
      },
      {
        field: 'perm',
        name: 'Permissions',
      },
      {
        field: 'size',
        name: 'Size',
      }
    ]
  }

  async componentDidMount() {
    console.log(this.props.currentFile)
  }

  getDetails(){
    const columns = this.columns();
    const details = columns.map((item,idx) => {
      const value = this.props.currentFile[item.field] || '-';
      
      return (
        <EuiFlexItem key={idx}>
          <EuiText className="detail-title">
            {item.name}
          </EuiText>
          <EuiText>
            {value}
          </EuiText>
        </EuiFlexItem>
        )
    });

    return (<EuiFlexGrid>{details}</EuiFlexGrid>);
  }

  render() {
    return (
      <div>
        {this.getDetails()}
      </div>
    )
  }
}
