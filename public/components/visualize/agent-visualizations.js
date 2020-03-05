/*
 * Wazuh app - Agents visualizations
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const agentVisualizations = {
  general: {
    metrics: [
      { id: 'Wazuh-App-Agents-General-Metric-alerts', description: 'Total', value: 'totalAlerts', color: 'primary' },
      { id: 'Wazuh-App-Agents-General-Level-12-alerts', description: 'Level 12 or above alerts', value: 'level12', color: 'accent' },
      { id: 'Wazuh-App-Agents-General-Authentication-failure', description: 'Authentication failure', value: 'authFailure', color: 'danger' },
      { id: 'Wazuh-App-Agents-General-Authentication-success', description: 'Authentication success', value: 'authSuccess', color: 'secondary'  },
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
            width: 34,
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
            width: 25,
          },
          {
            title: 'Actions',
            id: 'Wazuh-App-Agents-FIM-Actions',
            width: 25,
          },
          {
            title: 'Events',
            id: 'Wazuh-App-Agents-FIM-Events',
            width: 50,
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
            width: 34,
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
        height: 300,
        vis: [
          {
            title: 'Top 5 rule groups',
            id: 'Wazuh-App-Agents-PCI-Groups',
            width: 33,
          },
          {
            title: 'Top 5 rules',
            id: 'Wazuh-App-Agents-PCI-Rule',
            width: 33,
          },
          {
            title: 'Top 5 PCI DSS requirements',
            id: 'Wazuh-App-Agents-PCI-Requirement',
            width: 34,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: 'PCI Requirements',
            id: 'Wazuh-App-Agents-PCI-Requirements',
            width: 75,
          },
          {
            title: 'Rule level distribution',
            id: 'Wazuh-App-Agents-PCI-Rule-level-distribution',
            width: 25,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Agents-PCI-Last-alerts',
          },
        ],
      },
    ],
  },
  gdpr: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Top 5 rule groups',
            id: 'Wazuh-App-Agents-GDPR-Groups',
            width: 33,
          },
          {
            title: 'Top 5 rules',
            id: 'Wazuh-App-Agents-GDPR-Rule',
            width: 33,
          },
          {
            title: 'Top 5 GDPR requirements',
            id: 'Wazuh-App-Agents-GDPR-Requirement',
            width: 34,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: 'GDPR Requirements',
            id: 'Wazuh-App-Agents-GDPR-Requirements',
            width: 75,
          },
          {
            title: 'Rule level distribution',
            id: 'Wazuh-App-Agents-GDPR-Rule-level-distribution',
            width: 25,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Agents-GDPR-Last-alerts',
          },
        ],
      },
    ],
  },
  nist: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Stats',
            id: 'Wazuh-App-Agents-NIST-Stats',
            width: 25,
          },
          {
            title: 'Top 10 requirements',
            id: 'Wazuh-App-Agents-NIST-top-10-requirements',
            width: 25,
          },
          {
            title: 'Requirements distributed by level',
            id: 'Wazuh-App-Agents-NIST-Requirement-by-level',
            width: 50,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: 'Requirements over time',
            id: 'Wazuh-App-Agents-NIST-Requirements-stacked-overtime',
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Agents-NIST-Last-alerts',
          },
        ],
      },
    ],
  },
  hipaa: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Requirements over time',
            id: 'Wazuh-App-Agents-HIPAA-Requirements-Stacked-Overtime',
            width: 50,
          },
          {
            title: 'Top 10 requirements',
            id: 'Wazuh-App-Agents-HIPAA-top-10',
            width: 50,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: 'HIPAA requirements',
            id: 'Wazuh-App-Agents-HIPAA-Burbles',
            width: 50,
          },
          {
            title: 'Requirements distribution by level',
            id: 'Wazuh-App-Agents-HIPAA-Distributed-By-Level',
            width: 25,
          },
          {
            title: 'Most common alerts',
            id: 'Wazuh-App-Agents-HIPAA-Most-Common',
            width: 25,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Agents-HIPAA-Last-alerts',
          },
        ],
      },
    ],
  },
  vuls: {
    metrics: [
      { id: 'Wazuh-App-Agents-vuls-Metric-Critical-severity', description: 'Critical severity alerts', color: 'danger' },
      { id: 'Wazuh-App-Agents-vuls-Metric-High-severity', description: 'High severity alerts', color: 'primary'  },
      { id: 'Wazuh-App-Agents-vuls-Metric-Medium-severity', description: 'Medium severity alerts', color: 'secondary'},
      { id: 'Wazuh-App-Agents-vuls-Metric-Low-severity', description: 'Low severity alerts', color: 'subdued' },
    ],
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Alerts severity over time',
            id: 'Wazuh-App-Agents-vuls-Alerts-severity-over-time',
            width: 50,
          },
          { title: 'Most common rules', id: 'Wazuh-App-Agents-vuls-Most-common-rules', width: 50 },
        ],
      },
      {
        height: 270,
        vis: [
          {
            title: 'Most common CVEs',
            id: 'Wazuh-App-Agents-vuls-Vulnerability-Most-common-CVEs',
            width: 33,
          },
          {
            title: 'Severity distribution',
            id: 'Wazuh-App-Agents-vuls-Vulnerability-severity-distribution',
            width: 33,
          },
          {
            title: 'Commonly affected packages',
            id: 'Wazuh-App-Agents-vuls-Commonly-affected-packages',
            width: 34,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alert summary',
            id: 'Wazuh-App-Agents-vuls-Alert-summary',
          },
        ],
      },
    ],
  },
  virustotal: {
    metrics: [
      { id: 'Wazuh-App-Agents-Virustotal-Total-Malicious', description: 'Total malicious', color: 'danger' },
      { id: 'Wazuh-App-Agents-Virustotal-Total-Positives', description: 'Total positives', color: 'primary' },
      { id: 'Wazuh-App-Agents-Virustotal-Total', description: 'Total', color: 'secondary' },
    ],
    rows: [
      {
        height: 250,
        vis: [
          {
            title: 'Last scanned files',
            id: 'Wazuh-App-Agents-Virustotal-Last-Files-Pie',
            width: 25,
          },
          {
            title: 'Malicious files alerts Evolution',
            id: 'Wazuh-App-Agents-Virustotal-Malicious-Evolution',
            width: 75,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Last files',
            id: 'Wazuh-App-Agents-Virustotal-Files-Table',
          },
        ],
      },
    ],
  },
  osquery: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Most common Osquery actions',
            id: 'Wazuh-App-Agents-Osquery-most-common-osquery-actions',
            width: 25,
          },
          {
            title: 'Evolution of Osquery events per pack over time',
            id: 'Wazuh-App-Agents-Osquery-Evolution',
            width: 75,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: 'Most common Osquery packs being used',
            id: 'Wazuh-App-Agents-Osquery-top-5-packs-being-used',
            width: 25,
          },
          {
            title: 'Most common rules',
            id: 'Wazuh-App-Agents-Osquery-monst-common-rules-being-fired',
            width: 75,
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
            id: 'Wazuh-App-Agents-Docker-top-5-images',
            width: 25,
          },
          {
            title: 'Top 5 events',
            id: 'Wazuh-App-Agents-Docker-top-5-actions',
            width: 25,
          },
          {
            title: 'Resources usage over time',
            id: 'Wazuh-App-Agents-Docker-Types-over-time',
            width: 50,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: 'Events occurred evolution',
            id: 'Wazuh-App-Agents-Docker-Actions-over-time',
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Agents-Docker-Events-summary',
          },
        ],
      },
    ],
  },
  oscap: {
    metrics: [
      { id: 'Wazuh-App-Agents-OSCAP-Last-score', description: 'Last score', color: 'accent'  },
      { id: 'Wazuh-App-Agents-OSCAP-Higher-score-metric', description: 'Highest score', color: 'primary'  },
      { id: 'Wazuh-App-Agents-OSCAP-Lower-score-metric', description: 'Lowest score', color: 'secondary'  },
    ],
    rows: [
      {
        height: 230,
        vis: [
          {
            title: 'Top 5 Scans',
            id: 'Wazuh-App-Agents-OSCAP-Scans',
            width: 25,
          },
          {
            title: 'Top 5 Profiles',
            id: 'Wazuh-App-Agents-OSCAP-Profiles',
            width: 25,
          },
          {
            title: 'Top 5 Content',
            id: 'Wazuh-App-Agents-OSCAP-Content',
            width: 25,
          },
          {
            title: 'Top 5 Severity',
            id: 'Wazuh-App-Agents-OSCAP-Severity',
            width: 25,
          },
        ],
      },
      {
        height: 230,
        vis: [
          {
            title: 'Daily scans evolution',
            id: 'Wazuh-App-Agents-OSCAP-Daily-scans-evolution',
          },
        ],
      },
      {
        height: 250,
        vis: [
          {
            title: 'Top 5 - Alerts',
            id: 'Wazuh-App-Agents-OSCAP-Top-5-Alerts',
            width: 50,
          },
          {
            title: 'Top 5 - High risk alerts',
            id: 'Wazuh-App-Agents-OSCAP-Top-5-High-risk-alerts',
            width: 50,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Agents-OSCAP-Last-alerts',
          },
        ],
      },
    ],
  },
  ciscat: {
    metrics: [
      { id: 'Wazuh-app-Agents-CISCAT-last-scan-error', description: 'Last not checked', color: 'accent'  },
      { id: 'Wazuh-app-Agents-CISCAT-last-scan-fail', description: 'Last pass', color: 'primary' },
      { id: 'Wazuh-app-Agents-CISCAT-last-scan-not-checked', description: 'Last scan score', color: 'secondary'  },
      { id: 'Wazuh-app-Agents-CISCAT-last-scan-pass', description: 'Last scan date', color: 'subdued' },
      { id: 'Wazuh-app-Agents-CISCAT-last-scan-score', description: 'Last errors', color: 'accent' },
      { id: 'Wazuh-app-Agents-CISCAT-last-scan-timestamp', description: 'Last fails',  color: 'primary' },
      { id: 'Wazuh-app-Agents-CISCAT-last-scan-benchmark', description: 'Last unknown', color: 'secondary' },
      { id: 'Wazuh-app-Agents-CISCAT-last-scan-unknown', description: 'Last scan benchmark', color: 'subdued' },
    ],
    rows: [
      {
        height: 320,
        vis: [
          {
            title: 'Top 5 CIS-CAT groups',
            id: 'Wazuh-app-Agents-CISCAT-top-5-groups',
            width: 60,
          },
          {
            title: 'Scan result evolution',
            id: 'Wazuh-app-Agents-CISCAT-scan-result-evolution',
            width: 40,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-app-Agents-CISCAT-alerts-summary',
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
            title: 'Alerts over time',
            id: 'Wazuh-App-Agents-PM-Events-over-time',
            width: 50,
          },
          {
            title: 'Rule distribution',
            id: 'Wazuh-App-Agents-PM-Top-5-rules',
            width: 50,
          },
        ],
      },
      {
        height: 240,
        vis: [
          {
            title: 'Events per control type evolution',
            id: 'Wazuh-App-Agents-PM-Events-per-agent-evolution',
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Agents-PM-Alerts-summary',
          },
        ],
      },
    ],
  },
  audit: {
    metrics: [
      { id: 'Wazuh-App-Agents-Audit-New-files-metric', description: 'New files', color: 'primary' },
      { id: 'Wazuh-App-Agents-Audit-Read-files-metric', description: 'Read files', color: 'secondary' },
      { id: 'Wazuh-App-Agents-Audit-Modified-files-metric', description: 'Modified files', color: 'accent' },
      { id: 'Wazuh-App-Agents-Audit-Removed-files-metric', description: 'Removed files', color: 'danger' },
    ],
    rows: [
      {
        height: 250,
        vis: [
          {
            title: 'Groups',
            id: 'Wazuh-App-Agents-Audit-Groups',
            width: 33,
          },
          {
            title: 'Commands',
            id: 'Wazuh-App-Agents-Audit-Commands',
            width: 33,
          },
          {
            title: 'Files',
            id: 'Wazuh-App-Agents-Audit-Files',
            width: 34,
          },
        ],
      },
      {
        height: 310,
        vis: [
          {
            title: 'Alerts over time',
            id: 'Wazuh-App-Agents-Audit-Alerts-over-time',
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Agents-Audit-Last-alerts',
          },
        ],
      },
    ],
  },
};
