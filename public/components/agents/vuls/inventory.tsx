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
  EuiToolTip,
  euiPaletteColorBlind,
} from '@elastic/eui';
import { EuiPalette } from '@elastic/eui/src/services/color/eui_palettes';
import { InventoryTable } from './inventory/';
import { getLastScan, getAggregation } from './inventory/lib';
import { ICustomBadges } from '../../wz-search-bar/components';
import {
  VisualizationBasicWidgetSelector,
  VisualizationBasicWidget,
} from '../../common/charts/visualizations/basic';
import { WzStat } from '../../wz-stat';
import { beautifyDate } from './inventory/lib';

interface Aggregation {
  title: number;
  description: string;
  titleColor: string;
}
interface pieStats {
  id: string;
  label: string;
  value: number;
}
interface LastScan {
  last_full_scan: string;
  last_partial_scan: string;
}
interface TitleColors {
  Critical: string;
  High: string;
  Medium: string;
  Low: string;
}

export class Inventory extends Component {
  _isMount = false;
  state: {
    filters: [];
    isLoading: boolean;
    isLoadingStats: boolean;
    customBadges: ICustomBadges[];
    stats: Aggregation[];
    severityPieStats: pieStats[];
    vulnerabilityLastScan: LastScan;
  };
  props: any;
  colorsVisualizationVulnerabilitiesSummaryData: EuiPalette;
  titleColors: TitleColors = {
    Critical: '#BD271E',
    High: '#d5a612',
    Medium: '#006BB4',
    Low: '#6a717d',
  };

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
        last_partial_scan: '',
      },
    };
    this.fetchVisualizationVulnerabilitiesSummaryData = this.fetchVisualizationVulnerabilitiesSummaryData.bind(
      this
    );
    this.fetchVisualizationVulnerabilitiesSeverityData = this.fetchVisualizationVulnerabilitiesSeverityData.bind(
      this
    );
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
    const results = await getAggregation(agentID, field, 4);
    return Object.entries(results[field])
      .map(([key, value], index) => ({
        label: key,
        value,
        color: this.colorsVisualizationVulnerabilitiesSummaryData[index],
        onClick: () => this.onFiltersChange(this.buildFilterQuery(field, key)),
      }))
      .sort((firstElement, secondElement) => secondElement.value - firstElement.value);
  }

  async fetchVisualizationVulnerabilitiesSeverityData() {
    const { id } = this.props.agent;
    const FIELD = 'severity';
    const SEVERITY_KEYS = ['Critical', 'High', 'Medium', 'Low'];
    this.setState({ isLoadingStats: true });

    const vulnerabilityLastScan = await getLastScan(id);
    const { severity } = await getAggregation(id, FIELD);

    const severityStats = SEVERITY_KEYS.map((key) => ({
      titleColor: this.titleColors[key],
      description: key,
      title: severity[key] ? severity[key] : 0,
    }));

    this.setState({
      stats: severityStats,
      isLoadingStats: false,
      vulnerabilityLastScan,
    });

    return Object.keys(severity).length
      ? SEVERITY_KEYS.map((key) => ({
          label: key,
          value: severity[key] ? severity[key] : 0,
          color: this.titleColors[key],
          onClick: () => this.onFiltersChange(this.buildFilterQuery(FIELD, key)),
        }))
      : [];
  }

  buildFilterQuery(field = '', selectedItem = '') {
    return [
      {
        field: 'q',
        value: `${field}=${selectedItem}`,
      },
    ];
  }

  async loadAgent() {
    if (this._isMount) {
      this.setState({
        isLoading: false,
      });
    }
  }

  onFiltersChange = (filters) => {
    this.setState({ filters });
  };

  renderTable() {
    const { filters } = this.state;
    return (
      <div>
        <InventoryTable {...this.props} filters={filters} onFiltersChange={this.onFiltersChange} />
      </div>
    );
  }

  loadingInventory() {
    return (
      <EuiPage>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiProgress size="xs" color="primary" />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPage>
    );
  }

  buildTitleFilter({ description, title, titleColor }) {
    const { isLoadingStats } = this.state;
    return (
      <EuiFlexItem key={`module_vulnerabilities_inventory_stat_${description}`}>
        <EuiStat
          textAlign="center"
          isLoading={isLoadingStats}
          title={
            <EuiToolTip position="top" content={`Filter by Severity`}>
              <span
                className={'statWithLink wz-user-select-none'}
                style={{ cursor: 'pointer', fontSize: '2.25rem' }}
                onClick={() => this.onFiltersChange(this.buildFilterQuery('severity', description))}
              >
                {title}
              </span>
            </EuiToolTip>
          }
          description={description}
          titleColor={titleColor}
        />
      </EuiFlexItem>
    );
  }

  render() {
    const { isLoading, stats, vulnerabilityLastScan } = this.state;
    if (isLoading) {
      return this.loadingInventory();
    }
    const last_full_scan = beautifyDate(vulnerabilityLastScan.last_full_scan);
    const last_partial_scan = beautifyDate(vulnerabilityLastScan.last_partial_scan);

    const table = this.renderTable();
    return (
      <EuiPage>
        <EuiPageBody>
          <EuiFlexGroup wrap>
            <EuiFlexItem>
              <EuiCard title description betaBadgeLabel="Severity" className="wz-euiCard-no-title">
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                  <VisualizationBasicWidget
                    type="donut"
                    size={{ width: '100%', height: '150px' }}
                    showLegend
                    onFetch={this.fetchVisualizationVulnerabilitiesSeverityData}
                    onFetchDependencies={[this.props.agent.id]}
                    noDataTitle="No results"
                    noDataMessage="No results were found."
                  />
                </div>
              </EuiCard>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiCard title description betaBadgeLabel="Details">
                <EuiFlexGroup alignItems="center" className={'height-full'}>
                  <EuiFlexItem>
                    <EuiFlexGroup alignItems="center">
                      {stats.map((stat) => this.buildTitleFilter(stat))}
                    </EuiFlexGroup>
                    <EuiFlexGroup style={{ marginTop: 'auto' }}>
                      <EuiFlexItem>
                        <WzStat
                          title={last_full_scan}
                          description="Last full scan"
                          textAlign="center"
                          titleSize="xs"
                        />
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <WzStat
                          title={last_partial_scan}
                          description="Last partial scan"
                          textAlign="center"
                          titleSize="xs"
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiCard>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiCard title description betaBadgeLabel="Summary" className="wz-euiCard-no-title">
                <VisualizationBasicWidgetSelector
                  type="donut"
                  size={{ width: '100%', height: '150px' }}
                  showLegend
                  selectorOptions={[
                    { value: 'name', text: 'Name' },
                    { value: 'cve', text: 'CVE' },
                    { value: 'version', text: 'Version' },
                    { value: 'cvss2_score', text: 'CVSS2 Score' },
                    { value: 'cvss3_score', text: 'CVSS3 Score' },
                  ]}
                  onFetch={this.fetchVisualizationVulnerabilitiesSummaryData}
                  onFetchExtraDependencies={[this.props.agent.id]}
                  noDataTitle="No results"
                  noDataMessage={(_, optionRequirement) =>
                    `No ${optionRequirement.text} results were found.`
                  }
                />
              </EuiCard>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer />
          <EuiPanel>{table}</EuiPanel>
        </EuiPageBody>
      </EuiPage>
    );
  }
}
