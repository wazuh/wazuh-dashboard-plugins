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

import rison from 'rison-node';
import Notifier from 'ui/notify/notifier';
import RegistryVisTypesProvider from 'ui/registry/vis_types';
require('plugins/metric_vis/metric_vis');
require('plugins/table_vis/table_vis');
require('plugins/markdown_vis/markdown_vis');


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
  .directive('kbnVisTest', [function () {
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
      template: require('../templates/directives/vis-template-full.html')
    }
  }]);

require('ui/modules').get('app/wazuh', [])
  .controller('VisController', function ($scope, $route, timefilter, AppState, appState, $location, kbnUrl, $timeout, courier, Private, Promise, savedVisualizations, SavedVis,getAppState) {
    $scope.v = {};
    $scope.chrome = {};
    $scope.chrome.getVisible = function () {
      return true;
    }
	$scope.defaultManagerName = appState.getDefaultManager().name;
	$scope.v.filter = $scope.visFilter + " AND host: " + $scope.defaultManagerName;

	
	// Initialize Visualization
	$scope.newVis = new SavedVis({ 'type': $scope.visType, 'indexPattern': $scope.visIndexPattern });
	$scope.newVis.init().then(function () {
		// Render visualization
		renderVisualization();
	});
	
	
	
    function renderVisualization() {
	
		
      $scope._loadVisAsync = true;
	  const queryFilter = Private(FilterBarQueryFilterProvider);	
      const savedVis = $scope.newVis;

      const vis = savedVis.vis;


      const searchSource = savedVis.searchSource;




	  const matchQueryFilter = function (filter) {
                    return filter.query && filter.query.query_string && !filter.meta;
       };
	   
	   const extractQueryFromFilters = function (filters) {
                    const filter = _.find(filters, matchQueryFilter);
                    if (filter) return filter.query;
                };
				
      let $state = $scope.$state = (function initState() {

		$scope.previousRoute = $route.current.params._a; 
		
		//console.log("En render: " + $scope.visA);
        //$route.current.params._a = $scope.visA;
       // $route.updateParams({ '_a': $scope.visA });
          $route.current.params._g = $scope.visG;
	     $route.updateParams({ '_g': $scope.visG });
		
        const stateDefaults = {
          uiState: {},
          linked: false,
          query: $scope.visFilter ? $scope.visFilter : { query_string: { analyze_wildcard: '!t', query: '*' } },
          filters: [],
          vis: {}
        };
		
		
		if(getAppState())
			$state = getAppState();
		else
			$state = new AppState(stateDefaults);	

		//console.log($state);
		//$route.updateParams({ '_a': $scope.previousRoute });
		//$route.current.params._a = $scope.previousRoute

        return $state;
      } ());

	  
      $scope.state = $state;	
		
	
	
      $scope.$watch("visG", function () {	  
        //This gets called when data changes.
        $route.current.params._g = $scope.visG;
        $route.updateParams({ '_g': $scope.visG });
        //$state.emit('fetch_with_changes');

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


	  			
      function init() {
        // export some objects
        $scope.savedVis = savedVis;
        $scope.searchSource = searchSource;
        $scope.vis = vis;

        $scope.indexPattern = vis.indexPattern;

        $scope.state = $state;

        $scope.uiState = $state.makeStateful('uiState');

        vis.setUiState($scope.uiState);

        $scope.timefilter = timefilter;

        // track state of editable vis vs. "actual" vis


        $scope.$watch('searchSource.get("index").timeFieldName', function (timeField) {
          timefilter.enabled = !!timeField;
		  
        });
		
	// TMMMMMMMMMMMP
	$scope.draw = function () {
		
		$timeout(function() { 

				var visDecoded = rison.decode($scope.visA);
				var visState = $scope.vis.getEnabledState();
				visState.aggs = visDecoded.vis.aggs;
				vis.setState(visState);
				$scope.fetch();
			
			}, 500);
			
	};
	$scope.draw();
	// TMMMMMMMMMMMP
	
        $scope.$listen($scope.state, 'fetch_with_changes', function (keys) {
			console.log("fetch_with_changes");
			$scope.draw();
        });

        //$scope.$listen(timefilter, 'fetch', _.bindKey($scope, 'fetch'));
		
        //$scope.$listen(queryFilter.getFilters(), 'fetch', _.bindKey($scope, 'fetch'));
			
			
		//$timeout(function() { console.log("Antes del emit"); $state.emit('fetch_with_changes') }, 500);
		
		
        $scope.$on('$destroy', function () {
          savedVis.destroy();
        });
		
				
      }
	$scope.fetch = function () {

        searchSource.set('filter', queryFilter.getFilters());
        searchSource.set('query', $scope.v.filter);
        if ($scope.vis.type.requiresSearch) {
          courier.fetch();
        }
      };


      init();
	  console.log("hola1");
	
	  
    };
	

		

  });
  
  app.controller('testController', function ($scope, $route) {
	  console.log("Hi from test controller");
	  
  });
