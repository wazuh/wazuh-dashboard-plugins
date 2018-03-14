import menuTemplate from './wz-menu.html'

const app = require('ui/modules').get('app/wazuh', []);

app.directive('wzMenu',function(){
    return {
        controller: function ($scope,$window, $rootScope, appState, patternHandler, courier, errorHandler) {
            $rootScope.showSelector = appState.getPatternSelector();
            if(!$rootScope.$$phase) $rootScope.$digest();
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
                    if(!appState.getPatternSelector()) return;
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
                    if(!appState.getPatternSelector()) return;
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
                if(!appState.getPatternSelector()) return;
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
});