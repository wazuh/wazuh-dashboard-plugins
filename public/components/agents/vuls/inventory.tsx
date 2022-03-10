/*
 * Wazuh app - Agent vulnerabilities components
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
  EuiPanel,
  EuiPage,
  EuiPageBody,
  EuiSpacer,
  EuiProgress,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCard,
  EuiStat,
  EuiBasicTable,
  EuiText,
  EuiIcon
} from '@elastic/eui';
import {
  InventoryTable,
} from './inventory/';
import {
  getSummary, getLastScan, getAggregation
} from './inventory/lib';
import { ICustomBadges } from '../../wz-search-bar/components';
import { Pie } from '../../d3/pie';
import { formatUIDate } from '../../../react-services';

interface Aggregation { title: number, description: string, titleColor: string }
interface LastScan { last_full_scan: string, last_partial_scan: string }

export class Inventory extends Component {
  _isMount = false;
  state: {
    filters: [];
    isLoading: Boolean;
    customBadges: ICustomBadges[];
    stats: Aggregation[],
    vulnerabilityLastScan: LastScan,
    aggregation: Aggregation[],
    aggrField: string
  };
  props: any;
  
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      customBadges: [],
      filters: [],
      stats: [],
      vulnerabilityLastScan: {
        last_full_scan: '1970-01-01T00:00:00Z',
        last_partial_scan: '1970-01-01T00:00:00Z'
      },
      aggregation: [],
      aggrField: '',
    }
  }

  async componentDidMount() {
    this._isMount = true;
    await this.loadAgent();
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  async loadAgent() {
    if (this._isMount) {    
      const { id } = this.props.agent;
      const { aggrField } = this.state;
      const summary = await getSummary(id);
      const vulnerabilityLastScan = await getLastScan(id);
      const aggregation = await getAggregation(id, aggrField);

      const stats = summary ? summary : [
        {title: 50, description: 'Critical', titleColor: 'danger'},
        {title: 25, description: 'High', titleColor: '#FEC514'},
        {title: 40, description: 'Medium', titleColor: 'primary'},
        {title: 17, description: 'Low', titleColor: 'subdued'},
      ]
      this.setState({
        isLoading: false,
        stats,
        aggregation,
        vulnerabilityLastScan
      });
    }
  }



  onAggregationChange = async (newField: string) => {
    const aggregation = await getAggregation(this.props.agent.id, newField);
    this.setState({ aggrField: newField, aggregation });
  }

  onFiltersChange = (filters) => {
    this.setState({ filters });
  }

  renderTable() {
    const { filters } = this.state;
    return (
      <div>
        <InventoryTable
          {...this.props}
          filters={filters}
          onFiltersChange={this.onFiltersChange}
        />
      </div>
    )
  }

  loadingInventory() {
    return <EuiPage>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiProgress size="xs" color="primary" />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPage>;
  }

  beautifyDate(date: string) {
    return ['', '1970-01-01T00:00:00Z'].includes(date) ? '-' : formatUIDate(date);
  }

  render() {
    const { isLoading, stats, vulnerabilityLastScan } = this.state;
    if (isLoading) {
      return this.loadingInventory()
    }
    const last_full_scan = this.beautifyDate(vulnerabilityLastScan.last_full_scan);
    const last_partial_scan = this.beautifyDate(vulnerabilityLastScan.last_partial_scan);
    
    const table = this.renderTable();
    return <EuiPage>
      <EuiPageBody>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiCard title description betaBadgeLabel="Severity">
              <Pie
                width={300}
                height={125}
                data={[
                  {id: 'critical', label: 'Critical', value: 50},
                  {id: 'high', label: 'High', value: 25},
                  {id: 'medium', label: 'Medium', value: 40},
                  {id: 'low', label: 'Low', value: 17}
                ]}
                colors={['#BD271E', '#FEC514', '#0077CC', '#6a717d']}
              />
            </EuiCard>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiCard title description betaBadgeLabel="Details">
              <EuiFlexGroup alignItems='center'>
                {stats.map(({description, title, titleColor}) => (
                  <EuiFlexItem
                    key={`module_vulnerabilities_inventory_stat_${description}`}
                  >
                    <EuiStat    
                      textAlign='center'
                      title={title}
                      description={description}
                      titleColor={titleColor}
                    />

                  </EuiFlexItem>
                ))}
                
              </EuiFlexGroup>
              <EuiFlexGroup style={{marginTop: 'auto'}}>
                <EuiFlexItem>
                  <EuiText>
                    <EuiIcon type="calendar" color={'primary'}/> Last full scan: {last_full_scan}
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText>
                    <EuiIcon type="calendar" color={'primary'}/> Last partial scan: {last_partial_scan}
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>

            </EuiCard>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiCard title description betaBadgeLabel="Top affected packages by CVEs">
              <EuiBasicTable
                columns={[
                  {field: 'name', name: 'Name'},
                  {field: 'version', name: 'Version'},
                  {field: 'count', name: 'Count'},
                ]}
                items={[
                  {name: 'bash', count: 4, version: '0.0.0'},
                  {name: 'curl', count: 2, version: '0.0.0'},
                  {name: 'python', count: 2, version: '0.0.0'},
                ]}
              />
            </EuiCard>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer />
        <EuiPanel>
          {table}
        </EuiPanel>
      </EuiPageBody>
    </EuiPage>
  }
}
