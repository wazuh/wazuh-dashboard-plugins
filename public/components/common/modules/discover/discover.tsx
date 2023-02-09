/*
 * Wazuh app - Integrity monitoring table component
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
import './discover.scss';
import { FilterManager, Filter } from '../../../../../../../src/plugins/data/public/';
import { GenericRequest } from '../../../../react-services/generic-request';
import { AppState } from '../../../../react-services/app-state';
import { AppNavigate } from '../../../../react-services/app-navigate';
import { RowDetails } from './row-details';
import DateMatch from '@elastic/datemath';
import { WazuhConfig } from '../../../../react-services/wazuh-config';
import { formatUIDate } from '../../../../react-services/time-service';
import { KbnSearchBar } from '../../../kbn-search-bar';
import { FlyoutTechnique } from '../../../../components/overview/mitre/components/techniques/components/flyout-technique';
import { withErrorBoundary, withReduxProvider } from '../../../common/hocs';
import { connect } from 'react-redux';
import { compose } from 'redux';
import _ from 'lodash';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';

import {
  EuiBasicTable,
  EuiLoadingContent,
  EuiTableSortingType,
  EuiFlexItem,
  EuiFlexGroup,
  Direction,
  EuiSpacer,
  EuiCallOut,
  EuiIcon,
  EuiButtonIcon,
  EuiButtonEmpty,
  EuiToolTip,
} from '@elastic/eui';
import {
  IIndexPattern,
  TimeRange,
  Query,
  buildPhraseFilter,
  getEsQueryConfig,
  buildEsQuery,
  IFieldType,
} from '../../../../../../../src/plugins/data/common';
import { getDataPlugin, getToasts, getUiSettings } from '../../../../kibana-services';

const mapStateToProps = (state) => ({
  currentAgentData: state.appStateReducers.currentAgentData,
});

interface ColumnDefinition {
  field: string;
  label?: string;
}

export const Discover = compose(
  withErrorBoundary,
  withReduxProvider,
  connect(mapStateToProps)
)(
  class Discover extends Component {
    _isMount!: boolean;
    timefilter: {
      getTime(): TimeRange;
      setTime(time: TimeRange): void;
      _history: { history: { items: { from: string; to: string }[] } };
    };

    PluginPlatformServices: { [key: string]: any };
    state: {
      sort: object;
      selectedTechnique: string;
      alerts: { _source: {}; _id: string }[];
      total: number;
      pageIndex: number;
      pageSize: number;
      sortField: string;
      sortDirection: Direction;
      isLoading: boolean;
      requestSize: number;
      requestOffset: number;
      query: { language: 'kuery' | 'lucene'; query: string };
      itemIdToExpandedRowMap: any;
      dateRange: TimeRange;
      elasticQuery: object;
      columns: string[];
      hover: string;
    };
    indexPattern!: IIndexPattern;
    props!: {
      implicitFilters: object[];
      initialFilters: object[];
      query?: { language: 'kuery' | 'lucene'; query: string };
      type?: any;
      rowDetailsFields?: string[];
      updateTotalHits: Function;
      includeFilters?: string;
      initialColumns: ColumnDefinition[];
      initialAgentColumns?: ColumnDefinition[];
      shareFilterManager: FilterManager;
      shareFilterManagerWithUserAuthorized: Filter[];
      refreshAngularDiscover?: number;
    };
    constructor(props) {
      super(props);
      this.PluginPlatformServices = getDataPlugin();
      this.timefilter = this.PluginPlatformServices.query.timefilter.timefilter;
      this.timeSubscription = null;
      this.state = {
        sort: {},
        selectedTechnique: '',
        alerts: [],
        total: 0,
        pageIndex: 0,
        pageSize: 10,
        sortField: 'timestamp',
        sortDirection: 'desc',
        isLoading: false,
        requestSize: 500,
        requestOffset: 0,
        itemIdToExpandedRowMap: {},
        dateRange: this.timefilter.getTime(),
        dateRangeHistory: this.timefilter._history,
        query: props.query || { language: 'kuery', query: '' },
        elasticQuery: {},
        columns: [],
        hover: '',
      };

      this.wazuhConfig = new WazuhConfig();

      this.hideCreateCustomLabel.bind(this);
      this.onQuerySubmit.bind(this);
      this.onFiltersUpdated.bind(this);
      this.hideCreateCustomLabel();
    }

    showToast = (color, title, time) => {
      getToasts().add({
        color: color,
        title: title,
        toastLifeTimeMs: time,
      });
    };

    async componentDidMount() {
      this._isMount = true;
      try {
        this.timeSubscription = this.timefilter.getTimeUpdate$().subscribe(() => {
          this.setState({
            dateRange: this.timefilter.getTime(),
            dateRangeHistory: this.timefilter._history,
          });
        });
        this.setState({ columns: this.getColumns() }); //initial columns
        await this.getIndexPattern();
        await this.getAlerts();
      } catch (error) {
        const options = {
          context: `${Discover.name}.componentDidMount`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }

    componentWillUnmount() {
      this._isMount = false;
      this.timeSubscription && this.timeSubscription.unsubscribe();
    }

    async componentDidUpdate(prevProps, prevState) {
      if (!this._isMount) {
        return;
      }
      if (
        (!prevProps.currentAgentData.id && this.props.currentAgentData.id) ||
        (prevProps.currentAgentData.id && !this.props.currentAgentData.id) ||
        prevProps.currentAgentData.id !== this.props.currentAgentData.id
      ) {
        this.setState({ columns: this.getColumns() }); // Updates the columns to be rendered if you change the selected agent to none or vice versa
        return;
      }
      if (!_.isEqual(this.props.query, prevProps.query)) {
        this.setState({ query: { ...this.props.query } });
        return;
      }
      if (
        this.props.currentAgentData.id !== prevProps.currentAgentData.id ||
        !_.isEqual(this.state.query, prevState.query) ||
        !_.isEqual(this.state.dateRange, prevState.dateRange) ||
        this.props.refreshAngularDiscover !== prevProps.refreshAngularDiscover
      ) {
        this.setState({ pageIndex: 0, tsUpdated: Date.now() });
        if (!_.isEqual(this.props.shareFilterManager, this.state.searchBarFilters)) {
          this.setState({
            columns: this.getColumns(),
            searchBarFilters: this.props.shareFilterManager || [],
          }); //initial columns
        }
        return;
      }
      if (
        ['pageIndex', 'pageSize', 'sortField', 'sortDirection'].some(
          (field) => this.state[field] !== prevState[field]
        ) ||
        this.state.tsUpdated !== prevState.tsUpdated
      ) {
        try {
          await this.getAlerts();
        } catch (error) {
          const options = {
            context: `${Discover.name}.componentDidUpdate`,
            level: UI_LOGGER_LEVELS.ERROR,
            severity: UI_ERROR_SEVERITIES.BUSINESS,
            error: {
              error: error,
              message: error.message || error,
              title: error.name || error,
            },
          };
          getErrorOrchestrator().handleError(options);
        }
      }
    }

    getInnitialDefinitions() {
      if (this.props.currentAgentData.id) {
        return this.props.initialAgentColumns || this.props.initialColumns;
      } else {
        return this.props.initialColumns;
      }
    }
    getColumns() {
      //Extract array of terms from object
      return this.getInnitialDefinitions().map((column) => column.field);
    }
    getLabel(field) {
      const innitialLabels = this.getInnitialDefinitions().filter((value) => value.field === field);
      if (innitialLabels.length) {
        return innitialLabels[0].label || field;
      } else {
        return field;
      }
    }

    async getIndexPattern() {
      this.indexPattern = {
        ...(await this.PluginPlatformServices.indexPatterns.get(AppState.getCurrentPattern())),
      };
    }

    hideCreateCustomLabel = () => {
      try {
        const button = document.querySelector(
          '.wz-discover #addFilterPopover > div > button > span > span'
        );
        if (!button) return setTimeout(this.hideCreateCustomLabel, 100);
        const findAndHide = () => {
          const switcher = document.querySelector('#filterEditorCustomLabelSwitch');
          if (!switcher) return setTimeout(findAndHide, 100);
          switcher.parentElement.style.display = 'none';
        };
        button.onclick = findAndHide;
      } catch (error) {
        const options = {
          context: `${Discover.name}.hideCreateCustomLabel`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    };

    filtersAsArray(filters) {
      const keys = Object.keys(filters);
      const result: {}[] = [];
      for (var i = 0; i < keys.length; i++) {
        const item = {};
        item[keys[i]] = filters[keys[i]];
        result.push(item);
      }
      return result;
    }

    toggleDetails = (item) => {
      const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };
      const { rowDetailsFields } = this.props;

      if (itemIdToExpandedRowMap[item._id]) {
        delete itemIdToExpandedRowMap[item._id];
        this.setState({ itemIdToExpandedRowMap });
      } else {
        const newItemIdToExpandedRowMap = {};
        newItemIdToExpandedRowMap[item._id] = (
          <div style={{ width: '100%' }}>
            {' '}
            <RowDetails
              item={item}
              addFilter={(filter) => this.addFilter(filter)}
              addFilterOut={(filter) => this.addFilterOut(filter)}
              toggleColumn={(id) => this.addColumn(id)}
              rowDetailsFields={rowDetailsFields}
              indexPattern={this.indexPattern}
            />
          </div>
        );
        this.setState({ itemIdToExpandedRowMap: newItemIdToExpandedRowMap });
      }
    };

    buildFilter() {
      const dateParse = (ds) =>
        /\d+-\d+-\d+T\d+:\d+:\d+.\d+Z/.test(ds) ? DateMatch.parse(ds).toDate().getTime() : ds;
      const { query } = this.state;
      const { hideManagerAlerts } = this.wazuhConfig.getConfig();
      const extraFilters = [];
      if (hideManagerAlerts)
        extraFilters.push({
          meta: {
            alias: null,
            disabled: false,
            key: 'agent.id',
            negate: true,
            params: { query: '000' },
            type: 'phrase',
            index: this.indexPattern.title,
          },
          query: { match_phrase: { 'agent.id': '000' } },
          $state: { store: 'appState' },
        });

      const filters = this.props.shareFilterManager
        ? this.props.shareFilterManager.getFilters()
        : [];
      const previousFilters =
        (this.PluginPlatformServices && this.PluginPlatformServices.query.filterManager.getFilters()) || [];
      const elasticQuery = buildEsQuery(
        this.indexPattern,
        query,
        _.union(
          previousFilters,
          filters,
          extraFilters,
          this.props.shareFilterManagerWithUserAuthorized || []
        ),
        getEsQueryConfig(getUiSettings())
      );

      const { sortField, sortDirection } = this.state;

      const range = {
        range: {
          timestamp: {
            gte: dateParse(this.state.dateRange.from),
            lte: dateParse(this.state.dateRange.to),
            format: 'epoch_millis',
          },
        },
      };
      elasticQuery.bool.must.push(range);

      if (this.props.implicitFilters) {
        this.props.implicitFilters.map((impicitFilter) =>
          elasticQuery.bool.must.push({
            match: impicitFilter,
          })
        );
      }
      if (this.props.currentAgentData.id) {
        elasticQuery.bool.must.push({
          match: { 'agent.id': this.props.currentAgentData.id },
        });
      }
      return {
        query: elasticQuery,
        size: this.state.pageSize,
        from: this.state.pageIndex * this.state.pageSize,
        ...(sortField ? { sort: { [sortField]: { order: sortDirection } } } : {}),
      };
    }

    async getAlerts() {
      if (!this.indexPattern || this.state.isLoading) return;
      //compare filters so we only make a request into Elasticsearch if needed
      try {
        this.setState({ isLoading: true });
        const newFilters = this.buildFilter();
        const alerts = await GenericRequest.request('POST', `/elastic/alerts`, {
          index: this.indexPattern.title,
          body: newFilters,
        });
        if (this._isMount) {
          this.setState({
            alerts: alerts.data.hits.hits,
            total: alerts.data.hits.total.value,
            isLoading: false,
          });
          this.props.updateTotalHits(alerts.data.hits.total.value);
        }
      } catch (error) {
        if (this._isMount) {
          this.setState({ alerts: [], total: 0, isLoading: false });
          this.props.updateTotalHits(0);
        }
        throw error;
      }
    }

    removeColumn(id) {
      if (this.state.columns.length < 2) {
        this.showToast('warning', 'At least one column must be selected', 3000);
        return;
      }
      const columns = this.state.columns;
      columns.splice(
        columns.findIndex((v) => v === id),
        1
      );
      this.setState(columns);
    }

    addColumn(id) {
      if (this.state.columns.length > 11) {
        this.showToast('warning', 'The maximum number of columns is 10', 3000);
        return;
      }
      if (this.state.columns.find((element) => element === id)) {
        this.removeColumn(id);
        return;
      }
      const columns = this.state.columns;
      columns.push(id);
      this.setState(columns);
    }

    columns = () => {
      var columnsList = [...this.state.columns];
      const columns = columnsList.map((item) => {
        if (item === 'icon') {
          return {
            width: '2.3%',
            isExpander: true,
            render: (item) => {
              return (
                <EuiIcon
                  size="s"
                  type={this.state.itemIdToExpandedRowMap[item._id] ? 'arrowDown' : 'arrowRight'}
                />
              );
            },
          };
        }
        if (item === 'timestamp') {
          return {
            field: 'timestamp',
            name: 'Time',
            width: '10%',
            sortable: true,
            render: (time) => {
              return <span>{formatUIDate(time)}</span>;
            },
          };
        }
        let width = false;
        let link = false;
        const arrayCompilance = [
          'rule.pci_dss',
          'rule.gdpr',
          'rule.nist_800_53',
          'rule.tsc',
          'rule.hipaa',
        ];

        if (item === 'agent.id') {
          link = (ev, x) => {
            AppNavigate.navigateToModule(ev, 'agents', { tab: 'welcome', agent: x });
          };
          width = '8%';
        }
        if (item === 'agent.name') {
          width = '12%';
        }
        if (item === 'rule.level') {
          width = '7%';
        }
        if (item === 'rule.id') {
          link = (ev, x) =>
            AppNavigate.navigateToModule(ev, 'manager', { tab: 'rules', redirectRule: x });
          width = '9%';
        }
        if (item === 'rule.description' && columnsList.indexOf('syscheck.event') === -1) {
          width = '30%';
        }
        if (item === 'syscheck.event') {
          width = '15%';
        }
        if (item === 'rule.mitre.id') {
          link = (ev, x) => this.openIntelligence(ev, 'techniques', x);
        }
        if (arrayCompilance.indexOf(item) !== -1) {
          width = '30%';
        }

        let column = {
          field: item,
          name: (
            <span
              onMouseEnter={() => {
                this.setState({ hover: item });
              }}
              onMouseLeave={() => {
                this.setState({ hover: '' });
              }}
              style={{ display: 'inline-flex' }}
            >
              {this.getLabel(item)}{' '}
              {this.state.hover === item && (
                <EuiToolTip position="top" content={`Remove column`}>
                  <EuiButtonIcon
                    style={{ paddingBottom: 12, marginBottom: '-10px', paddingTop: 0 }}
                    onClick={(e) => {
                      this.removeColumn(item);
                      e.stopPropagation();
                    }}
                    iconType="cross"
                    aria-label="Filter"
                    iconSize="s"
                  />
                </EuiToolTip>
              )}
            </span>
          ),
          sortable: true,
        };

        if (width) {
          column.width = width;
        }
        if (
          (link && item !== 'rule.mitre.id') ||
          (item === 'rule.mitre.id' && this.props.shareFilterManager)
        ) {
          column.render = (itemValue) => {
            return (
              <span>
                {(item === 'agent.id' && itemValue === '000' && (
                  <span style={{ fontSize: 14, marginLeft: 8 }}>{itemValue}</span>
                )) ||
                  (item === 'rule.mitre.id' &&
                    Array.isArray(itemValue) &&
                    itemValue.map((currentItem) => (
                      <EuiButtonEmpty
                        onClick={(ev) => {
                          ev.stopPropagation();
                        }}
                        onMouseDown={(ev) => {
                          ev.stopPropagation();
                          link(ev, currentItem);
                        }}
                      >
                        {currentItem}
                      </EuiButtonEmpty>
                    ))) || (
                    <EuiButtonEmpty
                      onClick={(ev) => {
                        ev.stopPropagation();
                      }}
                      onMouseDown={(ev) => {
                        ev.stopPropagation();
                        link(ev, itemValue);
                      }}
                    >
                      {itemValue}
                    </EuiButtonEmpty>
                  )}
              </span>
            );
          };
        }

        return column;
      });
      return columns;
    };

    onTableChange = ({ page = {}, sort = {} }) => {
      const { index: pageIndex, size: pageSize } = page;
      const { field: sortField, direction: sortDirection } = sort;

      this.setState({
        pageIndex,
        pageSize,
        sortField,
        sortDirection,
      });
    };

    getFiltersAsObject(filters) {
      var result = {};
      for (var i = 0; i < filters.length; i++) {
        result = { ...result, ...filters[i] };
      }
      return result;
    }

    /**
     * Adds a new negated filter with format { "filter_key" : "filter_value" }, e.g. {"agent.id": "001"}
     * @param filter
     */
    addFilterOut(filter) {
      const filterManager = this.props.shareFilterManager;
      const key = Object.keys(filter)[0];
      const value = filter[key];
      const valuesArray = Array.isArray(value) ? [...value] : [value];
      valuesArray.map((item) => {
        const formattedFilter = buildPhraseFilter(
          { name: key, type: 'string' },
          item,
          this.indexPattern
        );
        formattedFilter.meta.negate = true;

        filterManager.addFilters(formattedFilter);
      });
      this.setState({ pageIndex: 0, tsUpdated: Date.now() });
    }

    /**
     * Adds a new filter with format { "filter_key" : "filter_value" }, e.g. {"agent.id": "001"}
     * @param filter
     */
    addFilter(filter) {
      const filterManager = this.props.shareFilterManager;
      const key = Object.keys(filter)[0];
      const value = filter[key];
      const valuesArray = Array.isArray(value) ? [...value] : [value];
      valuesArray.map((item) => {
        const formattedFilter = buildPhraseFilter(
          { name: key, type: 'string' },
          item,
          this.indexPattern
        );
        if (
          formattedFilter.meta.key === 'manager.name' ||
          formattedFilter.meta.key === 'cluster.name'
        ) {
          formattedFilter.meta['removable'] = false;
        }
        filterManager.addFilters(formattedFilter);
      });
      this.setState({ pageIndex: 0, tsUpdated: Date.now() });
    }

    onQuerySubmit = (payload: { dateRange: TimeRange; query: Query | undefined }) => {
      this.setState({ ...payload, tsUpdated: Date.now() });
    };

    onFiltersUpdated = (filters: Filter[]) => {
      this.setState({ pageIndex: 0, tsUpdated: Date.now() });
    };


    openDiscover(e, techniqueID) {
      AppNavigate.navigateToModule(e, 'overview', {
        tab: 'mitre',
        tabView: 'discover',
        filters: { 'rule.mitre.id': techniqueID },
      });
    }

    openDashboard(e, techniqueID) {
      AppNavigate.navigateToModule(e, 'overview', {
        tab: 'mitre',
        tabView: 'dashboard',
        filters: { 'rule.mitre.id': techniqueID },
      });
    }

    openIntelligence(e, redirectTo, itemID) {
      AppNavigate.navigateToModule(e, 'overview', { "tab": 'mitre', "tabView": "intelligence", "tabRedirect": redirectTo, "idToRedirect": itemID});
    }

    render() {
      if (this.state.isLoading)
        return (
          <div style={{ alignSelf: 'center', minHeight: 400 }}>
            <EuiLoadingContent lines={3} />{' '}
          </div>
        );
      const { total, itemIdToExpandedRowMap } = this.state;
      const { query = this.state.query } = this.props;
      const getRowProps = (item) => {
        const { _id } = item;
        return {
          'data-test-subj': `row-${_id}`,
          className: 'customRowClass',
          onClick: () => this.toggleDetails(item),
        };
      };

      const columns = this.columns();

      const sorting: EuiTableSortingType<{}> = {
        sort: {
          //@ts-ignore
          field: this.state.sortField,
          direction: this.state.sortDirection,
        },
      };
      const pagination = {
        pageIndex: this.state.pageIndex,
        pageSize: this.state.pageSize,
        totalItemCount: this.state.total > 10000 ? 10000 : this.state.total,
        pageSizeOptions: [10, 25, 50],
      };
      const noResultsText = `No results match for this search criteria`;
      return (
        <div className="wz-discover hide-filter-control wz-inventory">
          {this.props.kbnSearchBar && (
            <KbnSearchBar
              indexPattern={this.indexPattern}
              filterManager={this.props.shareFilterManager}
              timeFilter={{
                timeFilter: this.state.dateRange,
                timeHistory: this.state.dateRangeHistory,
                setTimeFilter: (dateRange) => this.setState({ dateRange }),
              }}
              onQuerySubmit={this.onQuerySubmit}
              onFiltersUpdated={this.onFiltersUpdated}
              query={query}
            />
          )}
          {total ? (
            <EuiFlexGroup>
              <EuiFlexItem>
                {this.state.alerts.length && (
                  <EuiBasicTable
                    items={this.state.alerts.map((alert) => ({ ...alert._source, _id: alert._id }))}
                    className="module-discover-table"
                    itemId="_id"
                    itemIdToExpandedRowMap={itemIdToExpandedRowMap}
                    isExpandable={true}
                    columns={columns}
                    rowProps={getRowProps}
                    pagination={pagination}
                    sorting={sorting}
                    onChange={this.onTableChange}
                  />
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : (
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiSpacer size="s" />
                <EuiCallOut title={noResultsText} color="warning" iconType="alert" />
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
        </div>
      );
    }
  }
);
