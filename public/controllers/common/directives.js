import menuTemplate from '../../templates/directives/menu-top.html'
const app = require('ui/modules').get('app/wazuh', []);
app.directive('dynamic', function($compile) {
        return {
            restrict: 'A',
            replace: true,
            link: function(scope, ele, attrs) {
                scope.$watch(attrs.dynamic, function(html) {
                    ele.html(html);
                    $compile(ele.contents())(scope);
                });
            },
        };
    })
	.directive('myEnter', function () {
		return function (scope, element, attrs) {
			element.bind("keydown keypress", function (event) {
				if(event.which === 13) {
					scope.$apply(function (){
						scope.$eval(attrs.myEnter);
					});

					event.preventDefault();
				}
			});
		};
	})
    .directive('menuTop',function(){
        return {
            controller: function ($scope, appState, patternHandler, courier, Notifier) {
                const notify = new Notifier();

                if(appState.getCurrentAPI()) {
                    $scope.theresAPI = true;
                    $scope.currentAPI = JSON.parse(appState.getCurrentAPI()).name;
                }
                else {
                    $scope.theresAPI = false;
                }

                // Getting the list of index patterns
                if(patternHandler.getPatternList()) {
                    $scope.patternList = patternHandler.getPatternList();
                    $scope.currentSelectedPattern = appState.getCurrentPattern();
                }

                // Function to change the current index pattern on the app
                $scope.changePattern = (selectedPattern) => {
                    $scope.currentSelectedPattern = patternHandler.changePattern(selectedPattern);
                }

                courier.indexPatterns.get(appState.getCurrentPattern())
                .then((data) => {
                    $scope.theresPattern = true;
                    $scope.currentPattern = data.title;
                })
                .catch((error) => {
                    notify.error("Error getting patterns from Kibana...");
                    $scope.theresPattern = false;
                });

                $scope.$on('updateAPI', () => {
                    if(appState.getCurrentAPI())
                    {
                        $scope.theresAPI = true;
                        $scope.currentAPI = JSON.parse(appState.getCurrentAPI()).name;
                    }
                    else {
                        $scope.theresAPI = false;
                    }
                });

                $scope.$on('updatePattern', () => {
                    courier.indexPatterns.get(appState.getCurrentPattern())
                    .then((data) => {
                        $scope.theresPattern = true;
                        $scope.currentPattern = data.title;
                    })
                    .catch((error) => {
                        notify.error("Error getting patterns from Kibana...");
                        $scope.theresPattern = false;
                    });
                });
            },
            template: menuTemplate
        };
    });
