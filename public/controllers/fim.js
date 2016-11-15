require('plugins/kibana/discover/styles/main.less');
require('ui/doc_table/doc_table.js');
require('ui/styles/sidebar.less');
require('ui/styles/table.less');
require('ui/doc_viewer/doc_viewer.js');
require('ui/doc_title/doc_title.js');
require('ui/styles/truncate.less');
require('ui/style_compile/style_compile.js');
require('ui/registry/doc_views.js');
require('plugins/kbn_doc_views/kbn_doc_views.js');
require('ui/tooltip/tooltip.js');
import 'plugins/kibana/discover/components/field_chooser';
import _ from 'lodash';
import moment from 'moment';
import getSort from 'ui/doc_table/lib/get_sort';
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
import 'ui/highlight/highlight_tags';
import 'ui/share';
import VisProvider from 'ui/vis';
import DocTitleProvider from 'ui/doc_title';
import UtilsBrushEventProvider from 'ui/utils/brush_event';
import PluginsKibanaDiscoverHitSortFnProvider from 'plugins/kibana/discover/_hit_sort_fn';
import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';
import FilterManagerProvider from 'ui/filter_manager';
import AggTypesBucketsIntervalOptionsProvider from 'ui/agg_types/buckets/_interval_options';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import indexTemplate from 'plugins/wazuh/templates/directives/dis-template.html';
import StateProvider from 'ui/state_management/state';


import 'plugins/kibana/discover/saved_searches/saved_searches';
import 'plugins/kibana/discover/directives/no_results';
import 'plugins/kibana/discover/directives/timechart';
import 'ui/collapsible_sidebar';
import 'plugins/kibana/discover/components/field_chooser/field_chooser';
import 'plugins/kibana/discover/styles/main.less';
import 'ui/doc_table/components/table_row';

import savedObjectRegistry from 'ui/saved_objects/saved_object_registry';
savedObjectRegistry.register(require('plugins/kibana/discover/saved_searches/saved_search_register'));

// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('fimController', function ($scope, $q, DataFactory, $mdToast, errlog, config, courier, $route, $window, Notifier, AppState, timefilter, Promise, Private, kbnUrl, highlightTags, $location, savedSearches, appState) {
    //Initialisation
    $scope.load = true;
    var objectsArray = [];
    var loadWatch;

    $scope._fimEvent = 'all'
    $scope.files = [];

    //Print error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        if ($scope._files_blocked) {
            $scope._files_blocked = false;
        }
    };

    //Functions

	$scope.setTimer = function (time) {
        $scope.timerFilterValue = time;
    };
	
    $scope.setSort = function (field) {
        if ($scope._sort === field) {
            if ($scope._sortOrder) {
                $scope._sortOrder = false;
                $scope._sort = '';
                DataFactory.filters.unset(objectsArray['/files'], 'filter-sort');
            } else {
                $scope._sortOrder = true;
                DataFactory.filters.set(objectsArray['/files'], 'filter-sort', field);
            }
        } else {
            $scope._sortOrder = false;
            $scope._sort = field;
            DataFactory.filters.set(objectsArray['/files'], 'filter-sort', '-' + field);
        }
    }

    $scope.fileSearchFilter = function (search) {
        if (search) {
            DataFactory.filters.set(objectsArray['/files'], 'search', search);
        } else {
            DataFactory.filters.unset(objectsArray['/files'], 'search');
        }
    };

    $scope.fileEventFilter = function (event) {
        if (event == 'all') {
            DataFactory.filters.unset(objectsArray['/files'], 'event');
        } else {
            DataFactory.filters.set(objectsArray['/files'], 'event', event);
        }
    };

    $scope.filesObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope._files_blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray['/files']);
            if (DataFactory.filters.flag(objectsArray['/files'])) {
                $scope._files_blocked = true;
                DataFactory.scrollTo(objectsArray['/files'], 50)
                    .then(function (data) {
                        $scope.files.length = 0;
                        $scope.files = data.data.items;
                        DataFactory.filters.unflag(objectsArray['/files']);
                        $scope._files_blocked = false;
                    }, printError);
            } else if ((_pos > 70) || (_pos < 0)) {
                $scope._files_blocked = true;
                DataFactory.scrollTo(objectsArray['/files'], index)
                    .then(function (data) {
                        $scope.files.length = 0;
                        $scope.files = data.data.items;
                        $scope._files_blocked = false;
                    }, printError);
            } else {
                return $scope.files[_pos];
            }
        },
        getLength: function () {
            return DataFactory.getTotalItems(objectsArray['/files']);
        },
    };

    $scope.changeType = function () {
        $scope.showFilesRegistry = !$scope.showFilesRegistry;
        fileTypeFilter();
    };

    var fileTypeFilter = function () {
        DataFactory.filters.set(objectsArray['/files'], 'filetype', $scope.showFilesRegistry ? 'registry' : 'file');
    };

    var createWatch = function () {
        loadWatch = $scope.$watch(function () {
            return $scope.$parent._agent;
        }, function () {
            DataFactory.initialize('get', '/syscheck/' + $scope.$parent._agent.id, {}, 100, 0)
                .then(function (data) {
                    DataFactory.clean(objectsArray['/files']);
                    objectsArray['/files'] = data;
                    DataFactory.get(objectsArray['/files'])
                        .then(function (data) {
                            $scope.files.length = 0;
                            $scope.files = data.data.items;
                            DataFactory.filters.register(objectsArray['/files'], 'search', 'string');
                            DataFactory.filters.register(objectsArray['/files'], 'event', 'string');
                            DataFactory.filters.register(objectsArray['/files'], 'filter-sort', 'string');
                            DataFactory.filters.register(objectsArray['/files'], 'filetype', 'string');
                            $scope._sort = '';
                            $scope.fileSearchFilter($scope._fileSearch);
                            $scope.fileEventFilter($scope._fimEvent);
                            fileTypeFilter();
                        }, printError);
                }, printError);
        });
    };

    var load = function () {
        DataFactory.initialize('get', '/syscheck/' + $scope.$parent._agent.id, {}, 100, 0)
            .then(function (data) {
                objectsArray['/files'] = data;
                DataFactory.get(objectsArray['/files'])
                    .then(function (data) {
                        $scope.files = data.data.items;
                        DataFactory.filters.register(objectsArray['/files'], 'search', 'string');
                        DataFactory.filters.register(objectsArray['/files'], 'event', 'string');
                        DataFactory.filters.register(objectsArray['/files'], 'filter-sort', 'string');
                        DataFactory.filters.register(objectsArray['/files'], 'filetype', 'string');
                        DataFactory.filters.set(objectsArray['/files'], 'filetype', 'file');
                        createWatch();
                        $scope.load = false;
                    }, printError);
            }, printError);
    };

	
	// TMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMP
	
	$scope.disA = "(columns:!(SyscheckFile.path,SyscheckFile.event,SyscheckFile.uname_after,SyscheckFile.gname_after,full_log),index:'ossec-*',interval:auto,query:(query_string:(analyze_wildcard:!t,query:'location:%20syscheck')),sort:!('@timestamp',desc))";
	$scope.disG = "(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-30d,mode:quick,to:now))";
	$scope.disFilter = "location: syscheck AND AgentName: " + $scope.$parent._agent.name;
	$scope.tableHeight = "800";
	$scope.infiniteScroll = true;

	$scope.defaultManagerName = appState.getDefaultManager().name;
	//$scope.stateQuery = $scope.disFilter + " AND host: " + $scope.defaultManagerName;
	$scope.stateQuery = $scope.disFilter;
	$scope.chrome = {};
	$scope.chrome.getVisible = function () {
		return true;
	}

  const notify = new Notifier({
    location: '*'
  });

	
  $route.requireDefaultIndex = true;
  $route.template = $route.indexTemplate;
  $route.reloadOnSearch = false;

  const State = Private(StateProvider);
  courier.indexPatterns.getIds()
    .then(function (list) {
      const state = new State('_a', {});

      const specified = !!state.index;
      const exists = _.contains(list, state.index);
      const id = exists ? state.index : config.get('defaultIndex');
      state.destroy();

      Promise.props({
        list: list,
        loaded: courier.indexPatterns.get(id),
        stateVal: state.index,
        stateValFound: specified && exists
      }).then(function (result) {
        $scope._ip = result;
        savedSearches.get().then(function (result) {
          $scope._savedSearch = result;

          const Vis = Private(VisProvider);
          const docTitle = Private(DocTitleProvider);
          const brushEvent = Private(UtilsBrushEventProvider);
          const HitSortFn = Private(PluginsKibanaDiscoverHitSortFnProvider);
          const queryFilter = Private(FilterBarQueryFilterProvider);
          const filterManager = Private(FilterManagerProvider);

          $scope.intervalOptions = Private(AggTypesBucketsIntervalOptionsProvider);
          $scope.showInterval = false;

          $scope.intervalEnabled = function (interval) {
            return interval.val !== 'custom';
          };

          $scope.toggleInterval = function () {
            $scope.showInterval = !$scope.showInterval;
          };
          $scope.topNavMenu = [];
          $scope.timefilter = timefilter;


          // the saved savedSearch
          const savedSearch = $scope._savedSearch;
          $scope.$on('$destroy', savedSearch.destroy);

          // the actual courier.SearchSource
          $scope.searchSource = savedSearch.searchSource;
          $scope.indexPattern = resolveIndexPatternLoading();
          $scope.searchSource.set('index', $scope.indexPattern);

          if (savedSearch.id) {
            docTitle.change(savedSearch.title);
          }

          const $state = $scope.state = new AppState(getStateDefaults());
          $scope.uiState = $state.makeStateful('uiState');
          $state.query = ($scope.stateQuery ? $scope.stateQuery : '*');

          function getStateDefaults() {
            var _aJson = rison.decode($scope.disA);
			
			
            return {
              query: $scope.disFilter ? $scope.disFilter : { query_string: { analyze_wildcard: '!t', query: '*' } },
              sort: _aJson.sort.length > 0 ? _aJson.sort : getSort.array(savedSearch.sort, $scope.indexPattern),
              columns: _aJson.columns.length > 0 ? _aJson.columns : (savedSearch.columns.length > 0 ? savedSearch.columns : config.get('defaultColumns')),
              index: _aJson.index ? _aJson.index : $scope.indexPattern.id,
              interval: 'auto',
              filters: _.cloneDeep(queryFilter.getFilters())
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
            indexPatternList: $scope.indexSelector ? $scope._ip.list : [],
            timefilter: $scope.timefilter
          };

          const init = _.once(function () {
            const showTotal = 5;
            $scope.failuresShown = showTotal;
            $scope.showAllFailures = function () {
              $scope.failuresShown = $scope.failures.length;
            };
            $scope.showLessFailures = function () {
              $scope.failuresShown = showTotal;
            };

            $scope.updateDataSource()
              .then(function () {
                $scope.$listen(timefilter, 'fetch', function () {
                  $scope.fetch();
                });

                $scope.$watchCollection('state.sort', function (sort) {
                  if (!sort) return;

                  // get the current sort from {key: val} to ["key", "val"];
                  const currentSort = _.pairs($scope.searchSource.get('sort')).pop();

                  // if the searchSource doesn't know, tell it so
                  if (!angular.equals(sort, currentSort)) $scope.fetch();
                });

                // update data source when filters update
                $scope.$listen(queryFilter, 'update', function () {
					
					return $scope.updateDataSource().then(function () {
					});
                });

                // update data source when hitting forward/back and the query changes
                $scope.$listen($state, 'fetch_with_changes', function (diff) {
                  $scope.fetch();
                });

                // fetch data when filters fire fetch event
                $scope.$listen(queryFilter, 'fetch', $scope.fetch);

                $scope.$watch('opts.timefield', function (timefield) {
                  timefilter.enabled = !!timefield;
                });

                $scope.$watch('state.interval', function (interval, oldInterval) {
                  if (interval !== oldInterval && interval === 'auto') {
                    $scope.showInterval = false;
                  }
                  $scope.fetch();
                });

                $scope.$watch('vis.aggs', function () {
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

                    prev = current;
                  };
                } ()));

                $scope.searchSource.onError(function (err) {
                  notify.error(err);
                }).catch(notify.fatal);

                function initForTime() {
                  return setupVisualization().then($scope.updateTime);
                }

                return Promise.resolve($scope.opts.timefield && initForTime())
                  .then(function () {
                    init.complete = true;
                    //$state.replace();
                    $scope.$emit('application.load');
                    $scope.fetch();
                  });
              });
          });

          $scope.opts.saveDataSource = function () {
            return $scope.updateDataSource()
              .then(function () {
                savedSearch.id = savedSearch.title;
                savedSearch.columns = $scope.state.columns;
                savedSearch.sort = $scope.state.sort;

                return savedSearch.save()
                  .then(function (id) {
                    $scope.kbnTopNav.close('save');

                    if (id) {
                      notify.info('Saved Data Source "' + savedSearch.title + '"');
                      if (savedSearch.id !== $route.current.params.id) {
                      } else {
                        // Update defaults so that "reload saved query" functions correctly
                        $state.setDefaults(getStateDefaults());
						
                      }
                    }
                  });
              })
              .catch(notify.error);
          };

          $scope.opts.fetch = $scope.fetch = function () {

            // ignore requests to fetch before the app inits
            if (!init.complete) return;

            $scope.updateTime();

            $scope.updateDataSource()
              .then(setupVisualization)
              .then(function () {
                return courier.fetch();
              })
              .catch(notify.error);
          };

          $scope.searchSource.onBeginSegmentedFetch(function (segmented) {

            function flushResponseData() {
              $scope.hits = 0;
              $scope.faliures = [];
              $scope.rows = [];
              $scope.fieldCounts = {};
            }

            if (!$scope.rows) flushResponseData();

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
            const sortBy = (function () {
              if (!_.isArray(sort)) return 'implicit';
              else if (sort[0] === '_score') return 'implicit';
              else if (sort[0] === timeField) return 'time';
              else return 'non-time';
            } ());

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

            segmented.on('segment', notify.timed('handle each segment', function (resp) {
              if (resp._shards.failed > 0) {
                $scope.failures = _.union($scope.failures, resp._shards.failures);
                $scope.failures = _.uniq($scope.failures, false, function (failure) {
                  return failure.index + failure.shard + failure.reason;
                });
              }
            }));

            segmented.on('mergedSegment', function (merged) {
              $scope.mergedEsResp = merged;
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

            segmented.on('complete', function () {
			  
              if ($scope.fetchStatus.hitCount === 0) {
                flushResponseData();
              }

              $scope.fetchStatus = null;
            });
          }).catch(notify.fatal);

          $scope.updateTime = function () {
            $scope.timeRange = {
              from: dateMath.parse(timefilter.time.from),
              to: dateMath.parse(timefilter.time.to, true)
            };
          };

          $scope.updateDataSource = Promise.method(function () {

			
			$route.current.params._a = $scope.disA;
            $route.updateParams({ '_a': $scope.disA })
			console.log("Emitiendo desde fim.js");
			
			$scope.$broadcast('searchFilterChanged', {
			  stateQuery: $scope.stateQuery // send whatever you want
			});
			
            $scope.searchSource
              .size($scope.opts.sampleSize)
              .sort(getSort($state.sort, $scope.indexPattern))
              .query(!$scope.stateQuery ? null : $scope.stateQuery)
              .set('filter', queryFilter.getFilters());


            if (config.get('doc_table:highlight')) {
              $scope.searchSource.highlight({
                pre_tags: [highlightTags.pre],
                post_tags: [highlightTags.post],
                fields: { '*': {} },
                require_field_match: false,
                fragment_size: 2147483647 // Limit of an integer.
              });
            }
          });

          // TODO: On array fields, negating does not negate the combination, rather all terms
          $scope.filterQuery = function (field, values, operation) {
            $scope.indexPattern.popularizeField(field, 1);
            filterManager.add(field, values, operation, $state.index);
          };

          $scope.toTop = function () {
            $window.scrollTo(0, 0);
          };

          let loadingVis;
          function setupVisualization() {
            // If we're not setting anything up we need to return an empty promise
            if (!$scope.opts.timefield) return Promise.resolve();
            if (loadingVis) return loadingVis;

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
                click: function (e) {
                  notify.log(e);
                  timefilter.time.from = moment(e.point.x);
                  timefilter.time.to = moment(e.point.x + e.data.ordered.interval);
                  timefilter.time.mode = 'absolute';
                },
                brush: brushEvent
              },
              aggs: visStateAggs
            });

            $scope.searchSource.aggs(function () {
              $scope.vis.requesting();
              return $scope.vis.aggs.toDsl();
            });

            // stash this promise so that other calls to setupVisualization will have to wait
            loadingVis = new Promise(function (resolve) {
              $scope.$on('ready:vis', function () {
                resolve($scope.vis);
              });
            })
              .finally(function () {
                // clear the loading flag
                loadingVis = null;
              });

            return loadingVis;
          }

          function resolveIndexPatternLoading() {
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

          init();
        });
      });


    });
	
	// TMPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    //Load
    try {
        load();
		$scope.setTimer($scope.$parent.timeFilter);
    } catch (e) {
        $mdToast.show({
            template: '<md-toast> Unexpected exception loading controller </md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        errlog.log('Unexpected exception loading controller', e);
    }

	
    // Timer filter watch
    var timerWatch = $scope.$watch(function () {
        return $scope.$parent.timeFilter;
    }, function () {
        $scope.setTimer($scope.$parent.timeFilter);
    });
	
    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
        $scope.files.length = 0;
        loadWatch();
		timerWatch();
    });

});
