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
		
	
	$scope.displayPCI = function (requirement){
		var pciRequirementBox = document.querySelector("#pciRequirementBox");
		var pciRequirementBox_ReqTitle = document.querySelector("#pciRequirementBox_ReqTitle");

		genericReq.request('GET', '/api/wazuh-api/pci/'+requirement).then(function (data) {
			pciRequirementBox_ReqTitle.innerText = requirement;
			pciRequirementBox_ReqContent.innerHTML = data.pci.description;
			angular.element(pciRequirementBox).show();
		});

	}

	function injectPciIcon(){
		// Get all filters on filter bar
		var filters = document.querySelectorAll(".filter-bar .filter");
		// Analyze each filter
		filters.forEach(function(item) {
			if(angular.element(item).data('pci') != "1"){
				var filterLabel = item.querySelectorAll(".filter-description");
				filterLabel.forEach(function(item) {
					if(item.children[0].innerText == "rule.pci_dss:"){
						// Preparing and adding new element to filter actions icons
						var pciLink = angular.element('<a class="action" ng-click=\'displayPCI('+item.children[1].innerText+')\'><img src="/plugins/wazuh/img/icon_pci.png"></a>');
						// Append the new element
						angular.element(pciLink).appendTo(item.nextElementSibling);
						// Compile element to enable ng click
						$compile(angular.element(item.nextElementSibling).contents())($scope);
						// Setup min width when adding new icon
						angular.element(item.parentNode).css("min-width","calc(6*(1.414em + 13px))");
						angular.element(item.parentNode).attr('data-pci','1');
						var cleanRequirement = item.children[1].innerText.replace(/^"(.*)"$/, '$1');
						//console.log(cleanRequirement);
						$scope.displayPCI(cleanRequirement);
					}
				});
			}
		});
		return;
	}

	// Set default time
	if($route.current.params._g == "()"){
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

	// Listen for filter changes
	$scope.$listen($scope.queryFilter, 'update', function () {
		$timeout(
		function() {  
			injectPciIcon();
		}, 0);
	 });

	// Watch visCounter, wait for finish and fetch.
	var visCounterWatch = $rootScope.$watch('visCounter', function (data) {

		if($rootScope.visCounter == 0){
			$timeout(
			function() {  
				$rootScope.$broadcast('fetchVisualization');
				injectPciIcon();
			}, 0);
		}

	});

	// Listen for destroy 
	$scope.$on('$destroy', visCounterWatch);

});
  
