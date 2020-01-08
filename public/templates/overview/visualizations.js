/*
 * Wazuh app - Tab name equivalence
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const visualizations = {
  general: {
    metrics: [
      { id: 'Wazuh-App-Overview-General-Metric-alerts' },
      { id: 'Wazuh-App-Overview-General-Level-12-alerts' },
      { id: 'Wazuh-App-Overview-General-Authentication-failure' },
      { id: 'Wazuh-App-Overview-General-Authentication-success' },
    ],
    rows: [
      {
        height: 360,
        vis: [
          {
            title: 'Alert level evolution',
            id: 'Wazuh-App-Overview-General-Alert-level-evolution',
            width: 50,
          },
          { title: 'Alerts', id: 'Wazuh-App-Overview-General-Alerts', width: 50 },
        ],
      },
      {
        height: 270,
        vis: [
          { title: 'Top 5 agents', id: 'Wazuh-App-Overview-General-Top-5-agents', width: 33 },
          {
            title: 'Top 5 rule groups',
            id: 'Wazuh-App-Overview-General-Top-5-rule-groups',
            width: 33,
          },
          { title: 'Agents status', id: 'Wazuh-App-Overview-General-Agents-status', width: 33 },
        ],
      },
      {
        height: 360,
        vis: [
          {
            title: 'Alerts evolution - Top 5 agents',
            id: 'Wazuh-App-Overview-General-Alerts-evolution-Top-5-agents',
          },
        ],
      },
      {
        height: 570,
        vis: [{ title: 'Alerts summary', id: 'Wazuh-App-Overview-General-Alerts-summary' }],
      },
    ],
  },
  fim: {
    rows: [
      {
        height: 400,
        vis: [
          {
            title: 'Alerts by action over time',
            id: 'Wazuh-App-Agents-FIM-Alerts-by-action-over-time',
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: 'Top 5 agents',
            id: 'Wazuh-App-Overview-FIM-Top-5-agents-pie',
            width: 25,
          },
          {
            title: 'Events summary',
            id: 'Wazuh-App-Overview-FIM-Events-summary',
            width: 75,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: 'Rule distribution',
            id: 'Wazuh-App-Overview-FIM-Top-5-rules',
            width: 33,
          },
          {
            title: 'Actions',
            id: 'Wazuh-App-Overview-FIM-Common-actions',
            width: 33,
          },
          {
            title: 'Top 5 users',
            id: 'Wazuh-App-Overview-FIM-top-agents-user',
            width: 33,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-FIM-Alerts-summary',
          },
        ],
      },
    ],
  },
};
