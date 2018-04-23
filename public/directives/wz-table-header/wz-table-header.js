/*
 * Wazuh app - Table header directive
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import tableHeaderTemplate from './wz-table-header.html'
const app = require('ui/modules').get('app/wazuh', []);

app.directive('wzTableHeader', function() {
    return {
        restrict: 'E',
        scope: {
            data: '=data',
            keys: '=keys'
        },
        link: function(scope, ele, attrs) {

        },
        template: tableHeaderTemplate
    }
});
