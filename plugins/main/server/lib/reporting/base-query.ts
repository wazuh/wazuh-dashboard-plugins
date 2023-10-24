/*
 * Wazuh app - Base query for reporting queries
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { cloneDeep } from 'lodash';

export function Base(pattern: string, filters: any, gte: number, lte: number, allowedAgentsFilter: any = null) {
  const clonedFilter = cloneDeep(filters);
  clonedFilter?.bool?.must?.push?.({
    range: {
      timestamp: {
        gte: gte,
        lte: lte,
        format: 'epoch_millis'
      }
    }
  });
  const base = {
    from: 0,
    size: 500,
    aggs: {},
    sort: [],
    script_fields: {},
    query: clonedFilter
  };

  return base;
}
