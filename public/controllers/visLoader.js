require('ui/styles/base.less');
require('ui/styles/mixins.less');
require('ui/share/styles/index.less');
require('ui/styles/control_group.less');
require('ui/styles/navbar.less');
require('plugins/kibana/visualize/styles/main.less');
require('ui/styles/config.less');
require('ui/styles/spinner.less');

import _ from 'lodash';
import 'plugins/kibana/visualize/saved_visualizations/saved_visualizations';
import 'plugins/kibana/visualize/editor/sidebar';
import 'plugins/kibana/visualize/editor/agg_filter';
import 'ui/visualize';
import 'ui/collapsible_sidebar';
import 'ui/share';
import 'ui/listen';
import 'ui/bind';
import 'ui/fancy_forms';
import 'ui/filter_bar'

import Notifier from 'ui/notify/notifier';
import RegistryVisTypesProvider from 'ui/registry/vis_types';
require('plugins/metric_vis/metric_vis');
require('plugins/table_vis/table_vis');
require('plugins/markdown_vis/markdown_vis');
RegistryVisTypesProvider.register(require('plugins/kbn_vislib_vis_types/histogram'));
RegistryVisTypesProvider.register(require('plugins/kbn_vislib_vis_types/line'));
RegistryVisTypesProvider.register(require('plugins/kbn_vislib_vis_types/pie'));
RegistryVisTypesProvider.register(require('plugins/kbn_vislib_vis_types/area'));
RegistryVisTypesProvider.register(require('plugins/kbn_vislib_vis_types/tile_map'));

import DocTitleProvider from 'ui/doc_title';
import UtilsBrushEventProvider from 'ui/utils/brush_event';
import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';
import FilterBarFilterBarClickHandlerProvider from 'ui/filter_bar/filter_bar_click_handler';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';

import 'ui/state_management/app_state';
import StateManagementAppStateProvider from 'ui/state_management/app_state';
import 'plugins/kibana/discover/saved_searches/saved_searches.js';

import 'ui/stringify/register';
import RegistryFieldFormatsProvider from 'ui/registry/field_formats';

import 'ui/kbn_top_nav';
import 'ui/timepicker';
import 'ui/directives/paginate.js';
import 'ui/directives/rows.js';

import 'ui/directives/pretty_duration.js';
import 'ui/parse_query';
import 'ui/persisted_log';
import 'ui/typeahead';

import 'plugins/spy_modes/req_resp_stats_spy_mode';
import 'plugins/spy_modes/table_spy_mode';

require('ui/courier');

var app = require('ui/modules').get('app/wazuh', [])
  .directive('kbnVis', [function () {
    return {
      restrict: 'E',
      scope: {
        visType: '@visType',
        visIndexPattern: '@visIndexPattern',
        visA: '@visA',
        visG: '@visG',
        visFilter: '@visFilter',
        visHeight: '@visHeight',
        visWidth: '@visWidth',
        visSearchable: '@visSearchable',
        visClickable: '@visClickable'
      },
      template: require('../templates/directives/vis-template.html')
    }
  }]);

require('ui/modules').get('app/wazuh', [])
  .controller('VisEditorW', function ($scope, $route, timefilter, AppState, appState, $location, kbnUrl, $timeout, courier, Private, Promise, savedVisualizations) {
    $scope.v = {};
    $scope.chrome = {};
    $scope.chrome.getVisible = function () {
      return true;
    }
	$scope.defaultManagerName = appState.getDefaultManager().name;
	$scope.v.filter = $scope.visFilter + " AND host: " + $scope.defaultManagerName;

	
	
    var renderVis = function () {

      const visTypes = Private(RegistryVisTypesProvider);
      const visType = _.find(visTypes, { name: $scope.visType });
      if (!visType) {
        throw new Error('You must provide a valid visualization type');
      }

      if (visType.requiresSearch && !$scope.visIndexPattern) {
        throw new Error('You must provide either an indexPattern');
      }

      return savedVisualizations.get({ 'type': $scope.visType, 'indexPattern': $scope.visIndexPattern, '_g': $scope.visG, '_a': $scope.visA })
        .catch(courier.redirectWhenMissing({
          '*': '/'
        }));
    }
	
    renderVis().then(function (_sVis) {
      $scope._loadVisAsync = true;
	  const queryFilter = Private(FilterBarQueryFilterProvider);	
      const savedVis = _sVis;

      const vis = savedVis.vis;
      const editableVis = vis.createEditableVis();
      vis.requesting = function () {
        const requesting = editableVis.requesting;
        requesting.call(vis);
        requesting.call(editableVis);
      };

      const searchSource = savedVis.searchSource;

      $scope.topNavMenu = [{
        key: 'refresh',
        description: 'Refresh',
        run: function () { $scope.fetch(); }
      }];


	  const matchQueryFilter = function (filter) {
                    return filter.query && filter.query.query_string && !filter.meta;
       };
	   
	   const extractQueryFromFilters = function (filters) {
                    const filter = _.find(filters, matchQueryFilter);
                    if (filter) return filter.query;
                };
				
      let $state = $scope.$state = (function initState() {
		console.log("First state");
		$scope.previousRoute = $route.current.params._a; 
		
        $route.current.params._a = $scope.visA;
        $route.updateParams({ '_a': $scope.visA });
        $route.current.params._g = $scope.visG;
        $route.updateParams({ '_g': $scope.visG });
		
        const stateDefaults = {
          uiState: {},
          linked: false,
          query: $scope.visFilter ? $scope.visFilter : { query_string: { analyze_wildcard: '!t', query: '*' } },
          filters: _.reject(searchSource.getOwn('filter'), matchQueryFilter),
          vis: {}
        };

        $state = new AppState(stateDefaults);
		$route.updateParams({ '_a': $scope.previousRoute });
		$route.current.params._a = $scope.previousRoute
		console.log($state);
        return $state;
      } ());

      $scope.state = $state;	
				
      $scope.$watch("visG", function () {	  
        //This gets called when data changes.
        $route.current.params._g = $scope.visG;
        $route.updateParams({ '_g': $scope.visG });
		console.log("Watch VISG");
        $state.emit('fetch_with_changes');
		//init();
      });

	  
		 function updateQueryOnRootSource() {
			const filters = queryFilter.getFilters();
			if ($state.query) {
				searchSource.set('filter', _.union(filters, [{
					query: $state.query
				}]));
			} else {
				searchSource.set('filter', filters);
			}
		}


		// update root source when filters update
		$scope.$listen(queryFilter, 'update', function () {
			//updateQueryOnRootSource();
			//$state.save();
			console.log("queryFilter changed!");
			console.log(queryFilter);
			
		});

		// update data when filters fire fetch event
		$scope.$listen(queryFilter, 'fetch', $scope, function () {
			console.log("queryFilter changed!");
		});
				
      function init() {
		  console.log("Vis INIT 1");
        // export some objects
        $scope.savedVis = savedVis;
        $scope.searchSource = searchSource;
        $scope.vis = vis;

        $scope.indexPattern = vis.indexPattern;
        $scope.editableVis = editableVis;
        $scope.state = $state;

        $scope.uiState = $state.makeStateful('uiState');

        vis.setUiState($scope.uiState);

        $scope.timefilter = timefilter;

        // track state of editable vis vs. "actual" vis
        $scope.stageEditableVis = transferVisState(editableVis, vis, true);
        $scope.resetEditableVis = transferVisState(vis, editableVis);

        $scope.$watch('searchSource.get("index").timeFieldName', function (timeField) {
          timefilter.enabled = !!timeField;
		  
        });
		
		$scope.$on('searchFilterChanged', function (event, data) {
		  console.log(data); // 'Data to send'
		  //$scope.visFilter = data.stateQuery.query_string.query;
		  
		});
		
		
        $scope.$listen($state, 'fetch_with_changes', function (keys) {
		console.log("Vis fetch_with_changes");
          let $state = $scope.$state = (function initState() {
			$scope.previousRoute = $route.current.params._a;
			
            $route.current.params._a = $scope.visA;
            $route.updateParams({ '_a': $scope.visA });
            $route.current.params._g = $scope.visG;
            $route.updateParams({ '_g': $scope.visG });
			
			
            const stateDefaults = {
              uiState: {},
              linked: false,
              query: $scope.visFilter ? $scope.visFilter : { query_string: { analyze_wildcard: '!t', query: '*' } },
              filters: [],
              vis: {}
            };
            $state = new AppState(stateDefaults);
			
			$route.updateParams({ '_a': $scope.previousRoute });
			$route.current.params._a = $scope.previousRoute

			
			
            return $state;
          } ());

          $scope.state = $state;

          if (_.contains(keys, 'linked') && $state.linked === true) {
            return;
          }

          $state.vis.listeners = _.defaults($state.vis.listeners || {}, vis.listeners);

          vis.setState($state.vis);
          editableVis.setState($state.vis);

          // we use state to track query, must write before we fetch
          if ($scope.v.filter && !$state.linked) {
            searchSource.set('query', $scope.v.filter);
          } else {
            searchSource.set('query', null);
          }

          if (_.isEqual(keys, ['filters'])) {
            // updates will happen in filter watcher if needed
            return;
          }


          $scope.fetch();
        });

        $scope.$listen(timefilter, 'fetch', _.bindKey($scope, 'fetch'));
		
        //$scope.$listen(queryFilter.getFilters(), 'fetch', _.bindKey($scope, 'fetch'));
			
		
	
        $scope.$on('$destroy', function () {
          savedVis.destroy();
        });
		
				
      }

      $scope.fetch = function () {
		 console.log("Fetch VIS 1");
		 console.log(timefilter);
        
        if ($scope.visClickable) searchSource.set('filter', queryFilter.getFilters());
		console.log(queryFilter.getFilters());
        if (!$state.linked) searchSource.set('query', $scope.v.filter);
        if ($scope.vis.type.requiresSearch) {
          courier.fetch();
        }
      };


      function transferVisState(fromVis, toVis, stage) {
        return function () {
          const view = fromVis.getEnabledState();
          const full = fromVis.getState();
          toVis.setState(view);
          editableVis.dirty = false;
          $state.vis = full;
          $state.save();
			console.log("Vis transferVisState");
          if (stage) $scope.fetch();
        };
      }
      init();
	
	  
    });
	

		

  });
