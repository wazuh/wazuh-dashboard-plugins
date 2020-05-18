/*
 * Wazuh app - React component information about last SCA scan.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiText,
  EuiLink,
  EuiBadge,
  EuiStat,
  EuiSpacer,
  EuiLoadingSpinner,
  EuiButtonIcon,
  EuiToolTip,
  EuiBasicTable
} from '@elastic/eui';
import { WzRequest } from '../../../../../react-services/wz-request';

export class ScaScan extends Component {
  _isMount = false;
  props!: {
    [key: string]: any
  }
  state: {
    lastScan: {
      [key: string]: any
    },
    historyScans: {
      [key: string]: any
    },
    isLoading: Boolean,
    showHistory: Boolean,
    detailsOn: Boolean
    detailsObj : {
      [key: string]: any
    },
  }

  constructor(props) {
    super(props);
    this.state = {
      lastScan: {},
      isLoading: true,
      showHistory: false,
      historyScans: [],
      detailsOn: false,
      detailsObj: {}
    };
  }

  async componentDidMount() {
    this._isMount = true;
    this.getLastScan(this.props.agentId);
  }

  async getLastScan(agentId: Number) {
    const scans = await WzRequest.apiReq('GET', `/sca/${agentId}?sort=-end_scan`, {limit: 1});
    this._isMount &&
      this.setState({
        lastScan: (((scans.data || {}).data || {}).items || {})[0],
        isLoading: false,
      });
  }

  async getHistoryScan(agentId: Number) {
    const scans = await WzRequest.apiReq('GET', `/sca/${agentId}?sort=-end_scan`, {limit: 5});
    this._isMount &&
      this.setState({
        historyScans: (((scans.data || {}).data || {}).items || {}),
        showHistory: true,
      });
  }

  renderLoadingStatus() {
    const { isLoading } = this.state;
    if (!isLoading) {  
     return;
		} else {
      return(
        <EuiFlexGroup justifyContent="center" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size="xl" />
          </EuiFlexItem>
        </EuiFlexGroup>
      )
		}
  }

  renderScanDetails() {
    const { isLoading, showHistory, lastScan, detailsOn, detailsObj } = this.state;
    if (isLoading || showHistory) return;
    let data = detailsOn ? detailsObj : lastScan;
    
    return(
      <Fragment>
        <EuiText size="xs">
          <h2>
          <EuiToolTip position="top" content="Scan history">
            <EuiButtonIcon
              color={'primary'}
              onClick={() => this.getHistoryScan(this.props.agentId)}
              iconType="sortLeft"
              aria-label="History SCA scan"
            />
          </EuiToolTip>
            {detailsOn ? `SCA: Scan details` : `SCA: Last scan`}
          </h2>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
            {data.references === 'NULL' ?
              <h3>{data.name}</h3> :
              <EuiLink href={data.references} target="_blank">
                <h3>{data.name}</h3>
              </EuiLink>}
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ marginTop: 15 }}>
            <EuiBadge color="secondary">{data.policy_id}</EuiBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText>
              <p>{data.description}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xl" />
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiStat
              title={data.pass}
              textAlign="center"
              description="Pass"
              titleColor="secondary"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={data.fail}
              textAlign="center"
              description="Fail"
              titleColor="danger"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={data.total_checks}
              textAlign="center"
              description="Total checks"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={`${data.score}%`}
              textAlign="center"
              description="Score"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xxl" />
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText textAlign="center">
              <span>{`Start Scan: ${data.start_scan} - End Scan: ${data.end_scan}`}</span>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    )
  }

  columns() {
    return [
      {
        field: 'start_scan',
        name: 'Data Scan',
        sortable: true,
        width: '65px'
      },
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        truncateText: true,
        width: '150px'
      },
      {
        field: 'pass',
        name: 'Pass',
        sortable: true,
        width: '20px'
      },
      {
        field: 'fail',
        name: 'Fail',
        sortable: true,
        width: '20px'
      },
      {
        field: 'total_checks',
        name: 'Total Checks',
        sortable: true,
        width: '30px'
      },
      {
        field: 'score',
        name: 'Score',
        sortable: true,
        width: '20px'
      },
    ]
  }

  renderHistoryScans() {
    const { showHistory, historyScans } = this.state;
    const columns = this.columns();

    const getRowProps = item => {
      const { hash_file } = item;
      return {
        'data-test-subj': `row-${hash_file}`,
        className: 'customRowClass',
        onClick: () => this.setState({
          detailsObj: item,
          detailsOn: true,
          showHistory: false
        }),
      };
    };
  
    const getCellProps = (item, column) => {
      const { hash_file } = item;
      const { field } = column;
      return {
        className: 'customCellClass',
        'data-test-subj': `cell-${hash_file}-${field}`,
        textOnly: true,
      };
    };

    if(!showHistory) return;
    return(
      <Fragment>
        <EuiText size="xs">
          <h2>
          <EuiToolTip position="top" content="Last Scan">
            <EuiButtonIcon
              color={'primary'}
              onClick={() => {
                this.getLastScan(this.props.agentId);
                this.setState({
                  showHistory: false,
                  detailsOn: false 
                });
                }
              }
              iconType="sortLeft"
              aria-label="Last scan"
            />
          </EuiToolTip>
            SCA: Scan history
          </h2>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
          <EuiBasicTable
            items={historyScans}
            itemId="start_scan"
            columns={columns}
            rowProps={getRowProps}
            cellProps={getCellProps}
          />
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    );
  }

  render() {
    const loading = this.renderLoadingStatus();
    const scaScan = this.renderScanDetails();
    const historyScan = this.renderHistoryScans();
    return (
      <EuiFlexItem style={{ marginTop: 0 }}>
        <EuiPanel paddingSize="m">
          {loading}
          {scaScan}
          {historyScan}
        </EuiPanel>
      </EuiFlexItem>
    )
  }
}