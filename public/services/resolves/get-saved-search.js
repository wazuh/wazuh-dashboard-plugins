/*
 * Wazuh app - File for routes definition
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import healthCheck from './health-check'

export default (courier, $q, $window, $rootScope, savedSearches, $route) => {
    if (healthCheck($window, $rootScope)) {
        $location.path('/health-check');
        return Promise.reject();
    } else {
        return savedSearches.get($route.current.params.id)
        .catch(courier.redirectWhenMissing({
            'search': '/discover',
            'index-pattern': '/management/kibana/objects/savedSearches/' + $route.current.params.id
        }));
    }
};