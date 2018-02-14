import menuTemplate from '../../templates/directives/menu-top.html'
import tableTemplate from '../../templates/directives/wz-table.html'
import tableHeaderTemplate from '../../templates/directives/wz-table-header.html'
import searchBarTemplate from '../../templates/directives/wz-search-bar.html'
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
            controller: function ($scope,$window, $rootScope, appState, patternHandler, courier, errorHandler) {

                if(appState.getCurrentAPI()) {
                    $scope.theresAPI = true;
                    $scope.currentAPI = JSON.parse(appState.getCurrentAPI()).name;
                }
                else {
                    $scope.theresAPI = false;
                }
                $scope.goToClick = path => {
                    $window.location.href = path;
                }
                const load = async () => {
                    try {
                        const data = await courier.indexPatterns.get(appState.getCurrentPattern());
                        $scope.theresPattern = true;
                        $scope.currentPattern = data.title;

                        const list = await patternHandler.getPatternList();

                        // Getting the list of index patterns
                        if(list) {
                            $scope.patternList = list;
                            $scope.currentSelectedPattern = appState.getCurrentPattern();
                        }
                        if(!$scope.$$phase) $scope.$digest();
                        return;
                    } catch (error) {
                        errorHandler.handle(error,'Directives - Menu');
                        $scope.theresPattern = false;
                        if(!$rootScope.$$phase) $rootScope.$digest();
                    }
                }

                load();

                // Function to change the current index pattern on the app
                $scope.changePattern = async selectedPattern => {
                    try{
                        $scope.currentSelectedPattern = await patternHandler.changePattern(selectedPattern);
                        if(!$scope.$$phase) $scope.$digest();
                        $window.location.reload();
                        return;
                    }catch(error){
                        errorHandler.handle(error,'Directives - Menu');
                        if(!$rootScope.$$phase) $rootScope.$digest();
                    }                    
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

                $scope.$on('updatePattern', () => {
                    courier.indexPatterns.get(appState.getCurrentPattern())
                    .then(data => {
                        $scope.theresPattern = true;
                        $scope.currentSelectedPattern = appState.getCurrentPattern();
                    })
                    .catch(error => {
                        errorHandler.handle(error,'Directives - Menu');
                        if(!$rootScope.$$phase) $rootScope.$digest();
                        $scope.theresPattern = false;
                    });
                });
            },
            template: menuTemplate
        };
    })
    .directive('wzTable',function(){
        return {
            restrict: 'E',
            scope: {
                data: '=data',
                keys: '=keys',
                func: '&',
                noscroll: '=noscroll',
                nopointer: '=nopointer',
                full:     '=full',
                noheight: '=noheight'                 
            },
            link: function(scope,ele,attrs){
                scope.clickAction = index => {
                    const obj = {};
                    if(scope.full){
                        obj[scope.full] = index;
                    } else {
                        obj.index = index;
                    }
                    scope.func(obj);
                }   
                scope.parseItem = (item,key) => {
                    let tmp = key;
                    if(key.col) {
                        tmp = key.col;
                    }
                    if(tmp && tmp.includes('.')){
                        return item[tmp.split('.')[0]][tmp.split('.')[1]];
                    }
                    return item[tmp];
                }
            },
            template: tableTemplate
        }
    })
    .directive('wzTableHeader',function(){
        return {
            restrict: 'E',
            scope: {
                data: '=data',
                keys: '=keys'          
            },
            link: function(scope,ele,attrs){
 
            },
            template: tableHeaderTemplate
        }
    })
    .directive('wzSearchBar',function(){
        return {
            restrict: 'E',
            scope: {
                data: '=data',
                term: '=term',
                placetext: '=placetext',
                height: '=height',
                noleft: '=noleft'           
            },
            link: function(scope,ele,attrs){
 
            },
            template: searchBarTemplate
        }
    });
