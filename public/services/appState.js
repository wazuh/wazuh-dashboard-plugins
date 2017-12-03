require('ui/modules')
.get('app/wazuh', [])
.service('appState', function ($cookies) {
    return {
        getExtensions: () => {
            return {
                extensions: $cookies.getObject('extensions')
            };
        },
        setExtensions: extensions => {
            if (extensions) {
                $cookies.putObject('extensions', extensions);
            }
        },
        getClusterInfo: () => {
            return $cookies.getObject('_clusterInfo');
        },
        setClusterInfo: cluster_info => {
            if (cluster_info) {
                $cookies.putObject('_clusterInfo', cluster_info);
            }
        },
        getCurrentPattern: () => {
            return $cookies.getObject('_currentPattern');
        },
        setCurrentPattern: newPattern => {
            if (newPattern) {
                $cookies.putObject('_currentPattern', newPattern);
            }
        }
    };
});