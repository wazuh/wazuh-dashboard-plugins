/*
 * Wazuh app - App state service
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import * as modules from 'ui/modules'

modules.get('app/wazuh', [])
.service('appState', function ($cookies, $window) {
    return {
        getExtensions: id => {
            const current = $cookies.getObject('extensions');
            return current ? current[id] : false;
        },
        setExtensions: (id,extensions) => {
            const current = $cookies.getObject('extensions') || {};
            current[id] = extensions;
            const exp = new Date();
            exp.setDate(exp.getDate() + 365);
            if (extensions) {
                $cookies.putObject('extensions', current, { 'expires': exp });
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
        },
        setCurrentDevTools: current => {
            $window.localStorage.setItem('currentDevTools',current);
        },
        getCurrentDevTools: () => {
            return $window.localStorage.getItem('currentDevTools')
        }
    };
});
