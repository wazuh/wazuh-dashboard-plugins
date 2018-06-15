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
import { uiModules }      from 'ui/modules'

const app = uiModules.get('app/wazuh', []);

app.directive('wzSearchBar', function() {
    return {
        restrict: 'E',
        scope: {
            data      : '=data',
            term      : '=term',
            placetext : '=placetext',
            height    : '=height',
            isdisabled: '=isdisabled'
        },
        link: function(scope, ele, attrs) {
            scope.applyDelayAndFilter = searchTerm => {
                setTimeout(() => scope.data.addFilter('search', searchTerm),200)
            }
        },
        template: searchBarTemplate
    }
});
