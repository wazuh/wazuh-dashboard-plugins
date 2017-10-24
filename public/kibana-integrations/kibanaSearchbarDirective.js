import rison from 'rison-node';
import { FilterBarQueryFilterProvider } from 'ui/filter_bar/query_filter';
import { StateProvider } from 'ui/state_management/state';
import { AggTypesBucketsIntervalOptionsProvider } from 'ui/agg_types/buckets/_interval_options';

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

require('ui/modules').get('app/wazuh', []).controller('kibanaSearchBar', function ($scope, $route, timefilter, AppState, $timeout, Private, $rootScope) {
	$route.reloadOnSearch = true;

	timefilter.enabled = true;
	$scope.stateQuery = "";
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
        if (this.stateQuery == "") {
	        $rootScope.$broadcast('updateQuery',"(*)");
        } else {
	        this.stateQuery = this.stateQuery == "" ? "" : this.stateQuery;
	        $rootScope.$broadcast('updateQuery',"(" + this.stateQuery + ")");
        }
	};

	$scope.queryFilter = Private(FilterBarQueryFilterProvider);

});
  