import rison from 'rison-node';
import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';
import UtilsBrushEventProvider from 'ui/utils/brush_event';

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
		  visId: '@visId',
		  visHeight: '@visHeight',
		  visWidth: '@visWidth',
		  visSearchable: '@visSearchable',
		  visClickable: '@visClickable'
		},
		template: require('../templates/directives/kibana-visualization-template.html')
    }
  }]).directive('kbnVisValue', [function () {
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
		template: require('../templates/directives/kibana-visualization-value-template.html')
    }
  }]);

require('ui/modules').get('app/wazuh', []).controller('VisController', function ($scope, $route, timefilter, AppState, appState, $location, kbnUrl, $timeout, courier, Private, Promise, savedVisualizations, SavedVis, getAppState, $rootScope) {
	
	
	if(typeof $rootScope.visCounter === "undefined")
		$rootScope.visCounter = 0;
	
	$rootScope.visCounter++;
	
	// Set filters
	$scope.filter = {};
	$scope.defaultManagerName = appState.getDefaultManager().name;
	$scope.filter.raw = $scope.visFilter + " AND host: " + $scope.defaultManagerName;
	$scope.filter.current = $scope.filter.raw;
			
	// Initialize Visualization

	$scope.newVis = new SavedVis({ 'type': $scope.visType, 'indexPattern': $scope.visIndexPattern });
	$scope.newVis.init().then(function () {
		// Render visualization
		renderVisualization();
	});
	
	
	

	
    function renderVisualization() {
	
		$scope.loadBeforeShow = false;
		
		// Get or create App State	
		let $state = $scope.$state = (function initState() {
		
			if(getAppState())
				$state = getAppState();
			else
				$state = new AppState();	

			return $state;
		} ());
		
		// Initialize queryFilter and searchSorce

		$scope.queryFilter = Private(FilterBarQueryFilterProvider);	
		$scope.searchSource = $scope.newVis.searchSource;
		const brushEvent = Private(UtilsBrushEventProvider);
		
		// Initialize visualization initial state


		
		// Initialize time
		$scope.timefilter = timefilter;
		 
		// Set default time
		if($route.current.params._g == "()")
			$scope.timefilter.time.from = "now-24h";
		

		$timeout(
		function() {  
			
			// Bind visualization, index pattern and state
			$scope.vis = $scope.newVis.vis;
			$scope.indexPattern = $scope.vis.indexPattern;
			$scope.state = $state;
			
			// Build visualization
			var visDecoded = rison.decode($scope.visA);
			var visState = $scope.vis.getEnabledState();
			visState.aggs = visDecoded.vis.aggs;
			visState.title = visDecoded.vis.title;
			visState.params = visDecoded.vis.params;
			
			// Set Vis states
			$scope.uiState = $state.makeStateful('uiState');
			$scope.vis.setUiState($scope.uiState);
			$scope.vis.listeners = {brush: brushEvent};
			$scope.vis.getEnabledState();
			$scope.vis.setState(visState);
			
			$scope.loadBeforeShow = true;
			$rootScope.visCounter--;
			
		}, 0);
		
		


		// Fetch visualization
		$scope.fetch = function () 
		{
			$state.save();	
			if($scope.visIndexPattern == "ossec-*"){
				$scope.searchSource.set('filter', $scope.queryFilter.getFilters());
				$scope.searchSource.set('query', $scope.filter.current);
			}
			if ($scope.vis.type.requiresSearch) {
				courier.fetch();
			}

		};
		
		 
		// Listeners
		
		// Listen for timefilter changes
		$scope.$listen(timefilter, 'fetch', function () {
			$scope.fetch(); 
        });
		
		// Listen for filter changes
		$scope.$listen($scope.queryFilter, 'update', function () {
			$scope.fetch();
		 });
		 
		// Listen for query changes
		$rootScope.$on('updateQuery', function (event, query) {
			if(query !== "undefined"){
				$scope.filter.current.query_string.query = $scope.filter.raw+" AND "+query.query_string.query;
				courier.fetch();
			}
		 });
		 
		// Listen for visualization queue prepared
		$rootScope.$on('fetchVisualization', function (event) {
				courier.fetch();
		 });		 
		 
		// Listen for destroy 
		$scope.$on('$destroy', function () {
			$scope.newVis.destroy();
		});
		
	
		
    };

  });
