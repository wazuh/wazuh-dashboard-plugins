/*
 * Wazuh app - Makes null the region maps (temporary hack in order to make it work)
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { uiModules } from 'ui/modules'

const app = uiModules.get('app/wazuh', [])

app
.service('regionmapsConfig', function () {
    return {
        // Intended noop function and empty array
        noop: () => {},
        layers: []
    }
})
.service('mapConfig', function () {
    return {
        // Intended noop function 
        noop: () => {}
    }
})
.service('tilemapsConfig', function () {
    return {
        // Intended noop function and false properties
        noop: () => {},
        deprecated: {
            config: {
                options: false
            }
        }
    }
});