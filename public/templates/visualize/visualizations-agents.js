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
      { id: 'Wazuh-App-Agents-General-Metric-alerts' },
      { id: 'Wazuh-App-Agents-General-Level-12-alerts' },
      { id: 'Wazuh-App-Agents-General-Authentication-failure' },
      { id: 'Wazuh-App-Agents-General-Authentication-success' },
    ],
    rows: [
      {
        height: 400,
        vis: [
          {
            title: 'Alert groups evolution',
            id: 'Wazuh-App-Agents-General-Alert-groups-evolution',
            width: 50,
          },
          { title: 'Alerts', id: 'Wazuh-App-Agents-General-Alerts', width: 50 },
        ],
      },
      {
        height: 300,
        vis: [
          { title: 'Top 5 agents', id: 'Wazuh-App-Agents-General-Top-5-alerts', width: 33 },
          {
            title: 'Top 5 rule groups',
            id: 'Wazuh-App-Agents-General-Top-10-groups',
            width: 33,
          },
          {
            title: 'Top 5 PCI DSS Requirements',
            id: 'Wazuh-App-Agents-General-Top-5-PCI-DSS-Requirements',
            width: 33,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Agents-General-Alerts-summary',
            width: 60,
          },
          {
            title: 'Groups summary',
            id: 'Wazuh-App-Agents-General-Groups-summary',
            width: 40,
          },
        ],
      },
    ],
  },
  fim: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Most active users',
            id: 'Wazuh-App-Agents-FIM-Users',
            width: 30,
          },
          {
            title: 'Actions',
            id: 'Wazuh-App-Agents-FIM-Actions',
            width: 30,
          },
          {
            title: 'Events',
            id: 'Wazuh-App-Agents-FIM-Events',
            width: 40,
          },
        ],
      },
      {
        height: 230,
        vis: [
          {
            title: 'Files added',
            id: 'Wazuh-App-Agents-FIM-Files-added',
            width: 33,
          },
          {
            title: 'Files modified',
            id: 'Wazuh-App-Agents-FIM-Files-modified',
            width: 33,
          },
          {
            title: 'Files deleted',
            id: 'Wazuh-App-Agents-FIM-Files-deleted',
            width: 33,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Agents-FIM-Alerts-summary',
          },
        ],
      },
    ],
  },
  pci: {
    rows: [
      {
        height: 400,
        vis: [
          {
            title: 'PCI DSS requirements',
            id: 'Wazuh-App-Overview-PCI-DSS-requirements',
            width: 50,
          },
          {
            title: 'Top 10 agents by alerts number',
            id: 'Wazuh-App-Overview-PCI-DSS-Agents',
            width: 50,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: 'Top requirements over time',
            id: 'Wazuh-App-Overview-PCI-DSS-Requirements-over-time',
          },
        ],
      },
      {
        height: 530,
        vis: [
          {
            title: 'Last alerts',
            id: 'Wazuh-App-Overview-PCI-DSS-Requirements-Agents-heatmap',
          },
        ],
      },
      {
        height: 255,
        vis: [
          {
            title: 'Requirements by agent',
            id: 'Wazuh-App-Overview-PCI-DSS-Requirements-by-agent',
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-PCI-DSS-Alerts-summary',
          },
        ],
      },
    ],
  },
  gdpr: {
    rows: [
      {
        height: 400,
        vis: [
          {
            title: 'Top 10 agents by alerts number',
            id: 'Wazuh-App-Overview-GDPR-Agents',
            width: 30,
          },
          {
            title: 'GDPR requirements',
            id: 'Wazuh-App-Overview-GDPR-requirements',
            width: 70,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: 'Top requirements over time',
            id: 'Wazuh-App-Overview-GDPR-Requirements-heatmap',
          },
        ],
      },
      {
        height: 530,
        vis: [
          {
            title: 'Last alerts',
            id: 'Wazuh-App-Overview-GDPR-Requirements-Agents-heatmap',
          },
        ],
      },
      {
        height: 255,
        vis: [
          {
            title: 'Requirements by agent',
            id: 'Wazuh-App-Overview-GDPR-Requirements-by-agent',
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-GDPR-Alerts-summary',
          },
        ],
      },
    ],
  },
  nist: {
    rows: [
      {
        height: 400,
        vis: [
          {
            title: 'Most active agents',
            id: 'Wazuh-App-Overview-NIST-Agents',
            width: 20,
          },
          {
            title: 'Top requirements over time',
            id: 'Wazuh-App-Overview-NIST-Requirements-over-time',
            width: 45,
          },
          {
            title: 'Requiments distribution by agent',
            id: 'Wazuh-App-Overview-NIST-requirements-by-agents',
            width: 35,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: 'Alerts volume by agent',
            id: 'Wazuh-App-Overview-NIST-Requirements-Agents-heatmap',
            width: 45,
          },
          {
            title: 'Stats',
            id: 'Wazuh-App-Overview-NIST-Metrics',
            width: 25,
          },
          {
            title: 'Top 10 requirements',
            id: 'Wazuh-App-Overview-NIST-Top-10-requirements',
            width: 30,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-NIST-Alerts-summary',
          },
        ],
      },
    ],
  },
  hipaa: {
    rows: [
      {
        height: 570,
        vis: [
          {
            title: 'Alerts volume by agent',
            id: 'Wazuh-App-Overview-HIPAA-Heatmap',
            width: 50,
          },
          {
            hasRows: true,
            rows: [
              {
                height: 285,
                vis: [
                  {
                    title: 'Most common alerts',
                    id: 'Wazuh-App-Overview-HIPAA-Tag-cloud',
                    width: 50,
                  },
                  {
                    title: 'Top 10 requirements',
                    id: 'Wazuh-App-Overview-HIPAA-Top-10-requirements',
                    width: 50,
                  },
                ],
              },
              {
                height: 285,
                vis: [
                  {
                    title: 'Most active agents',
                    id: 'Wazuh-App-Overview-HIPAA-Top-10-agents',
                    width: 50,
                  },
                  {
                    title: 'Stats',
                    id: 'Wazuh-App-Overview-HIPAA-Metrics',
                    width: 50,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        height: 400,
        vis: [
          {
            title: 'Requirements evolution over time',
            id: 'Wazuh-App-Overview-HIPAA-Top-requirements-over-time',
            width: 50,
          },
          {
            title: 'Requirements distribution by agent',
            id: 'Wazuh-App-Overview-HIPAA-Top-10-requirements-over-time-by-agent',
            width: 50,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-HIPAA-Alerts-summary',
          },
        ],
      },
    ],
  },
  vuls: {
    metrics: [
      { id: 'Wazuh-App-Overview-vuls-Metric-Critical-severity' },
      { id: 'Wazuh-App-Overview-vuls-Metric-High-severity' },
      { id: 'Wazuh-App-Overview-vuls-Metric-Medium-severity' },
      { id: 'Wazuh-App-Overview-vuls-Metric-Low-severity' },
    ],
    rows: [
      {
        height: 270,
        vis: [
          {
            title: 'Most affected agents',
            id: 'Wazuh-App-Overview-vuls-Most-affected-agents',
            width: 30,
          },
          { title: 'Alerts severity', id: 'Wazuh-App-Overview-vuls-Alerts-severity', width: 70 },
        ],
      },
      {
        height: 270,
        vis: [
          {
            title: 'Severity distribution',
            id: 'Wazuh-App-Overview-vuls-Vulnerability-severity-distribution',
            width: 25,
          },
          {
            title: 'Commonly affected packages',
            id: 'Wazuh-App-Overview-vuls-Commonly-affected-packages',
            width: 25,
          },
          {
            title: 'Most common CVEs',
            id: 'Wazuh-App-Overview-vuls-Most-common-CVEs',
            width: 25,
          },
          {
            title: 'Most common CWEs',
            id: 'Wazuh-App-Overview-vuls-Most-common-CWEs',
            width: 25,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alert summary',
            id: 'Wazuh-App-Overview-vuls-Alert-summary',
          },
        ],
      },
    ],
  },
  virustotal: {
    metrics: [
      { id: 'Wazuh-App-Overview-Virustotal-Total-Malicious' },
      { id: 'Wazuh-App-Overview-Virustotal-Total-Positives' },
      { id: 'Wazuh-App-Overview-Virustotal-Total' },
    ],
    rows: [
      {
        height: 360,
        vis: [
          {
            title: 'Unique malicious files per agent',
            id: 'Wazuh-App-Overview-Virustotal-Malicious-Per-Agent',
            width: 50,
          },
          {
            title: 'Last scanned files',
            id: 'Wazuh-App-Overview-Virustotal-Last-Files-Pie',
            width: 50,
          },
        ],
      },
      {
        height: 550,
        vis: [
          {
            title: 'Top 10 agents with positive scans',
            id: 'Wazuh-App-Overview-Virustotal-Positives-Heatmap',
          },
        ],
      },
      {
        height: 250,
        vis: [
          {
            title: 'Malicious files alerts evolution',
            id: 'Wazuh-App-Overview-Virustotal-Malicious-Evolution',
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Last files',
            id: 'Wazuh-App-Overview-Virustotal-Files-Table',
          },
        ],
      },
    ],
  },
  osquery: {
    metrics: [{ id: 'Wazuh-App-Overview-Osquery-Agents-reporting' }],
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Top 5 Osquery events added',
            id: 'Wazuh-App-Overview-Osquery-Top-5-added',
            width: 25,
          },
          {
            title: 'Top 5 Osquery events removed',
            id: 'Wazuh-App-Overview-Osquery-Top-5-removed',
            width: 25,
          },
          {
            title: 'Evolution of Osquery events per pack over time',
            id: 'Wazuh-App-Agents-Osquery-Evolution',
            width: 50,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: 'Most common packs',
            id: 'Wazuh-App-Overview-Osquery-Most-common-packs',
            width: 30,
          },
          {
            title: 'Top 5 rules',
            id: 'Wazuh-App-Overview-Osquery-Top-5-rules',
            width: 70,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-Osquery-Alerts-summary',
          },
        ],
      },
    ],
  },
  docker: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Top 5 images',
            id: 'Wazuh-App-Overview-Docker-top-5-images',
            width: 25,
          },
          {
            title: 'Top 5 events',
            id: 'Wazuh-App-Overview-Docker-top-5-actions',
            width: 25,
          },
          {
            title: 'Resources usage over time',
            id: 'Wazuh-App-Overview-Docker-Types-over-time',
            width: 50,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: 'Events occurred evolution',
            id: 'Wazuh-App-Overview-Docker-Actions-over-time',
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-Docker-Events-summary',
          },
        ],
      },
    ],
  },
  oscap: {
    metrics: [
      { id: 'Wazuh-App-Overview-OSCAP-Last-score' },
      { id: 'Wazuh-App-Overview-OSCAP-Highest-score' },
      { id: 'Wazuh-App-Overview-OSCAP-Lowest-score' },
    ],
    rows: [
      {
        height: 215,
        vis: [
          {
            title: 'Top 5 Agents',
            id: 'Wazuh-App-Overview-OSCAP-Agents',
            width: 25,
          },
          {
            title: 'Top 5 Profiles',
            id: 'Wazuh-App-Overview-OSCAP-Profiles',
            width: 25,
          },
          {
            title: 'Top 5 Content',
            id: 'Wazuh-App-Overview-OSCAP-Content',
            width: 25,
          },
          {
            title: 'Top 5 Severity',
            id: 'Wazuh-App-Overview-OSCAP-Severity',
            width: 25,
          },
        ],
      },
      {
        height: 240,
        vis: [
          {
            title: 'Top 5 Agents - Severity high',
            id: 'Wazuh-App-Overview-OSCAP-Top-5-agents-Severity-high',
          },
        ],
      },
      {
        height: 320,
        vis: [
          {
            title: 'Top 10 - Alerts',
            id: 'Wazuh-App-Overview-OSCAP-Top-10-alerts',
            width: 50,
          },
          {
            title: 'Top 10 - High risk alerts',
            id: 'Wazuh-App-Overview-OSCAP-Top-10-high-risk-alerts',
            width: 50,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-OSCAP-Last-alerts',
          },
        ],
      },
    ],
  },
  ciscat: {
    metrics: [
      { id: 'Wazuh-app-Overview-CISCAT-last-scan-error' },
      { id: 'Wazuh-app-Overview-CISCAT-last-scan-fail' },
      { id: 'Wazuh-app-Overview-CISCAT-last-scan-not-checked' },
      { id: 'Wazuh-app-Overview-CISCAT-last-scan-pass' },
      { id: 'Wazuh-app-Overview-CISCAT-last-scan-score' },
      { id: 'Wazuh-app-Overview-CISCAT-last-scan-timestamp' },
      { id: 'Wazuh-app-Overview-CISCAT-last-scan-benchmark' },
      { id: 'Wazuh-app-Overview-CISCAT-last-scan-unknown' },
    ],
    rows: [
      {
        height: 320,
        vis: [
          {
            title: 'Top 5 CIS-CAT groups',
            id: 'Wazuh-app-Overview-CISCAT-top-5-groups',
            width: 60,
          },
          {
            title: 'Scan result evolution',
            id: 'Wazuh-app-Overview-CISCAT-scan-result-evolution',
            width: 40,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-app-Overview-CISCAT-alerts-summary',
          },
        ],
      },
    ],
  },
  pm: {
    rows: [
      {
        height: 290,
        vis: [
          {
            title: 'Events over time',
            id: 'Wazuh-App-Overview-PM-Events-over-time',
            width: 50,
          },
          {
            title: 'Rule distribution',
            id: 'Wazuh-App-Overview-PM-Top-5-rules',
            width: 25,
          },
          {
            title: 'Top 5 agents',
            id: 'Wazuh-App-Overview-PM-Top-5-agents-pie',
            width: 25,
          },
        ],
      },
      {
        height: 240,
        vis: [
          {
            title: 'Events per control type evolution',
            id: 'Wazuh-App-Overview-PM-Events-per-agent-evolution',
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-PM-Alerts-summary',
          },
        ],
      },
    ],
  },
  audit: {
    rows: [
      {
        height: 250,
        vis: [
          {
            title: 'Groups',
            id: 'Wazuh-App-Overview-Audit-Groups',
            width: 25,
          },
          {
            title: 'Agents',
            id: 'Wazuh-App-Overview-Audit-Agents',
            width: 25,
          },
          {
            title: 'Commands',
            id: 'Wazuh-App-Overview-Audit-Commands',
            width: 25,
          },
          {
            title: 'Files',
            id: 'Wazuh-App-Overview-Audit-Files',
            width: 25,
          },
        ],
      },
      {
        height: 310,
        vis: [
          {
            title: 'Alerts over time',
            id: 'Wazuh-App-Overview-Audit-Alerts-over-time',
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-Audit-Last-alerts',
          },
        ],
      },
    ],
  },
};
