/*
 * Wazuh app - Inventory component
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
  EuiFlexItem,
  EuiFlexGroup,
  EuiPanel,
  EuiPage,
  EuiSpacer,
  EuiProgress,
} from '@elastic/eui';
import { formatUIDate } from '../../../react-services/time-service';
import _ from 'lodash';
import { MODULE_SCA_CHECK_RESULT_LABEL } from '../../../../common/constants';
import SCAPoliciesTable from './inventory/agent-policies-table';

type InventoryProps = {
  agent: { [key: string]: any };
};

type InventoryState = {
  loading: boolean;
  checksIsLoading: boolean;
};
export class Inventory extends Component<InventoryProps, InventoryState> {
  _isMount = false;
  agent: { [key: string]: any } = {};
  columnsPolicies: object[];
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      checksIsLoading: false,
    };

    this.columnsPolicies = [
      {
        field: 'name',
        name: 'Policy',
        sortable: true,
      },
      {
        field: 'description',
        name: 'Description',
        truncateText: true,
        sortable: true,
      },
      {
        field: 'end_scan',
        name: 'End scan',
        dataType: 'date',
        render: formatUIDate,
        sortable: true,
      },
      {
        field: 'pass',
        name: MODULE_SCA_CHECK_RESULT_LABEL.passed,
        width: '100px',
        sortable: true,
      },
      {
        field: 'fail',
        name: MODULE_SCA_CHECK_RESULT_LABEL.failed,
        width: '100px',
        sortable: true,
      },
      {
        field: 'invalid',
        name: MODULE_SCA_CHECK_RESULT_LABEL['not applicable'],
        width: '100px',
        sortable: true,
      },
      {
        field: 'score',
        name: 'Score',
        render: score => {
          return `${score}%`;
        },
        width: '100px',
      },
    ];
  }

  render() {
    return (
      <>
        <div>
          {this.state.loading && (
            <div style={{ margin: 16 }}>
              <EuiSpacer size='m' />
              <EuiProgress size='xs' color='primary' />
            </div>
          )}
        </div>
        <EuiPage>
          <div>
            <EuiSpacer size='m' />
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiPanel>
                  <SCAPoliciesTable
                    agent={this.props.agent}
                    columns={this.columnsPolicies}
                  />
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        </EuiPage>
      </>
    );
  }
}
