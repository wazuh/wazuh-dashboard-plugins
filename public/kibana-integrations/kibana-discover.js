/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////       WAZUH             //////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { uiModules } from 'ui/modules';
import discoverTemplate from '../templates/kibana-template/kibana-discover-template.html';

uiModules.get('app/wazuh', [  'kibana/courier']).directive('kbnDis', [function() {
    return {
        restrict: 'E',
        scope: {},
        template: discoverTemplate
    };
}]);

// Added dependencies (from Kibana module)
import 'ui/pager';
import 'ui/typeahead';
import 'ui/doc_viewer';
import 'ui/render_directive';

// Added from its index.js
import 'plugins/kibana/discover/saved_searches/saved_searches';
import 'plugins/kibana/discover/directives/no_results';
import 'plugins/kibana/discover/directives/timechart';
import 'ui/collapsible_sidebar';
import 'plugins/kibana/discover/components/field_chooser/field_chooser';
import 'plugins/kibana/discover/controllers/discover';
import 'plugins/kibana/discover/styles/main.less';
import 'ui/doc_table/components/table_row';

// Research added (further checks needed)
import 'ui/doc_table/doc_table';
import 'ui/styles/sidebar.less';
import 'ui/styles/table.less';
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
import angular from 'angular';
import { getSort } from 'ui/doc_table/lib/get_sort';
import * as columnActions from 'ui/doc_table/actions/columns';
import * as filterActions from 'ui/doc_table/actions/filter';
import dateMath from '@kbn/datemath';
import 'ui/doc_table';
import 'ui/visualize';
import 'ui/fixed_scroll';
import 'ui/directives/validate_json';
import 'ui/filters/moment';
import 'ui/index_patterns';
import 'ui/state_management/app_state';
import { timefilter } from 'ui/timefilter';
import 'ui/share';
import 'ui/query_bar';
import { hasSearchStategyForIndexPattern, isDefaultTypeIndexPattern } from 'ui/courier';
import { toastNotifications, getPainlessError } from 'ui/notify';
import { VisProvider } from 'ui/vis';
import { BasicResponseHandlerProvider } from 'ui/vis/response_handlers/basic';
import { DocTitleProvider } from 'ui/doc_title';
import PluginsKibanaDiscoverHitSortFnProvider from 'plugins/kibana/discover/_hit_sort_fn';
import { FilterBarQueryFilterProvider } from 'ui/filter_bar/query_filter';
import { stateMonitorFactory } from 'ui/state_management/state_monitor_factory';
import { migrateLegacyQuery } from 'ui/utils/migrateLegacyQuery';
import { FilterManagerProvider } from 'ui/filter_manager';
import { visualizationLoader } from 'ui/visualize/loader/visualization_loader';
import { getDocLink } from 'ui/documentation_links';

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
  appState,
  $rootScope,
  $location,
  getAppState,
  globalState,
  loadedVisualizations,
  discoverPendingUpdates
) {

  const Vis = Private(VisProvider);
  const docTitle = Private(DocTitleProvider);
  const HitSortFn = Private(PluginsKibanaDiscoverHitSortFnProvider);
  const queryFilter = Private(FilterBarQueryFilterProvider);
  const responseHandler = Private(BasicResponseHandlerProvider).handler;
  const filterManager = Private(FilterManagerProvider);
  const notify = new Notifier({
    location: 'Discover'
  });

  //////////////////////////////////////////////////////////
  //////////////////// WAZUH ///////////////////////////////
  //////////////////////////////////////////////////////////
  const calcWzInterval = () => {
    let wzInterval = false;
    try {
      const from = dateMath.parse(timefilter.getTime().from);
      const to   = dateMath.parse(timefilter.getTime().to);
      
      const totalSeconds = (to - from) / 1000;
      if(totalSeconds <= 3600 )                                 wzInterval = 'm';
      else if(totalSeconds > 3600 && totalSeconds <= 86400)     wzInterval = 'h';
      else if(totalSeconds > 86400 && totalSeconds <= 604800)   wzInterval = 'd';
      else if(totalSeconds > 604800 && totalSeconds <= 2419200) wzInterval = 'w';
      else                                                      wzInterval = 'M';


    } catch (error) {} // eslint-disable-line

    return wzInterval;
  };
  //////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////

  $scope.getDocLink = getDocLink;

  ///////////////////////////////////////////////////////////////////////////////
  //////////// WAZUH ////////////////////////////////////////////////////////////
  // Old code:                                                                 //
  // $scope.intervalOptions = intervalOptions; //
  ///////////////////////////////////////////////////////////////////////////////
  $scope.intervalOptions = [
    {
      display: 'Minute',
      val: 'm'
    },
    {
      display: 'Hourly',
      val: 'h'
    },
    {
      display: 'Daily',
      val: 'd'
    },
    {
      display: 'Weekly',
      val: 'w'
    },
    {
      display: 'Monthly',
      val: 'M'
    },
    {
      display: 'Yearly',
      val: 'y'
    },
    {
      display: 'Custom',
      val: 'custom'
    }
  ];
  //////////////////////////////////////
  //////////////////////////////////////
  //////////////////////////////////////
  $scope.showInterval = false;
  $scope.minimumVisibleRows = 50;

  $scope.intervalEnabled = function (interval) {
    return interval.val !== 'custom';
  };

  $scope.topNavMenu = [];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////       WAZUH             //////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

$scope.toggleRefresh = () => {
  $scope.timefilter.refreshInterval.pause = !$scope.timefilter.refreshInterval.pause;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // the saved savedSearch
  const savedSearch = $route.current.locals.savedSearch;

  $scope.$on('$destroy', savedSearch.destroy);

  // the actual courier.SearchSource
  $scope.searchSource = savedSearch.searchSource;
  $scope.indexPattern = resolveIndexPatternLoading();

  $scope.searchSource
    .setField('index', $scope.indexPattern)
    .setField('highlightAll', true)
    .setField('version', true);

  // searchSource which applies time range
  const timeRangeSearchSource = savedSearch.searchSource.create();
  timeRangeSearchSource.setField('filter', () => {
    return timefilter.createFilter($scope.indexPattern);
  });

  $scope.searchSource.setParent(timeRangeSearchSource);

  const pageTitleSuffix = savedSearch.id && savedSearch.title ? `: ${savedSearch.title}` : '';
  docTitle.change(`Discover${pageTitleSuffix}`);

  let stateMonitor;
  const $appStatus = $scope.appStatus = this.appStatus = {
    dirty: !savedSearch.id
  };

  const $state = $scope.state = new AppState(getStateDefaults());

  const getFieldCounts = async () => {
    // the field counts aren't set until we have the data back,
    // so we wait for the fetch to be done before proceeding
    if (!$scope.fetchStatus) {
      return $scope.fieldCounts;
    }

    return await new Promise(resolve => {
      const unwatch = $scope.$watch('fetchStatus', (newValue) => {
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
    if (selectedFields.length === 1 && selectedFields[0] ===  '_source') {
      const fieldCounts = await getFieldCounts();
      return {
        searchFields: null,
        selectFields: _.keys(fieldCounts).sort()
      };
    }

    const timeFieldName = $scope.indexPattern.timeFieldName;
    const fields = timeFieldName ? [timeFieldName, ...selectedFields] : selectedFields;
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
      conflictedTypesFields: $scope.indexPattern.fields.filter(f => f.type === 'conflict').map(f => f.name),
      indexPatternId: searchSource.getField('index').id
    };
  };

  this.getSharingType = () => {
    return 'search';
  };

  this.getSharingTitle = () => {
    return savedSearch.title;
  };

  $scope.uiState = $state.makeStateful('uiState');

  function getStateDefaults() {

    //////////////////////////////////////////////////////////
    //////////////////// WAZUH ///////////////////////////////
    /////////////////////////////////////////////////////////
    let wzInterval = calcWzInterval();
    //////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////
    
    
    return {
      query: $scope.searchSource.getField('query') || { query: '', language: config.get('search:queryLanguage') },
      sort: getSort.array(savedSearch.sort, $scope.indexPattern, config.get('discover:sort:defaultOrder')),
      columns: savedSearch.columns.length > 0 ? savedSearch.columns : config.get('defaultColumns').slice(),
      index: $scope.indexPattern.id,
      interval: wzInterval || 'h',  //// WAZUH /////
      filters: _.cloneDeep($scope.searchSource.getOwnField('filter'))
    };
  }

  $state.index = $scope.indexPattern.id;
  $state.sort = getSort.array($state.sort, $scope.indexPattern);

  $scope.getBucketIntervalToolTipText = () => {
    return (
      `This interval creates ${$scope.bucketInterval.scale > 1 ? 'buckets that are too large' : 'too many buckets'}
      to show in the selected time range, so it has been scaled to ${$scope.bucketInterval.description }`
    );
  };

  $scope.$watchCollection('state.columns', function () {
    $state.save();
  });

  $scope.opts = {
    // number of records to fetch, then paginate through
    sampleSize: config.get('discover:sampleSize'),
    timefield: $scope.indexPattern.timeFieldName,
    savedSearch: savedSearch,
    indexPatternList: $route.current.locals.ip.list,
  };

  const init = _.once(function () {
    stateMonitor = stateMonitorFactory.create($state, getStateDefaults());
    stateMonitor.onChange((status) => {
      $appStatus.dirty = status.dirty || !savedSearch.id;
    });
    $scope.$on('$destroy', () => stateMonitor.destroy());

    $scope.updateDataSource()
      .then(function () {
        $scope.$listen(timefilter, 'fetch', function () {
          ////////////////////////////////////////////////
          //               WAZUH                        //
          ////////////////////////////////////////////////
          $state.interval = calcWzInterval() || 'd';
          ////////////////////////////////////////////////
          ////////////////////////////////////////////////
          ////////////////////////////////////////////////
          
          $scope.fetch();
        });

        $scope.$watchCollection('state.sort', function (sort) {
          if (!sort) return;

          // get the current sort from {key: val} to ["key", "val"];
          // WAZUH: replaced _.pairs by Object.entries due to Lodash compatibility
          const currentSort = Object.entries($scope.searchSource.getField('sort')).pop(); // eslint-disable-line
          
          // if the searchSource doesn't know, tell it so
          if (!angular.equals(sort, currentSort)) $scope.fetch();
        });

        // update data source when filters update
        $scope.$listen(queryFilter, 'update', function () {
          return $scope.updateDataSource().then(function () {
            
            ////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////  WAZUH   ///////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////    
            discoverPendingUpdates.removeAll();
            discoverPendingUpdates.addItem($state.query,queryFilter.getFilters());
            $rootScope.$broadcast('updateVis');
            $rootScope.$broadcast('fetch');
            if($location.search().tab != 'configuration') {
              loadedVisualizations.removeAll();
              $rootScope.rendered = false;
              $rootScope.loadingStatus = "Fetching data...";
            }
            ////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////

            $state.save();
          }).catch(console.error); // eslint-disable-line
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

        $scope.$watch('state.query', $scope.updateQueryAndFetch);

        $scope.$watchMulti([
          'rows',
          'fetchStatus'
        ], (function updateResultState() {
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
          }()));

        if ($scope.opts.timefield) {
          setupVisualization();
          $scope.updateTime();
        }

        init.complete = true;
        $state.replace();
      });
  });

  $scope.opts.saveDataSource = function () {
    return $scope.updateDataSource()
      .then(function () {
        savedSearch.columns = $scope.state.columns;
        savedSearch.sort = $scope.state.sort;

        return savedSearch.save()
          .then(function (id) {
            stateMonitor.setInitialState($state.toJSON());
            $scope.wzKbnTopNav.close('save'); // WAZUH replaced kbnTopNav

            if (id) {
              // Using toaster service due to notify.info is now deprecated
              toastNotifications.addSuccess({
                title: `Search '${savedSearch.title}' was saved`,
                'data-test-subj': 'saveSearchSuccess',
              });

              if (savedSearch.id !== $route.current.params.id) {
                kbnUrl.change('/discover/{{id}}', { id: savedSearch.id });
              } else {
                // Update defaults so that "reload saved query" functions correctly
                $state.setDefaults(getStateDefaults());
                docTitle.change(savedSearch.lastSavedTitle);
              }
            }
          });
      })
      .catch(notify.error);
  };

  $scope.opts.fetch = $scope.fetch = function () {
    // ignore requests to fetch before the app inits
    if (!init.complete) return;

    $scope.fetchError = undefined;

    $scope.updateTime();

    $scope.updateDataSource()
      .then(setupVisualization)
      .then(function () {
        $state.save();
        return courier.fetch();
      })
      .catch(notify.error);
  };

  $scope.updateQueryAndFetch = function (query) {

    ////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////  WAZUH   ///////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    // We don't need this cause the auto-complete feature breaks using this   //
    /*if ($state.query.language && $state.query.language !== query.language) {
      $state.filters = [];
    }*/
    const currentUrlPath = $location.path();
    if(currentUrlPath && !currentUrlPath.includes('wazuh-discover')){
      let filters = queryFilter.getFilters();
      filters = Array.isArray(filters) ? filters.filter(item => item && item.$state && item.$state.store && item.$state.store === 'appState') : [];
      if(!filters || !filters.length) return;
    }
    discoverPendingUpdates.removeAll();
    discoverPendingUpdates.addItem($state.query,queryFilter.getFilters());
    $rootScope.$broadcast('updateVis');
    $rootScope.$broadcast('fetch');
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    $state.query = migrateLegacyQuery(query);
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
    }());

    let sortFn = null;
    if (sortBy !== 'implicit') {
      sortFn = new HitSortFn(sort[1]);
    }

    $scope.updateTime();
    if (sort[0] === '_score') segmented.setMaxSegments(1);  
    segmented.setDirection(sortBy === 'time' ? (sort[1] || 'desc') : 'desc');
    segmented.setSortFn(sortFn);
    segmented.setSize($scope.opts.sampleSize);

    // triggered when the status updated
    segmented.on('status', function (status) {
      $scope.fetchStatus = status;
    });

    segmented.on('first', function () {
      flushResponseData();
    });

    segmented.on('segment', (resp) => {
      if (resp._shards.failed > 0) {
        $scope.failures = _.union($scope.failures, resp._shards.failures);
        $scope.failures = _.uniq($scope.failures, false, function (failure) {
          return failure.index + failure.shard + failure.reason;
        });
      }
    });

    segmented.on('mergedSegment', function (merged) {
      $scope.mergedEsResp = merged;

      if ($scope.opts.timefield) {
        $scope.searchSource.rawResponse = merged;
        Promise
          .resolve(responseHandler($scope.vis, merged))
          .then(resp => {
            $scope.visData = resp;
            if(($scope.tabView !== 'panels' || $location.path().includes('wazuh-discover')) && 
               ($scope.tabView !== 'cluster-monitoring')
              ) {
              const visEl = $element.find('#discoverHistogram')[0];
              visualizationLoader.render(visEl, $scope.vis, $scope.visData, $scope.uiState, { listenOnChange: true });
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
        while (field = fields[--n]) { // eslint-disable-line
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
    $scope.searchSource.onBeginSegmentedFetch(handleSegmentedFetch)
      .catch((error) => {
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
    if($location.search().tab != 'configuration') {
      loadedVisualizations.removeAll();
      $rootScope.rendered = false;
      $rootScope.loadingStatus = "Fetching data...";
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
    $scope.indexPattern.popularizeField(field, 1);
    filterActions.addFilter(field, values, operation, $scope.indexPattern.id, $scope.state, filterManager);
  };

  $scope.addColumn = function addColumn(columnName) {
    $scope.indexPattern.popularizeField(columnName, 1);
    columnActions.addColumn($scope.state.columns, columnName);
  };

  $scope.removeColumn = function removeColumn(columnName) {
    $scope.indexPattern.popularizeField(columnName, 1);
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

  function setupVisualization() {
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
          interval: $state.interval
        }
      }
    ];

    // we have a vis, just modify the aggs
    if ($scope.vis) {
      const visState = $scope.vis.getEnabledState();
      visState.aggs = visStateAggs;

      $scope.vis.setState(visState);
    } else {
      $scope.vis = new Vis($scope.indexPattern, {
        title: savedSearch.title,
        type: 'histogram',
        params: {
          addLegend: false,
          addTimeMarker: true
        },
        aggs: visStateAggs
      });

  
      $scope.searchSource.onRequestStart((searchSource, searchRequest) => {
        return $scope.vis.getAggConfig().onSearchRequestStart(searchSource, searchRequest);
      });

      $scope.searchSource.setField('aggs', function () {
        //////////////////// WAZUH ////////////////////////////////
        // Old code:                                             //
        // return $scope.vis.getAggConfig().toDsl();             //
        ///////////////////////////////////////////////////////////
        const result = $scope.vis.getAggConfig().toDsl();
        if(result[2] && result[2].date_histogram && result[2].date_histogram.interval === '0ms') {
          result[2].date_histogram.interval = '1d';
        }
        return result;
        ///////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////
      });
    }

    $scope.vis.filters = {
      timeRange: timefilter.getTime()
    };
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
      const warningTitle = `"${stateVal}" is not a configured index pattern ID`;

      if (ownIndexPattern) {
        toastNotifications.addWarning({
          title: warningTitle,
          text: `Showing the saved index pattern: "${ownIndexPattern.title}" (${ownIndexPattern.id})`,
        });
        return ownIndexPattern;
      }

      toastNotifications.addWarning({
        title: warningTitle,
        text: `Showing the default index pattern: "${loadedIndexPattern.title}" (${loadedIndexPattern.id})`,
      });
    }

    return loadedIndexPattern;
  }

  // Block the UI from loading if the user has loaded a rollup index pattern but it isn't
  // supported.
  $scope.isUnsupportedIndexPattern = (
    !isDefaultTypeIndexPattern($route.current.locals.ip.loaded)
    && !hasSearchStategyForIndexPattern($route.current.locals.ip.loaded)
  );

  if ($scope.isUnsupportedIndexPattern) {
    $scope.unsupportedIndexPatternType = $route.current.locals.ip.loaded.type;
    return;
  }
  
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////// WAZUH //////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const loadFilters = (wzCurrentFilters, localChange) => {
    const appState = getAppState();
    if(!appState || !globalState){
      $timeout(100)
      .then(() => {
        return loadFilters(wzCurrentFilters);
      });
    } else {
      $state.filters = localChange ? $state.filters : [];

      queryFilter.addFilters(wzCurrentFilters)
      .then(() => { })
      .catch(error => console.log(error.message || error)); // eslint-disable-line
    }
  };

  const wzEventFiltersListener = $rootScope.$on('wzEventFilters', (evt,parameters) => {
    loadFilters(parameters.filters, parameters.localChange);
  });


  $scope.tabView = $location.search().tabView || 'panels';
  const changeTabViewListener = $rootScope.$on('changeTabView',(evt,parameters) => {
    $scope.tabView = parameters.tabView || 'panels';
    $scope.updateQueryAndFetch($state.query);
  });

  $scope.$on('$destroy', () => {
    wzEventFiltersListener();
    changeTabViewListener();
  });
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  init();
}
