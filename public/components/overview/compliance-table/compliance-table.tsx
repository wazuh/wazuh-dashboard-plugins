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
import { getElasticAlerts, getIndexPattern, IFilterParams } from '../mitre/lib';
import { pciRequirementsFile } from '../../../../server/integration-files/pci-requirements';
import { gdprRequirementsFile } from '../../../../server/integration-files/gdpr-requirements';
import { hipaaRequirementsFile } from '../../../../server/integration-files/hipaa-requirements';
import { nistRequirementsFile } from '../../../../server/integration-files/nist-requirements';
import { tscRequirementsFile } from '../../../../server/integration-files/tsc-requirements';
import { KbnSearchBar } from '../../kbn-search-bar';


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
    filterParams: IFilterParams,
    complianceObject: object,
    descriptions: object,
    loadingAlerts: boolean
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
      loadingAlerts: true,
      selectedRequirements: {},
      filterParams: {
        filters: this.filterManager.getFilters() || [],
        query: { language: 'kuery', query: '' },
        time: this.timefilter.getTime(),
      },
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
    const { filters } = this.state.filterParams;
    const filterParams:IFilterParams = { time: dateRange, filters, query};
    this.setState({ filterParams, loadingAlerts: true });
  }

  onFiltersUpdated = (filters: []) => {
    const { time, query} = this.state.filterParams;
    const filterParams = {time, query, filters};
    this.setState({ filterParams, loadingAlerts: true });
  }

  async componentDidUpdate(prevProps) {
    const { filterParams, loadingAlerts } = this.state;
    if (JSON.stringify(prevProps.filterParams) !== JSON.stringify(filterParams) && loadingAlerts) {
      this.getRequirementsCount();
    }
  }

  async getRequirementsCount() {
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
    const { complianceObject, loadingAlerts } = this.state;
    return (<div>
      <EuiFlexGroup>
        <EuiFlexItem>
          <div className='wz-discover hide-filter-controll' >
            <KbnSearchBar 
              onQuerySubmit={this.onQuerySubmit}
              onFiltersUpdated={this.onFiltersUpdated}
              isLoading={loadingAlerts} />
          </div>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup style={{ margin: '0 8px' }}>
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

