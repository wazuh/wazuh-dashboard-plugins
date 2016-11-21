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
		template: require('../templates/directives/vis-template-full.html')
    }
  }]);

require('ui/modules').get('app/wazuh', []).controller('VisEditorW', function ($scope, $route, timefilter, AppState, appState, $location, kbnUrl, $timeout, courier, Private, Promise, savedVisualizations, SavedVis, getAppState,$rootScope) {
		
	$scope.filter = {};
	
	$scope.defaultManagerName = appState.getDefaultManager().name;
	$scope.filter.vis = $scope.visFilter + " AND host: " + $scope.defaultManagerName;
			
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
	
	
		$scope.$watch("visG", function () {		
		//This gets called when data changes.
		//$route.current.params._g = $scope.visG;
		//$route.updateParams({ '_g': $scope.visG });
		});

					
		// Initialize queryFilter and searchSorce

		$scope.queryFilter = Private(FilterBarQueryFilterProvider);	
		$scope.searchSource = $scope.newVis.searchSource;

		// Initialize visualization params

		$scope.vis = $scope.newVis.vis;

        

		$scope.indexPattern = $scope.vis.indexPattern;
		$scope.state = $state;
		$scope.uiState = $state.makeStateful('uiState');

		$scope.vis.setUiState($scope.uiState);

		$scope.timefilter = timefilter;

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
		
		// Listen to filter changes
		$scope.$listen($scope.queryFilter, 'update', function () {
			//$state.vis.listeners = _.defaults($state.vis.listeners || {}, $scope.vis.vis.listeners);
			$scope.fetch();

		 });

		$rootScope.$on('update', function (event, query) {
			//$state.vis.listeners = _.defaults($state.vis.listeners || {}, $scope.vis.vis.listeners);
			console.log("query filter update en vis");
			console.log(query);
			//$scope.searchSource.set('filter', $scope.queryFilter.getFilters());
			$scope.searchSource.set('query', query);
			courier.fetch();
		 });
		$scope.$on('$destroy', function () {
			$scope.newVis.destroy();
		});
			
		// Fetch / reload visualization
		$scope.fetch = function () 
		{

			$scope.searchSource.set('filter', $scope.queryFilter.getFilters());
			$scope.searchSource.set('query', $scope.filter.vis);
			if ($scope.vis.type.requiresSearch) {
				courier.fetch();
			}

		};
		$scope.loadBeforeShow = true;
    };

  });
  
  app.controller('testController', function ($scope, $route) {
		console.log("Hi from test controller");
  });
