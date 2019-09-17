/*
 * Author: Elasticsearch B.V.
 * Updated by Wazuh, Inc.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';
import discoverTemplate from '../templates/kibana-template/kibana-discover-template.html';

uiModules.get('app/wazuh', ['kibana/courier']).directive('kbnDis', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      template: discoverTemplate
    };
  }
]);

// Added dependencies (from Kibana module)
import 'plugins/kibana/discover/doc_table/pager';
import 'ui/render_directive';

// Added from its index.js
import 'plugins/kibana/discover/saved_searches/saved_searches';
import 'plugins/kibana/discover/directives';
import 'ui/collapsible_sidebar';
import 'plugins/kibana/discover/components/field_chooser/field_chooser';
import 'plugins/kibana/discover/controllers/discover';

// Research added (further checks needed)

import 'ui/style_compile/style_compile';
import 'ui/registry/doc_views';
import 'plugins/kbn_doc_views/kbn_doc_views';
import 'plugins/kibana/discover/doc_table/pager_control';
import _ from 'lodash';
import { i18n } from '@kbn/i18n';
import React from 'react';
import angular from 'angular';
import moment from 'moment';
import chrome from 'ui/chrome';
import dateMath from '@elastic/datemath';

// doc table
import 'plugins/kibana/discover/doc_table';
import { getSort } from 'plugins/kibana/discover/doc_table/lib/get_sort';
import * as columnActions from 'plugins/kibana/discover/doc_table/actions/columns';
import * as filterActions from 'plugins/kibana/discover/doc_table/actions/filter';

import 'ui/listen';
import 'ui/visualize';
import './debounce';
import 'ui/fixed_scroll';
import 'ui/index_patterns';
import 'ui/state_management/app_state';
import { timefilter } from 'ui/timefilter';
import {
  hasSearchStategyForIndexPattern,
  isDefaultTypeIndexPattern
} from 'ui/courier';
import { toastNotifications } from 'ui/notify';
import { VisProvider } from 'ui/vis';
import { FilterBarQueryFilterProvider } from './search-bar/query-filter';
import { vislibSeriesResponseHandlerProvider } from 'ui/vis/response_handlers/vislib';
import { docTitle } from 'ui/doc_title';
import { intervalOptions } from 'ui/agg_types/buckets/_interval_options';
import { stateMonitorFactory } from 'ui/state_management/state_monitor_factory';
import uiRoutes from 'ui/routes';

import { StateProvider } from 'ui/state_management/state';
import { migrateLegacyQuery } from 'ui/utils/migrate_legacy_query';
import { subscribeWithScope } from 'ui/utils/subscribe_with_scope';
import { getFilterGenerator } from './search-bar/filter-generator';
import { SavedObjectsClientProvider } from 'ui/saved_objects';
import { VisualizeLoaderProvider } from 'ui/visualize/loader/visualize_loader';
import { recentlyAccessed } from 'ui/persisted_log';
import { getDocLink } from 'ui/documentation_links';
import 'plugins/kibana/discover/components/fetch_error';
import { getPainlessError } from './get_painless_error';
import {
  showShareContextMenu,
  ShareContextMenuExtensionsRegistryProvider
} from 'ui/share';
import { getUnhashableStatesProvider } from 'ui/state_management/state_hashing';
import { Inspector } from 'ui/inspector';
import { RequestAdapter } from 'ui/inspector/adapters';
import {
  getRequestInspectorStats,
  getResponseInspectorStats
} from 'ui/courier/utils/courier_inspector_utils';
const { showOpenSearchPanel } = data.search.ui;
import { tabifyAggResponse } from 'ui/agg_response/tabify';
import { showSaveModal } from 'ui/saved_objects/show_saved_object_save_modal';
import { SavedObjectSaveModal } from 'ui/saved_objects/components/saved_object_save_modal';
const { getRootBreadcrumbs, getSavedSearchBreadcrumbs } = data.search.ui;
import { buildVislibDimensions } from 'ui/visualize/loader/pipeline_helpers/build_pipeline';
import 'ui/capabilities/route_setup';
import { defaultSearchStrategy } from 'ui/courier/search_strategy/default_search_strategy';
import { data } from 'plugins/data/setup';
data.search.loadLegacyDirectives();

const fetchStatuses = {
  UNINITIALIZED: 'uninitialized',
  LOADING: 'loading',
  COMPLETE: 'complete'
};

const app = uiModules.get('apps/discover', [
  'kibana/notify',
  'kibana/courier',
  'kibana/url',
  'kibana/index_patterns',
  'app/wazuh'
]);

app.directive('discoverAppW', function() {
  return {
    restrict: 'E',
    controllerAs: 'discoverApp',
    controller: discoverController
  };
});

function discoverController(
  $element,
  $route,
  $scope,
  $timeout,
  $window,
  AppState,
  Private,
  Promise,
  config,
  courier,
  kbnUrl,
  localStorage,
  uiCapabilities,
  // Wazuh requirements from here
  $rootScope,
  $location,
  getAppState,
  globalState,
  loadedVisualizations,
  discoverPendingUpdates,
  errorHandler
) {
  // Wazuh. Copy for the pinned filters
  let pinnedFilters = [];
  let lastTab = 'unknown';
  // Wazuh. Copy for the discover filters
  let discoverFilters = [];
  let backFromDiscover = false;

  const visualizeLoader = Private(VisualizeLoaderProvider);
  let visualizeHandler;
  const Vis = Private(VisProvider);
  const responseHandler = vislibSeriesResponseHandlerProvider().handler;
  const getUnhashableStates = Private(getUnhashableStatesProvider);
  const shareContextMenuExtensions = Private(
    ShareContextMenuExtensionsRegistryProvider
  );

  const queryFilter = Private(FilterBarQueryFilterProvider);
  const filterGen = getFilterGenerator(queryFilter);

  const inspectorAdapters = {
    requests: new RequestAdapter()
  };

  let filterUpdateSubscription;
  let filterFetchSubscription;

  timefilter.disableTimeRangeSelector();
  timefilter.disableAutoRefreshSelector();

  $scope.getDocLink = getDocLink;
  $scope.intervalOptions = intervalOptions;
  $scope.showInterval = false;
  $scope.minimumVisibleRows = 50;
  $scope.fetchStatus = fetchStatuses.UNINITIALIZED;
  $scope.refreshInterval = timefilter.getRefreshInterval();

  $scope.intervalEnabled = function(interval) {
    return interval.val !== 'custom';
  };

  // the saved savedSearch
  const savedSearch = $route.current.locals.savedSearch;
  $scope.$on('$destroy', () => {
    savedSearch.destroy();
    if (filterFetchSubscription) filterFetchSubscription.unsubscribe();
    if (filterUpdateSubscription) filterUpdateSubscription.unsubscribe();
  });

  const $appStatus = ($scope.appStatus = this.appStatus = {
    dirty: !savedSearch.id
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

  const pageTitleSuffix =
    savedSearch.id && savedSearch.title ? `: ${savedSearch.title}` : '';
  docTitle.change(`Wazuh${pageTitleSuffix}`);
  const discoverBreadcrumbsTitle = i18n.translate(
    'kbn.discover.discoverBreadcrumbTitle',
    {
      defaultMessage: 'Wazuh'
    }
  );

  if (savedSearch.id && savedSearch.title) {
    chrome.breadcrumbs.set([
      {
        text: discoverBreadcrumbsTitle,
        href: '#/discover'
      },
      { text: savedSearch.title }
    ]);
  } else {
    chrome.breadcrumbs.set([
      {
        text: discoverBreadcrumbsTitle
      }
    ]);
  }

  let stateMonitor;

  const $state = ($scope.state = new AppState(getStateDefaults()));

  $scope.filters = queryFilter.getFilters();
  $scope.screenTitle = savedSearch.title;

  const isRemovable = filter =>
    typeof filter.meta.removable !== 'undefined' && !filter.meta.removable;

  $scope.onFiltersUpdated = filters => {
    ///////////////////////////////  WAZUH   ///////////////////////////////////
    // Store non removable filters
    const nonRemovableFilters = filters
      .filter(isRemovable)
      .map(item => item.meta.key);

    // Compose final filters array not including filters that also exist as non removable filter
    const finalFilters = filters.filter(item => {
      let key;
      if (typeof item.exists !== 'undefined') {
        key = item.exists.field;
      } else {
        const hasKey = item.meta.key;
        const hasMeta = Object.keys((item.query || {}).match || {})[0];
        const hasRange = Object.keys(item.range || {})[0];
        key = hasKey || hasMeta || hasRange;
      }
      const isIncluded = nonRemovableFilters.includes(key);
      const isNonRemovable = isRemovable(item);
      const shouldBeAdded = (isIncluded && isNonRemovable) || !isIncluded;
      if (!shouldBeAdded) {
        console.log(`Filter for ${key} already added`);
      }
      return shouldBeAdded;
    });
    ///////////////////////////////  END-WAZUH   ////////////////////////////////
    // The filters will automatically be set when the queryFilter emits an update event (see below)
    queryFilter.setFilters(finalFilters);
    // Update our internal copy for the pinned filters
    pinnedFilters = getPinnedFilters(finalFilters);
  };

  $scope.applyFilters = filters => {
    queryFilter.addFiltersAndChangeTimeFilter(filters);
    $scope.state.$newFilters = [];
  };

  $scope.$watch('state.$newFilters', (filters = []) => {
    if (filters.length === 1) {
      $scope.applyFilters(filters);
    }
  });

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
        selectFields: _.keys(fieldCounts).sort()
      };
    }

    const timeFieldName = $scope.indexPattern.timeFieldName;
    const hideTimeColumn = config.get('doc_table:hideTimeColumn');
    const fields =
      timeFieldName && !hideTimeColumn
        ? [timeFieldName, ...selectedFields]
        : selectedFields;
    return {
      searchFields: fields,
      selectFields: fields
    };
  };

  this.getSharingData = async () => {
    const searchSource = $scope.searchSource.createCopy();

    const { searchFields, selectFields } = await getSharingDataFields();
    searchSource.setField('fields', searchFields);
    searchSource.setField('sort', getSort($state.sort, $scope.indexPattern));
    searchSource.setField('highlight', null);
    searchSource.setField('highlightAll', null);
    searchSource.setField('aggs', null);
    searchSource.setField('size', null);

    const body = await searchSource.getSearchRequestBody();
    return {
      searchRequest: {
        index: searchSource.getField('index').title,
        body
      },
      fields: selectFields,
      metaFields: $scope.indexPattern.metaFields,
      conflictedTypesFields: $scope.indexPattern.fields
        .filter(f => f.type === 'conflict')
        .map(f => f.name),
      indexPatternId: searchSource.getField('index').id
    };
  };

  $scope.uiState = $state.makeStateful('uiState');

  function getStateDefaults() {
    return {
      query: $scope.searchSource.getField('query') || {
        query: '',
        language:
          localStorage.get('kibana.userQueryLanguage') ||
          config.get('search:queryLanguage')
      },
      sort: getSort.array(
        savedSearch.sort,
        $scope.indexPattern,
        config.get('discover:sort:defaultOrder')
      ),
      columns:
        savedSearch.columns.length > 0
          ? savedSearch.columns
          : config.get('defaultColumns').slice(),
      index: $scope.indexPattern.id,
      interval: 'auto',
      filters: _.cloneDeep($scope.searchSource.getOwnField('filter'))
    };
  }

  $state.index = $scope.indexPattern.id;
  $state.sort = getSort.array($state.sort, $scope.indexPattern);

  $scope.getBucketIntervalToolTipText = () => {
    return i18n.translate('kbn.discover.bucketIntervalTooltip', {
      // eslint-disable-next-line max-len
      defaultMessage:
        'This interval creates {bucketsDescription} to show in the selected time range, so it has been scaled to {bucketIntervalDescription}',
      values: {
        bucketsDescription:
          $scope.bucketInterval.scale > 1
            ? i18n.translate(
                'kbn.discover.bucketIntervalTooltip.tooLargeBucketsText',
                {
                  defaultMessage: 'buckets that are too large'
                }
              )
            : i18n.translate(
                'kbn.discover.bucketIntervalTooltip.tooManyBucketsText',
                {
                  defaultMessage: 'too many buckets'
                }
              ),
        bucketIntervalDescription: $scope.bucketInterval.description
      }
    });
  };

  $scope.$watchCollection('state.columns', function() {
    $state.save();
  });

  $scope.opts = {
    // number of records to fetch, then paginate through
    sampleSize: config.get('discover:sampleSize'),
    timefield:
      isDefaultTypeIndexPattern($scope.indexPattern) &&
      $scope.indexPattern.timeFieldName,
    savedSearch: savedSearch,
    indexPatternList: $route.current.locals.ip.list
  };

  const init = _.once(function() {
    stateMonitor = stateMonitorFactory.create($state, getStateDefaults());
    stateMonitor.onChange(status => {
      $appStatus.dirty = status.dirty || !savedSearch.id;
    });
    $scope.$on('$destroy', () => stateMonitor.destroy());

    $scope.updateDataSource().then(function() {
      $scope.$listen(timefilter, 'fetch', function() {
        $scope.fetch();
        // WAZUH
        $rootScope.$broadcast('updateVis');
      });
      $scope.$listen(timefilter, 'autoRefreshFetch', function() {
        $scope.fetch();
      });
      $scope.$listen(timefilter, 'refreshIntervalUpdate', () => {
        $scope.updateRefreshInterval();
      });
      $scope.$listen(timefilter, 'timeUpdate', () => {
        $scope.updateTime();
      });

      $scope.$watchCollection('state.sort', function(sort) {
        if (!sort) return;

        // get the current sort from {key: val} to ["key", "val"];
        const currentSort = Object.entries(
          $scope.searchSource.getField('sort')
        ).pop();

        // if the searchSource doesn't know, tell it so
        if (!angular.equals(sort, currentSort)) $scope.fetch();
      });

      // update data source when filters update
      filterUpdateSubscription = subscribeWithScope(
        $scope,
        queryFilter.getUpdates$(),
        {
          next: () => {
            $scope.filters = queryFilter.getFilters();
            $scope
              .updateDataSource()
              .then(function() {
                ///////////////////////////////  WAZUH   ///////////////////////////////////
                if (!filtersAreReady()) return;
                discoverPendingUpdates.removeAll();
                discoverPendingUpdates.addItem(
                  $state.query,
                  queryFilter.getFilters()
                );
                $rootScope.$broadcast('updateVis');
                if ($location.search().tab != 'configuration') {
                  loadedVisualizations.removeAll();
                  $rootScope.rendered = false;
                  $rootScope.loadingStatus = 'Fetching data...';
                  // Forcing a digest cycle
                  $rootScope.$applyAsync();
                }
                ////////////////////////////////////////////////////////////////////////////
                $state.save();
              })
              .catch(console.error); // eslint-disable-line
          }
        }
      );

      // fetch data when filters fire fetch event
      filterFetchSubscription = subscribeWithScope(
        $scope,
        queryFilter.getUpdates$(),
        {
          next: $scope.fetch
        }
      );

      // update data source when hitting forward/back and the query changes
      $scope.$listen($state, 'fetch_with_changes', function(diff) {
        if (diff.indexOf('query') >= 0) $scope.fetch();
      });

      $scope.$watch('opts.timefield', function(timefield) {
        $scope.enableTimeRangeSelector = !!timefield;
      });

      $scope.$watch('state.interval', function() {
        $scope.fetch();
      });

      $scope.$watch('vis.aggs', function() {
        // no timefield, no vis, nothing to update
        if (!$scope.opts.timefield) return;

        const buckets = $scope.vis.getAggConfig().bySchemaGroup.buckets;

        if (buckets && buckets.length === 1) {
          $scope.bucketInterval = buckets[0].buckets.getInterval();
        }
      });

      $scope.$watch('state.query', newQuery => {
        const query = migrateLegacyQuery(newQuery || '');
        $scope.updateQueryAndFetch({ query });
      });

      $scope.$watchMulti(
        ['rows', 'fetchStatus'],
        (function updateResultState() {
          let prev = {};
          const status = {
            LOADING: 'loading', // initial data load
            READY: 'ready', // results came back
            NO_RESULTS: 'none' // no results came back
          };

          function pick(rows, oldRows, fetchStatus) {
            // initial state, pretend we are loading
            if (rows == null && oldRows == null) return status.LOADING;

            const rowsEmpty = _.isEmpty(rows);
            const preparingForFetch =
              fetchStatus === fetchStatuses.UNINITIALIZED;
            if (preparingForFetch) return status.LOADING;
            else if (rowsEmpty && fetchStatus === fetchStatuses.LOADING)
              return status.LOADING;
            else if (!rowsEmpty) return status.READY;
            else {
              // Wazuh. If there are hits but no rows, the it's also a READY status
              return $scope.hits ? status.READY : status.NO_RESULTS;
            }
          }

          return function() {
            const current = {
              rows: $scope.rows,
              fetchStatus: $scope.fetchStatus
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
    });
  });

  ////////////////////////////////////////////////////////////////////////
  // Wazuh - Removed saveDataSource, it's not needed by our integration //
  ////////////////////////////////////////////////////////////////////////

  /**
   * Wazuh - aux function for checking filters status
   */
  const filtersAreReady = () => {
    const currentUrlPath = $location.path();
    if (currentUrlPath && !currentUrlPath.includes('wazuh-discover')) {
      let filters = queryFilter.getFilters();
      filters = Array.isArray(filters)
        ? filters.filter(
            item => (((item || {}).$state || {}).store || '') === 'appState'
          )
        : [];
      if (!filters || !filters.length) return false;
    }
    return true;
  };

  $scope.opts.fetch = $scope.fetch = function() {
    // Wazuh filters are not ready yet
    if (!filtersAreReady()) return;
    // ignore requests to fetch before the app inits
    if (!init.complete) return;

    $scope.fetchError = undefined;

    $scope.updateTime();

    // Abort any in-progress requests before fetching again
    $scope.searchSource.cancelQueued();

    $scope
      .updateDataSource()
      .then(setupVisualization)
      .then(function() {
        $state.save();
        $scope.fetchStatus = fetchStatuses.LOADING;
        logInspectorRequest();
        return $scope.searchSource.fetch();
      })
      .then(onResults)
      .catch(error => {
        const fetchError = getPainlessError(error);

        if (fetchError) {
          $scope.fetchError = fetchError;
        } else {
          toastNotifications.addError(error, {
            title: i18n.translate('kbn.discover.errorLoadingData', {
              defaultMessage: 'Error loading data'
            })
          });
        }
      });
  };

  $scope.updateQueryAndFetch = function({ query, dateRange }) {
    // Wazuh filters are not ready yet
    if (!filtersAreReady()) return;
    let inheritedFilters;
    // Preserve filters in discover
    if ((discoverFilters || []).length || (pinnedFilters || []).length) {
      inheritedFilters = [...(discoverFilters || []), ...(pinnedFilters || [])];
      discoverFilters = [];
      if (backFromDiscover) pinnedFilters = [];
    }

    // Update query from search bar
    discoverPendingUpdates.removeAll();
    discoverPendingUpdates.addItem($state.query, [
      ...(inheritedFilters || []),
      ...queryFilter.getFilters()
    ]);
    $rootScope.$broadcast('updateVis');
    inheritedFilters = false;
    timefilter.setTime(dateRange);
    if (query && typeof query === 'object') $state.query = query;
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
          searchSource: $scope.searchSource
        })
      )
        .then(resp => responseHandler(tabifiedData, resp))
        .then(resp => {
          if (visualizeHandler) {
            visualizeHandler.render({
              as: 'visualization',
              value: {
                visType: $scope.vis.type.name,
                visData: resp,
                visConfig: $scope.vis.params,
                params: {}
              }
            });
          }
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
      defaultMessage: 'Data'
    });
    const description = i18n.translate(
      'kbn.discover.inspectorRequestDescription',
      {
        defaultMessage:
          'This request queries Elasticsearch to fetch the data for the search.'
      }
    );
    inspectorRequest = inspectorAdapters.requests.start(title, { description });
    inspectorRequest.stats(getRequestInspectorStats($scope.searchSource));
    $scope.searchSource.getSearchRequestBody().then(body => {
      inspectorRequest.json(body);
    });
  }

  function logInspectorResponse(resp) {
    inspectorRequest
      .stats(getResponseInspectorStats($scope.searchSource, resp))
      .ok({ json: resp });
  }

  $scope.updateTime = function() {
    ///////////////////////////////  WAZUH   ///////////////////////////////////
    if ($location.search().tab != 'configuration') {
      loadedVisualizations.removeAll();
      $rootScope.rendered = false;
      $rootScope.loadingStatus = 'Fetching data...';
      // Forcing a digest cycle
      $rootScope.$applyAsync();
    }
    ////////////////////////////////////////////////////////////////////////////
    $scope.timeRange = {
      from: dateMath.parse(timefilter.getTime().from),
      to: dateMath.parse(timefilter.getTime().to, { roundUp: true })
    };
    $scope.time = timefilter.getTime();
  };

  $scope.toMoment = function(datetime) {
    return moment(datetime).format(config.get('dateFormat'));
  };

  $scope.updateRefreshInterval = function() {
    $scope.refreshInterval = timefilter.getRefreshInterval();
  };

  $scope.onRefreshChange = function({ isPaused, refreshInterval }) {
    timefilter.setRefreshInterval({
      pause: isPaused,
      value: refreshInterval ? refreshInterval : $scope.refreshInterval.value
    });
  };

  $scope.resetQuery = function() {
    kbnUrl.change('/discover/{{id}}', { id: $route.current.params.id });
  };

  $scope.newQuery = function() {
    kbnUrl.change('/discover');
  };

  // Wazuh.
  // defaultSearchSource -> Use it for Discover tabs and the Discover visualization.
  // noHitsSearchSource  -> It doesn't fetch the "hits" array and it doesn't fetch the "_source",
  //                        use it for panels.
  let defaultSearchSource = null,
    noHitsSearchSource = null;

  $scope.updateDataSource = Promise.method(function updateDataSource() {
    // Wazuh
    const currentUrlPath = $location.path();
    const isPanels = $scope.tabView === 'panels';
    const isClusterMonitoring = $scope.tabView === 'cluster-monitoring';
    const isTopDiscover = currentUrlPath.includes('wazuh-discover');

    // Wazuh. Should we fetch "_source" and "hits" ?
    const noHits = (isPanels || isClusterMonitoring) && !isTopDiscover;

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

    $scope.searchSource
      .setField('size', size) // Wazuh. Use custom size
      .setField('sort', getSort($state.sort, $scope.indexPattern))
      .setField('query', !$state.query ? null : $state.query)
      .setField('filter', queryFilter.getFilters());
  });

  $scope.setSortOrder = function setSortOrder(columnName, direction) {
    $scope.state.sort = [columnName, direction];
  };

  // TODO: On array fields, negating does not negate the combination, rather all terms
  $scope.filterQuery = function(field, values, operation) {
    // Commented due to https://github.com/elastic/kibana/issues/22426
    //$scope.indexPattern.popularizeField(field, 1);
    filterActions.addFilter(
      field,
      values,
      operation,
      $scope.indexPattern.id,
      $scope.state,
      filterGen
    );
  };

  $scope.addColumn = function addColumn(columnName) {
    // Commented due to https://github.com/elastic/kibana/issues/22426
    //$scope.indexPattern.popularizeField(field, 1);
    columnActions.addColumn($scope.state.columns, columnName);
  };

  $scope.removeColumn = function removeColumn(columnName) {
    // Commented due to https://github.com/elastic/kibana/issues/22426
    //$scope.indexPattern.popularizeField(field, 1);
    columnActions.removeColumn($scope.state.columns, columnName);
  };

  $scope.moveColumn = function moveColumn(columnName, newIndex) {
    columnActions.moveColumn($scope.state.columns, columnName, newIndex);
  };

  $scope.scrollToTop = function() {
    $window.scrollTo(0, 0);
  };

  $scope.scrollToBottom = function() {
    // delay scrolling to after the rows have been rendered
    $timeout(() => {
      $element.find('#discoverBottomMarker').focus();
    }, 0);
  };

  $scope.showAllRows = function() {
    $scope.minimumVisibleRows = $scope.hits;
  };

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
        schema: 'metric'
      },
      {
        type: 'date_histogram',
        schema: 'segment',
        params: {
          field: $scope.opts.timefield,
          interval: $state.interval,
          timeRange: timefilter.getTime()
        }
      }
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
          addTimeMarker: true
        },
        aggs: visStateAggs
      }
    };

    $scope.vis = new Vis(
      // Wazuh. Force to use the default searchSource copy
      defaultSearchSource.getField('index'),
      visSavedObject.visState
    );
    visSavedObject.vis = $scope.vis;

    // Wazuh. Force to use the default searchSource copy
    defaultSearchSource.onRequestStart((searchSource, searchRequest) => {
      return $scope.vis
        .getAggConfig()
        .onSearchRequestStart(searchSource, searchRequest);
    });

    // Wazuh. Force to use the default searchSource copy
    defaultSearchSource.setField('aggs', function() {
      //////////////////// WAZUH ////////////////////////////////
      const result = $scope.vis.getAggConfig().toDsl();
      if (((result[2] || {}).date_histogram || {}).interval === '0ms') {
        result[2].date_histogram.interval = '1d';
      }
      return result;
      ///////////////////////////////////////////////////////////
    });

    $timeout(async () => {
      const visEl = $element.find('#discoverHistogram')[0];
      if (visEl) {
        visualizeHandler = await visualizeLoader.embedVisualizationWithSavedObject(
          visEl,
          visSavedObject,
          {
            autoFetch: false
          }
        );
      }
    });
  }

  function resolveIndexPatternLoading() {
    const {
      loaded: loadedIndexPattern,
      stateVal,
      stateValFound
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
            stateVal: `"${stateVal}"`
          }
        }
      );

      if (ownIndexPattern) {
        toastNotifications.addWarning({
          title: warningTitle,
          text: i18n.translate(
            'kbn.discover.showingSavedIndexPatternWarningDescription',
            {
              defaultMessage:
                'Showing the saved index pattern: "{ownIndexPatternTitle}" ({ownIndexPatternId})',
              values: {
                ownIndexPatternTitle: ownIndexPattern.title,
                ownIndexPatternId: ownIndexPattern.id
              }
            }
          )
        });
        return ownIndexPattern;
      }

      toastNotifications.addWarning({
        title: warningTitle,
        text: i18n.translate(
          'kbn.discover.showingDefaultIndexPatternWarningDescription',
          {
            defaultMessage:
              'Showing the default index pattern: "{loadedIndexPatternTitle}" ({loadedIndexPatternId})',
            values: {
              loadedIndexPatternTitle: loadedIndexPattern.title,
              loadedIndexPatternId: loadedIndexPattern.id
            }
          }
        )
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

  const loadFilters = async (wzCurrentFilters, localChange) => {
    const appState = getAppState();
    if (!appState || !globalState) {
      $timeout(100).then(() => {
        return loadFilters(wzCurrentFilters);
      });
    } else {
      $state.filters = localChange ? $state.filters : [];
      if ((pinnedFilters || []).length) {
        await queryFilter.addFilters(pinnedFilters);
      }
      const currentFilters = queryFilter.getFilters();
      const pinnedAgentIDs = currentFilters.filter(
        item =>
          ((item || {}).meta || {}).key === 'agent.id' &&
          ((item || {}).$state || {}).store === 'globalState'
      );

      const implicitAgentIDs = wzCurrentFilters.filter(
        item =>
          ((typeof item || {}).meta || {}).removable !== 'undefined' &&
          !((item || {}).meta || {}).removable &&
          ((item || {}).meta || {}).key === 'agent.id'
      );

      if (pinnedAgentIDs.length && implicitAgentIDs.length) {
        for (const filter of pinnedAgentIDs) {
          queryFilter.removeFilter(filter);
        }
      }

      queryFilter
        .addFilters(wzCurrentFilters)
        .then(() => {})
        .catch(error => console.log(error.message || error)); // eslint-disable-line
    }
  };

  /**
   * Return a list of pinned filters from a given array of filters or
   * from the queryFilter service if no array is given.
   * @param {*} arr Optional. Array of filters to be used instead of getFilters()
   */
  const getPinnedFilters = arr => {
    const currentFilters = arr || queryFilter.getFilters();
    if (currentFilters) {
      return currentFilters.filter(
        item => ((item || {}).$state || {}).store === 'globalState'
      );
    }
  };

  const wzEventFiltersListener = $rootScope.$on(
    'wzEventFilters',
    (evt, parameters) => {
      $rootScope.resultState = fetchStatuses.LOADING;
      if (!parameters.localChange) {
        if (!(pinnedFilters || []).length) {
          pinnedFilters = getPinnedFilters();
        }
        queryFilter.removeAll();
      }
      loadFilters(parameters.filters, parameters.localChange);
    }
  );

  $scope.tabView = $location.search().tabView || 'panels';
  const changeTabViewListener = $rootScope.$on(
    'changeTabView',
    async (evt, parameters) => {
      $rootScope.resultState = fetchStatuses.LOADING;
      pinnedFilters = getPinnedFilters();
      const goToDiscover = parameters.tabView === 'discover';
      const wasOnDiscover = $scope.tabView === 'discover';
      const backDiscover = !goToDiscover && wasOnDiscover;
      backFromDiscover = backDiscover;

      // Store last tab we visited
      const sameTab = lastTab === parameters.tab;
      lastTab = parameters.tab;

      if (!sameTab) {
        await queryFilter.removeAll();
      } else {
        discoverFilters = queryFilter.getFilters();
      }

      // Prevent multiple executions
      evt.stopPropagation();

      // Assign the incoming value for tabView
      $scope.tabView = parameters.tabView || 'panels';

      // Ensure tabView is always up-to-date.
      $scope.$applyAsync();

      // Wazuh. Force to retrieve "hits".
      // Before this version, we already had the hits, with the latest optimization
      // they are only retrieved if needed (Discover table).
      if (goToDiscover) {
        $scope.updateQueryAndFetch({
          query: $state.query,
          dateRange: $scope.time
        });
      } else {
        $scope.updateQueryAndFetch($state.query);
      }
    }
  );

  $scope.$on('$destroy', () => {
    wzEventFiltersListener();
    changeTabViewListener();
  });
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  init();
}
