require('ui/modules').get('app/wazuh', [])
.service('patternHandler', function ($rootScope, $route, $location, genericReq, courier, appState, errorHandler) {
    return {
        getPatternList: async () => {
            try {
                const patternList = await genericReq.request('GET','/get-list',{});

                if(!patternList.data.data.length){
                    $rootScope.blankScreenError = 'Sorry but your user has no access to any valid index pattern'
                    $location.search('tab',null);
                    $location.path('/blank-screen'); 
                    return;  
                }
                return patternList.data.data;
            } catch (error) {
                errorHandler.handle(error,'Pattern Handler (getPatternList)');
                if(!$rootScope.$$phase) $rootScope.$digest();
            }
        },
        changePattern: async selectedPattern => {
            try {
                const data = await genericReq.request('GET', `/api/wazuh-elastic/updatePattern/${selectedPattern}`);
                appState.setCurrentPattern(selectedPattern);
                return appState.getCurrentPattern();
            } catch (error) {
                errorHandler.handle(error,'Pattern Handler (changePattern)');
                if(!$rootScope.$$phase) $rootScope.$digest();
            }

        }
    };
});
