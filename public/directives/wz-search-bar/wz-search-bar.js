/*
 * Wazuh app - Search bar directive
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import searchBarTemplate from './wz-search-bar.html'

const app = require('ui/modules').get('app/wazuh', []);

app.directive('wzSearchBar', function() {
    return {
        restrict: 'E',
        scope: {
            data: '=data',
            term: '=term',
            placetext: '=placetext',
            height: '=height'
        },
        link: function(scope, ele, attrs) {

        },
        template: searchBarTemplate
    }
});
