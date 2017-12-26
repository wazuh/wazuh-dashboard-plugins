import $ from 'jquery';
import { getVisualizeLoader } from 'ui/visualize/loader';

var app = require('ui/modules').get('apps/webinar_app', [])
    .directive('kbnVis', [function () {
        return {
            restrict: 'E',
            scope: {
                visID: '=visId',
                specificTimeRange: '=specificTimeRange'
            },
            controller: function VisController($scope, $rootScope, savedVisualizations, implicitFilters) {

                var implicitFilter = '';
                var visTitle = '';
                var fullFilter = '';
                var rendered = false;
                var visualization = null;

                // Listen for changes
                var updateSearchSource = $scope.$on('updateVis', function (event, query, filters) {
                    if (rendered === true) {
                        if (visTitle !== 'Wazuh App Overview General Agents status') { // We don't want to filter that visualization as it uses another index-pattern
                            if (query.query == '') {
                                fullFilter = implicitFilter;
                            }
                            else {
                                if (implicitFilter != '') {
                                    fullFilter = implicitFilter + ' AND ' + query.query;
                                }
                                else {
                                    fullFilter = query.query;
                                }
                            }

                            visualization.searchSource
                            .query({ language: 'lucene', query: fullFilter })
                            .set('filter', filters);
                        }
                    }
                });

                // Initializing the visualization
                getVisualizeLoader().then(loader => {
                    savedVisualizations.get($scope.visID).then(savedObj => {
                        implicitFilter = savedObj.searchSource.get('query')['query'];
                        visTitle = savedObj.vis.title;
                        visualization = savedObj;

                        if (visTitle !== 'Wazuh App Overview General Agents status') { // We don't want to filter that visualization as it uses another index-pattern
                            visualization.searchSource
                            .query({ language: 'lucene', query: implicitFilter })
                            .set('filter', implicitFilters.loadFilters());
                        }

                        let params = {};

                        if ($scope.specificTimeRange == true) {
                            const timeRange = {
                                min: 'now-1d/d',
                                max: 'now'
                            };
                            params = {timeRange: timeRange}
                        }
                        loader.embedVisualizationWithSavedObject($("#"+$scope.visID), visualization, params)
                        .then(handler => {

                            // We bind the renderComplete event to watch for proper loading screen
                            /*$("#"+$scope.visID).on('renderComplete', () => { 
                                $rootScope.loadedVisualizations--;
                                console.log("Finished updating", visTitle, $rootScope.loadedVisualizations);
                            });*/

                            rendered = true;
                        });
                    });
                });
            }
        }
    }]);
