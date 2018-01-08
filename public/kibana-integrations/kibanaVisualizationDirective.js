import $ from 'jquery';
const ownLoader = require('./loader/loader-import');

var app = require('ui/modules').get('apps/webinar_app', [])
    .directive('kbnVis', [function () {
        return {
            restrict: 'E',
            scope: {
                visID: '=visId',
                specificTimeRange: '=specificTimeRange'
            },
            controller: function VisController($scope, $rootScope, savedVisualizations, implicitFilters) {
                if(!$rootScope.ownHandlers) $rootScope.ownHandlers = [];
                let implicitFilter = '';
                let visTitle       = '';
                let fullFilter     = '';
                let rendered       = false;
                let visualization  = null;
                let visHandler     = null;

                // Listen for changes
                $scope.$on('updateVis', function (event, query, filters) {
                    if (rendered) {
                        if (visTitle !== 'Wazuh App Overview General Agents status') { // We don't want to filter that visualization as it uses another index-pattern
                            if (query.query === '') {
                                fullFilter = implicitFilter;
                            }
                            else {
                                if (implicitFilter !== '') {
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
                const loader = ownLoader.getVisualizeLoader();

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

                    if ($scope.specificTimeRange) {
                        const timeRange = {
                            min: 'now-1d/d',
                            max: 'now'
                        };
                        params = {timeRange: timeRange}
                    }
                    visHandler = loader.embedVisualizationWithSavedObject($("#"+$scope.visID), visualization, params); 
                    $rootScope.ownHandlers.push(visHandler);
                    visHandler.whenFirstRenderComplete().then(() => { 
                        rendered = true;
                    });
                });
     
            }
        }
    }]);