import rison from 'rison-node';
import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';

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

require('ui/modules').get('app/wazuh', []).controller('VisController', function ($scope, $route, timefilter, AppState, appState, $location, kbnUrl, $timeout, courier, Private, Promise, savedVisualizations, SavedVis, getAppState,$rootScope) {
	
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

		// Initialize visualization initial state

		$scope.vis = $scope.newVis.vis;
		$scope.indexPattern = $scope.vis.indexPattern;
		$scope.state = $state;
		$scope.uiState = $state.makeStateful('uiState');
		$scope.vis.setUiState($scope.uiState);
		
		// Initialize time
		$scope.timefilter = timefilter;
		
		// Set default time
		if($route.current.params._g == "()")
			$scope.timefilter.time.from = "now-24h";
		

		$timeout(
		function() { 

			// Set visualization params
			var visDecoded = rison.decode($scope.visA);
			var visState = $scope.vis.getEnabledState();
			visState.aggs = visDecoded.vis.aggs;
			visState.title = visDecoded.vis.title;
			visState.params = visDecoded.vis.params;
			$scope.vis.setState(visState);
			$state.save();
			$scope.fetch();

		}, 0);
		
		// Fetch visualization
		$scope.fetch = function () 
		{
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
		$rootScope.$on('update', function (event, query) {
			$scope.filter.current.query_string.query = $scope.filter.raw+" AND "+query.query_string.query
			courier.fetch();
		 });
		// Listen for destroy 
		$scope.$on('$destroy', function () {
			$scope.newVis.destroy();
		});
		
		$scope.loadBeforeShow = true;
    };

  });
