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
  EuiText,
  EuiIcon,
  euiPaletteColorBlind,
} from '@elastic/eui';
import { EuiPalette } from '@elastic/eui/src/services/color/eui_palettes';
import {
  InventoryTable,
} from './inventory/';
import {
  getLastScan, getAggregation
} from './inventory/lib';
import { ICustomBadges } from '../../wz-search-bar/components';
import { Pie } from '../../d3/pie';
import { formatUIDate } from '../../../react-services';
import { VisualizationBasicWidgetSelector, VisualizationBasicWidget  } from '../../common/charts/visualizations/basic';

interface Aggregation { title: number, description: string, titleColor: string }
interface pieStats { id: string, label: string, value: number }
interface LastScan { last_full_scan: string, last_partial_scan: string }

export class Inventory extends Component {
  _isMount = false;
  state: {
    filters: [];
    isLoading: Boolean;
    customBadges: ICustomBadges[];
    stats: Aggregation[],
    severityPieStats: pieStats[],
    vulnerabilityLastScan: LastScan,
    aggregation: Aggregation[],
  };
  props: any;
  colorsVisualizationVulnerabilitiesSummaryData: EuiPalette;

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      customBadges: [],
      filters: [],
      stats: [],
      severityPieStats: [],
      vulnerabilityLastScan: {
        last_full_scan: '1970-01-01T00:00:00Z',
        last_partial_scan: '1970-01-01T00:00:00Z'
      },
      aggregation: [],
    }
    this.fetchVisualizationVulnerabilitiesSummaryData = this.fetchVisualizationVulnerabilitiesSummaryData.bind(this);
    this.fetchVisualizationVulnerabilitiesSeverityData = this.fetchVisualizationVulnerabilitiesSeverityData.bind(this);
    this.colorsVisualizationVulnerabilitiesSummaryData = euiPaletteColorBlind();
  }

  async componentDidMount() {
    this._isMount = true;
    await this.loadAgent();
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  async fetchVisualizationVulnerabilitiesSummaryData(field, agentID){
    const results = await getAggregation(agentID, field, 3);
    return Object.entries(results[field]).map(([key, value], index) => ({
      label: key,
      value,
      color: this.colorsVisualizationVulnerabilitiesSummaryData[index]
    }))
  }

  async fetchVisualizationVulnerabilitiesSeverityData(){
    const { id } = this.props.agent;
    const { severity } = await getAggregation(id, 'severity');
    const titleColors = { Critical: 'danger', High: '#FEC514', Medium: 'primary', Low: 'subdued' };
    const severityStats = Object.keys(severity).map(key => ({ titleColor: titleColors[key], description: key, title: severity[key] }));
    this.setState({stats: severityStats});
    
    return Object.entries(severity).map(([key, value], index) => ({
      label: key,
      value,
      color: this.colorsVisualizationVulnerabilitiesSummaryData[index]
    }))
  }
  
  async loadAgent() {
    if (this._isMount) {    
      const { id } = this.props.agent;
      const vulnerabilityLastScan = await getLastScan(id);
      const aggregation = await getAggregation(id, 'name');

      
      this.setState({
        isLoading: false,
        aggregation,
        vulnerabilityLastScan
      });
    }
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
    const { isLoading, stats, vulnerabilityLastScan, severityPieStats } = this.state;
    if (isLoading) {
      return this.loadingInventory()
    }
    const last_full_scan = this.beautifyDate(vulnerabilityLastScan.last_full_scan);
    const last_partial_scan = this.beautifyDate(vulnerabilityLastScan.last_partial_scan);
    
    const table = this.renderTable();
    return <EuiPage>
      <EuiPageBody>
        <EuiFlexGroup wrap>
          <EuiFlexItem>
            <EuiCard title description betaBadgeLabel="Severity">
              <VisualizationBasicWidget
                type='donut'
                size={{ width: '300px', height: '125px' }}
                showLegend
                onFetch={this.fetchVisualizationVulnerabilitiesSeverityData}
                noDataTitle='No results'
                noDataMessage='No results were found.'
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
            <EuiCard title description betaBadgeLabel="Summary">
              <VisualizationBasicWidgetSelector
                type='donut'
                size={{ width: '100%', height: '250px' }}
                showLegend
                selectorOptions={[
                  { value: 'name', text: 'Name' },
                  { value: 'severity', text: 'Severity' },
                  { value: 'cve', text: 'CVE' },
                  { value: 'version', text: 'Version' },
                  { value: 'cvss2_score', text: 'CVSS2 Score' },
                  { value: 'cvss3_score', text: 'CVSS3 Score' }
                ]}
                onFetch={this.fetchVisualizationVulnerabilitiesSummaryData}
                onFetchExtraDependencies={[this.props.agent.id]}
                noDataTitle='No results'
                noDataMessage={(_, optionRequirement) => `No ${optionRequirement.text} results were found.`}
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
