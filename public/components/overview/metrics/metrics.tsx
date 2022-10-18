/*
 * Wazuh app - Metrics component
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
import { EuiStat, EuiFlexGroup, EuiFlexItem, EuiToolTip } from '@elastic/eui';
import { FilterManager } from '../../../../../../src/plugins/data/public/';
import {
  buildRangeFilter,
  buildPhrasesFilter,
  buildPhraseFilter,
  buildExistsFilter,
} from '../../../../../../src/plugins/data/common';

//@ts-ignore
import { getElasticAlerts, getIndexPattern } from '../mitre/lib';
import { ModulesHelper } from '../../common/modules/modules-helper';
import { getDataPlugin } from '../../../kibana-services';
import { withAllowedAgents } from '../../common/hocs/withAllowedAgents';
import { formatUIDate } from '../../../react-services';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';

export const Metrics = withAllowedAgents(
  class Metrics extends Component {
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
      resultState: string;
      results: object;
      metricsOnClicks: object;
      loading: boolean;
      filterParams: object;
    };
    metricsList: object;

    props: any;

    constructor(props) {
      super(props);
      this.PluginPlatformServices = getDataPlugin().query;
      this.filterManager = this.PluginPlatformServices.filterManager;
      this.timefilter = this.PluginPlatformServices.timefilter.timefilter;
      this.state = {
        resultState: '',
        results: {},
        metricsOnClicks: {},
        loading: true,
        filterParams: {
          filters: [],
          query: { language: 'kuery', query: '' },
          time: { from: 'init', to: 'init' },
        },
      };
      this.modulesHelper = ModulesHelper;
      this.stats = <></>;

      this.metricsList = {
        general: [
          { name: 'Total', type: 'total' },
          {
            name: 'Level 12 or above alerts',
            type: 'range',
            gte: '12',
            lt: null,
            field: 'rule.level',
            color: 'danger',
          }, //null = infinite
          {
            name: 'Authentication failure',
            type: 'phrases',
            values: [
              'win_authentication_failed',
              'authentication_failed',
              'authentication_failures',
            ],
            field: 'rule.groups',
            color: 'danger',
          },
          {
            name: 'Authentication success',
            type: 'phrase',
            value: 'authentication_success',
            field: 'rule.groups',
            color: 'secondary',
          },
        ],
        vuls: [
          {
            name: 'Critical Severity Alerts',
            type: 'phrase',
            value: 'Critical',
            field: 'data.vulnerability.severity',
            color: 'danger',
          },
          {
            name: 'High Severity Alerts',
            type: 'phrase',
            value: 'High',
            field: 'data.vulnerability.severity',
          },
          {
            name: 'Medium Severity Alerts',
            type: 'phrase',
            value: 'Medium',
            field: 'data.vulnerability.severity',
            color: 'secondary',
          },
          {
            name: 'Low Severity Alerts',
            type: 'phrase',
            value: 'Low',
            field: 'data.vulnerability.severity',
            color: 'subdued',
          },
        ],
        virustotal: [
          {
            name: 'Total malicious',
            type: 'phrase',
            value: '1',
            field: 'data.virustotal.malicious',
            color: 'danger',
          },
          {
            name: 'Total positives',
            type: 'phrase',
            value: '0',
            negate: true,
            field: 'data.virustotal.positives',
            color: 'secondary',
          },
          { name: 'Total', type: 'total' },
        ],
        osquery: [{ name: 'Agents reporting', type: 'unique-count', field: 'agent.id' }],
        ciscat: [
          {
            name: 'Last scan not checked',
            type: 'custom',
            filter: { phrase: 'ciscat', field: 'rule.groups' },
            agg: {
              customAggResult: {
                terms: { field: 'timestamp', order: { _term: 'desc' }, size: 1 },
                aggs: { aggResult: { terms: { field: 'data.cis.notchecked' } } },
              },
            },
            color: 'subdued',
          },
          {
            name: 'Last scan pass',
            type: 'custom',
            filter: { phrase: 'ciscat', field: 'rule.groups' },
            agg: {
              customAggResult: {
                terms: { field: 'timestamp', order: { _term: 'desc' }, size: 1 },
                aggs: { aggResult: { terms: { field: 'data.cis.pass' } } },
              },
            },
            color: 'secondary',
          },
          {
            name: 'Last scan score',
            type: 'custom',
            filter: { phrase: 'ciscat', field: 'rule.groups' },
            agg: {
              customAggResult: {
                terms: { field: 'timestamp', order: { _term: 'desc' }, size: 1 },
                aggs: { aggResult: { terms: { field: 'data.cis.score' } } },
              },
            },
          },
          {
            name: 'Last scan date',
            type: 'custom',
            filter: { phrase: 'ciscat', field: 'rule.groups' },
            agg: {
              customAggResult: {
                terms: { field: 'timestamp', order: { _term: 'desc' }, size: 1 },
                aggs: { aggResult: { terms: { field: 'data.cis.timestamp' } } },
              },
            },
            color: 'secondary',
            transformValue: formatUIDate,
          },
          {
            name: 'Last scan errors',
            type: 'custom',
            filter: { phrase: 'ciscat', field: 'rule.groups' },
            agg: {
              customAggResult: {
                terms: { field: 'timestamp', order: { _term: 'desc' }, size: 1 },
                aggs: { aggResult: { terms: { field: 'data.cis.error' } } },
              },
            },
            color: 'danger',
          },
          {
            name: 'Last scan fails',
            type: 'custom',
            filter: { phrase: 'ciscat', field: 'rule.groups' },
            agg: {
              customAggResult: {
                terms: { field: 'timestamp', order: { _term: 'desc' }, size: 1 },
                aggs: { aggResult: { terms: { field: 'data.cis.fail' } } },
              },
            },
            color: 'danger',
          },
          {
            name: 'Last scan unknown',
            type: 'custom',
            filter: { phrase: 'ciscat', field: 'rule.groups' },
            agg: {
              customAggResult: {
                terms: { field: 'timestamp', order: { _term: 'desc' }, size: 1 },
                aggs: { aggResult: { terms: { field: 'data.cis.unknown' } } },
              },
            },
            color: 'subdued',
          },
        ],
        oscap: [
          {
            name: 'Last scan score',
            type: 'custom',
            filter: { phrase: 'oscap-report', field: 'rule.groups' },
            agg: {
              customAggResult: {
                terms: { field: 'timestamp', order: { _term: 'desc' }, size: 1 },
                aggs: { aggResult: { terms: { field: 'data.oscap.scan.score' } } },
              },
            },
          },
          {
            name: 'Highest scan score',
            type: 'custom',
            filter: { phrase: 'oscap-report', field: 'rule.groups' },
            agg: {
              customAggResult: {
                terms: { field: 'data.oscap.scan.score', order: { _term: 'desc' }, size: 1 },
                aggs: { aggResult: { terms: { field: 'data.oscap.scan.score' } } },
              },
            },
            color: 'secondary',
          },
          {
            name: 'Lowest scan score',
            type: 'custom',
            filter: { phrase: 'oscap-report', field: 'rule.groups' },
            agg: {
              customAggResult: {
                terms: { field: 'data.oscap.scan.score', order: { _term: 'asc' }, size: 1 },
                aggs: { aggResult: { terms: { field: 'data.oscap.scan.score' } } },
              },
            },
            color: 'danger',
          },
        ],
        office: [
          { name: "Max Rule Level", type: "custom", filter: { phrase: "office365", field: "rule.groups" }, agg: { "customAggResult": { "terms": { "field": "rule.level", "order": { "_term": "desc" }, "size": 1 }, "aggs": { "aggResult": { "terms": { "field": "rule.level" } } } } } },
          { name: "Suspicious Downloads", type: "phrase", value: "91724", field: "rule.id", color: "danger" },
          { name: "Full Access Permissions", type: "phrase", value: "91725", field: "rule.id" },
          { name: "Phishing and Malware", type: "phrases", values: ["91556", "91575", "91700"], field: "rule.id", color: "danger" },
        ],
        github: [
          { name: "Organizations", type: "unique-count",  field: "data.github.org"},
          { name: "Repositories", type: "unique-count",  field: "data.github.repo", color: "secondary"},
          { name: "Actors", type: "unique-count",  field: "data.github.actor", color: "danger"},
        ]
      };
    }

    async componentDidMount() {
      this.indexPattern = await getIndexPattern();
      this.scope = await this.modulesHelper.getDiscoverScope();
      this._isMount = true;
      this.buildMetric();
    }

    async getResults(filterParams, aggs = {}) {
      const params = { size: 0, track_total_hits: true };
      const result = await getElasticAlerts(this.indexPattern, filterParams, aggs, params);
      let totalHits = 0;
      if (Object.keys(aggs).length) {
        const agg = (result.data || {}).aggregations || {};
        if (agg && agg.customAggResult) {
          //CUSTOM AGG
          totalHits =
            (
              (((((agg.customAggResult || {}).buckets || [])[0] || {}).aggResult || {}).buckets ||
                [])[0] || {}
            ).key || 0;
        } else {
          totalHits = (agg.aggResult || {}).value || 0;
        }
      } else {
        totalHits = (((result.data || {}).hits || {}).total || {}).value || 0;
      }
      return totalHits;
    }

    async buildMetric() {
      if (!this.metricsList[this.props.section] || !this._isMount) return <></>;
      const searchBarQuery = this.scope.state.query;
      const filterParams = {};
      filterParams['time'] = this.timefilter.getTime();
      filterParams['query'] = searchBarQuery;
      filterParams['filters'] = this.filterManager.getFilters();
      this.props.filterAllowedAgents &&
        filterParams['filters'].push(this.props.filterAllowedAgents);
      this.setState({ filterParams, loading: true });
      const newOnClick = {};

      const result = this.metricsList[this.props.section].map(async (item) => {
        let filters = [];
        if (item.type === 'range') {
          const results = {};
          const rangeFilterParams = {};
          const valuesArray = { gte: item.gte, lt: item.lt };
          const filters = {
            ...buildRangeFilter(
              { name: item.field, type: 'integer' },
              valuesArray,
              this.indexPattern
            ),
            $state: { store: 'appState' },
          };
          rangeFilterParams['filters'] = [...filterParams['filters']];
          rangeFilterParams['time'] = filterParams['time'];
          rangeFilterParams['query'] = filterParams['query'];
          rangeFilterParams['filters'].push(filters);
          newOnClick[item.name] = () => {
            this.filterManager.addFilters(filters);
          };
          results[item.name] = await this.getResults(rangeFilterParams);
          return results;
        } else if (item.type === 'phrases') {
          const results = {};
          const phrasesFilter = {};
          const filters = {
            ...buildPhrasesFilter(
              { name: item.field, type: 'string' },
              item.values,
              this.indexPattern
            ),
            $state: { store: 'appState' },
          };
          phrasesFilter['filters'] = [...filterParams['filters']];
          phrasesFilter['time'] = filterParams['time'];
          phrasesFilter['query'] = filterParams['query'];
          phrasesFilter['filters'].push(filters);
          newOnClick[item.name] = () => {
            this.filterManager.addFilters(filters);
          };
          results[item.name] = await this.getResults(phrasesFilter);
          return results;
        } else if (item.type === 'custom') {
          const results = {};
          const customFilters = {};

          customFilters['filters'] = [...filterParams['filters']];
          customFilters['time'] = filterParams['time'];
          customFilters['query'] = filterParams['query'];
          if (item.filter.phrase) {
            const filters = {
              ...buildPhraseFilter(
                { name: item.filter.field, type: 'string' },
                item.filter.phrase,
                this.indexPattern
              ),
              $state: { store: 'appState' },
            };
            customFilters['filters'].push(filters);
          }
          results[item.name] = await this.getResults(customFilters, item.agg);
          return results;
        } else if (item.type === 'exists') {
          const results = {};
          const existsFilters = {};
          const filters = {
            ...buildExistsFilter({ name: item.field, type: 'nested' }, this.indexPattern),
            $state: { store: 'appState' },
          };
          existsFilters['filters'] = [...filterParams['filters']];
          existsFilters['time'] = filterParams['time'];
          existsFilters['query'] = filterParams['query'];
          existsFilters['filters'].push(filters);
          newOnClick[item.name] = () => {
            this.filterManager.addFilters(filters);
          };
          results[item.name] = await this.getResults(existsFilters);
          return results;
        } else if (item.type === 'unique-count') {
          const results = {};
          const params = {};
          const aggs = {
            aggResult: {
              cardinality: {
                field: item.field,
              },
            },
          };

          params['filters'] = [...filterParams['filters']];
          params['time'] = filterParams['time'];
          params['query'] = filterParams['query'];
          results[item.name] = await this.getResults(params, aggs);
          return results;
        } else if (item.type === 'phrase') {
          const results = {};
          const phraseFilter = {};
          const filters = {
            ...buildPhraseFilter(
              { name: item.field, type: 'string' },
              item.value,
              this.indexPattern
            ),
            $state: { store: 'appState' },
          };
          if (item.negate) {
            filters.meta.negate = item.negate;
          }
          phraseFilter['filters'] = [...filterParams['filters']];
          phraseFilter['time'] = filterParams['time'];
          phraseFilter['query'] = filterParams['query'];
          phraseFilter['filters'].push(filters);
          newOnClick[item.name] = () => {
            this.filterManager.addFilters(filters);
          };
          results[item.name] = await this.getResults(phraseFilter);
          return results;
        } else {
          const results = {};
          results[item.name] = await this.getResults(filterParams);
          return results;
        }
      });

      try {
        const completed = await Promise.all(result);
        const newResults = {};
        completed.forEach((item) => {
          const key = Object.keys(item)[0];
          newResults[key] = item[key];
        });
        this.setState({
          results: newResults,
          loading: false,
          buildingMetrics: false,
          metricsOnClicks: newOnClick,
        });
      } catch (error) {
        this.setState({ loading: false, buildingMetrics: false });
        const options = {
          context: `${Metrics.name}.buildMetric`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          display: true,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }

    componentDidUpdate() {
      if (
        !this.state.buildingMetrics &&
        this.props.resultState === 'ready' &&
        this.state.resultState === 'loading'
      ) {
        this.setState({ buildingMetrics: true, resultState: this.props.resultState }, () => {
          this.stats = this.buildMetric();
        });
      } else if (this.props.resultState !== this.state.resultState) {
        const isLoading = this.props.resultState === 'loading' ? { loading: true } : {};
        this.setState({ resultState: this.props.resultState, ...isLoading });
      }
    }

    buildTitleButton = (count, itemName) => {
      return (
        <EuiToolTip position="top" content={`Filter by ${itemName}`}>
          <span
            className={'statWithLink'}
            style={{ cursor: 'pointer', fontSize: count > 20 ? '2rem' : '2.25rem' }}
            onClick={this.state.metricsOnClicks[itemName]}
          >
            {this.state.results[itemName]}
          </span>
        </EuiToolTip>
      );
    };

    buildStatsComp() {
      const { section } = this.props;
      if (this.metricsList[section]) {
        return this.metricsList[section].map((item, idx) => {
          const count = (this.state.results[item.name] || []).length;
          return (
            <EuiFlexItem grow={count > 20 ? 3 : 1} key={`${item.name}`}>
              <EuiStat
                title={
                  this.state.metricsOnClicks[item.name] ? (
                    this.buildTitleButton(count, item.name)
                  ) : (
                    <span style={{ fontSize: count > 20 ? '2rem' : '2.25rem' }}>
                      {item.transformValue
                        ? item.transformValue(this.state.results[item.name])
                        : this.state.results[item.name]}
                    </span>
                  )
                }
                description={item.name}
                titleColor={this.metricsList[section][idx].color || 'primary'}
                isLoading={this.state.loading}
                textAlign="center"
              />
            </EuiFlexItem>
          );
        });
      }
    }

    render() {
      const stats = this.buildStatsComp();
      return (
        <EuiFlexGroup>
          <EuiFlexItem />
          {stats}
          <EuiFlexItem />
        </EuiFlexGroup>
      );
    }
  }
);
