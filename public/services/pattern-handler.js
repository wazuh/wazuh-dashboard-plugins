require('ui/modules').get('app/wazuh', [])
.service('patternHandler', function ($rootScope, $route, genericReq, courier, appState, errorHandler) {
    return {
        getPatternList: async () => {
            try {
                const patternList = await genericReq.request('GET','/get-list',{});
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
