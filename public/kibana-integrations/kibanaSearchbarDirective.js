require('ui/query_bar');
import { FilterBarQueryFilterProvider } from 'ui/filter_bar/query_filter';

const app = require('ui/modules').get('apps/webinar_app', []);

app.controller('kibanaSearchbar', function ($scope, timefilter, AppState, $timeout, Private, $rootScope, savedVisualizations, appState) {
    const filterBar = Private(FilterBarQueryFilterProvider);
    timefilter.enabled = true;
    let visualizeLoader = null;
    let implicitFilter = null;
    let currentAppState = null;
    $scope.indexPattern = [];

    // This is embarrassing, but currently I don't know of any other way to get the index-pattern object
    savedVisualizations.get('Alert-level-evolution').then(savedObj => {
        $scope.indexPattern[0] = savedObj.vis.indexPattern;

        // Configure AppState. Get App State, if there is no App State create new one
        if (!currentAppState) {
            $scope.state = new AppState(getStateDefaults());
        } else {
            $scope.state = currentAppState;
        }
    });

    function getStateDefaults() {
        return {
            query: {'language': 'lucene', 'query': ''},
            index: $scope.indexPattern[0].id,
            interval: 'auto',
            filters: {}
        };
    }

    $scope.showWholeSearchbar = function () {
        return $(".kuiLocalSearchAssistedInput").length >= 1;
    };

    $scope.showFilterBar = function () {
        if (filterBar.getFilters().length == 0) return false;
        else return true;
    };

    $scope.$listen(filterBar, 'update', function () {
        $scope.updateQueryAndFetch($scope.state.query);
    });

    $scope.updateQueryAndFetch = function (query) {
        $scope.state.query = query;
        $scope.state.save();

        let fullFilter = null;

        // Build the full query using the implicit filter
        // The implicit filter should be have two parts: the cluster name and the page related query
        if ($rootScope.currentImplicitFilter === "") implicitFilter = 'cluster.name : "' + appState.getClusterInfo().cluster + '"';
        else implicitFilter = 'cluster.name : "' + appState.getClusterInfo().cluster + '" AND ' + $rootScope.currentImplicitFilter;
        if (query.query === '')
            fullFilter = implicitFilter;
        else fullFilter = implicitFilter + ' AND ' + query.query;

        $rootScope.$broadcast('updateVis', {'language': 'lucene', 'query': fullFilter}, filterBar.getFilters());
        $rootScope.$broadcast('fetch');
    };
});
