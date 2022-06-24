/*
 * Wazuh app - Mitre alerts components
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
import { EuiPanel, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { SearchBar, FilterManager } from '../../../../../../src/plugins/data/public/';

//@ts-ignore
import { ComplianceRequirements } from './components/requirements';
import { ComplianceSubrequirements } from './components/subrequirements';
import { getElasticAlerts, getIndexPattern, IFilterParams } from '../mitre/lib';
import { pciRequirementsFile } from '../../../../common/compliance-requirements/pci-requirements';
import { gdprRequirementsFile } from '../../../../common/compliance-requirements/gdpr-requirements';
import { hipaaRequirementsFile } from '../../../../common/compliance-requirements/hipaa-requirements';
import { nistRequirementsFile } from '../../../../common/compliance-requirements/nist-requirements';
import { tscRequirementsFile } from '../../../../common/compliance-requirements/tsc-requirements';
import { KbnSearchBar } from '../../kbn-search-bar';
import { getDataPlugin } from '../../../kibana-services';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { withAgentSupportModule } from '../../common/hocs';

export const ComplianceTable = withAgentSupportModule(class ComplianceTable extends Component {
  _isMount = false;
  timefilter: {
    getTime(): any;
    setTime(time: any): void;
    _history: { history: { items: { from: string; to: string }[] } };
  };

  PluginPlatformServices: { [key: string]: any };
  filterManager: FilterManager;
  indexPattern: any;
  state: {
    selectedRequirement: string;
    flyoutOn: boolean;
    filterParams: IFilterParams;
    complianceObject: object;
    descriptions: object;
    loadingAlerts: boolean;
    selectedRequirements: object;
  };

  props: any;

  constructor(props) {
    super(props);
    this.PluginPlatformServices = getDataPlugin().query;
    this.filterManager = this.PluginPlatformServices.filterManager;
    this.timefilter = this.PluginPlatformServices.timefilter.timefilter;
    this.state = {
      selectedRequirement: '',
      flyoutOn: true,
      complianceObject: {},
      descriptions: {},
      loadingAlerts: true,
      selectedRequirements: {},
      filterParams: {
        filters: this.filterManager.getFilters() || [],
        query: { language: 'kuery', query: '' },
        time: this.timefilter.getTime(),
      },
    };

    this.onChangeSelectedRequirements.bind(this);
    this.onQuerySubmit.bind(this);
    this.onFiltersUpdated.bind(this);
  }

  async componentDidMount() {
    this._isMount = true;
    this.filtersSubscriber = this.filterManager.getUpdates$().subscribe(() => {
      this.onFiltersUpdated(this.filterManager.getFilters());
    });
    this.indexPattern = await getIndexPattern();
    this.buildComplianceObject();
  }

  componentWillUnmount() {
    this.filtersSubscriber.unsubscribe();
  }

  buildComplianceObject() {
    try {
      let complianceRequirements = {};
      let descriptions = {};
      let selectedRequirements = {}; // all enabled by default
      if (this.props.section === 'pci') {
        descriptions = pciRequirementsFile;
        Object.keys(pciRequirementsFile).forEach((item) => {
          const currentRequirement = item.split('.')[0];
          if (complianceRequirements[currentRequirement]) {
            complianceRequirements[currentRequirement].push(item);
          } else {
            selectedRequirements[currentRequirement] = true;
            complianceRequirements[currentRequirement] = [];
            complianceRequirements[currentRequirement].push(item);
          }
        }); //forEach
      }
      if (this.props.section === 'gdpr') {
        descriptions = gdprRequirementsFile;
        Object.keys(gdprRequirementsFile).forEach((item) => {
          const currentRequirement = item.split('_')[0];
          if (complianceRequirements[currentRequirement]) {
            complianceRequirements[currentRequirement].push(item);
          } else {
            selectedRequirements[currentRequirement] = true;
            complianceRequirements[currentRequirement] = [];
            complianceRequirements[currentRequirement].push(item);
          }
        }); //forEach
      }

      if (this.props.section === 'hipaa') {
        descriptions = hipaaRequirementsFile;
        Object.keys(hipaaRequirementsFile).forEach((item) => {
          const currentRequirement =
            item.split('.')[0] + '.' + item.split('.')[1] + '.' + item.split('.')[2];
          if (complianceRequirements[currentRequirement]) {
            complianceRequirements[currentRequirement].push(item);
          } else {
            selectedRequirements[currentRequirement] = true;
            complianceRequirements[currentRequirement] = [];
            complianceRequirements[currentRequirement].push(item);
          }
        }); //forEach
      }

      if (this.props.section === 'nist') {
        descriptions = nistRequirementsFile;
        Object.keys(nistRequirementsFile).forEach((item) => {
          const currentRequirement = item.split('.')[0];
          if (complianceRequirements[currentRequirement]) {
            complianceRequirements[currentRequirement].push(item);
          } else {
            selectedRequirements[currentRequirement] = true;
            complianceRequirements[currentRequirement] = [];
            complianceRequirements[currentRequirement].push(item);
          }
        }); //forEach
      }
      if (this.props.section === 'tsc') {
        descriptions = tscRequirementsFile;
        Object.keys(tscRequirementsFile).forEach((item) => {
          const currentRequirement = item.split('.')[0];
          if (complianceRequirements[currentRequirement]) {
            complianceRequirements[currentRequirement].push(item);
          } else {
            selectedRequirements[currentRequirement] = true;
            complianceRequirements[currentRequirement] = [];
            complianceRequirements[currentRequirement].push(item);
          }
        }); //forEach
      }

      this._isMount &&
        this.setState(
          { complianceObject: complianceRequirements, selectedRequirements, descriptions },
          () => this.getRequirementsCount()
        );
    } catch (error) {
      const options = {
        context: `${ComplianceTable.name}.buildComplianceObject`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Compliance (${this.props.section}) data could not be fetched`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  onChangeSelectedRequirements = (selectedRequirements) => {
    this.setState({ selectedRequirements });
  };

  onQuerySubmit = (payload: { dateRange: TimeRange; query: Query | undefined }) => {
    const { dateRange, query } = payload;
    const { filters } = this.state.filterParams;
    const filterParams: IFilterParams = { time: dateRange, filters, query };
    this.setState({ filterParams, loadingAlerts: true });
  };

  onFiltersUpdated = (filters: []) => {
    const { time, query } = this.state.filterParams;
    const filterParams = { time, query, filters };
    this.setState({ filterParams, loadingAlerts: true });
  };

  async componentDidUpdate(prevProps) {
    const { filterParams, loadingAlerts } = this.state;
    if (JSON.stringify(prevProps.filterParams) !== JSON.stringify(filterParams) && loadingAlerts) {
      this.getRequirementsCount();
    }
  }

  async getRequirementsCount() {
    try {
      const { filterParams } = this.state;
      if (!this.indexPattern) {
        return;
      }
      let fieldAgg = '';
      if (this.props.section === 'pci') fieldAgg = 'rule.pci_dss';
      if (this.props.section === 'gdpr') fieldAgg = 'rule.gdpr';
      if (this.props.section === 'hipaa') fieldAgg = 'rule.hipaa';
      if (this.props.section === 'nist') fieldAgg = 'rule.nist_800_53';
      if (this.props.section === 'tsc') fieldAgg = 'rule.tsc';
      const aggs = {
        tactics: {
          terms: {
            field: fieldAgg,
            size: 100,
          },
        },
      };

      // TODO: use `status` and `statusText`  to show errors
      // @ts-ignore
      const { data, status, statusText } = await getElasticAlerts(
        this.indexPattern,
        filterParams,
        aggs
      );
      const { buckets } = data.aggregations.tactics;
      /*if(firstTime){
       this.initTactics(buckets); // top tactics are checked on component mount
      }*/
      this._isMount &&
        this.setState({ requirementsCount: buckets, loadingAlerts: false, firstTime: false });
    } catch (error) {
      const options = {
        context: `${ComplianceTable.name}.buildComplianceObject`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Mitre alerts could not be fetched:`,
        },
      };
      getErrorOrchestrator().handleError(options);
      this.setState({ loadingAlerts: false });
    }
  }

  onChangeFlyout = (flyoutOn) => {
    this.setState({ flyoutOn });
  };

  closeFlyout() {
    this.setState({ flyoutOn: false });
  }

  showFlyout(requirement) {
    this.setState({
      selectedRequirement: requirement,
      flyoutOn: true,
    });
  }

  render() {
    const { complianceObject, loadingAlerts } = this.state;
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <div className="wz-discover hide-filter-control">
              <KbnSearchBar
                onQuerySubmit={this.onQuerySubmit}
                onFiltersUpdated={this.onFiltersUpdated}
                isLoading={loadingAlerts}
              />
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiFlexGroup style={{ margin: '0 8px' }}>
          <EuiFlexItem style={{ width: 'calc(100% - 24px)' }}>
            <EuiPanel paddingSize="none">
              {!!Object.keys(complianceObject).length &&
                this.state.filterParams.time.from !== 'init' && (
                  <EuiFlexGroup>
                    <EuiFlexItem
                      grow={false}
                      style={{
                        width: '15%',
                        minWidth: 145,
                        maxHeight: 'calc(100vh - 320px)',
                        overflowX: 'hidden',
                      }}
                    >
                      <ComplianceRequirements
                        indexPattern={this.indexPattern}
                        section={this.props.section}
                        onChangeSelectedRequirements={this.onChangeSelectedRequirements}
                        {...this.state}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem style={{ width: '15%' }}>
                      <ComplianceSubrequirements
                        indexPattern={this.indexPattern}
                        filters={this.state.filterParams}
                        section={this.props.section}
                        onSelectedTabChanged={(id) => this.props.onSelectedTabChanged(id)}
                        {...this.state}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                )}
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
})
