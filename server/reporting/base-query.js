/*
 * Wazuh app - Base query for reporting queries
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default (pattern, filters, gte, lte) => {
  return {
    pattern: pattern,
    size: 0,
    aggs: {},
    stored_fields: ['*'],
    script_fields: {},
    docvalue_fields: [
      '@timestamp',
      'data.vulnerability.published',
      'data.vulnerability.updated',
      'syscheck.mtime_after',
      'syscheck.mtime_before',
      'data.cis.timestamp'
    ],
    query: {
      bool: {
        must: [
          {
            query_string: {
              query: filters,
              analyze_wildcard: true,
              default_field: '*'
            }
          },
          {
            range: {
              '@timestamp': {
                gte: gte,
                lte: lte,
                format: 'epoch_millis'
              }
            }
          }
        ],
        must_not: []
      }
    }
  };
};
