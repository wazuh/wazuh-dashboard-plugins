import menuTemplate from '../../templates/directives/menu-top.html'
import healthCheckTemplate from '../../templates/directives/health-check.html'
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
            controller: function ($scope, appState) {
                if(appState.getCurrentAPI()) {
                    $scope.theresAPI = true;
                    $scope.currentAPI = JSON.parse(appState.getCurrentAPI()).name;
                }
                else {
                    $scope.theresAPI = false;
                }

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
            },
            template: menuTemplate
        };
    })
    .directive('healthCheck', function () {
        return {
            controller: function filterPillController($scope, $rootScope, genericReq, appState) {
                $rootScope.$watch('healthCheck', () => {
                    // Check API connection
                    // Check index-pattern existence
                    // Check template
                    genericReq.request('GET', `/api/wazuh-elastic/template/${appState.getCurrentPattern()}`)
                    .then((data) => {
                        console.log("wiiii", data);
                    });
                    $scope.APIStatus ="Checking API connection...";
                    $scope.indexStatus ="Checking index-pattern...";
                    $scope.templateStatus ="Checking template...";
                });
            },
            template: healthCheckTemplate
        };
    });
