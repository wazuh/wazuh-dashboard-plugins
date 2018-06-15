/*
 * Wazuh app - Dynamic directive
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules }  from 'ui/modules'

const app = uiModules.get('app/wazuh', []);

app.directive('wzDynamic', function($compile) {
    return {
        restrict: 'A',
        replace: true,
        link: function(scope, ele, attrs) {
            scope.$watch(attrs.wzDynamic, function(html) {
                ele.html(html);
                $compile(ele.contents())(scope);
            });
        },
    };
});
