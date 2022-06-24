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
import React, { Component } from 'react'
import { Tactics, Techniques } from './components';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { IFilterParams, getIndexPattern } from './lib';

import {  FilterManager, Filter } from '../../../../../../src/plugins/data/public/';
//@ts-ignore
import { KbnSearchBar } from '../../kbn-search-bar';
import { TimeRange, Query } from '../../../../../../src/plugins/data/common';
import { ModulesHelper } from '../../common/modules/modules-helper';
import { getDataPlugin, getToasts } from '../../../kibana-services';
import { withErrorBoundary } from "../../common/hocs";
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';

export interface ITactic {
  [key:string]: string[]
}

export const Mitre = withErrorBoundary (class Mitre extends Component {
  _isMount = false;
  timefilter: {
    getTime(): TimeRange
    setTime(time: TimeRange): void
    _history: { history: { items: { from: string, to: string }[] } }
  };

  PluginPlatformServices: { [key: string]: any };
  filterManager: FilterManager;
  indexPattern: any;
  destroyWatcher: any;
  state: {
    tacticsObject: ITactic,
    selectedTactics: Object,
    filterParams: IFilterParams,
    isLoading: boolean,
  }

  props: any;

  constructor(props) {
    super(props);
    this.PluginPlatformServices = getDataPlugin().query;
    this.filterManager = this.PluginPlatformServices.filterManager;
    this.timefilter = this.PluginPlatformServices.timefilter.timefilter;
    this.state = {
      tacticsObject: {},
      selectedTactics: {},
      isLoading: true,
      filterParams: {
        filters: this.filterManager.getFilters() || [],
        query: { language: 'kuery', query: '' },
        time: this.timefilter.getTime(),
      },
    }
    this.onChangeSelectedTactics.bind(this);
    this.onQuerySubmit.bind(this);
    this.onFiltersUpdated.bind(this);
  }

  async componentDidMount(){
    this._isMount = true;
    this.indexPattern = await getIndexPattern();
    const scope = await ModulesHelper.getDiscoverScope();
    const query = scope.state.query;
    const { filters, time} = this.state.filterParams;
    this.setState({filterParams: {query, filters, time}})
    this.filtersSubscriber = this.filterManager.getUpdates$().subscribe(() => {
      this.onFiltersUpdated(this.filterManager.getFilters())
    });

    await this.buildTacticsObject();
  }

  componentWillUnmount() {
    this.filtersSubscriber.unsubscribe();
    this._isMount = false;
  }

  onQuerySubmit = (payload: { dateRange: TimeRange, query: Query }) => {
    const { query, dateRange } = payload;
    const { filters } = this.state.filterParams
    const filterParams = { query, time: dateRange , filters};
    this.setState({ filterParams, isLoading: true }, () => this.setState({isLoading:false}));
  }

  onFiltersUpdated = (filters: Filter[]) => {
    const { query, time } = this.state.filterParams;
    const filterParams = { query, time, filters };
    this.setState({ filterParams, isLoading: true }, () => this.setState({isLoading:false}));
  }

  showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

  async buildTacticsObject() {
    try {
      const data = await WzRequest.apiReq('GET', '/mitre/tactics', {});
      const result = (((data || {}).data || {}).data || {}).affected_items;
      const tacticsObject = {};
      result && result.forEach(item => {
        tacticsObject[item.name] = item;
      });
      this._isMount && this.setState({tacticsObject, isLoading: false});
    } catch(error) {
      this.setState({ isLoading: false });
      const options = {
        context: `${Mitre.name}.buildTacticsObject`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Mitre data could not be fetched`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  onChangeSelectedTactics = (selectedTactics) => {
    this.setState({selectedTactics});
  }

  render() {
    const { isLoading } = this.state;

    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <div className='wz-discover hide-filter-control' >
              <KbnSearchBar
                onQuerySubmit={this.onQuerySubmit}
                onFiltersUpdated={this.onFiltersUpdated}
                isLoading={isLoading} />
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiFlexGroup style={{ margin: '0 8px' }}>
          <EuiFlexItem>
            <EuiPanel paddingSize="none">
                <EuiFlexGroup >
                  <EuiFlexItem grow={false} style={{width: "15%", minWidth: 145, height: "calc(100vh - 325px)",overflowX: "hidden"}}>
                    <Tactics
                      indexPattern={this.indexPattern}
                      onChangeSelectedTactics={this.onChangeSelectedTactics}
                      filters={this.state.filterParams}
                      {...this.state} />
                  </EuiFlexItem>
                  <EuiFlexItem>
                      <Techniques
                      indexPattern={this.indexPattern}
                      filters={this.state.filterParams}
                      onSelectedTabChanged={(id) => this.props.onSelectedTabChanged(id)}
                      {...this.state} />
                  </EuiFlexItem>
                </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>

      </div>
    );
  }
})

