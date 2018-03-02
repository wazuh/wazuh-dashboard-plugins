import $ from 'jquery';
const app = require('ui/modules').get('app/wazuh', []);

app.service('metricService', function ($rootScope) {
    let watchers = [];
    let ownIds   = [];
    return {
        createWatchers: ids => {
            for(let id in ids){
                ownIds.push(id);
                watchers.push(
                    $rootScope.$watch(() => {
                        let html = $(ids[id]).html();
                        if (typeof html !== 'undefined' && html.includes('<span')) {
                            if(typeof html.split('<span>')[1] !== 'undefined'){
                                return html.split('<span>')[1].split('</span')[0];
                            }
                        }
                        return false;
                    }, (newVal, oldVal) => {
                        if (newVal !== oldVal) {
                            $rootScope[id] = newVal ? newVal : '---';
                            if (!$rootScope.$$phase) $rootScope.$digest();
                        }
                    })
                );
            }
        },
        destroyWatchers: () => {
            for(let watcher of watchers){
                watcher();
            }
            for(let id of ownIds){
                if($rootScope[id]) delete $rootScope[id];
            }
            watchers = [];
            ownIds   = [];
            if (!$rootScope.$$phase) $rootScope.$digest();
        },
        hasItems: () => watchers.length !== 0
    }
});