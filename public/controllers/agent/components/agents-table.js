/*
 * Wazuh app - React component for building the agents table.
 *
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
import PropTypes from 'prop-types';
import {
  EuiInMemoryTable,
  EuiButtonIcon,
  EuiFlexItem,
  EuiFlexGroup,
  EuiPanel,
  EuiIcon,
  EuiTitle,
  EuiButtonEmpty,
  EuiText,
  EuiPopover,
  EuiFormRow,
  EuiFieldText,
  EuiSpacer,
  EuiButton,
  EuiCallOut
} from '@elastic/eui';

export class AgentsTable extends Component {

  constructor(props) {
    super(props);

  }

  componentDidMount() {    
  }



  render() {
    const search = {
      box: {
        incremental: true,
        schema: true,
      }
    };

    const columns = [
      {
        field: 'id',
        name: 'ID',
        sortable: true,
      },
      {
        field: 'name',
        name: 'Name',
        sortable: true,
      },
      {
        field: 'ip',
        name: 'IP',
        sortable: true,
      },
      {
        field: 'status',
        name: 'Status',
        sortable: true,
      },
      {
        field: 'group',
        name: 'Group',
        sortable: true,
      },
      {
        field: 'os_name',
        name: 'OS name',
        sortable: true,
      },
      {
        field: 'os_version',
        name: 'OS version',
        sortable: true,
      },
      {
        field: 'version',
        name: 'Version',
        sortable: true,
      },
      {
        field: 'r_date',
        name: 'Registration date',
        sortable: true,
      },
      {
        field: 'lk_alive',
        name: 'Last keep alive',
        sortable: true,
      },
      {
        field: 'actions',
        name: 'Actions',
        render: () => {
          return (
            <div>
              <EuiIcon type="discoverApp" style={{marginRight: 5}} />
              <EuiIcon type="wrench" />
            </div>
          );
        }
      },

    ];

    const groupStyle = {
      margin: 15
    }


    return (
      
      <EuiPanel paddingSize="none">
        <EuiFlexGroup className="wz-card-actions">
          <EuiFlexItem>
            <a>
            <EuiIcon type="plusInCircle" /> Add new agent
            </a>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup style={groupStyle}>
          <EuiFlexItem>
            <EuiInMemoryTable
              itemId="id"
              items={[
                {
                "id": "001",
                "name": "jose-msi",
                "ip": "192.168.0.105",
                "status": "Active",
                "group": "default",
                "os_name": "Ubuntu",
                "os_version": "19.04",
                "version": "Wazuh v3.10.2",
                "r_date": "2019/10/03 11:57:29",
                "lk_alive": "2019/10/04 15:30:13",
                "actions":""
                },
              ]}
              columns={columns}
              search={search}
              pagination={true}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup style={groupStyle}>
        <EuiFlexItem style={{alignItems: 'flex-end'}}>
          <a>
            <EuiIcon type="importAction" /> Formatted          
          </a>
        </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
}

AgentsTable.propTypes = {
};