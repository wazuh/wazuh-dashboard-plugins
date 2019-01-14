/*
 * Wazuh app - Wazuh table directive
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

app.service('wzTableFilter', () => {
  const filters = [];
  return {
    set(array) {
      if (Array.isArray(array)) {
        filters.length = 0;
        filters.push(...array);
      }
    },
    get() {
      return filters;
    }
  };
});
