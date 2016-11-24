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

require('ui/modules').get('app/wazuh', []).controller('kibanaSearchBar', function ($scope, $route, timefilter, AppState, appState, $location, kbnUrl, $timeout, courier, Private, Promise, savedVisualizations, SavedVis, getAppState, Notifier,$rootScope) {


	$scope.stateQuery = $scope.disFilter;

	$route.reloadOnSearch = true;

	timefilter.enabled = true;
		
	$scope.timefilter = timefilter;
	
	// Set default time
	if($route.current.params._g == "()")
		$scope.timefilter.time.from = "now-24h";
	
	let $state = $scope.$state = (function initState() {

	if(getAppState())
		$state = getAppState();
	else
		$state = new AppState();	

	return $state;
	} ());

	// Fetch / reload visualization
	$scope.fetch = function () 
	{
		$rootScope.$broadcast('update',$scope.stateQuery);  
	};


});
  
