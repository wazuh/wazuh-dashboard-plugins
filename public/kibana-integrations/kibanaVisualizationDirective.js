import $ from 'jquery';
import { getVisualizeLoader } from 'ui/visualize/loader';

const app = require('ui/modules')
	.get('apps/webinar_app', [])
	.directive('kbnVis', [
		function() {
			return {
				restrict: 'E',
				scope: {
					visID: '=visId',
	            },
				controller: function VisController($scope, $rootScope, savedVisualizations) {
					$scope.implicitFilter = '';
					$scope.visTitle       = '';
					$scope.fullFilter     = '';

					// Listen for changes
					let updateSearchSource = $scope.$on('updateVis', function(event, query, filters) {
						if (!query.query) {
							$scope.fullFilter = $scope.implicitFilter;
						} else {
							if ($scope.implicitFilter) {
								$scope.fullFilter = $scope.implicitFilter + ' AND ' + query.query;
							} else {
								$scope.fullFilter = query.query;
							}
						}
						$scope.savedObj.searchSource.set('query', {
							language: 'lucene',
							query:    $scope.fullFilter
						});
						$scope.savedObj.searchSource.set('filter', filters);
					});
                    let loader = null;
					// Initializing the visualization
					getVisualizeLoader()
						.then(data => {
                            loader = data;
                            return savedVisualizations.get($scope.visID);
                        })
						.then(savedObj => {
							$scope.implicitFilter = savedObj.searchSource.get('query')['query'];
							$scope.visTitle = savedObj.vis.title;
							$scope.savedObj = savedObj;
							return loader.embedVisualizationWithSavedObject($('#' + $scope.visID), $scope.savedObj, {});
						})
                        .then(handler => console.log('render complete', $scope.visTitle))
                        .catch(err => console.error(err));
				}
			};
		}
	]);
