require('ui/modules').get('app/wazuh', []).service('appState', function ($cookies, $window) {
    return {
        getExtensions: () => {
            return {
                extensions: $cookies.getObject('extensions')
            };
        },
        setExtensions: extensions => {
            var exp = new Date();
            exp.setDate(exp.getDate() + 365);
            if (extensions) {
                $cookies.putObject('extensions', extensions, { 'expires': exp });
            }
        },
        getClusterInfo: () => {
            return $cookies.getObject('_clusterInfo');
        },
        setClusterInfo: cluster_info => {
            var exp = new Date();
            exp.setDate(exp.getDate() + 365);
            if (cluster_info) {
                $cookies.putObject('_clusterInfo', cluster_info, { 'expires': exp });
            }
        },
        getCurrentPattern: () => {
            return $cookies.getObject('_currentPattern');
        },
        setCurrentPattern: newPattern => {
            var exp = new Date();
            exp.setDate(exp.getDate() + 365);
            if (newPattern) {
                $cookies.putObject('_currentPattern', newPattern, { 'expires': exp });
            }
        },
        getCurrentAPI: () => {
            return $cookies.getObject('API');
        },
        removeCurrentAPI: () => {
            return $cookies.remove('API');
        },
        setCurrentAPI: API => {
            var exp = new Date();
            exp.setDate(exp.getDate() + 365);
            if (API) {
                $cookies.putObject('API', API, { 'expires': exp});
            }
        }
    };
});
