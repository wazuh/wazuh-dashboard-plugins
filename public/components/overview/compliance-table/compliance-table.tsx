/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react'
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { SearchBar, FilterManager } from '../../../../../../src/plugins/data/public/';
import { KibanaContextProvider } from '../../../../../../src/plugins/kibana_react/public/context';

import { I18nProvider } from '@kbn/i18n/react';
//@ts-ignore
import { getServices } from 'plugins/kibana/discover/kibana_services';
import { ComplianceRequirements } from './components/requirements';
import { ComplianceSubrequirements } from './components/subrequirements';
import { getElasticAlerts, getIndexPattern } from '../mitre/lib';
import { pciRequirementsFile } from '../../../../server/integration-files/pci-requirements';
import { gdprRequirementsFile } from '../../../../server/integration-files/gdpr-requirements';
import { hipaaRequirementsFile } from '../../../../server/integration-files/hipaa-requirements';
import { nistRequirementsFile } from '../../../../server/integration-files/nist-requirements';
import { tscRequirementsFile } from '../../../../server/integration-files/tsc-requirements';



export class ComplianceTable extends Component {
  _isMount = false;
  timefilter: {
    getTime(): any
    setTime(time: any): void
    _history: { history: { items: { from: string, to: string }[] } }
  };

  KibanaServices: { [key: string]: any };
  filterManager: FilterManager;
  indexPattern: any;
  state: {
    selectedRequirement: string,
    flyoutOn: boolean,
    dateRange: object,
    filterParams: object,
    query: object,
    searchBarFilters: [],
    complianceObject: object,
    descriptions: object,
    selectedRequirements: object,
  }

  props: any;

  constructor(props) {
    super(props);
    this.KibanaServices = getServices();
    this.filterManager = this.KibanaServices.filterManager;
    this.timefilter = this.KibanaServices.timefilter;
    this.state = {
      selectedRequirement: "",
      flyoutOn: true,
      complianceObject: {},
      descriptions: {},
      selectedRequirements: {},
      filterParams: {
        filters: [],
        query: { language: 'kuery', query: '' },
        time: { from: 'init', to: 'init' },
      },
      dateRange: this.timefilter.getTime(),
      query: { language: "kuery", query: "" },
      searchBarFilters: [],
    }

    this.onChangeSelectedRequirements.bind(this);
    this.onQuerySubmit.bind(this);
    this.onFiltersUpdated.bind(this);
  }

  async componentDidMount() {
    this._isMount = true;
    this.filtersSubscriber = this.filterManager.updated$.subscribe(() => {
      this.onFiltersUpdated(this.filterManager.filters)
    });
    this.indexPattern = await getIndexPattern();
    this.buildComplianceObject();
  }

  componentWillUnmount(){
    this.filtersSubscriber.unsubscribe();
  }


  buildComplianceObject() {
    try {
      let complianceRequirements = {};
      let descriptions = {};
      let selectedRequirements = {}; // all enabled by default
      if (this.props.section === 'pci') {
        descriptions = pciRequirementsFile;
        Object.keys(pciRequirementsFile).forEach(item => {
          const currentRequirement = item.split(".")[0];
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
        Object.keys(gdprRequirementsFile).forEach(item => {
          const currentRequirement = item.split("_")[0];
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
        Object.keys(hipaaRequirementsFile).forEach(item => {
          const currentRequirement = item.split(".")[0] + "." + item.split(".")[1] + "." + item.split(".")[2];
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
        Object.keys(nistRequirementsFile).forEach(item => {
          const currentRequirement = item.split(".")[0];
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
        Object.keys(tscRequirementsFile).forEach(item => {
          const currentRequirement = item.split(".")[0];
          if (complianceRequirements[currentRequirement]) {
            complianceRequirements[currentRequirement].push(item);
          } else {
            selectedRequirements[currentRequirement] = true;
            complianceRequirements[currentRequirement] = [];
            complianceRequirements[currentRequirement].push(item);
          }
        }); //forEach        
      }

      this._isMount && this.setState({ complianceObject: complianceRequirements, selectedRequirements, descriptions }, () => this.getRequirementsCount());
    } catch (err) {
      // TODO ADD showToast
      /*this.showToast(
        'danger',
        'Error',
        `Compliance (${this.props.section}) data could not be fetched: ${err}`,
        3000
      );*/
    }
  }

  onChangeSelectedRequirements = (selectedRequirements) => {
    this.setState({ selectedRequirements });
  }

  onQuerySubmit = (payload: { dateRange: TimeRange, query: Query | undefined }) => {
    const { dateRange, query } = payload;
    this.timefilter.setTime(dateRange);
    const filterParams = {};
    filterParams["time"] = dateRange;
    filterParams["query"] = query;
    filterParams["filters"] = this.state.filterParams["filters"];
    this.setState({ dateRange, query, filterParams });
  }

  onFiltersUpdated = (filters: []) => {
    this.filterManager.setFilters(filters);
    const filterParams = {};
    filterParams["time"] = this.state.filterParams["time"];
    filterParams["query"] = this.state.filterParams["query"];
    filterParams["filters"] = filters;
    this.setState({ searchBarFilters: filters, filterParams });
  }



  getSearchBar() {
    const { filterManager, KibanaServices } = this;
    if (JSON.stringify(filterManager.filters) !== JSON.stringify(this.state.filterParams.filters || JSON.stringify(this.state.dateRange) !== JSON.stringify(this.state.filterParams.time))) {
      const filterParams = {};
      filterParams["filters"] = filterManager.filters
      filterParams["query"] = this.state.filterParams.query
      filterParams["time"] = this.state.dateRange
      this.setState({ filterParams })
    }

    const storage = {
      ...window.localStorage,
      get: (key) => JSON.parse(window.localStorage.getItem(key) || '{}'),
      set: (key, value) => window.localStorage.setItem(key, JSON.stringify(value)),
      remove: (key) => window.localStorage.removeItem(key)
    }
    const http = {
      ...KibanaServices.indexPatterns.apiClient.http
    }
    const savedObjects = {
      ...KibanaServices.indexPatterns.savedObjectsClient
    }
    const data = {
      ...KibanaServices.data,
      query: {
        ...KibanaServices.data.query,
      }
    }
    const { dateRange, query, searchBarFilters } = this.state;
    return (
      <KibanaContextProvider services={{
        ...KibanaServices,
        appName: "wazuhMitre",
        data,
        storage,
        http,
        savedObjects
      }} >
        <I18nProvider>
          <SearchBar
            indexPatterns={[this.indexPattern]}
            filters={filterManager.filters}
            dateRangeFrom={dateRange.from}
            dateRangeTo={dateRange.to}
            onQuerySubmit={this.onQuerySubmit}
            onFiltersUpdated={this.onFiltersUpdated}
            query={query}
            timeHistory={this.timefilter._history}
            {...{ appName: 'wazuhCompliance' }} />
        </I18nProvider>
      </KibanaContextProvider>
    );
  }

  async componentDidUpdate(prevProps, prevState) {
    const { filterParams } = this.state;
    if (JSON.stringify(this.state.prevFilters) !== JSON.stringify(filterParams)) {
      this.getRequirementsCount();
    }
  }

  async getRequirementsCount() {
    this.setState({ loadingAlerts: true, prevFilters: this.state.filterParams });
    try {
      const { filterParams } = this.state;
      if (!this.indexPattern) { return; }
      let fieldAgg = "";
      if (this.props.section === "pci")
        fieldAgg = "rule.pci_dss";
      if (this.props.section === "gdpr")
        fieldAgg = "rule.gdpr";
      if (this.props.section === "hipaa")
        fieldAgg = "rule.hipaa";
      if (this.props.section === "nist")
        fieldAgg = "rule.nist_800_53";
      if (this.props.section === "tsc")
        fieldAgg = "rule.tsc";
      const aggs = {
        tactics: {
          terms: {
            field: fieldAgg,
            size: 100,
          }
        }
      }

      // TODO: use `status` and `statusText`  to show errors
      // @ts-ignore
      const { data, status, statusText, } = await getElasticAlerts(this.indexPattern, filterParams, aggs);
      const { buckets } = data.aggregations.tactics;
      /*if(firstTime){
       this.initTactics(buckets); // top tactics are checked on component mount
      }*/
      this._isMount && this.setState({ requirementsCount: buckets, loadingAlerts: false, firstTime: false });

    } catch (err) {
      /*   this.showToast(
           'danger',
           'Error',
           `Mitre alerts could not be fetched: ${err}`,
           3000
         );*/
      this.setState({ loadingAlerts: false })
    }

  }


  onChangeFlyout = (flyoutOn) => {
    this.setState({ flyoutOn });
  }

  closeFlyout() {
    this.setState({ flyoutOn: false });
  }

  showFlyout(requirement) {
    this.setState({
      selectedRequirement: requirement,
      flyoutOn: true
    })
  }



  render() {
    const { complianceObject, selectedRequirements, filterParams } = this.state;
    return (<div>
      <EuiFlexGroup>
        <EuiFlexItem>
          {this.getSearchBar()}
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup style={{ margin: 8 }}>
        <EuiFlexItem>
          <EuiPanel paddingSize="none">
            {!!Object.keys(complianceObject).length && this.state.filterParams.time.from !== "init" &&
              <EuiFlexGroup>
                  <EuiFlexItem grow={false} style={{width: "15%", minWidth: 145, maxHeight: "calc(100vh - 300px)",overflowX: "hidden"}}>
                  <ComplianceRequirements
                    indexPattern={this.indexPattern}
                    section={this.props.section}
                    onChangeSelectedRequirements={this.onChangeSelectedRequirements}
                    {...this.state} />
                </EuiFlexItem>
                <EuiFlexItem>
                  <ComplianceSubrequirements
                    indexPattern={this.indexPattern}
                    filters={this.state.filterParams}
                    section={this.props.section}
                    onSelectedTabChanged={(id) => this.props.onSelectedTabChanged(id)}
                    {...this.state} />
                </EuiFlexItem>
              </EuiFlexGroup>
            }
          </EuiPanel>

        </EuiFlexItem>
      </EuiFlexGroup>

    </div>
    )
  }
}

