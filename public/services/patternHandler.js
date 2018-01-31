require('ui/modules').get('app/wazuh', [])
.service('patternHandler', function ($rootScope, $route, $window, genericReq, courier, appState, errorHandler) {
    return {
        getPatternList: async () => {
            try {
                let patternList = [];

                // Getting the index pattern list into the array,
                // but selecting only "valid" ones
                const len = $route.current.locals.ips.list.length;
                let data;
                for (let i = 0; i < len; i ++) {
                    data = await courier.indexPatterns.get($route.current.locals.ips.list[i].id)
                    
                    let minimum = ["@timestamp", "full_log", "manager.name", "agent.id"];
                    let minimumCount = 0;
                    data.fields.filter(element => minimumCount += (minimum.includes(element.name)) ? 1 : 0);

                    if (minimumCount === minimum.length) {
                        patternList.push($route.current.locals.ips.list[i]);
                    }
                }
    
                return patternList;
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
