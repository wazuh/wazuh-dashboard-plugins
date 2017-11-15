require('ui/query_bar');
import { FilterBarQueryFilterProvider } from 'ui/filter_bar/query_filter';

const app = require('ui/modules').get('apps/webinar_app', []);

app.controller('kibanaSearchbar', function ($scope, timefilter, AppState, $timeout, Private, $rootScope, savedVisualizations, getAppState) {
    const filterBar = Private(FilterBarQueryFilterProvider);
    timefilter.enabled = true;
    let visualizeLoader = null;
    let currentAppState = getAppState();
    $scope.indexPattern = [];

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
            query: {'language': 'lucene', 'query': '' },
            index: $scope.indexPattern[0].id,
            interval: 'auto',
            filters: {}
        };
    }

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

        $rootScope.$broadcast('updateVis', query, filterBar.getFilters());
        $rootScope.$broadcast('fetch');
    };
});
