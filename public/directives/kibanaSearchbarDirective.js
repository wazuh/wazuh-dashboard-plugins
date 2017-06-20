import rison from 'rison-node';
import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';
import StateProvider from 'ui/state_management/state';
import AggTypesBucketsIntervalOptionsProvider from 'ui/agg_types/buckets/_interval_options';

var app = require('ui/modules').get('app/wazuh', [])
  .directive('kbnSearchbar', [function () {
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
		template: require('../templates/directives/kibana-searchbar-template.html')
    }
  }]);

require('ui/modules').get('app/wazuh', []).controller('kibanaSearchBar', function (genericReq, $compile, $scope, $route, timefilter, AppState, appState, $location, kbnUrl, $timeout, courier, Private, Promise, savedVisualizations, SavedVis, getAppState, Notifier, $rootScope) {

	$scope.stateQuery = $scope.disFilter;

	$route.reloadOnSearch = true;

	timefilter.enabled = true;
	
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
    if (gParameter == "()"){
		timefilter.time.from = "now-24h";
		timefilter.time.to = "now";
	}
	
	$scope.timefilter = timefilter;
	
	let $state = $scope.$state = (function initState() {
		$state = new AppState();	
		return $state;
	} ());

	// Fetch / reload visualization
	$scope.fetch = function () 
	{
		$rootScope.$broadcast('updateQuery',$scope.stateQuery);
	};

	$scope.queryFilter = Private(FilterBarQueryFilterProvider);


	// Watch visCounter, wait for finish and fetch.
	var visCounterWatch = $rootScope.$watch('visCounter', function (data) {

		if($rootScope.visCounter == 0){
			$timeout(
			function() {
				$rootScope.$broadcast('fetchVisualization');
			}, 0);
		}

	});
	
	// Listen for destroy 
	$scope.$on('$destroy', visCounterWatch);

});
  
