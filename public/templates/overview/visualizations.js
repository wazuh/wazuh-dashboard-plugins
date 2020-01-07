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
    overview: {
        metrics: [
            { id: 'Wazuh-App-Overview-General-Metric-alerts' },
            { id: 'Wazuh-App-Overview-General-Level-12-alerts' },
            { id: 'Wazuh-App-Overview-General-Authentication-failure' },
            { id: 'Wazuh-App-Overview-General-Authentication-success' }
        ],
        rows: [
            {
                height: 360,
                vis: [
                    { title: 'Alert level evolution', id: 'Wazuh-App-Overview-General-Alert-level-evolution', width: 50 },
                    { title: 'Alerts', id: 'Wazuh-App-Overview-General-Alerts', width: 50 },
                ]
            },
            {
                height: 270,
                vis: [
                    { title: 'Top 5 agents', id: 'Wazuh-App-Overview-General-Top-5-agents', width: 30 },
                    { title: 'Top 5 rule groups', id: 'Wazuh-App-Overview-General-Top-5-rule-groups', width: 30 },
                    { title: 'Agents status', id: 'Wazuh-App-Overview-General-Agents-status', width: 30 },
                ]
            },
            {
                height: 360,
                vis: [
                    { title: 'Alerts evolution - Top 5 agents', id: 'Wazuh-App-Overview-General-Alerts-evolution-Top-5-agents' },
                ]
            },
            {
                height: 570,
                vis: [
                    { title: 'Alerts summary', id: 'Wazuh-App-Overview-General-Alerts-summary' },
                ]
            },
        ]
    }
};
