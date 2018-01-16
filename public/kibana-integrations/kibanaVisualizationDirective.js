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
            controller: function VisController($scope, $rootScope, $location, savedVisualizations, implicitFilters) {
                if(!$rootScope.ownHandlers) $rootScope.ownHandlers = [];
                let implicitFilter = '';
                let visTitle       = '';
                let fullFilter     = '';
                let rendered       = false;
                let visualization  = null;
                let visHandler     = null;
                let pendingUpdates = [];

                // Listen for changes
                $scope.$on('updateVis', function (event, query, filters) {
                    console.log("update, rendered", rendered);
                    if (rendered) {
                        if (visTitle !== 'Wazuh App Overview General Agents status') { // We don't want to filter that visualization as it uses another index-pattern

                            if (pendingUpdates.length != 0) {
                                for (let i = 0; i < pendingUpdates.length; i++) {
                                    for (let j = 0; j < implicitFilters.loadFilters().length; j++) {
                                        console.log("comparing", pendingUpdates[i].query, implicitFilters.loadFilters()[j]);
                                        if (pendingUpdates[i].query == implicitFilters.loadFilters()[j]) {
                                            console.log("this is the same", )
                                        }
                                    }
                                }
                            }

                            if (query != null) {
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

                                console.log("updating inside", visTitle,filters);
                                visualization.searchSource
                                .query({ language: 'lucene', query: fullFilter })
                                .set('filter', filters);
                            } else { // Update with pending

                            }
                        }
                    } else {
                        pendingUpdates.push({"query": query, "filters": filters});
                            console.log("pushing inside", visTitle, pendingUpdates);
                            console.log("the implicits", implicitFilters.loadFilters());
                    }
                });

                var renderComplete = function() {
                    rendered = true;

                    if (pendingUpdates.length != 0) {
                        console.log("emitting, pending updates");
                        $rootScope.$broadcast('updateVis', null, null);
                    }

                    $rootScope.loadedVisualizations.push(true);
                    $rootScope.loadingStatus = `Rendering visualizations... ${Math.round((100 * $rootScope.loadedVisualizations.length / $rootScope.tabVisualizations[$location.search().tab]) * 100) / 100} %`;
                    if ($rootScope.loadedVisualizations.length >= $rootScope.tabVisualizations[$location.search().tab]) {
                        if (!visTitle !== 'Wazuh App Overview General Agents status') $rootScope.rendered = true;
                        // Forcing a digest cycle
                        $rootScope.$digest();
                    }
                    else if (!visTitle !== 'Wazuh App Overview General Agents status') $rootScope.rendered = false;
                };

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

                    $("#"+$scope.visID).on('renderStart', () => {
                        $rootScope.loadingStatus = "Fetching data...";
                    });

                    visHandler = loader.embedVisualizationWithSavedObject($("#"+$scope.visID), visualization, params); 
                    
                    $rootScope.ownHandlers.push(visHandler);

                    visHandler.addRenderCompleteListener(renderComplete);
                });
     
            }
        }
    }]);