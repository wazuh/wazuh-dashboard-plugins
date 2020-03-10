/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import discoverTemplate from '../templates/discover/discover.html';
import { uiModules } from 'ui/modules';
import store from '../redux/store';
import { updateVis } from '../redux/actions/visualizationsActions';

uiModules.get('app/wazuh', []).directive('kbnDis', [
  function () {
    return {
      restrict: 'E',
      scope: {},
      template: discoverTemplate
    };
  }
]);

// Added dependencies (from Kibana module)
import './discover_dependencies'
import 'ui/directives/render_directive';
import 'plugins/kibana/discover/np_ready/angular/directives';
import _ from 'lodash';
import { Subscription } from 'rxjs';
import moment from 'moment';
import dateMath from '@elastic/datemath';
import { i18n } from '@kbn/i18n';

// doc table
import { getSort } from 'plugins/kibana/discover/np_ready/angular/doc_table/lib/get_sort';
import { getSortForSearchSource } from 'plugins/kibana/discover/np_ready/angular/doc_table/lib/get_sort_for_search_source';
import * as columnActions from 'plugins/kibana/discover/np_ready/angular/doc_table/actions/columns';

import 'plugins/kibana/discover/np_ready/components/fetch_error';
import { getPainlessError } from 'plugins/kibana/discover/np_ready/angular/get_painless_error';
import {
  angular,
  buildVislibDimensions,
  getRequestInspectorStats,
  getResponseInspectorStats,
  setServices,
  getServices,
  hasSearchStategyForIndexPattern,
  intervalOptions,
  isDefaultTypeIndexPattern,
  migrateLegacyQuery,
  RequestAdapter,
  stateMonitorFactory,
  subscribeWithScope,
  tabifyAggResponse,
  vislibSeriesResponseHandlerProvider,
  Vis,
  registerTimefilterWithGlobalStateFactory
} from 'plugins/kibana/discover/kibana_services';

import { generateFilters } from 'plugins/kibana/../../../../plugins/data/public';
import { FilterStateManager } from 'plugins/data';
import { buildServices } from 'plugins/kibana/discover/build_services';
import { npStart } from 'ui/new_platform';
import { pluginInstance } from 'plugins/kibana/discover/index';
import { WazuhConfig } from '../react-services/wazuh-config';

const fetchStatuses = {
  UNINITIALIZED: 'uninitialized',
  LOADING: 'loading',
  COMPLETE: 'complete',
};

const app = uiModules.get('app/discover', []);
app.run(async (globalState, $rootScope) => {
  const services = await buildServices(npStart.core, npStart.plugins, pluginInstance.docViewsRegistry);
  setServices(services);
  const {
    timefilter,
  } = getServices();
  registerTimefilterWithGlobalStateFactory(timefilter, globalState, $rootScope);
});

app.directive('discoverAppW', function () {
  return {
    restrict: 'E',
    controllerAs: 'discoverApp',
    controller: discoverController,
  };
});

function discoverController(
  $element,
  $route,
  $scope,
  $timeout,
  $window,
  AppState,
  Promise,
  config,
  kbnUrl,
  localStorage,
  uiCapabilities,
  getAppState,
  globalState,
  // Wazuh requirements from here
  $rootScope,
  $location,
  loadedVisualizations,
  discoverPendingUpdates
) {
  //WAZUH
  (async () => {
    const services = await buildServices(npStart.core, npStart.plugins, pluginInstance.docViewsRegistry);
    setServices(services);
  })();
  const {
    data,
    chrome,
    filterManager,
    timefilter,
    toastNotifications,
  } = getServices();
  const wazuhConfig = new WazuhConfig();
  //////
  const responseHandler = vislibSeriesResponseHandlerProvider().handler;
  const filterStateManager = new FilterStateManager(globalState, getAppState, filterManager);

  const inspectorAdapters = {
    requests: new RequestAdapter(),
  };

  const subscriptions = new Subscription();

  timefilter.disableTimeRangeSelector();
  timefilter.disableAutoRefreshSelector();
  $scope.timefilterUpdateHandler = ranges => {
    timefilter.setTime({
      from: moment(ranges.from).toISOString(),
      to: moment(ranges.to).toISOString(),
      mode: 'absolute',
    });
    $scope.updateQueryAndFetch({
      query: $state.query
    });
  };
  $scope.intervalOptions = intervalOptions;
  $scope.showInterval = false;
  $scope.minimumVisibleRows = 50;
  $scope.fetchStatus = fetchStatuses.UNINITIALIZED;
  $scope.refreshInterval = timefilter.getRefreshInterval();
  $scope.showSaveQuery = uiCapabilities.discover.saveQuery;
  let implicitFilters = null;

  $scope.$watch(
    () => uiCapabilities.discover.saveQuery,
    newCapability => {
      $scope.showSaveQuery = newCapability;
    }
  );

  $scope.intervalEnabled = function (interval) {
    return interval.val !== 'custom';
  };

  // the saved savedSearch
  const savedSearch = $route.current.locals.savedSearch;

  let abortController;
  $scope.$on('$destroy', () => {
    if (abortController) abortController.abort();
    savedSearch.destroy();
    subscriptions.unsubscribe();
    filterStateManager.destroy();
    if (filterListener) filterListener();
    if (tabListener) tabListener();
    implicitFilters = null;
  });

  const $appStatus = ($scope.appStatus = this.appStatus = {
    dirty: !savedSearch.id,
  });

  // WAZUH MODIFIED
  $scope.topNavMenu = [];

  // the actual courier.SearchSource
  $scope.searchSource = savedSearch.searchSource;
  $scope.indexPattern = resolveIndexPatternLoading();

  $scope.searchSource
    .setField('index', $scope.indexPattern)
    .setField('highlightAll', true)
    .setField('version', true);

  // Even when searching rollups, we want to use the default strategy so that we get back a
  // document-like response.
  $scope.searchSource.setPreferredSearchStrategyId('default');

  // searchSource which applies time range
  const timeRangeSearchSource = savedSearch.searchSource.create();
  if (isDefaultTypeIndexPattern($scope.indexPattern)) {
    timeRangeSearchSource.setField('filter', () => {
      return timefilter.createFilter($scope.indexPattern);
    });
  }

  $scope.searchSource.setParent(timeRangeSearchSource);

  const pageTitleSuffix = savedSearch.id && savedSearch.title ? `: ${savedSearch.title}` : '';
  chrome.docTitle.change(`Wazuh${pageTitleSuffix}`);
  const discoverBreadcrumbsTitle = i18n.translate('kbn.discover.discoverBreadcrumbTitle', {
    defaultMessage: 'Wazuh',
  });

  if (savedSearch.id && savedSearch.title) {
    chrome.setBreadcrumbs([
      {
        text: discoverBreadcrumbsTitle,
        href: '#/discover',
      },
      { text: savedSearch.title },
    ]);
  } else {
    chrome.setBreadcrumbs([
      {
        text: discoverBreadcrumbsTitle,
      },
    ]);
  }

  let stateMonitor;

  const $state = ($scope.state = new AppState(getStateDefaults()));

  $scope.filters = filterManager.filters;
  $scope.screenTitle = savedSearch.title;

  $scope.onFiltersUpdated = filters => {
    // The filters will automatically be set when the filterManager emits an update event (see below)
    filterManager.setFilters(filters);
  };

  const getFieldCounts = async () => {
    // the field counts aren't set until we have the data back,
    // so we wait for the fetch to be done before proceeding
    if ($scope.fetchStatus === fetchStatuses.COMPLETE) {
      return $scope.fieldCounts;
    }

    return await new Promise(resolve => {
      const unwatch = $scope.$watch('fetchStatus', newValue => {
        if (newValue === fetchStatuses.COMPLETE) {
          unwatch();
          resolve($scope.fieldCounts);
        }
      });
    });
  };

  const getSharingDataFields = async () => {
    const selectedFields = $state.columns;
    if (selectedFields.length === 1 && selectedFields[0] === '_source') {
      const fieldCounts = await getFieldCounts();
      return {
        searchFields: null,
        selectFields: _.keys(fieldCounts).sort(),
      };
    }

    const timeFieldName = $scope.indexPattern.timeFieldName;
    const hideTimeColumn = config.get('doc_table:hideTimeColumn');
    const fields =
      timeFieldName && !hideTimeColumn ? [timeFieldName, ...selectedFields] : selectedFields;
    return {
      searchFields: fields,
      selectFields: fields,
    };
  };

  this.getSharingData = async () => {
    const searchSource = $scope.searchSource.createCopy();

    const { searchFields, selectFields } = await getSharingDataFields();
    searchSource.setField('fields', searchFields);
    searchSource.setField('sort', getSortForSearchSource($state.sort, $scope.indexPattern));
    searchSource.setField('highlight', null);
    searchSource.setField('highlightAll', null);
    searchSource.setField('aggs', null);
    searchSource.setField('size', null);

    const body = await searchSource.getSearchRequestBody();
    return {
      searchRequest: {
        index: searchSource.getField('index').title,
        body,
      },
      fields: selectFields,
      metaFields: $scope.indexPattern.metaFields,
      conflictedTypesFields: $scope.indexPattern.fields
        .filter(f => f.type === 'conflict')
        .map(f => f.name),
      indexPatternId: searchSource.getField('index').id,
    };
  };

  $scope.uiState = $state.makeStateful('uiState');

  function getStateDefaults() {
    return {
      query: ($scope.savedQuery && $scope.savedQuery.attributes.query) ||
        $scope.searchSource.getField('query') || {
          query: '',
          language:
            localStorage.get('kibana.userQueryLanguage') || config.get('search:queryLanguage'),
        },
      sort: getSort.array(
        savedSearch.sort,
        $scope.indexPattern,
        config.get('discover:sort:defaultOrder')
      ),
      columns:
        savedSearch.columns.length > 0 ? savedSearch.columns : config.get('defaultColumns').slice(),
      index: $scope.indexPattern.id,
      interval: 'auto',
      filters:
        ($scope.savedQuery && $scope.savedQuery.attributes.filters) ||
        _.cloneDeep($scope.searchSource.getOwnField('filter')),
    };
  }

  $state.index = $scope.indexPattern.id;
  $state.sort = getSort.array($state.sort, $scope.indexPattern);

  $scope.getBucketIntervalToolTipText = () => {
    return i18n.translate('kbn.discover.bucketIntervalTooltip', {
      defaultMessage:
        'This interval creates {bucketsDescription} to show in the selected time range, so it has been scaled to {bucketIntervalDescription}',
      values: {
        bucketsDescription:
          $scope.bucketInterval.scale > 1
            ? i18n.translate('kbn.discover.bucketIntervalTooltip.tooLargeBucketsText', {
              defaultMessage: 'buckets that are too large',
            })
            : i18n.translate('kbn.discover.bucketIntervalTooltip.tooManyBucketsText', {
              defaultMessage: 'too many buckets',
            }),
        bucketIntervalDescription: $scope.bucketInterval.description,
      },
    });
  };

  $scope.$watchCollection('state.columns', function () {
    $state.save();
  });

  $scope.opts = {
    // number of records to fetch, then paginate through
    sampleSize: config.get('discover:sampleSize'),
    timefield: isDefaultTypeIndexPattern($scope.indexPattern) && $scope.indexPattern.timeFieldName,
    savedSearch: savedSearch,
    indexPatternList: $route.current.locals.ip.list,
  };

  const shouldSearchOnPageLoad = () => {
    // If a saved query is referenced in the app state, omit the initial load because the saved query will
    // be fetched separately and trigger a reload
    if ($scope.state.savedQuery) {
      return false;
    }
    // A saved search is created on every page load, so we check the ID to see if we're loading a
    // previously saved search or if it is just transient
    return (
      config.get('discover:searchOnPageLoad') ||
      savedSearch.id !== undefined ||
      _.get($scope, 'refreshInterval.pause') === false
    );
  };

  const init = _.once(function () {
    stateMonitor = stateMonitorFactory.create($state, getStateDefaults());
    stateMonitor.onChange(status => {
      $appStatus.dirty = status.dirty || !savedSearch.id;
    });
    $scope.$on('$destroy', () => stateMonitor.destroy());

    $scope.updateDataSource().then(function () {
      subscriptions.add(
        subscribeWithScope($scope, timefilter.getAutoRefreshFetch$(), {
          next: () => {
            $scope.fetch;
          }
        })
      );
      subscriptions.add(
        subscribeWithScope($scope, timefilter.getRefreshIntervalUpdate$(), {
          next: $scope.updateRefreshInterval,
        })
      );
      subscriptions.add(
        subscribeWithScope($scope, timefilter.getTimeUpdate$(), {
          next: $scope.updateTime,
        })
      );
      subscriptions.add(
        subscribeWithScope($scope, timefilter.getFetch$(), {
          next: () => {
            $scope.fetch;
          }
        })
      );

      $scope.$watchCollection('state.sort', function (sort) {
        if (!sort) return;

        // get the current sort from searchSource as array of arrays
        const currentSort = getSort.array(
          $scope.searchSource.getField('sort'),
          $scope.indexPattern
        );

        // if the searchSource doesn't know, tell it so
        if (!angular.equals(sort, currentSort)) $scope.fetch();
      });

      // update data source when filters update
      subscriptions.add(
        subscribeWithScope($scope, filterManager.getUpdates$(), {
          next: () => {
            $scope.filters = filterManager.filters;
            // Wazuh. Hides the alerts of the '000' agent if it is in the configuration
            const buildFilters = () => {
              const { hideManagerAlerts } = wazuhConfig.getConfig();
              if (hideManagerAlerts) {
                return [{
                  "meta": {
                    "alias": null,
                    "disabled": false,
                    "key": "agent.id",
                    "negate": true,
                    "params": { "query": "000" },
                    "type": "phrase",
                    "index": "wazuh-alerts-3.x-*"
                  },
                  "query": { "match_phrase": { "agent.id": "000" } },
                  "$state": { "store": "appState" }
                }];
              }
              return [];
            }

            $scope.updateDataSource().then(function () {
              ///////////////////////////////  WAZUH   ///////////////////////////////////
              if (!filtersAreReady()) return;
              discoverPendingUpdates.removeAll();
              discoverPendingUpdates.addItem(
                $state.query,
                [
                  ...$scope.filters,
                  ...buildFilters() // Hide '000' agent
                ]
              );
              if ($location.search().tab != 'configuration') {
                loadedVisualizations.removeAll();
              }
              $scope.fetch();
              ////////////////////////////////////////////////////////////////////////////
              $state.save();
              // Forcing a digest cycle
              $rootScope.$applyAsync();
            });
          },
        })
      );

      // fetch data when filters fire fetch event
      subscriptions.add(
        subscribeWithScope($scope, filterManager.getFetches$(), {
          next: $scope.fetch,
        })
      );

      // update data source when hitting forward/back and the query changes
      $scope.$listen($state, 'fetch_with_changes', function (diff) {
        if (diff.indexOf('query') >= 0) $scope.fetch();
      });

      $scope.$watch('opts.timefield', function (timefield) {
        $scope.enableTimeRangeSelector = !!timefield;
      });

      $scope.$watch('state.interval', function (newInterval, oldInterval) {
        if (newInterval !== oldInterval) {
          $scope.fetch();
        }
      });

      $scope.$watch('vis.aggs', function () {
        // no timefield, no vis, nothing to update
        if (!$scope.opts.timefield) return;

        const buckets = $scope.vis.getAggConfig().bySchemaGroup('buckets');

        if (buckets && buckets.length === 1) {
          $scope.bucketInterval = buckets[0].buckets.getInterval();
        }
      });

      $scope.$watch('state.query', (newQuery, oldQuery) => {
        if (!_.isEqual(newQuery, oldQuery)) {
          const query = migrateLegacyQuery(newQuery);
          if (!_.isEqual(query, newQuery)) {
            $scope.updateQueryAndFetch({ query });
          }
        }
      });

      $scope.$watchMulti(
        ['rows', 'fetchStatus'],
        (function updateResultState() {
          let prev = {};
          const status = {
            UNINITIALIZED: 'uninitialized',
            LOADING: 'loading', // initial data load
            READY: 'ready', // results came back
            NO_RESULTS: 'none', // no results came back
          };

          function pick(rows, oldRows, fetchStatus) {
            // initial state, pretend we're already loading if we're about to execute a search so
            // that the uninitilized message doesn't flash on screen
            if (rows == null && oldRows == null && shouldSearchOnPageLoad()) {
              return status.LOADING;
            }

            if (fetchStatus === fetchStatuses.UNINITIALIZED) {
              return status.UNINITIALIZED;
            }

            const rowsEmpty = _.isEmpty(rows);
            if (rowsEmpty && fetchStatus === fetchStatuses.LOADING) return status.LOADING;
            else if (!rowsEmpty) return status.READY;
            else {
              // Wazuh. If there are hits but no rows, the it's also a READY status
              return $scope.hits ? status.READY : status.NO_RESULTS;
            }
          }

          return function () {
            const current = {
              rows: $scope.rows,
              fetchStatus: $scope.fetchStatus,
            };

            $scope.resultState = pick(
              current.rows,
              prev.rows,
              current.fetchStatus,
              prev.fetchStatus
            );
            // Copying it to the rootScope to access it from the Wazuh App //
            $rootScope.resultState = $scope.resultState;
            /////////////////////////////////////////////////////////////////

            prev = current;
          };
        })()
      );

      if ($scope.opts.timefield) {
        setupVisualization();
        $scope.updateTime();
      }

      init.complete = true;
      $state.replace();

      if (shouldSearchOnPageLoad()) {
        $scope.fetch();
      }
    });
  });

  ////////////////////////////////////////////////////////////////////////
  // Wazuh - Removed saveDataSource, it's not needed by our integration //
  ////////////////////////////////////////////////////////////////////////

  $scope.opts.fetch = $scope.fetch = function () {
    // Wazuh filters are not ready yet
    if (!filtersAreReady()) return;
    // ignore requests to fetch before the app inits
    if (!init.complete) return;

    $scope.fetchError = undefined;

    $scope.updateTime();

    // Abort any in-progress requests before fetching again
    if (abortController) abortController.abort();
    abortController = new AbortController();

    $scope
      .updateDataSource()
      .then(setupVisualization)
      .then(function () {
        $state.save();
        $scope.fetchStatus = fetchStatuses.LOADING;
        logInspectorRequest();
        return $scope.searchSource.fetch({
          abortSignal: abortController.signal,
        });
      })
      .then(onResults)
      .catch(error => {
        // If the request was aborted then no need to surface this error in the UI
        if (error instanceof Error && error.name === 'AbortError') return;

        const fetchError = getPainlessError(error);

        if (fetchError) {
          $scope.fetchError = fetchError;
        } else {
          toastNotifications.addError(error, {
            title: i18n.translate('kbn.discover.errorLoadingData', {
              defaultMessage: 'Error loading data',
            }),
            toastMessage: error.shortMessage,
          });
        }
      });
  };

  $scope.updateQueryAndFetch = function ({ query, dateRange }) {
    // Wazuh filters are not ready yet
    if (!filtersAreReady()) return;

    timefilter.setTime(dateRange);
    if (query && typeof query === 'object') {
      /// Wazuh 7.6.1
      if ($scope.tabView !== 'discover')
        query.update_Id = new Date().getTime().toString();
      ///
      $state.query = query;
    }
    // Update query from search bar
    discoverPendingUpdates.removeAll();
    discoverPendingUpdates.addItem($state.query, filterManager.filters);
    $scope.fetch();
  };

  function onResults(resp) {
    logInspectorResponse(resp);

    if ($scope.opts.timefield) {
      const tabifiedData = tabifyAggResponse($scope.vis.aggs, resp);
      $scope.searchSource.rawResponse = resp;
      Promise.resolve(
        buildVislibDimensions($scope.vis, {
          timeRange: $scope.timeRange,
          searchSource: $scope.searchSource,
        })
      )
        .then(resp => responseHandler(tabifiedData, resp))
        .then(resp => {
          $scope.histogramData = resp;
        });
    }

    $scope.hits = resp.hits.total;
    $scope.rows = resp.hits.hits;
    // Ensure we have "hits" and "rows" available as soon as possible
    $scope.$applyAsync();

    // if we haven't counted yet, reset the counts
    const counts = ($scope.fieldCounts = $scope.fieldCounts || {});

    $scope.rows.forEach(hit => {
      const fields = Object.keys($scope.indexPattern.flattenHit(hit));
      fields.forEach(fieldName => {
        counts[fieldName] = (counts[fieldName] || 0) + 1;
      });
    });

    $scope.fetchStatus = fetchStatuses.COMPLETE;
  }

  let inspectorRequest;

  function logInspectorRequest() {
    inspectorAdapters.requests.reset();
    const title = i18n.translate('kbn.discover.inspectorRequestDataTitle', {
      defaultMessage: 'data',
    });
    const description = i18n.translate('kbn.discover.inspectorRequestDescription', {
      defaultMessage: 'This request queries Elasticsearch to fetch the data for the search.',
    });
    inspectorRequest = inspectorAdapters.requests.start(title, { description });
    inspectorRequest.stats(getRequestInspectorStats($scope.searchSource));
    $scope.searchSource.getSearchRequestBody().then(body => {
      inspectorRequest.json(body);
    });
  }

  function logInspectorResponse(resp) {
    inspectorRequest.stats(getResponseInspectorStats($scope.searchSource, resp)).ok({ json: resp });
  }

  $scope.updateTime = function () {
    ///////////////////////////////  WAZUH   ///////////////////////////////////
    if ($location.search().tab != 'configuration') {
      loadedVisualizations.removeAll();
      $rootScope.$broadcast('updateVis');
      store.dispatch(updateVis({ update: true }));
      // Forcing a digest cycle
      $rootScope.$applyAsync();
    }
    ////////////////////////////////////////////////////////////////////////////
    $scope.timeRange = {
      from: dateMath.parse(timefilter.getTime().from),
      to: dateMath.parse(timefilter.getTime().to, { roundUp: true }),
    };
    $scope.time = timefilter.getTime();
  };

  $scope.toMoment = function (datetime) {
    return moment(datetime).format(config.get('dateFormat'));
  };

  $scope.updateRefreshInterval = function () {
    const newInterval = timefilter.getRefreshInterval();
    const shouldFetch =
      _.get($scope, 'refreshInterval.pause') === true && newInterval.pause === false;

    $scope.refreshInterval = newInterval;

    if (shouldFetch) {
      $scope.fetch();
    }
  };

  $scope.onRefreshChange = function ({ isPaused, refreshInterval }) {
    timefilter.setRefreshInterval({
      pause: isPaused,
      value: refreshInterval ? refreshInterval : $scope.refreshInterval.value,
    });
  };

  $scope.resetQuery = function () {
    kbnUrl.change('/discover/{{id}}', { id: $route.current.params.id });
  };

  $scope.newQuery = function () {
    kbnUrl.change('/discover');
  };

  // Wazuh.
  // defaultSearchSource -> Use it for Discover tabs and the Discover visualization.
  // noHitsSearchSource  -> It doesn't fetch the "hits" array and it doesn't fetch the "_source",
  //                        use it for panels.
  let defaultSearchSource = null,
    noHitsSearchSource = null;

  $scope.updateDataSource = Promise.method(function updateDataSource() {
    const { indexPattern, searchSource } = $scope;
    // Wazuh
    const isPanels = $scope.tabView === 'panels';
    const isClusterMonitoring = $scope.tabView === 'cluster-monitoring';

    // Wazuh. Should we fetch "_source" and "hits" ?
    const noHits = isPanels || isClusterMonitoring;

    // Wazuh. The very first time, the copies are null, just create them
    if (!defaultSearchSource || !noHitsSearchSource) {
      defaultSearchSource = $scope.searchSource.createCopy();
      noHitsSearchSource = $scope.searchSource.createCopy();
      noHitsSearchSource.setField('source', false);
    }

    // Wazuh. Select the proper searchSource depending on the view
    $scope.searchSource = noHits ? noHitsSearchSource : defaultSearchSource;

    // Wazuh. Set the size to 0 depending on the selected searchSource
    const size = noHits ? 0 : $scope.opts.sampleSize;
    searchSource
      .setField('size', size) // Wazuh. Use custom size
      .setField('sort', getSortForSearchSource($state.sort, indexPattern))
      .setField('query', !$state.query ? null : $state.query)
      .setField('filter', filterManager.filters);

    //Wazuh update the visualizations
    $rootScope.$broadcast('updateVis');
    store.dispatch(updateVis({ update: true }));
  });

  $scope.setSortOrder = function setSortOrder(sortPair) {
    $scope.state.sort = sortPair;
  };

  // TODO: On array fields, negating does not negate the combination, rather all terms
  $scope.filterQuery = function (field, values, operation) {
    // Commented due to https://github.com/elastic/kibana/issues/22426
    //$scope.indexPattern.popularizeField(field, 1);
    const newFilters = generateFilters(
      filterManager,
      field,
      values,
      operation,
      $scope.indexPattern.id
    );
    return filterManager.addFilters(newFilters);
  };

  $scope.addColumn = function addColumn(columnName) {
    // Commented due to https://github.com/elastic/kibana/issues/22426
    //$scope.indexPattern.popularizeField(columnName, 1);
    columnActions.addColumn($scope.state.columns, columnName);
  };

  $scope.removeColumn = function removeColumn(columnName) {
    // Commented due to https://github.com/elastic/kibana/issues/22426
    //$scope.indexPattern.popularizeField(columnName, 1);
    columnActions.removeColumn($scope.state.columns, columnName);
  };

  $scope.moveColumn = function moveColumn(columnName, newIndex) {
    columnActions.moveColumn($scope.state.columns, columnName, newIndex);
  };

  $scope.scrollToTop = function () {
    $window.scrollTo(0, 0);
  };

  $scope.scrollToBottom = function () {
    // delay scrolling to after the rows have been rendered
    $timeout(() => {
      $element.find('#discoverBottomMarker').focus();
    }, 0);
  };

  $scope.showAllRows = function () {
    $scope.minimumVisibleRows = $scope.hits;
  };

  $scope.onQuerySaved = savedQuery => {
    $scope.savedQuery = savedQuery;
  };

  $scope.onSavedQueryUpdated = savedQuery => {
    $scope.savedQuery = { ...savedQuery };
  };

  $scope.onClearSavedQuery = () => {
    delete $scope.savedQuery;
    delete $state.savedQuery;
    $state.query = {
      query: '',
      language: localStorage.get('kibana.userQueryLanguage') || config.get('search:queryLanguage'),
    };
    filterManager.removeAll();
    $state.save();
    $scope.fetch();
  };

  const updateStateFromSavedQuery = savedQuery => {
    $state.query = savedQuery.attributes.query;
    $state.save();
    filterManager.setFilters(savedQuery.attributes.filters || []);

    if (savedQuery.attributes.timefilter) {
      timefilter.setTime({
        from: savedQuery.attributes.timefilter.from,
        to: savedQuery.attributes.timefilter.to,
      });
      if (savedQuery.attributes.timefilter.refreshInterval) {
        timefilter.setRefreshInterval(savedQuery.attributes.timefilter.refreshInterval);
      }
    }

    $scope.fetch();
  };

  $scope.$watch('savedQuery', newSavedQuery => {
    if (!newSavedQuery) return;

    $state.savedQuery = newSavedQuery.id;
    $state.save();

    updateStateFromSavedQuery(newSavedQuery);
  });

  $scope.$watch('state.savedQuery', newSavedQueryId => {
    const { getSavedQuery } = data || {}.query || {}.savedQueries;
    if (!newSavedQueryId) {
      $scope.savedQuery = undefined;
      return;
    }
    if (getSavedQuery) {
      if (!$scope.savedQuery || newSavedQueryId !== $scope.savedQuery.id) {
        getSavedQuery(newSavedQueryId).then(savedQuery => {
          $scope.$evalAsync(() => {
            $scope.savedQuery = savedQuery;
            updateStateFromSavedQuery(savedQuery);
          });
        });
      }
    }
  });

  async function setupVisualization() {
    // Wazuh. Do not setup visualization if there isn't a copy for the default searchSource
    if (!defaultSearchSource) {
      return;
    }
    // If no timefield has been specified we don't create a histogram of messages
    if (!$scope.opts.timefield) return;

    const visStateAggs = [
      {
        type: 'count',
        schema: 'metric',
      },
      {
        type: 'date_histogram',
        schema: 'segment',
        params: {
          field: $scope.opts.timefield,
          interval: $state.interval,
          timeRange: timefilter.getTime(),
        },
      },
    ];

    if ($scope.vis) {
      const visState = $scope.vis.getEnabledState();
      visState.aggs = visStateAggs;

      $scope.vis.setState(visState);
      return;
    }

    const visSavedObject = {
      indexPattern: $scope.indexPattern.id,
      visState: {
        type: 'histogram',
        title: savedSearch.title,
        params: {
          addLegend: false,
          addTimeMarker: true,
        },
        aggs: visStateAggs,
      },
    };

    $scope.vis = new Vis(
      // Wazuh. Force to use the default searchSource copy
      defaultSearchSource.getField('index'),
      visSavedObject.visState);
    visSavedObject.vis = $scope.vis;

    defaultSearchSource.onRequestStart((searchSource, options) => {
      return $scope.vis.getAggConfig().onSearchRequestStart(searchSource, options);
    });

    // Wazuh. Force to use the default searchSource copy
    defaultSearchSource.setField('aggs', function () {
      //////////////////// WAZUH ////////////////////////////////
      const result = $scope.vis.getAggConfig().toDsl();
      if (((result[2] || {}).date_histogram || {}).interval === '0ms') {
        result[2].date_histogram.interval = '1d';
      }
      return result;
      ///////////////////////////////////////////////////////////
    });
  }

  function resolveIndexPatternLoading() {
    const {
      loaded: loadedIndexPattern,
      stateVal,
      stateValFound,
    } = $route.current.locals.ip;

    const ownIndexPattern = $scope.searchSource.getOwnField('index');

    if (ownIndexPattern && !stateVal) {
      return ownIndexPattern;
    }

    if (stateVal && !stateValFound) {
      const warningTitle = i18n.translate(
        'kbn.discover.valueIsNotConfiguredIndexPatternIDWarningTitle',
        {
          defaultMessage: '{stateVal} is not a configured index pattern ID',
          values: {
            stateVal: `"${stateVal}"`,
          },
        }
      );

      if (ownIndexPattern) {
        toastNotifications.addWarning({
          title: warningTitle,
          text: i18n.translate('kbn.discover.showingSavedIndexPatternWarningDescription', {
            defaultMessage:
              'Showing the saved index pattern: "{ownIndexPatternTitle}" ({ownIndexPatternId})',
            values: {
              ownIndexPatternTitle: ownIndexPattern.title,
              ownIndexPatternId: ownIndexPattern.id,
            },
          }),
        });
        return ownIndexPattern;
      }

      toastNotifications.addWarning({
        title: warningTitle,
        text: i18n.translate('kbn.discover.showingDefaultIndexPatternWarningDescription', {
          defaultMessage:
            'Showing the default index pattern: "{loadedIndexPatternTitle}" ({loadedIndexPatternId})',
          values: {
            loadedIndexPatternTitle: loadedIndexPattern.title,
            loadedIndexPatternId: loadedIndexPattern.id,
          },
        }),
      });
    }

    return loadedIndexPattern;
  }

  // Block the UI from loading if the user has loaded a rollup index pattern but it isn't
  // supported.
  $scope.isUnsupportedIndexPattern =
    !isDefaultTypeIndexPattern($route.current.locals.ip.loaded) &&
    !hasSearchStategyForIndexPattern($route.current.locals.ip.loaded);

  if ($scope.isUnsupportedIndexPattern) {
    $scope.unsupportedIndexPatternType = $route.current.locals.ip.loaded.type;
    return;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////// WAZUH //////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const hideCloseImplicitsFilters = () => {
    const closeButtons = $(`.globalFilterItem .euiBadge__iconButton`);
    const optionsButtons = $(`.globalFilterItem .euiBadge__childButton`);
    for (let i = 0; i < closeButtons.length; i++) {
      $(closeButtons[i]).addClass('hide-close-button');
      $(optionsButtons[i]).off("click");
    };
    if (!implicitFilters) return;
    const filters = $(`.globalFilterItem .euiBadge__childButton`);
    for (let i = 0; i < filters.length; i++) {
      let found = false;
      (implicitFilters || []).forEach(x => {
        const objKey = x.query ? Object.keys(x.query.match)[0] : x.meta.key;
        const key = `filter-key-${objKey}`;
        const value = x.query ? `filter-value-${x.query.match[objKey].query}` : `filter-value-${x.meta.value}`;
        const data = filters[i].attributes[3];
        if (data.value.includes(key) && data.value.includes(value)) {
          found = true;
        }
      });
      if (!found) {
        const closeButton = $(`.globalFilterItem .euiBadge__iconButton`)[i];
        $(closeButton).removeClass('hide-close-button');
      } else {
        const optionsButton = $(`.globalFilterItem .euiBadge__childButton`)[i];
        $(optionsButton).on("click", (ev) => { ev.stopPropagation(); });
      }
    }
    $scope.$applyAsync();
  }

  const loadFilters = async (wzCurrentFilters, tab) => {
    const appState = getAppState();
    if (!appState || !globalState) {
      $timeout(100).then(() => {
        return loadFilters(wzCurrentFilters);
      });
    } else {
      implicitFilters = [];
      wzCurrentFilters.forEach(x => implicitFilters.push({ ...x }));
      const globalFilters = globalState.filters;
      if (tab && $scope.tab !== tab) {
        filterManager.removeAll();
      }
      
      filterManager.addFilters([...wzCurrentFilters, ...globalFilters || []]);
      $scope.filters = filterManager.filters;
    }
  };

  const filterListener = $rootScope.$on('wzEventFilters', (evt, parameters) => {
    loadFilters(parameters.filters, parameters.tab);
  });


  $scope.tabView = $location.search().tabView || 'panels';
  const tabListener = $rootScope.$on('changeTabView', async (evt, parameters) => {
    $scope.resultState = 'loading';
    hideCloseImplicitsFilters();
    $scope.$applyAsync();
    $scope.tabView = parameters.tabView || 'panels';
    $scope.tab = parameters.tab;
    delete (($state || {}).query || {}).update_Id;
    evt.stopPropagation();
    if ($scope.tabView === 'discover') {
      $scope.rows = false;
      $scope.fetch();
    }
    $scope.updateQueryAndFetch({
      query: $state.query
    });
    $scope.$applyAsync();
  });

  /**
 * Wazuh - aux function for checking filters status
 */
  const filtersAreReady = () => {
    const currentUrlPath = $location.path();
    if (currentUrlPath) {
      let filters = filterManager.filters;
      filters = Array.isArray(filters)
        ? filters.filter(
          item => ['appState', 'globalState'].includes(((item || {}).$state || {}).store || '')
        )
        : [];
      if (!filters || !filters.length) return false;
    }
    return true;
  };
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  init();
}