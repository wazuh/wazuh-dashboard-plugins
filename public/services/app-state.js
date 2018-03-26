require('ui/modules').get('app/wazuh', []).service('appState', function ($cookies, $window) {
    return {
        getExtensions: () => {
            const data = {
                extensions: $cookies.getObject('extensions')
            };

            if(typeof data.extensions === 'undefined'){
                return {
                    extensions : {
                        audit     : true,
                        pci       : true,
                        oscap     : true,
                        aws       : false,
                        virustotal: false
                    }
                }
            }
            return data;
        },
        setExtensions: extensions => {
            const exp = new Date();
            exp.setDate(exp.getDate() + 365);
            if (extensions) {
                $cookies.putObject('extensions', extensions, { 'expires': exp });
            }
        },
        getClusterInfo: () => {
            return $cookies.getObject('_clusterInfo');
        },
        removeClusterInfo: () => {
            return $cookies.remove('_clusterInfo');
        },
        setClusterInfo: cluster_info => {
            const exp = new Date();
            exp.setDate(exp.getDate() + 365);
            if (cluster_info) {
                $cookies.putObject('_clusterInfo', cluster_info, { 'expires': exp });
            }
        },
        getCurrentPattern: () => {
            return $cookies.getObject('_currentPattern');
        },
        setCreatedAt: date => {
            const exp = new Date();
            exp.setDate(exp.getDate() + 365);
            $cookies.putObject('_createdAt',date,{ 'expires': exp });
        },
        setCurrentPattern: newPattern => {
            const exp = new Date();
            exp.setDate(exp.getDate() + 365);
            if (newPattern) {
                $cookies.putObject('_currentPattern', newPattern, { 'expires': exp });
            }
        },
        removeCurrentPattern: () => {
            return $cookies.remove('_currentPattern');
        },
        getCreatedAt: () => {
            return $cookies.getObject('_createdAt');
        }, 
        removeCreatedAt: () => {
            return $cookies.remove('_createdAt');
        }, 
        getCurrentAPI: () => {
            return $cookies.getObject('API');
        },
        removeCurrentAPI: () => {
            return $cookies.remove('API');
        },
        setCurrentAPI: API => {
            const exp = new Date();
            exp.setDate(exp.getDate() + 365);
            if (API) {
                $cookies.putObject('API', API, { 'expires': exp});
            }
        },
        setUserCode: code => {
            $cookies.putObject('userCode', code);
        },
        getUserCode: () => {
            return $cookies.getObject('userCode');
        },
        removeUserCode: () => {
            return $cookies.remove('userCode');
        },
        getPatternSelector: () => {
            return $cookies.getObject('patternSelector');
        },
        setPatternSelector: value => {
            $cookies.putObject('patternSelector', value);
        },
        removePatternSelector: () => {
            return $cookies.remove('patternSelector');
        }
    };
});
