require('ui/doc_table/doc_table.js');
require('ui/styles/sidebar.less');
require('ui/styles/table.less');
require('ui/doc_viewer/doc_viewer.js');
require('ui/doc_title/doc_title.js');
require('ui/style_compile/style_compile.js');
require('ui/registry/doc_views.js');
require('plugins/kbn_doc_views/kbn_doc_views.js');
require('ui/tooltip/tooltip.js');
import 'plugins/kibana/discover/components/field_chooser';
import 'plugins/kibana/discover/components/field_chooser/field_chooser';
import * as columnActions from 'ui/doc_table/actions/columns';
import _ from 'lodash';
import moment from 'moment';
import { getSort } from 'ui/doc_table/lib/get_sort';
import rison from 'rison-node';
import dateMath from '@elastic/datemath';
import 'ui/doc_table';
import 'ui/visualize';
import 'ui/notify';
import 'ui/fixed_scroll';
import 'ui/directives/validate_json';
import 'ui/filters/moment';
import 'ui/courier';
import 'ui/index_patterns';
import 'ui/state_management/app_state';
import 'ui/timefilter';
import 'ui/pager_control';
import 'ui/pager';
//import 'plugins/kibana/common/highlight/highlight_tags';
import 'ui/share';
import { DocTitleProvider } from 'ui/doc_title';
import { VisProvider } from 'ui/vis';
import { UtilsBrushEventProvider } from 'ui/utils/brush_event';
import PluginsKibanaDiscoverHitSortFnProvider from 'plugins/kibana/discover/_hit_sort_fn';
import { FilterBarQueryFilterProvider } from 'ui/filter_bar/query_filter';
import { FilterManagerProvider } from 'ui/filter_manager';
import { AggTypesBucketsIntervalOptionsProvider } from 'ui/agg_types/buckets/_interval_options';
import { stateMonitorFactory } from 'ui/state_management/state_monitor_factory';
import uiRoutes from 'ui/routes';
import { uiModules } from 'ui/modules';
import indexTemplate from 'plugins/wazuh/templates/directives/dis-template.html';
import { StateProvider } from 'ui/state_management/state';
import { documentationLinks } from 'ui/documentation_links/documentation_links';
import 'ui/debounce';
import 'plugins/kibana/discover/saved_searches/saved_searches';
import 'plugins/kibana/discover/directives/no_results';
import 'plugins/kibana/discover/directives/timechart';
import 'ui/collapsible_sidebar';
import 'plugins/kibana/discover/controllers/discover';
import 'plugins/kibana/discover/styles/main.less';
import 'ui/doc_table/components/table_row';
import { SavedObjectRegistryProvider } from 'ui/saved_objects/saved_object_registry';
import { SavedObjectsClientProvider } from 'ui/saved_objects';
import { savedSearchProvider } from 'plugins/kibana/discover/saved_searches/saved_search_register';
import { getDefaultQuery } from 'ui/parse_query';
import { IndexPatternsFieldListProvider } from 'ui/index_patterns/_field_list';
import { fieldCalculator } from 'plugins/kibana/discover/components/field_chooser/lib/field_calculator';
import { QueryManagerProvider } from 'ui/query_manager';
import { migrateLegacyQuery } from 'ui/utils/migrateLegacyQuery';
import { BasicResponseHandlerProvider } from 'ui/vis/response_handlers/basic';

SavedObjectRegistryProvider.register(savedSearchProvider);

var app = require('ui/modules').get('app/wazuh', [])
    .directive('kbnDis', [function() {
        return {
            restrict: 'E',
            scope: {
                disA: '@disA',
                disG: '@disG',
                disFilter: '@disFilter',
                tableHeight: '@tableHeight',
                infiniteScroll: '@infiniteScroll',
                indexSelector: '@indexSelector'
            },
            template: require('../templates/directives/dis-template.html')
        }
    }]);

var app = require('ui/modules').get('app/wazuh', [])
    .directive('kbnDisfull', [function() {
        return {
            restrict: 'E',
            scope: {
                disA: '@disA',
                disG: '@disG',
                disFilter: '@disFilter',
                tableHeight: '@tableHeight',
                infiniteScroll: '@infiniteScroll'
            },
            template: require('../templates/directives/dis-full-template.html')
        }
    }]);


require('ui/modules').get('app/wazuh', []).controller('discoverW', function($scope, config, courier, $route, $window, Notifier,
    AppState, timefilter, Promise, Private, kbnUrl, $timeout, $location, savedSearches, appState, $rootScope, getAppState) {
    
        const FieldList = Private(IndexPatternsFieldListProvider);
    $scope.cluster_info = appState.getClusterInfo();
    $scope.cluster_filter = "cluster.name: " + $scope.cluster_info.cluster;

    if($rootScope.page == "agents" && $location.path() != "/discover/"){
        $scope.agent_info = $rootScope.agent;

        $scope.agent_filter = "agent.id: " + $route.current.params.id;
        $scope.global_filter = $scope.cluster_filter + " AND " + $scope.agent_filter;
    }else
        $scope.global_filter = $scope.cluster_filter;

    if(!angular.isUndefined($scope.disFilter))
        $scope.global_filter = $scope.disFilter + " AND " + $scope.global_filter;

    $scope.stateQuery = $scope.global_filter;
    $scope.chrome = {};
    $scope.removeColumn = function removeColumn(columnName) {
        $scope.indexPattern.popularizeField(columnName, 1);
        columnActions.removeColumn($scope.state.columns, columnName);
    };
    $scope.addColumn = function addColumn(columnName) {
        $scope.indexPattern.popularizeField(columnName, 1);
        columnActions.addColumn($scope.state.columns, columnName);
        $scope.columns = $scope.state.columns;
    };
    $scope.chrome.getVisible = function() {
        return true;
    }

    const notify = new Notifier({
        location: '*'
    });

    if (typeof $rootScope.visCounter === "undefined")
        $rootScope.visCounter = 0;

    $rootScope.visCounter++;

    const State = Private(StateProvider);
    const savedObjectsClient = Private(SavedObjectsClientProvider);

    savedObjectsClient.find({
        type: 'index-pattern',
        fields: ['title'],
        perPage: 10000
      })
      .then(({ savedObjects }) => {
            $scope.indexPatternList = savedObjects;
            // Decode discover settings from directive
            var disDecoded = rison.decode($scope.disA);
            const state = disDecoded;
            state.index = config.get('defaultIndex');
            
            Promise.props({
                list: savedObjects,
                loaded: courier.indexPatterns.get(state.index),
                stateVal: state.index,
                stateValFound: true
            }).then(function(result) {
                $scope._ip = result;
                savedSearches.get().then(function(result) {
                    $scope._savedSearch = result;
                    const Vis = Private(VisProvider);
                    const docTitle = Private(DocTitleProvider);
                    const brushEvent = Private(UtilsBrushEventProvider);
                    const HitSortFn = Private(PluginsKibanaDiscoverHitSortFnProvider);
                    const queryFilter = Private(FilterBarQueryFilterProvider);
                    const responseHandler = Private(BasicResponseHandlerProvider).handler;
                    const filterManager = Private(FilterManagerProvider);
                    $scope.queryDocLinks = documentationLinks.query;
                    $scope.intervalOptions = Private(AggTypesBucketsIntervalOptionsProvider);
                    $scope.showInterval = false;
                    $scope.intervalEnabled = function(interval) {
                        return interval.val !== 'custom';
                    };

                    $scope.toggleInterval = function() {
                        $scope.showInterval = !$scope.showInterval;
                    };

                    $scope.timefilter = timefilter;

                    // Set default time
                    var gParameter;
                    if($route.current.params._g){
                        if($route.current.params._g.startsWith("h@")){
                            gParameter = sessionStorage.getItem($route.current.params._g);
                        }else{
                            gParameter = $route.current.params._g;
                        }
                    }
                    else{
                        gParameter="()";
                    }
                    if (gParameter == "()")
                        $scope.timefilter.time.from = "now-24h";

                    // the saved savedSearch
                    const savedSearch = $scope._savedSearch;
                    $scope.$on('$destroy', savedSearch.destroy);

                    // the actual courier.SearchSource
                    $scope.searchSource = savedSearch.searchSource;
                    $scope.indexPattern = resolveIndexPatternLoading();
                    $scope.searchSource
                        .set('index', $scope.indexPattern)
                        .highlightAll(true)
                        .version(true);


                    if (savedSearch.id) {
                        docTitle.change(savedSearch.title);
                    }


                    // Configure AppState. Get App State, if there is no App State create new one
                    let currentAppState = getAppState();
                    if (!currentAppState) {
                        $scope.state = new AppState(getStateDefaults());
                    } else {
                        $scope.state = currentAppState;
                        $scope.state.columns = disDecoded.columns.length > 0 ? disDecoded.columns : config.get('defaultColumns');
                        $scope.state.sort = disDecoded.sort.length > 0 ? disDecoded.sort : getSort.array(savedSearch.sort, $scope.indexPattern);
                    }

                    const $appStatus = $scope.appStatus = {
                          dirty: !savedSearch.id
                    };
                    let stateMonitor;
                    const $state = $scope.state;
                    const queryManager = Private(QueryManagerProvider)($state);

                    $scope.uiState = $state.makeStateful('uiState');
                    $scope.uiState.set('vis.legendOpen', false);
                    $state.query = ($scope.stateQuery ? $scope.stateQuery : '');

                    function getStateDefaults() {
                        return {
                            query: $scope.disFilter ? $scope.disFilter : '',
                            sort: disDecoded.sort.length > 0 ? disDecoded.sort : getSort.array(savedSearch.sort, $scope.indexPattern),
                            columns: disDecoded.columns.length > 0 ? disDecoded.columns : config.get('defaultColumns'),
                            index: $scope.indexPattern.id,
                            interval: 'auto',
                            filters: _.cloneDeep($scope.searchSource.getOwn('filter'))
                        };
                    }

                    $state.index = $scope.indexPattern.id;
                    $state.sort = getSort.array($state.sort, $scope.indexPattern);

                    $scope.opts = {
                        // number of records to fetch, then paginate through
                        sampleSize: config.get('discover:sampleSize'),
                        // Index to match
                        index: $scope.indexPattern.id,
                        timefield: $scope.indexPattern.timeFieldName,
                        savedSearch: savedSearch,
                        indexPatternList: savedObjects,
                        timefilter: $scope.timefilter
                    };
                    const init = _.once(function() {
                        const showTotal = 5;
                        $scope.failuresShown = showTotal;
                        $scope.showAllFailures = function() {
                            $scope.failuresShown = $scope.failures.length;
                        };
                        $scope.showLessFailures = function() {
                            $scope.failuresShown = showTotal;
                        };

						stateMonitor = stateMonitorFactory.create($state, getStateDefaults());
						stateMonitor.onChange((status) => {
							$appStatus.dirty = status.dirty;
						});
						$scope.$on('$destroy', () => stateMonitor.destroy());

                        $scope.updateDataSource()
                            .then(function() {
                                $scope.$listen(timefilter, 'fetch', function() {
                                    $scope.fetch();
                                });

                                $scope.$watchCollection('state.sort', function(sort) {
                                    if (!sort) return;

                                    // get the current sort from {key: val} to ["key", "val"];
                                    const currentSort = _.pairs($scope.searchSource.get('sort')).pop();

                                    // if the searchSource doesn't know, tell it so
                                    if (!angular.equals(sort, currentSort)) $scope.fetch();
                                });

                                // update data source when filters update
                                $scope.$listen(queryFilter, 'update', function() {
                                    return $scope.updateDataSource().then(function() {});
                                });

                                // update data source when hitting forward/back and the query changes
                                $scope.$listen($state, 'fetch_with_changes', function(diff) {
                                    $scope.fetch();
                                });

                                // fetch data when filters fire fetch event
                                $scope.$listen(queryFilter, 'fetch', $scope.fetch);

                                $scope.$watch('opts.timefield', function(timefield) {
                                    timefilter.enabled = !!timefield;
                                });

                                $scope.$watch('state.interval', function(interval, oldInterval) {
                                    if (interval !== oldInterval && interval === 'auto') {
                                        $scope.showInterval = false;
                                    }

                                });
                                $scope.$watchCollection('state.$newFilters', function (filters = []) {
                                    // need to convert filters generated from user interaction with viz into kuery AST
                                    // These are handled by the filter bar directive when lucene is the query language
                                    Promise.all(filters.map(queryManager.addLegacyFilter))
                                    .then(() => $scope.state.$newFilters = [])
                                    .then($scope.fetch);
                                });
                                $scope.$watch('vis.aggs', function() {
                                    // no timefield, no vis, nothing to update
                                    if (!$scope.opts.timefield) return;

                                    const buckets = $scope.vis.aggs.bySchemaGroup.buckets;

                                    if (buckets && buckets.length === 1) {
                                        $scope.intervalName = 'by ' + buckets[0].buckets.getInterval().description;
                                    } else {
                                        $scope.intervalName = 'auto';
                                    }
                                });

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

                                        prev = current;
                                    };
                                }()));

                                $scope.searchSource.onError(function(err) {
                                    notify.error(err);
                                }).catch(notify.fatal);

                                function initForTime() {
                                    return setupVisualization().then($scope.updateTime);
                                }

                                return Promise.resolve($scope.opts.timefield && initForTime())
                                    .then(function() {
                                        init.complete = true;
                                        $scope.$emit('application.load');
                                        $scope.fetch();
                                    });
                            });
                    });

                    $scope.opts.saveDataSource = function() {
                        return $scope.updateDataSource()
                            .then(function() {
                                savedSearch.id = savedSearch.title;
                                savedSearch.columns = $scope.state.columns;
                                savedSearch.sort = $scope.state.sort;

                                return savedSearch.save()
                                    .then(function(id) {
                                        $scope.kbnTopNav.close('save');

                                        if (id) {
                                            notify.info('Saved Data Source "' + savedSearch.title + '"');
                                            if (savedSearch.id !== $route.current.params.id) {} else {
                                                // Update defaults so that "reload saved query" functions correctly
                                                $state.setDefaults(getStateDefaults());
                                            }
                                        }
                                    });
                            })
                            .catch(notify.error);
                    };

                    $scope.opts.fetch = $scope.fetch = function() {
                        // ignore requests to fetch before the app inits
                        if (!init.complete) return;

                        $scope.updateTime();

                        $scope.updateDataSource()
                            .then(setupVisualization)
                            .then(function() {
                                $state.save();
                                return courier.fetch();
                            })
                            .catch(notify.error);
                    };
                    $scope.searchSource.onBeginSegmentedFetch(function(segmented) {

                        function flushResponseData() {
                            $scope.hits = 0;
                            $scope.faliures = [];
                            $scope.rows = [];
                            $scope.fieldCounts = {};
                        }

                        if (!$scope.rows) flushResponseData();

						if(!$state.sort)
							$state.sort = ["@timestamp","desc"];
                        const sort = $state.sort;
                        const timeField = $scope.indexPattern.timeFieldName;
                        const totalSize = $scope.size || $scope.opts.sampleSize;

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
                        const sortBy = (function() {
                            if (!_.isArray(sort)) return 'implicit';
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
                        segmented.on('status', function(status) {
                            $scope.fetchStatus = status;
                        });

                        segmented.on('first', function() {
                            flushResponseData();
                        });

                        segmented.on('segment', notify.timed('handle each segment', function(resp) {
                            if (resp._shards.failed > 0) {
                                $scope.failures = _.union($scope.failures, resp._shards.failures);
                                $scope.failures = _.uniq($scope.failures, false, function(failure) {
                                    return failure.index + failure.shard + failure.reason;
                                });
                            }
                        }));

    segmented.on('mergedSegment', function (merged) {
      $scope.mergedEsResp = merged;

      if ($scope.opts.timefield) {
        $scope.searchSource.rawResponse = merged;
        responseHandler($scope.vis, merged).then(resp => {
          $scope.visData = resp;
        });
      }

      $scope.hits = merged.hits.total;

      const indexPattern = $scope.searchSource.get('index');
      // the merge rows, use a new array to help watchers
      $scope.rows = merged.hits.hits.slice();

      notify.event('flatten hit and count fields', function () {
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
          while (field = fields[--n]) {
            if (counts[field]) counts[field] += 1;
            else counts[field] = 1;
          }
        });
      });
    });

                        segmented.on('complete', function() {

                            if ($scope.fetchStatus.hitCount === 0) {
                                flushResponseData();
                            }

                            $scope.fetchStatus = null;
                        });
                    }).catch(notify.fatal);

                    $scope.updateTime = function() {
                        $scope.timeRange = {
                            from: dateMath.parse(timefilter.time.from),
                            to: dateMath.parse(timefilter.time.to, true)
                        };
                    };

                    $scope.updateDataSource = Promise.method(function updateDataSource() {
                        $scope.searchSource
                            .size($scope.opts.sampleSize)
                            .sort(getSort($state.sort, $scope.indexPattern))
                            .query(!$state.query ? null : migrateLegacyQuery($state.query))
                            .set('filter', queryFilter.getFilters());
                    });

                    // TODO: On array fields, negating does not negate the combination, rather all terms
                    $scope.filterQuery = function (field, values, operation) {
                        $scope.indexPattern.popularizeField(field, 1);
                        filterManager.add(field, values, operation, $state.index);
                    };

                    $scope.addColumn = function addColumn(columnName) {
                        $scope.indexPattern.popularizeField(columnName, 1);
                        columnActions.addColumn($scope.state.columns, columnName);
                        $scope.columns = $scope.state.columns;
                    };

                    $scope.removeColumn = function removeColumn(columnName) {
                        $scope.indexPattern.popularizeField(columnName, 1);
                        columnActions.removeColumn($scope.state.columns, columnName);
                        $scope.columns = $scope.state.columns;
                    };

                    $scope.moveColumn = function moveColumn(columnName, newIndex) {
                        columnActions.moveColumn($scope.state.columns, columnName, newIndex);
                        $scope.columns = $scope.state.columns;
                    };

                    $scope.toTop = function () {
                        $window.scrollTo(0, 0);
                    };

                    let loadingVis;

                    function setupVisualization() {
                        // If we're not setting anything up we need to return an empty promise
                        if (!$scope.opts.timefield) return Promise.resolve();
                        if (loadingVis) return loadingVis;

                        const visStateAggs = [{
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
                            return Promise.resolve($scope.vis);
                        }

                        $scope.vis = new Vis($scope.indexPattern, {
                            title: savedSearch.title,
                            type: 'histogram',
                            params: {
                                addLegend: false,
                                addTimeMarker: true
                            },
                            listeners: {
                                click: function(e) {
                                    notify.log(e);
                                    timefilter.time.from = moment(e.point.x);
                                    timefilter.time.to = moment(e.point.x + e.data.ordered.interval);
                                    timefilter.time.mode = 'absolute';
                                },
                                brush: brushEvent($scope.state)
                            },
                            aggs: visStateAggs
                        });

                        $scope.searchSource.aggs(function() {
                            $scope.vis.requesting();
                            return $scope.vis.aggs.toDsl();
                        });

                        // stash this promise so that other calls to setupVisualization will have to wait
                        loadingVis = new Promise(function(resolve) {
                                $rootScope.visCounter--;
                                $scope.$on('ready:vis', function() {
                                    resolve($scope.vis);
                                });
                            })
                            .finally(function() {
                                // clear the loading flag
                                loadingVis = null;
                            });

                        return loadingVis;
                    }
                    // Listen for visualization queue prepared
                    var fetchVisualizationWatch = $rootScope.$on('fetchVisualization', function(event) {
                        //$scope.fetch();
                        courier.fetch()
                    });

                    function resolveIndexPatternLoading() {
                        console.log($scope._ip);
                        const props = $scope._ip;
                        const loaded = props.loaded;
                        const stateVal = props.stateVal;
                        const stateValFound = props.stateValFound;

                        const own = $scope.searchSource.getOwn('index');

                        if (own && !stateVal) return own;
                        if (stateVal && !stateValFound) {
                            const err = '"' + stateVal + '" is not a configured pattern. ';
                            if (own) {
                                notify.warning(err + ' Using the saved index pattern: "' + own.id + '"');
                                return own;
                            }

                            notify.warning(err + ' Using the default index pattern: "' + loaded.id + '"');
                        }
                        return loaded;
                    }
$scope.selectedIndexPattern = $scope.indexPatternList.find(
        (pattern) => pattern.id === $scope.indexPattern.id
      );
      $scope.indexPatternList = _.sortBy($scope.indexPatternList, o => o.get('title'));
      $scope.setIndexPattern = function (pattern) {
        $scope.state.index = pattern.id;
        $scope.state.save();
      };

      $scope.$watch('state.index', function (id, previousId) {
        if (previousId == null || previousId === id) return;
        $route.reload();
      });

      const filter = $scope.filter = {
        props: [
          'type',
          'aggregatable',
          'searchable',
          'missing',
          'name'
        ],
        defaults: {
          missing: true,
          type: 'any'
        },
        boolOpts: [
          { label: 'any', value: undefined },
          { label: 'yes', value: true },
          { label: 'no', value: false }
        ],
        toggleVal: function (name, def) {
          if (filter.vals[name] !== def) filter.vals[name] = def;
          else filter.vals[name] = undefined;
        },
        reset: function () {
          filter.vals = _.clone(filter.defaults);
        },
        isFieldSelected: function (field) {
          return field.display;
        },
        isFieldFiltered: function (field) {
          const matchFilter = (filter.vals.type === 'any' || field.type === filter.vals.type);
          const isAggregatable = (filter.vals.aggregatable == null || field.aggregatable === filter.vals.aggregatable);
          const isSearchable = (filter.vals.searchable == null || field.searchable === filter.vals.searchable);
          const scriptedOrMissing = (!filter.vals.missing || field.scripted || field.rowCount > 0);
          const matchName = (!filter.vals.name || field.name.indexOf(filter.vals.name) !== -1);

          return !field.display
            && matchFilter
            && isAggregatable
            && isSearchable
            && scriptedOrMissing
            && matchName
          ;
        },
        popularity: function (field) {
          return field.count > 0;
        },
        getActive: function () {
          return _.some(filter.props, function (prop) {
            return filter.vals[prop] !== filter.defaults[prop];
          });
        }
      };

      // set the initial values to the defaults
      filter.reset();

      $scope.$watchCollection('filter.vals', function () {
        filter.active = filter.getActive();
      });

      $scope.$watchMulti([
        '[]fieldCounts',
        '[]columns',
        '[]hits'
      ], function (cur, prev) {
        const newHits = cur[2] !== prev[2];
        let fields = $scope.fields;
        const columns = $scope.columns || [];
        const fieldCounts = $scope.fieldCounts;

        if (!fields || newHits) {
          $scope.fields = fields = getFields();
        }

        if (!fields) return;

        // group the fields into popular and up-popular lists
        _.chain(fields)
        .each(function (field) {
          field.displayOrder = _.indexOf(columns, field.name) + 1;
          field.display = !!field.displayOrder;
          field.rowCount = fieldCounts[field.name];
        })
        .sortBy(function (field) {
          return (field.count || 0) * -1;
        })
        .groupBy(function (field) {
          if (field.display) return 'selected';
          return field.count > 0 ? 'popular' : 'unpopular';
        })
        .tap(function (groups) {
          groups.selected = _.sortBy(groups.selected || [], 'displayOrder');

          groups.popular = groups.popular || [];
          groups.unpopular = groups.unpopular || [];

          // move excess popular fields to un-popular list
          const extras = groups.popular.splice(config.get('fields:popularLimit'));
          groups.unpopular = extras.concat(groups.unpopular);
        })
        .each(function (group, name) {
          $scope[name + 'Fields'] = _.sortBy(group, name === 'selected' ? 'display' : 'name');
        })
        .commit();

        // include undefined so the user can clear the filter
        $scope.fieldTypes = _.union(['any'], _.pluck(fields, 'type'));
      });

      $scope.increaseFieldCounter = function (fieldName) {
        $scope.indexPattern.popularizeField(fieldName, 1);
      };

      function getVisualizeUrl(field) {
        if (!$scope.state) {return '';}

        let agg = {};
        const isGeoPoint = field.type === 'geo_point';
        const type = isGeoPoint ? 'tile_map' : 'histogram';
        // If we're visualizing a date field, and our index is time based (and thus has a time filter),
        // then run a date histogram
        if (field.type === 'date' && $scope.indexPattern.timeFieldName === field.name) {
          agg = {
            type: 'date_histogram',
            schema: 'segment',
            params: {
              field: field.name,
              interval: 'auto'
            }
          };

        } else if (isGeoPoint) {
          agg = {
            type: 'geohash_grid',
            schema: 'segment',
            params: {
              field: field.name,
              precision: 3
            }
          };
        } else {
          agg = {
            type: 'terms',
            schema: 'segment',
            params: {
              field: field.name,
              size: parseInt(config.get('discover:aggs:terms:size'), 10),
              orderBy: '2'
            }
          };
        }

        return '#/visualize/create?' + $.param(_.assign(_.clone($location.search()), {
          indexPattern: $scope.state.index,
          type: type,
          _a: rison.encode({
            filters: $scope.state.filters || [],
            query: migrateLegacyQuery($scope.state.query) || undefined,
            vis: {
              type: type,
              aggs: [
                agg,
                { schema: 'metric', type: 'count', 'id': '2' }
              ]
            }
          })
        }));
      }

      $scope.computeDetails = function (field, recompute) {
        if (_.isUndefined(field.details) || recompute) {
          field.details = Object.assign(
            {
              visualizeUrl: field.visualizable ? getVisualizeUrl(field) : null,
            },
            fieldCalculator.getFieldValueCounts({
              hits: $scope.rows,
              field: field,
              count: 5,
              grouped: false
            }),
          );
          _.each(field.details.buckets, function (bucket) {
            bucket.display = field.format.convert(bucket.value);
          });
          $scope.increaseFieldCounter(field, 1);
        } else {
          delete field.details;
        }
      };

      function getFields() {
        const prevFields = $scope.fields;
        const indexPattern = $scope.indexPattern;
        const hits = $scope.hits;
        const fieldCounts = $scope.fieldCounts;

        if (!indexPattern || !hits || !fieldCounts) return;

        const fieldSpecs = indexPattern.fields.slice(0);
        const fieldNamesInDocs = _.keys(fieldCounts);
        const fieldNamesInIndexPattern = _.keys(indexPattern.fields.byName);

        _.difference(fieldNamesInDocs, fieldNamesInIndexPattern)
        .forEach(function (unknownFieldName) {
          fieldSpecs.push({
            name: unknownFieldName,
            type: 'unknown'
          });
        });

        const fields = new FieldList(indexPattern, fieldSpecs);

        if (prevFields) {
          fields.forEach(function (field) {
            field.details = _.get(prevFields, ['byName', field.name, 'details']);
          });
        }

        return fields;
      }
                    init();
                });
            });
        });
});
