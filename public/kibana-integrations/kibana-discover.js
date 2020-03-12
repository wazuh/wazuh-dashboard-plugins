/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////       WAZUH             //////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { uiModules } from 'ui/modules';
import discoverTemplate from '../templates/kibana-template/kibana-discover-template.html';

uiModules.get('app/wazuh', ['kibana/courier']).directive('kbnDis', [
  function () {
    return {
      restrict: 'E',
      scope: {},
      template: discoverTemplate
    };
  }
]);

// Added dependencies (from Kibana module)
import 'ui/pager';
//import 'ui/typeahead';
import 'ui/doc_viewer';
import 'ui/render_directive';

// Added from its index.js
import 'plugins/kibana/discover/saved_searches/saved_searches';
import 'plugins/kibana/discover/directives/no_results';
import 'plugins/kibana/discover/directives/timechart';
import 'ui/collapsible_sidebar';
import 'plugins/kibana/discover/components/field_chooser/field_chooser';
import 'plugins/kibana/discover/controllers/discover';
import 'ui/doc_table/components/table_row';

// Research added (further checks needed)
import 'ui/doc_table/doc_table';
import 'ui/doc_viewer/doc_viewer';
import 'ui/doc_title/doc_title';
import 'ui/style_compile/style_compile';
import 'ui/registry/doc_views';
import 'plugins/kbn_doc_views/kbn_doc_views';
import 'ui/tooltip/tooltip';
import 'ui/pager_control';
import 'ui/pager';

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import _ from 'lodash';
//import React from 'react';
import angular from 'angular';
import chrome from 'ui/chrome';
import { getSort } from 'ui/doc_table/lib/get_sort';
import * as columnActions from 'ui/doc_table/actions/columns';
import * as filterActions from 'ui/doc_table/actions/filter';
import dateMath from '@elastic/datemath';
import 'ui/doc_table';
import 'ui/visualize';
import 'ui/fixed_scroll';
import 'ui/directives/validate_json';
import 'ui/filters/moment';
import 'ui/index_patterns';
import 'ui/state_management/app_state';
import { timefilter } from 'ui/timefilter';
import 'ui/query_bar';
import {
  hasSearchStategyForIndexPattern,
  isDefaultTypeIndexPattern
} from 'ui/courier';
import { toastNotifications, getPainlessError } from 'ui/notify';
import { VisProvider } from 'ui/vis';
import { VislibSeriesResponseHandlerProvider } from 'ui/vis/response_handlers/vislib';
import { DocTitleProvider } from 'ui/doc_title';
import PluginsKibanaDiscoverHitSortFnProvider from 'plugins/kibana/discover/_hit_sort_fn';
import { FilterBarQueryFilterProvider } from 'ui/filter_bar/query_filter';
import { intervalOptions } from 'ui/agg_types/buckets/_interval_options';
import { stateMonitorFactory } from 'ui/state_management/state_monitor_factory';
import { migrateLegacyQuery } from 'ui/utils/migrate_legacy_query';
import { FilterManagerProvider } from 'ui/filter_manager';
import { getDocLink } from 'ui/documentation_links';
import { VisualizeLoaderProvider } from './loader';
import { ShareContextMenuExtensionsRegistryProvider } from 'ui/share';
import { getUnhashableStatesProvider } from 'ui/state_management/state_hashing';
//import { Inspector } from 'ui/inspector';
import { RequestAdapter } from 'ui/inspector/adapters';
import {
  getRequestInspectorStats,
  getResponseInspectorStats
} from 'ui/courier/utils/courier_inspector_utils';
import { tabifyAggResponse } from 'ui/agg_response/tabify';

import 'ui/courier/search_strategy/default_search_strategy';

const app = uiModules.get('apps/discover', [
  'kibana/notify',
  'kibana/courier',
  'kibana/url',
  'kibana/index_patterns',
  'app/wazuh'
]);

app.directive('discoverAppW', function () {
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
  Notifier,
  Private,
  Promise,
  config,
  courier,
  kbnUrl,
  localStorage,
  i18n,
  // Wazuh requirements from here
  $rootScope,
  $location,
  getAppState,
  globalState,
  loadedVisualizations,
  discoverPendingUpdates,
  wazuhConfig
) {
  const visualizeLoader = Private(VisualizeLoaderProvider);
  let visualizeHandler;
  const Vis = Private(VisProvider);
  const docTitle = Private(DocTitleProvider);
  const HitSortFn = Private(PluginsKibanaDiscoverHitSortFnProvider);
  const queryFilter = Private(FilterBarQueryFilterProvider);
  const responseHandler = Private(VislibSeriesResponseHandlerProvider).handler;
  const filterManager = Private(FilterManagerProvider);
  const notify = new Notifier({
    location: 'Discover'
  });
  const getUnhashableStates = Private(getUnhashableStatesProvider);
  const shareContextMenuExtensions = Private(
    ShareContextMenuExtensionsRegistryProvider
  );
  const inspectorAdapters = {
    requests: new RequestAdapter()
  };

  $scope.getDocLink = getDocLink;

  $scope.intervalOptions = intervalOptions;

  $scope.showInterval = false;
  $scope.minimumVisibleRows = 50;

  $scope.intervalEnabled = function (interval) {
    return interval.val !== 'custom';
  };

  // the saved savedSearch
  const savedSearch = $route.current.locals.savedSearch;
  $scope.$on('$destroy', savedSearch.destroy);

  const $appStatus = ($scope.appStatus = this.appStatus = {
    dirty: !savedSearch.id
  });

  // WAZUH MODIFIED
  $scope.topNavMenu = [];

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////       WAZUH             //////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  $scope.toggleRefresh = () => {
    $scope.timefilter.refreshInterval.pause = !$scope.timefilter.refreshInterval
      .pause;
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
  docTitle.change(`Discover${pageTitleSuffix}`);
  const discoverBreadcrumbsTitle = i18n(
    'kbn.discover.discoverBreadcrumbTitle',
    {
      defaultMessage: 'Discover'
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

  const getFieldCounts = async () => {
    // the field counts aren't set until we have the data back,
    // so we wait for the fetch to be done before proceeding
    if (!$scope.fetchStatus) {
      return $scope.fieldCounts;
    }

    return await new Promise(resolve => {
      const unwatch = $scope.$watch('fetchStatus', newValue => {
        if (newValue) {
          return;
        }

        unwatch();
        resolve($scope.fieldCounts);
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
    return i18n('kbn.discover.bucketIntervalTooltip', {
      // eslint-disable-next-line max-len
      defaultMessage:
        'This interval creates {bucketsDescription} to show in the selected time range, so it has been scaled to {bucketIntervalDescription}',
      values: {
        bucketsDescription:
          $scope.bucketInterval.scale > 1
            ? i18n('kbn.discover.bucketIntervalTooltip.tooLargeBucketsText', {
              defaultMessage: 'buckets that are too large'
            })
            : i18n('kbn.discover.bucketIntervalTooltip.tooManyBucketsText', {
              defaultMessage: 'too many buckets'
            }),
        bucketIntervalDescription: $scope.bucketInterval.description
      }
    });
  };

  $scope.$watchCollection('state.columns', function () {
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

  const init = _.once(function () {
    stateMonitor = stateMonitorFactory.create($state, getStateDefaults());
    stateMonitor.onChange(status => {
      $appStatus.dirty = status.dirty || !savedSearch.id;
    });
    $scope.$on('$destroy', () => stateMonitor.destroy());

    $scope.updateDataSource().then(function () {
      $scope.$listen(timefilter, 'fetch', function () {
        $scope.fetch();
        // WAZUH
        $rootScope.$broadcast('updateVis');
      });

      $scope.$watchCollection('state.sort', function (sort) {
        if (!sort) return;

        // get the current sort from {key: val} to ["key", "val"];
        const currentSort = Object.entries(
          $scope.searchSource.getField('sort')
        ).pop();

        // if the searchSource doesn't know, tell it so
        if (!angular.equals(sort, currentSort)) $scope.fetch();
      });

      // update data source when filters update
      $scope.$listen(queryFilter, 'update', function () {
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
        return $scope
          .updateDataSource()
          .then(function () {
            ////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////  WAZUH   ///////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////
            discoverPendingUpdates.removeAll();
            discoverPendingUpdates.addItem(
              $state.query,
              [
                ...queryFilter.getFilters(),
                ...buildFilters() // Hide '000' agent
              ]
            );
            $rootScope.$broadcast('updateVis');
            $rootScope.$broadcast('fetch');
            if ($location.search().tab != 'configuration') {
              loadedVisualizations.removeAll();
              $rootScope.rendered = false;
              $rootScope.loadingStatus = 'Fetching data...';
              // Forcing a digest cycle
              $rootScope.$applyAsync();
            }
            ////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////

            $state.save();
          })
          .catch(console.error); // eslint-disable-line
      });

      // update data source when hitting forward/back and the query changes
      $scope.$listen($state, 'fetch_with_changes', function (diff) {
        if (diff.indexOf('query') >= 0) $scope.fetch();
      });

      // fetch data when filters fire fetch event
      $scope.$listen(queryFilter, 'fetch', $scope.fetch);

      timefilter.enableAutoRefreshSelector();
      $scope.$watch('opts.timefield', function (timefield) {
        if (!!timefield) {
          timefilter.enableTimeRangeSelector();
        } else {
          timefilter.disableTimeRangeSelector();
        }
      });

      $scope.$watch('state.interval', function () {
        $scope.fetch();
      });

      $scope.$watch('vis.aggs', function () {
        // no timefield, no vis, nothing to update
        if (!$scope.opts.timefield) return;

        const buckets = $scope.vis.getAggConfig().bySchemaGroup.buckets;

        if (buckets && buckets.length === 1) {
          $scope.bucketInterval = buckets[0].buckets.getInterval();
        }
      });

      $scope.$watch('state.query', newQuery => {
        const query = migrateLegacyQuery(newQuery);
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
            // An undefined fetchStatus means the requests are still being
            // prepared to be sent. When all requests are completed,
            // fetchStatus is set to null, so it's important that we
            // specifically check for undefined to determine a loading status.
            const preparingForFetch = _.isUndefined(fetchStatus);
            if (preparingForFetch) return status.LOADING;
            else if (rowsEmpty && fetchStatus) return status.LOADING;
            else if (!rowsEmpty) return status.READY;
            else return status.NO_RESULTS;
          }

          return function () {
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

            /////////////////////////////////////////////////////////////////
            // Copying it to the rootScope to access it from the Wazuh App //
            /////////////////////////////////////////////////////////////////
            $rootScope.resultState = $scope.resultState;
            /////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////
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

  $scope.opts.fetch = $scope.fetch = function () {
    // Wazuh filters are not ready yet
    if (!filtersAreReady()) return;

    // ignore requests to fetch before the app inits
    if (!init.complete) return;

    $scope.fetchError = undefined;

    $scope.updateTime();

    $scope
      .updateDataSource()
      .then(setupVisualization)
      .then(function () {
        $state.save();
        return courier.fetch();
      })
      .catch(notify.error);
  };

  $scope.updateQueryAndFetch = function ({ query }) {
    ////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////  WAZUH   ///////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    // Wazuh filters are not ready yet
    if (!filtersAreReady()) return;

    discoverPendingUpdates.removeAll();
    discoverPendingUpdates.addItem($state.query, queryFilter.getFilters());
    $rootScope.$broadcast('updateVis');
    $rootScope.$broadcast('fetch');
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    $state.query = query;
    $scope.fetch();
  };

  function handleSegmentedFetch(segmented) {
    function flushResponseData() {
      $scope.fetchError = undefined;
      $scope.hits = 0;
      $scope.failures = [];
      $scope.rows = [];
      $scope.fieldCounts = {};
    }

    if (!$scope.rows) flushResponseData();

    const sort = $state.sort;
    const timeField = $scope.indexPattern.timeFieldName;

    /**
     * Basically an emum.
     *
     * opts:
     *   "time" - sorted by the timefield
     *   "non-time" - explicitly sorted by a non-time field, NOT THE SAME AS `sortBy !== "time"`
     *   "implicit" - no sorting set, NOT THE SAME AS "non-time"
     *
     * @type {String}
     */
    const sortBy = (function () {
      if (!Array.isArray(sort)) return 'implicit';
      else if (sort[0] === '_score') return 'implicit';
      else if (sort[0] === timeField) return 'time';
      else return 'non-time';
    })();

    let sortFn = null;
    if (sortBy !== 'implicit') {
      sortFn = new HitSortFn(sort[1]);
    }

    $scope.updateTime();

    if (sort[0] === '_score') {
      segmented.setMaxSegments(1);
    }

    segmented.setDirection(sortBy === 'time' ? sort[1] || 'desc' : 'desc');
    segmented.setSortFn(sortFn);
    segmented.setSize($scope.opts.sampleSize);

    let inspectorRequests = [];
    function logResponseInInspector(resp) {
      if (inspectorRequests.length > 0) {
        const inspectorRequest = inspectorRequests.shift();
        inspectorRequest
          .stats(getResponseInspectorStats($scope.searchSource, resp))
          .ok({ json: resp });
      }
    }

    // triggered when the status updated
    segmented.on('status', function (status) {
      $scope.fetchStatus = status;
      if (status.complete === 0) {
        // starting new segmented search request
        inspectorAdapters.requests.reset();
        inspectorRequests = [];
      }

      if (status.remaining > 0) {
        const inspectorRequest = inspectorAdapters.requests.start(
          i18n(
            'kbn.discover.inspectorRequest.segmentFetchCompleteStatusTitle',
            {
              defaultMessage: 'Segment {fetchCompleteStatus}',
              values: {
                fetchCompleteStatus: $scope.fetchStatus.complete
              }
            }
          ),
          {
            description: i18n(
              'kbn.discover.inspectorRequest.segmentFetchCompleteStatusDescription',
              {
                defaultMessage:
                  'This request queries Elasticsearch to fetch the data for the search.'
              }
            )
          }
        );
        inspectorRequest.stats(getRequestInspectorStats($scope.searchSource));
        $scope.searchSource.getSearchRequestBody().then(body => {
          inspectorRequest.json(body);
        });
        inspectorRequests.push(inspectorRequest);
      }
    });

    segmented.on('first', function () {
      flushResponseData();
    });

    segmented.on('segment', resp => {
      logResponseInInspector(resp);
      if (resp._shards.failed > 0) {
        $scope.failures = _.union($scope.failures, resp._shards.failures);
        $scope.failures = _.uniq($scope.failures, false, function (failure) {
          return failure.index + failure.shard + failure.reason;
        });
      }
    });

    segmented.on('emptySegment', function (resp) {
      logResponseInInspector(resp);
    });

    segmented.on('mergedSegment', function (merged) {
      $scope.mergedEsResp = merged;

      if ($scope.opts.timefield) {
        const tabifiedData = tabifyAggResponse($scope.vis.aggs, merged);
        $scope.searchSource.rawResponse = merged;
        Promise.resolve(responseHandler(tabifiedData)).then(resp => {
          if (visualizeHandler) {
            visualizeHandler.render(resp);
          }
        });
      }

      $scope.hits = merged.hits.total;

      const indexPattern = $scope.searchSource.getField('index');

      // the merge rows, use a new array to help watchers
      $scope.rows = merged.hits.hits.slice();

      let counts = $scope.fieldCounts;

      // if we haven't counted yet, or need a fresh count because we are sorting, reset the counts
      if (!counts || sortFn) counts = $scope.fieldCounts = {};

      $scope.rows.forEach(function (hit) {
        // skip this work if we have already done it
        if (hit.$$_counted) return;

        // when we are sorting results, we need to redo the counts each time because the
        // "top 500" may change with each response, so don't mark this as counted
        if (!sortFn) hit.$$_counted = true;

        const fields = _.keys(indexPattern.flattenHit(hit));
        let n = fields.length;
        let field;
        while ((field = fields[--n])) {
          // eslint-disable-line
          if (counts[field]) counts[field] += 1;
          else counts[field] = 1;
        }
      });
    });

    segmented.on('complete', function () {
      if ($scope.fetchStatus.hitCount === 0) {
        flushResponseData();
      }

      $scope.fetchStatus = null;
    });
  }

  function beginSegmentedFetch() {
    $scope.searchSource
      .onBeginSegmentedFetch(handleSegmentedFetch)
      .catch(error => {
        const fetchError = getPainlessError(error);

        if (fetchError) {
          $scope.fetchError = fetchError;
        } else {
          notify.error(error);
        }

        // Restart. This enables auto-refresh functionality.
        beginSegmentedFetch();
      });
  }
  beginSegmentedFetch();

  $scope.updateTime = function () {
    ////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////  WAZUH   ///////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    if ($location.search().tab != 'configuration') {
      loadedVisualizations.removeAll();
      $rootScope.rendered = false;
      $rootScope.loadingStatus = 'Fetching data...';
      // Forcing a digest cycle
      $rootScope.$applyAsync();
    }
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    $scope.timeRange = {
      from: dateMath.parse(timefilter.getTime().from),
      to: dateMath.parse(timefilter.getTime().to, { roundUp: true })
    };
  };

  $scope.resetQuery = function () {
    kbnUrl.change('/discover/{{id}}', { id: $route.current.params.id });
  };

  $scope.newQuery = function () {
    kbnUrl.change('/discover');
  };

  $scope.updateDataSource = Promise.method(function updateDataSource() {
    $scope.searchSource
      .setField('size', $scope.opts.sampleSize)
      .setField('sort', getSort($state.sort, $scope.indexPattern))
      .setField('query', !$state.query ? null : $state.query)
      .setField('filter', queryFilter.getFilters());
  });

  $scope.setSortOrder = function setSortOrder(columnName, direction) {
    $scope.state.sort = [columnName, direction];
  };

  // TODO: On array fields, negating does not negate the combination, rather all terms
  $scope.filterQuery = function (field, values, operation) {
    // Commented due to https://github.com/elastic/kibana/issues/22426
    //$scope.indexPattern.popularizeField(field, 1);
    filterActions.addFilter(
      field,
      values,
      operation,
      $scope.indexPattern.id,
      $scope.state,
      filterManager
    );
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

  async function setupVisualization() {
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

    // we have a vis, just modify the aggs
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
      $scope.searchSource.getField('index'),
      visSavedObject.visState
    );
    visSavedObject.vis = $scope.vis;

    $scope.searchSource.onRequestStart((searchSource, searchRequest) => {
      return $scope.vis
        .getAggConfig()
        .onSearchRequestStart(searchSource, searchRequest);
    });

    $scope.searchSource.setField('aggs', function () {
      //////////////////// WAZUH ////////////////////////////////
      // Old code:                                             //
      // return $scope.vis.getAggConfig().toDsl();             //
      ///////////////////////////////////////////////////////////
      const result = $scope.vis.getAggConfig().toDsl();
      if (((result[2] || {}).date_histogram || {}).interval === '0ms') {
        result[2].date_histogram.interval = '1d';
      }
      return result;
      ///////////////////////////////////////////////////////////
    });

    $timeout(async () => {
      const visEl = $element.find('#discoverHistogram')[0];
      visualizeHandler = await visualizeLoader.embedVisualizationWithSavedObject(
        visEl,
        visSavedObject,
        {
          autoFetch: false
        }
      );
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
      const warningTitle = i18n(
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
          text: i18n(
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
        text: i18n(
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

  const loadFilters = (wzCurrentFilters, localChange) => {
    const appState = getAppState();
    if (!appState || !globalState) {
      $timeout(100).then(() => {
        return loadFilters(wzCurrentFilters);
      });
    } else {
      $state.filters = localChange ? $state.filters : [];
      const currentFilters = queryFilter.getFilters();
      const hasAgentIDPinned = currentFilters.filter(
        item =>
          ((item || {}).meta || {}).key === 'agent.id' &&
          ((item || {}).$state || {}).store === 'globalState'
      );

      const weHaveAgentIDImplicit = wzCurrentFilters.filter(
        item =>
          ((typeof item || {}).meta || {}).removable !== 'undefined' &&
          !((item || {}).meta || {}).removable &&
          ((item || {}).meta || {}).key === 'agent.id'
      );

      if (weHaveAgentIDImplicit.length && hasAgentIDPinned.length) {
        for (const filter of hasAgentIDPinned) {
          queryFilter.removeFilter(filter);
        }
      }

      queryFilter
        .addFilters(wzCurrentFilters)
        .then(() => { })
        .catch(error => console.log(error.message || error)); // eslint-disable-line
    }
  };

  const wzEventFiltersListener = $rootScope.$on(
    'wzEventFilters',
    (evt, parameters) => {
      $rootScope.resultState = 'loading';
      loadFilters(parameters.filters, parameters.localChange);
    }
  );

  $scope.tabView = $location.search().tabView || 'panels';
  const changeTabViewListener = $rootScope.$on(
    'changeTabView',
    (evt, parameters) => {
      if (parameters.syscollector) {
        const currentFilters = queryFilter.getFilters();
        currentFilters
          .filter(item => ((item || {}).$state || {}).store !== 'globalState')
          .forEach(item => queryFilter.removeFilter(item));
      }
      $rootScope.resultState = 'loading';
      evt.stopPropagation();
      $scope.tabView = parameters.tabView || 'panels';
      $scope.updateQueryAndFetch($state.query);
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