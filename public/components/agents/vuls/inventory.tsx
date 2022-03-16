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
  EuiToolTip,
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
import { formatUIDate } from '../../../react-services';
import { VisualizationBasicWidgetSelector, VisualizationBasicWidget  } from '../../common/charts/visualizations/basic';
import { Position } from '@elastic/charts';

interface Aggregation { title: number, description: string, titleColor: string }
interface pieStats { id: string, label: string, value: number }
interface LastScan { last_full_scan: string, last_partial_scan: string }
interface TitleColors { Critical: string, High: string, Medium: string, Low: string }

export class Inventory extends Component {
  _isMount = false;
  state: {
    filters: [];
    isLoading: boolean;
    isLoadingStats: boolean;
    customBadges: ICustomBadges[];
    stats: Aggregation[],
    severityPieStats: pieStats[],
    vulnerabilityLastScan: LastScan,
  };
  props: any;
  colorsVisualizationVulnerabilitiesSummaryData: EuiPalette;
  titleColors: TitleColors = { Critical: '#BD271E', High: '#d5a612', Medium: '#006BB4', Low: '#6a717d' };
  

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      isLoadingStats: true,
      customBadges: [],
      filters: [],
      stats: [
        { title: 0, description: 'Critical', titleColor: this.titleColors.Critical },
        { title: 0, description: 'High', titleColor: this.titleColors.High },
        { title: 0, description: 'Medium', titleColor: this.titleColors.Medium },
        { title: 0, description: 'Low', titleColor: this.titleColors.Low },
      ],
      severityPieStats: [],
      vulnerabilityLastScan: {
        last_full_scan: '',
        last_partial_scan: ''
      },
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

  async fetchVisualizationVulnerabilitiesSummaryData(field, agentID) {
    const results = await getAggregation(agentID, field, 5);
    return Object.entries(results[field]).map(([key, value], index) => ({
      label: key,
      value,
      color: this.colorsVisualizationVulnerabilitiesSummaryData[index],
      onClick: () => this.onFiltersChange(this.buildFilterQuery(field, key))
    })).sort((firstElement, secondElement) => secondElement.value - firstElement.value)
  }

  async fetchVisualizationVulnerabilitiesSeverityData(){
    const { id } = this.props.agent;
    const FIELD = 'severity';
    //Assign a value to the severity label to be able to sort it by level
    const severityOrder = { Critical: 12, High: 9, Medium: 6, Low: 3 };
    
    const { severity } = await getAggregation(id, FIELD);
    
    const severityStats = Object.keys(severity).map(key => ({ 
      titleColor: this.titleColors[key],
      description: key,
      title: severity[key]
    }))
    .sort((prev, next) => severityOrder[prev.description] > severityOrder[next.description] ? -1 : 1);

    this.setState({stats: severityStats, isLoadingStats: false});
    
    return Object.entries(severity)
      .map(([key, value]) => ({
        label: key,
        value,
        color: this.titleColors[key],
        onClick: () => this.onFiltersChange(this.buildFilterQuery(FIELD, key))
      }
      ))
      .sort((prev, next) => severityOrder[prev.label] > severityOrder[next.label] ? -1 : 1);
  }

  buildFilterQuery(field = '', selectedItem = '') {
    return [
      {
        field: 'q',
        value: `${field}=${selectedItem}`,
      },
    ]
  }

  async loadAgent() {
    if (this._isMount) {    
      const { id } = this.props.agent;
      const vulnerabilityLastScan = await getLastScan(id);
      
      this.setState({
        isLoading: false,
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

  buildTitleFilter({ description, title, titleColor }) {
    const { isLoadingStats } = this.state;
    return (
      <EuiFlexItem
        key={`module_vulnerabilities_inventory_stat_${description}`}
      >
        <EuiStat
          textAlign='center'
          isLoading={isLoadingStats}
          title={(
            <EuiToolTip position="top" content={`Filter by Severity`}>
              <span
                className={'statWithLink wz-user-select-none'}
                style={{ cursor: 'pointer', fontSize: '2.25rem' }}
                onClick={() => this.onFiltersChange(this.buildFilterQuery('severity', description))}
              >
                {title}
              </span>
            </EuiToolTip>
          )}
          description={description}
          titleColor={titleColor}
        />
      </EuiFlexItem>
    )
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
        <EuiFlexGroup wrap>
          <EuiFlexItem>
            <EuiCard title description betaBadgeLabel="Severity" className="wz-euiCard-no-title">
              <EuiSpacer />
              <VisualizationBasicWidget
                type='donut'
                size={{ width: '100%', height: '150px' }}
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
                {stats.map((stat) => this.buildTitleFilter(stat))}                
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
            <EuiCard title description betaBadgeLabel="Summary" className="wz-euiCard-no-title">
              <VisualizationBasicWidgetSelector
                type='donut'
                size={{ width: '100%', height: '150px' }}
                showLegend
                selectorOptions={[
                  { value: 'name', text: 'Name' },
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
