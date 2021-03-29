/*
 * Wazuh app - Module for monitoring template
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const statisticsTemplate = {
  order: 0,
  settings: {
    'index.refresh_interval': '5s'
  },
  mappings: {
    properties: {
      timestamp: {
        type: 'date',
        format: 'dateOptionalTime'
      },
      status: {
        type: 'keyword'
      },
      name: {
        type: 'keyword'
      },
      analysisid: {
        type: 'nested',
        properties: {
          total_events_decoded: {
            type: 'text'
          },
          syscheck_events_decoded: {
            type: 'text'
          }
        }
      },
      remoted: {
          type: 'nested',
          properties: {
            queue_size: {
              type: 'text'
            }
          }
      }
    }
  }
};
