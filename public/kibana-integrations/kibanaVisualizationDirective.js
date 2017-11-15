import $ from 'jquery';
import { getVisualizeLoader } from 'ui/visualize/loader';

var app = require('ui/modules').get('apps/webinar_app', [])
    .directive('kbnVis', [function () {
        return {
            restrict: 'E',
            scope: {
                visID: '=visId',
            },
            controller: function VisController($scope, savedVisualizations) {

                $scope.implicitFilter = '';
                // Listen for changes
                var updateSearchSource = $scope.$on('updateVis', function (event, query, filters) {
                    if ($scope.implicitFilter !== '') query.query = $scope.implicitFilter + ' AND ' + query.query;
                    $scope.savedObj.searchSource.set('query', query);
                    $scope.savedObj.searchSource.set('filter', filters);
                });

                // Initializing the visualization
                getVisualizeLoader().then(loader => {
                    savedVisualizations.get($scope.visID).then(savedObj => {
                        if ($scope.implicitFilter.endsWith("AND ")) $scope.implicitFilter = $scope.implicitFilter.substring(0, $scope.implicitFilter.indexOf("AND "));
                        $scope.implicitFilter = savedObj.searchSource.get('query')['query'];
                        $scope.savedObj = savedObj;
                        loader.embedVisualizationWithSavedObject($("#"+$scope.visID), $scope.savedObj, {})
                        .then(handler => {
                            console.log('render complete', handler);
                        });
                    });
                });
            }
        }
    }]);
