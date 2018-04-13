require('ui/modules').get('app/wazuh', [])
.service('patternHandler', function ($rootScope, $route, $location, genericReq, courier, appState, errorHandler) {
    return {
        getPatternList: async () => {
            try {
                const patternList = await genericReq.request('GET','/get-list',{});

                if(!patternList.data.data.length){
                    $rootScope.blankScreenError = 'Sorry but no valid index patterns were found'
                    $location.search('tab',null);
                    $location.path('/blank-screen'); 
                    return;  
                }

                if(appState.getCurrentPattern()){
                    let filtered = patternList.data.data.filter(item => item.id.includes(appState.getCurrentPattern()))
                    if(!filtered.length) appState.setCurrentPattern(patternList.data.data[0].id)
                }

                return patternList.data.data;
            } catch (error) {
                errorHandler.handle(error,'Pattern Handler (getPatternList)');
                if(!$rootScope.$$phase) $rootScope.$digest();
            }
        },
        changePattern: async selectedPattern => {
            try {
                appState.setCurrentPattern(selectedPattern);
                await genericReq.request('GET',`/refresh-fields/${selectedPattern}`,{})
                return appState.getCurrentPattern();
            } catch (error) {
                errorHandler.handle(error,'Pattern Handler (changePattern)');
                if(!$rootScope.$$phase) $rootScope.$digest();
            }

        }
    };
});
