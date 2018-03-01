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
            controller: function VisController($scope, $rootScope, $location, savedVisualizations) {
                if(!$rootScope.ownHandlers) $rootScope.ownHandlers = [];
                let implicitFilter = '';
                let visTitle       = '';
                let fullFilter     = '';
                let rendered       = false;
                let visualization  = null;
                let visHandler     = null;
                let renderInProgress = false;
                let originalImplicitFilter;
                const myRender = function() {
                    if (($rootScope.discoverPendingUpdates && $rootScope.discoverPendingUpdates.length != 0) || $scope.visID.includes('Ruleset') ){ // There are pending updates from the discover (which is the one who owns the true app state)

                        if(!visualization && !rendered && !renderInProgress) { // There's no visualization object -> create it with proper filters
                            renderInProgress = true;

                            savedVisualizations.get($scope.visID).then(savedObj => {
                                implicitFilter = savedObj.searchSource.get('query')['query'];
                                originalImplicitFilter = implicitFilter;
                                visTitle = savedObj.vis.title;
                                visualization = savedObj;

                                if ($rootScope.discoverPendingUpdates && implicitFilter &&  typeof $rootScope.discoverPendingUpdates[0].query === 'string') {
                                    if($rootScope.discoverPendingUpdates[0].query.length > 0)
                                        implicitFilter += ' AND ' + $rootScope.discoverPendingUpdates[0].query;
                                } else if ($rootScope.discoverPendingUpdates && !implicitFilter && typeof $rootScope.discoverPendingUpdates[0].query === 'string') {
                                    implicitFilter = $rootScope.discoverPendingUpdates[0].query;
                                }

                                if (visTitle !== 'Wazuh App Overview General Agents status') { // We don't want to filter that visualization as it uses another index-pattern
                                    visualization.searchSource
                                    .query({ language: 'lucene', query: implicitFilter })
                                    .set('filter',  $rootScope.discoverPendingUpdates ? $rootScope.discoverPendingUpdates[1] : {});
                                }

                                let params = {};

                                if ($scope.specificTimeRange) {
                                    const timeRange = {
                                        from: 'now-1d/d',
                                        to: 'now'
                                    };
                                    params = {timeRange: timeRange}
                                }
                                $(`[vis-id="'${$scope.visID}'"]`).on('renderStart', () => {
                                //$("#"+$scope.visID).on('renderStart', () => {
                                    // TBD: Use renderStart to couple it with renderComplete?
                                });
 
                                visHandler = loader.embedVisualizationWithSavedObject($(`[vis-id="'${$scope.visID}'"]`), visualization, params); 
                                
                                $rootScope.ownHandlers.push(visHandler);
                                visHandler.addRenderCompleteListener(renderComplete);
                            });     

                        } else if (rendered) { // There's a visualization object -> just update its filters
                            
                            if ($rootScope.discoverPendingUpdates && implicitFilter && typeof $rootScope.discoverPendingUpdates[0].query === 'string') {
                                if($rootScope.discoverPendingUpdates[0].query.length > 0 && !implicitFilter.includes($rootScope.discoverPendingUpdates[0].query)){
                                    implicitFilter += ' AND ' + $rootScope.discoverPendingUpdates[0].query;
                                } else if(implicitFilter.includes('AND') && $rootScope.discoverPendingUpdates[0].query.length === 0){
                                    implicitFilter = implicitFilter.split('AND')[0];                                    
                                } else if(!implicitFilter.includes('AND') && $rootScope.discoverPendingUpdates[0].query.length === 0){
                                    implicitFilter = originalImplicitFilter;                              
                                }   
                            } else if ($rootScope.discoverPendingUpdates && !implicitFilter && typeof $rootScope.discoverPendingUpdates[0].query === 'string') {
                                implicitFilter = $rootScope.discoverPendingUpdates[0].query;
                            }

                            if (visTitle !== 'Wazuh App Overview General Agents status') { // We don't want to filter that visualization as it uses another index-pattern
                                visualization.searchSource
                                .query({ language: 'lucene', query: implicitFilter })
                                .set('filter', $rootScope.discoverPendingUpdates ? $rootScope.discoverPendingUpdates[1] : {});
                            }
                        }
                    }
                };

                // Listen for changes
                $scope.$on('updateVis', function (event, query, filters) {
                    myRender();
                });

                var renderComplete = function() {
                    rendered = true;

                    if(typeof $rootScope.loadedVisualizations === 'undefined') $rootScope.loadedVisualizations = [];
                    $rootScope.loadedVisualizations.push(true);
                    let currentCompleted = Math.round(($rootScope.loadedVisualizations.length / $rootScope.tabVisualizations[$location.search().tab]) * 100);
                    $rootScope.loadingStatus = `Rendering visualizations... ${currentCompleted > 100 ? 100 : currentCompleted} %`;

                    if (currentCompleted >= 100) {
                        if (!visTitle !== 'Wazuh App Overview General Agents status') $rootScope.rendered = true;
                        // Forcing a digest cycle
                        if(!$rootScope.$$phase) $rootScope.$digest();
                    }
                    else if (!visTitle !== 'Wazuh App Overview General Agents status') $rootScope.rendered = false;
                };

                // Initializing the visualization
                const loader = ownLoader.getVisualizeLoader();

                myRender();
     
            }
        }
    }]);