/*
 * Wazuh app - Order object by filter module
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import { getAngularModule } from '../kibana-services';

const app = getAngularModule();

app.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    if (!items) return [];

    const isNumeric = n => !isNaN(parseFloat(n)) && isFinite(n);

    const filtered = [];

    items.forEach((item, key) => {
      item.key = key;
      filtered.push(item);
    });

    const index = (obj, i) => obj[i];

    filtered.sort((a, b) => {
      let reducedA = field.split('.').reduce(index, a);
      let reducedB = field.split('.').reduce(index, b);

      if (isNumeric(reducedA) && isNumeric(reducedB)) {
        reducedA = Number(reducedA);
        reducedB = Number(reducedB);
      }

      if (reducedA === reducedB) return 0;
      else return reducedA > reducedB ? 1 : -1;
    });

    if (reverse) {
      filtered.reverse();
    }

    return filtered;
  };
});
