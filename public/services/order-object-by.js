/*
 * Wazuh app - Order object by filter module
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * Copyright (C) 2015 Fabricio Quagliariello.
 * Source code available under the MIT License.
 * More information here: https://github.com/fmquaglia/ngOrderObjectBy
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
'use strict';
import { uiModules } from 'ui/modules'

uiModules.get('app/wazuh', [])
    .filter('orderObjectBy', function() {
        return function(items, field, reverse) {

            function isNumeric(n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            }

            var filtered = [];

            angular.forEach(items, function(item, key) {
                item.key = key;
                filtered.push(item);
            });

            function index(obj, i) {
                return obj[i];
            }

            filtered.sort(function(a, b) {
                var comparator;
                var reducedA = field.split('.').reduce(index, a);
                var reducedB = field.split('.').reduce(index, b);

                if (isNumeric(reducedA) && isNumeric(reducedB)) {
                    reducedA = Number(reducedA);
                    reducedB = Number(reducedB);
                }

                if (reducedA === reducedB) {
                    comparator = 0;
                } else {
                    comparator = reducedA > reducedB ? 1 : -1;
                }

                return comparator;
            });

            if (reverse) {
                filtered.reverse();
            }

            return filtered;
        };
    });
