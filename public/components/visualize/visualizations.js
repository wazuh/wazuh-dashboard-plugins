/*
 * Wazuh app - Overview visualizations
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { i18n } from '@kbn/i18n';

export const visualizations = {
  general: {
    rows: [
      {
        height: 360,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.alertLevel',
              {
                defaultMessage: 'Alert level evolution',
              },
            ),
            id: 'Wazuh-App-Overview-General-Alert-level-evolution',
            width: 60,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.topMitreAttacks',
              {
                defaultMessage: 'Top MITRE ATT&CKS',
              },
            ),
            id: 'Wazuh-App-Overview-General-Alerts-Top-Mitre',
            width: 40,
          },
        ],
      },
      {
        height: 360,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.topAgents',
              {
                defaultMessage: 'Top 5 agents',
              },
            ),
            id: 'Wazuh-App-Overview-General-Top-5-agents',
            width: 30,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.alertsEvolutionTopAgents',
              {
                defaultMessage: 'Alerts evolution - Top 5 agents',
              },
            ),
            id: 'Wazuh-App-Overview-General-Alerts-evolution-Top-5-agents',
            width: 70,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.alertsSummary',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-General-Alerts-summary',
          },
        ],
      },
    ],
  },
  fim: {
    rows: [
      {
        height: 400,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.alertsAction',
              {
                defaultMessage: 'Alerts by action over time',
              },
            ),
            id: 'Wazuh-App-Agents-FIM-Alerts-by-action-over-time',
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.topAgents',
              {
                defaultMessage: 'Top 5 agents',
              },
            ),
            id: 'Wazuh-App-Overview-FIM-Top-5-agents-pie',
            width: 30,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.eventSummary',
              {
                defaultMessage: 'Events summary',
              },
            ),
            id: 'Wazuh-App-Overview-FIM-Events-summary',
            width: 70,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.ruleDistribution',
              {
                defaultMessage: 'Rule distribution',
              },
            ),
            id: 'Wazuh-App-Overview-FIM-Top-5-rules',
            width: 33,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.commonAction',
              {
                defaultMessage: 'Actions',
              },
            ),
            id: 'Wazuh-App-Overview-FIM-Common-actions',
            width: 33,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.topAgentsUser',
              {
                defaultMessage: 'Top 5 users',
              },
            ),
            id: 'Wazuh-App-Overview-FIM-top-agents-user',
            width: 34,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.alertsSummary',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-FIM-Alerts-summary',
          },
        ],
      },
    ],
  },
  office: {
    rows: [
      {
        height: 320,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.eventBySeverity',
              {
                defaultMessage: 'Events by severity over time',
              },
            ),
            id: 'Wazuh-App-Overview-Office-Rule-Level-Histogram',
            width: 40,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.ipByUsers',
              {
                defaultMessage: 'IP by Users',
              },
            ),
            id: 'Wazuh-App-Overview-Office-IPs-By-User-Barchart',
            width: 30,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.topUsersBySubscription',
              {
                defaultMessage: 'Top Users By Subscription',
              },
            ),
            id: 'Wazuh-App-Overview-Office-Top-Users-By-Subscription-Barchart',
            width: 30,
          },
        ],
      },
      {
        height: 350,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.operationResult',
              {
                defaultMessage: 'Users by Operation Result',
              },
            ),
            id: 'Wazuh-App-Overview-Office-User-By-Operation-Result',
            width: 35,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.16',
              {
                defaultMessage: 'Severity by User',
              },
            ),
            id: 'Wazuh-App-Overview-Office-Severity-By-User-Barchart',
            width: 30,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.17',
              {
                defaultMessage: 'Rule Description by Level',
              },
            ),
            id: 'Wazuh-App-Overview-Office-Rule-Description-Level-Table',
            width: 35,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.18',
              {
                defaultMessage: 'Geolocation map',
              },
            ),
            id: 'Wazuh-App-Overview-Office-Location',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.19',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-Office-Alerts-summary',
          },
        ],
      },
    ],
  },
  aws: {
    rows: [
      {
        height: 250,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.20',
              {
                defaultMessage: 'Sources',
              },
            ),
            id: 'Wazuh-App-Overview-AWS-Top-sources',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.21',
              {
                defaultMessage: 'Accounts',
              },
            ),
            id: 'Wazuh-App-Overview-AWS-Top-accounts',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.22',
              {
                defaultMessage: 'S3 buckets',
              },
            ),
            id: 'Wazuh-App-Overview-AWS-Top-buckets',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.23',
              {
                defaultMessage: 'Regions',
              },
            ),
            id: 'Wazuh-App-Overview-AWS-Top-regions',
            width: 25,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.24',
              {
                defaultMessage: 'Events by source over time',
              },
            ),
            id: 'Wazuh-App-Overview-AWS-Events-by-source',
            width: 50,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.25',
              {
                defaultMessage: 'Events by S3 bucket over time',
              },
            ),
            id: 'Wazuh-App-Overview-AWS-Events-by-s3-bucket',
            width: 50,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.26',
              {
                defaultMessage: 'Geolocation map',
              },
            ),
            id: 'Wazuh-App-Overview-AWS-geo',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.27',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-AWS-Alerts-summary',
          },
        ],
      },
    ],
  },
  gcp: {
    rows: [
      {
        height: 250,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.28',
              {
                defaultMessage: 'Events over time by auth answer',
              },
            ),
            id: 'Wazuh-App-Overview-GCP-Alerts-Evolution-By-AuthAnswer',
            width: 100,
          },
        ],
      },
      {
        height: 250,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.29',
              {
                defaultMessage: 'Top instances by response code',
              },
            ),
            id: 'Wazuh-App-Overview-GCP-Top-vmInstances-By-ResponseCode',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.30',
              {
                defaultMessage: 'Resource type by project id',
              },
            ),
            id: 'Wazuh-App-Overview-GCP-Top-ResourceType-By-Project-Id',
            width: 50,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.31',
              {
                defaultMessage: 'Top project id by sourcetype',
              },
            ),
            id: 'Wazuh-App-Overview-GCP-Top-ProjectId-By-SourceType',
            width: 25,
          },
        ],
      },
      {
        height: 450,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.32',
              {
                defaultMessage: 'Top 5 Map by source ip',
              },
            ),
            id: 'Wazuh-App-Overview-GCP-Map-By-SourceIp',
            width: 100,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.33',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-GCP-Alerts-summary',
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
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.34',
              {
                defaultMessage: 'PCI DSS requirements',
              },
            ),
            id: 'Wazuh-App-Overview-PCI-DSS-requirements',
            width: 50,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.35',
              {
                defaultMessage: 'Top 10 agents by alerts number',
              },
            ),
            id: 'Wazuh-App-Overview-PCI-DSS-Agents',
            width: 50,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.36',
              {
                defaultMessage: 'Top requirements over time',
              },
            ),
            id: 'Wazuh-App-Overview-PCI-DSS-Requirements-over-time',
          },
        ],
      },
      {
        height: 530,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.37',
              {
                defaultMessage: 'Last alerts',
              },
            ),
            id: 'Wazuh-App-Overview-PCI-DSS-Requirements-Agents-heatmap',
          },
        ],
      },
      {
        height: 255,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.38',
              {
                defaultMessage: 'Requirements by agent',
              },
            ),
            id: 'Wazuh-App-Overview-PCI-DSS-Requirements-by-agent',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.39',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
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
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.40',
              {
                defaultMessage: 'Top 10 agents by alerts number',
              },
            ),
            id: 'Wazuh-App-Overview-GDPR-Agents',
            width: 30,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.41',
              {
                defaultMessage: 'GDPR requirements',
              },
            ),
            id: 'Wazuh-App-Overview-GDPR-requirements',
            width: 70,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.42',
              {
                defaultMessage: 'Top requirements over time',
              },
            ),
            id: 'Wazuh-App-Overview-GDPR-Requirements-heatmap',
          },
        ],
      },
      {
        height: 530,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.43',
              {
                defaultMessage: 'Last alerts',
              },
            ),
            id: 'Wazuh-App-Overview-GDPR-Requirements-Agents-heatmap',
          },
        ],
      },
      {
        height: 255,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.44',
              {
                defaultMessage: 'Requirements by agent',
              },
            ),
            id: 'Wazuh-App-Overview-GDPR-Requirements-by-agent',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.45',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
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
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.46',
              {
                defaultMessage: 'Most active agents',
              },
            ),
            id: 'Wazuh-App-Overview-NIST-Agents',
            width: 20,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.47',
              {
                defaultMessage: 'Top requirements over time',
              },
            ),
            id: 'Wazuh-App-Overview-NIST-Requirements-over-time',
            width: 50,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.48',
              {
                defaultMessage: 'Requiments distribution by agent',
              },
            ),
            id: 'Wazuh-App-Overview-NIST-requirements-by-agents',
            width: 30,
          },
        ],
      },
      {
        height: 350,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.49',
              {
                defaultMessage: 'Alerts volume by agent',
              },
            ),
            id: 'Wazuh-App-Overview-NIST-Requirements-Agents-heatmap',
            width: 50,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.50',
              {
                defaultMessage: 'Stats',
              },
            ),
            id: 'Wazuh-App-Overview-NIST-Metrics',
            width: 20,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.51',
              {
                defaultMessage: 'Top 10 requirements',
              },
            ),
            id: 'Wazuh-App-Overview-NIST-Top-10-requirements',
            width: 30,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.52',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-NIST-Alerts-summary',
          },
        ],
      },
    ],
  },
  tsc: {
    rows: [
      {
        height: 400,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.53',
              {
                defaultMessage: 'TSC requirements',
              },
            ),
            id: 'Wazuh-App-Overview-TSC-requirements',
            width: 50,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.54',
              {
                defaultMessage: 'Top 10 agents by alerts number',
              },
            ),
            id: 'Wazuh-App-Overview-TSC-Agents',
            width: 50,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.55',
              {
                defaultMessage: 'Top requirements over time',
              },
            ),
            id: 'Wazuh-App-Overview-TSC-Requirements-over-time',
          },
        ],
      },
      {
        height: 530,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.56',
              {
                defaultMessage: 'Last alerts',
              },
            ),
            id: 'Wazuh-App-Overview-TSC-Requirements-Agents-heatmap',
          },
        ],
      },
      {
        height: 255,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.57',
              {
                defaultMessage: 'Requirements by agent',
              },
            ),
            id: 'Wazuh-App-Overview-TSC-Requirements-by-agent',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.58',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-TSC-Alerts-summary',
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
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.59',
              {
                defaultMessage: 'Alerts volume by agent',
              },
            ),
            id: 'Wazuh-App-Overview-HIPAA-Heatmap',
            width: 50,
          },
          {
            hasRows: true,
            width: 50,
            rows: [
              {
                height: 285,
                vis: [
                  {
                    title: i18n.translate(
                      'wazuh.components.visualize.visualizations.title.60',
                      {
                        defaultMessage: 'Most common alerts',
                      },
                    ),
                    id: 'Wazuh-App-Overview-HIPAA-Tag-cloud',
                    width: 50,
                  },
                  {
                    title: i18n.translate(
                      'wazuh.components.visualize.visualizations.title.61',
                      {
                        defaultMessage: 'Top 10 requirements',
                      },
                    ),
                    id: 'Wazuh-App-Overview-HIPAA-Top-10-requirements',
                    width: 50,
                  },
                ],
              },
              {
                height: 285,
                noMargin: true,
                vis: [
                  {
                    title: i18n.translate(
                      'wazuh.components.visualize.visualizations.title.62',
                      {
                        defaultMessage: 'Most active agents',
                      },
                    ),
                    id: 'Wazuh-App-Overview-HIPAA-Top-10-agents',
                    width: 50,
                  },
                  {
                    title: i18n.translate(
                      'wazuh.components.visualize.visualizations.title.63',
                      {
                        defaultMessage: 'Stats',
                      },
                    ),
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
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.64',
              {
                defaultMessage: 'Requirements evolution over time',
              },
            ),
            id: 'Wazuh-App-Overview-HIPAA-Top-requirements-over-time',
            width: 50,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.65',
              {
                defaultMessage: 'Requirements distribution by agent',
              },
            ),
            id: 'Wazuh-App-Overview-HIPAA-Top-10-requirements-over-time-by-agent',
            width: 50,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.66',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-HIPAA-Alerts-summary',
          },
        ],
      },
    ],
  },
  vuls: {
    rows: [
      {
        height: 330,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.67',
              {
                defaultMessage: 'Most affected agents',
              },
            ),
            id: 'Wazuh-App-Overview-vuls-Most-affected-agents',
            width: 30,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.68',
              {
                defaultMessage: 'Alerts severity',
              },
            ),
            id: 'Wazuh-App-Overview-vuls-Alerts-severity',
            width: 70,
          },
        ],
      },
      {
        height: 330,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.69',
              {
                defaultMessage: 'Most common CVEs',
              },
            ),
            id: 'Wazuh-App-Overview-vuls-Most-common-CVEs',
            width: 30,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.70',
              {
                defaultMessage: 'TOP affected packages alerts Evolution',
              },
            ),
            id: 'Wazuh-App-Overview-vuls-Vulnerability-evolution-affected-packages',
            width: 40,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.71',
              {
                defaultMessage: 'Most common CWEs',
              },
            ),
            id: 'Wazuh-App-Overview-vuls-Most-common-CWEs',
            width: 30,
          },
        ],
      },
      {
        height: 450,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.72',
              {
                defaultMessage: 'Top affected packages by CVEs',
              },
            ),
            id: 'Wazuh-App-Overview-vuls-packages-CVEs',
            width: 50,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.73',
              {
                defaultMessage: 'Agents by severity',
              },
            ),
            id: 'Wazuh-App-Overview-vuls-agents-severities',
            width: 50,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.74',
              {
                defaultMessage: 'Alert summary',
              },
            ),
            id: 'Wazuh-App-Overview-vuls-Alert-summary',
          },
        ],
      },
    ],
  },
  virustotal: {
    rows: [
      {
        height: 360,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.75',
              {
                defaultMessage: 'Unique malicious files per agent',
              },
            ),
            id: 'Wazuh-App-Overview-Virustotal-Malicious-Per-Agent',
            width: 50,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.76',
              {
                defaultMessage: 'Last scanned files',
              },
            ),
            id: 'Wazuh-App-Overview-Virustotal-Last-Files-Pie',
            width: 50,
          },
        ],
      },
      {
        height: 550,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.77',
              {
                defaultMessage: 'Alerts evolution by agents',
              },
            ),
            id: 'Wazuh-App-Overview-Virustotal-Alerts-Evolution',
          },
        ],
      },
      {
        height: 250,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.78',
              {
                defaultMessage: 'Malicious files alerts evolution',
              },
            ),
            id: 'Wazuh-App-Overview-Virustotal-Malicious-Evolution',
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.79',
              {
                defaultMessage: 'Last files',
              },
            ),
            id: 'Wazuh-App-Overview-Virustotal-Files-Table',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.80',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-Virustotal-Alerts-summary',
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
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.81',
              {
                defaultMessage: 'Top 5 Osquery events added',
              },
            ),
            id: 'Wazuh-App-Overview-Osquery-Top-5-added',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.82',
              {
                defaultMessage: 'Top 5 Osquery events removed',
              },
            ),
            id: 'Wazuh-App-Overview-Osquery-Top-5-removed',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.83',
              {
                defaultMessage:
                  'Evolution of Osquery events per pack over time',
              },
            ),
            id: 'Wazuh-App-Agents-Osquery-Evolution',
            width: 50,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.84',
              {
                defaultMessage: 'Most common packs',
              },
            ),
            id: 'Wazuh-App-Overview-Osquery-Most-common-packs',
            width: 30,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.85',
              {
                defaultMessage: 'Top 5 rules',
              },
            ),
            id: 'Wazuh-App-Overview-Osquery-Top-5-rules',
            width: 70,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.86',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-Osquery-Alerts-summary',
          },
        ],
      },
    ],
  },
  mitre: {
    rows: [
      {
        height: 360,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.87',
              {
                defaultMessage: 'Alerts evolution over time',
              },
            ),
            id: 'Wazuh-App-Overview-MITRE-Alerts-Evolution',
            width: 75,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.88',
              {
                defaultMessage: 'Top tactics',
              },
            ),
            id: 'Wazuh-App-Overview-MITRE-Top-Tactics',
            width: 25,
          },
        ],
      },
      {
        height: 360,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.89',
              {
                defaultMessage: 'Attacks by technique',
              },
            ),
            id: 'Wazuh-App-Overview-MITRE-Attacks-By-Technique',
            width: 33,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.90',
              {
                defaultMessage: 'Top tactics by agent',
              },
            ),
            id: 'Wazuh-App-Overview-MITRE-Top-Tactics-By-Agent',
            width: 34,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.91',
              {
                defaultMessage: 'Mitre techniques by agent',
              },
            ),
            id: 'Wazuh-App-Overview-MITRE-Attacks-By-Agent',
            width: 33,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.92',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-MITRE-Alerts-summary',
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
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.93',
              {
                defaultMessage: 'Top 5 images',
              },
            ),
            id: 'Wazuh-App-Overview-Docker-top-5-images',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.94',
              {
                defaultMessage: 'Top 5 events',
              },
            ),
            id: 'Wazuh-App-Overview-Docker-top-5-actions',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.95',
              {
                defaultMessage: 'Resources usage over time',
              },
            ),
            id: 'Wazuh-App-Overview-Docker-Types-over-time',
            width: 50,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.96',
              {
                defaultMessage: 'Events occurred evolution',
              },
            ),
            id: 'Wazuh-App-Overview-Docker-Actions-over-time',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.97',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-Docker-Events-summary',
          },
        ],
      },
    ],
  },
  oscap: {
    rows: [
      {
        height: 215,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.98',
              {
                defaultMessage: 'Top 5 Agents',
              },
            ),
            id: 'Wazuh-App-Overview-OSCAP-Agents',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.99',
              {
                defaultMessage: 'Top 5 Profiles',
              },
            ),
            id: 'Wazuh-App-Overview-OSCAP-Profiles',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.100',
              {
                defaultMessage: 'Top 5 Content',
              },
            ),
            id: 'Wazuh-App-Overview-OSCAP-Content',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.101',
              {
                defaultMessage: 'Top 5 Severity',
              },
            ),
            id: 'Wazuh-App-Overview-OSCAP-Severity',
            width: 25,
          },
        ],
      },
      {
        height: 240,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.102',
              {
                defaultMessage: 'Top 5 Agents - Severity high',
              },
            ),
            id: 'Wazuh-App-Overview-OSCAP-Top-5-agents-Severity-high',
          },
        ],
      },
      {
        height: 320,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.103',
              {
                defaultMessage: 'Top 10 - Alerts',
              },
            ),
            id: 'Wazuh-App-Overview-OSCAP-Top-10-alerts',
            width: 50,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.',
              {
                defaultMessage: 'Top 10 - High risk alerts',
              },
            ),
            id: 'Wazuh-App-Overview-OSCAP-Top-10-high-risk-alerts',
            width: 50,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.104',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-OSCAP-Last-alerts',
          },
        ],
      },
    ],
  },
  ciscat: {
    rows: [
      {
        height: 320,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.105',
              {
                defaultMessage: 'Top 5 CIS-CAT groups',
              },
            ),
            id: 'Wazuh-app-Overview-CISCAT-top-5-groups',
            width: 60,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.106',
              {
                defaultMessage: 'Scan result evolution',
              },
            ),
            id: 'Wazuh-app-Overview-CISCAT-scan-result-evolution',
            width: 40,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.107',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
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
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.108',
              {
                defaultMessage: 'Events over time',
              },
            ),
            id: 'Wazuh-App-Overview-PM-Events-over-time',
            width: 50,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.109',
              {
                defaultMessage: 'Rule distribution',
              },
            ),
            id: 'Wazuh-App-Overview-PM-Top-5-rules',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.110',
              {
                defaultMessage: 'Top 5 agents',
              },
            ),
            id: 'Wazuh-App-Overview-PM-Top-5-agents-pie',
            width: 25,
          },
        ],
      },
      {
        height: 240,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.111',
              {
                defaultMessage: 'Events per control type evolution',
              },
            ),
            id: 'Wazuh-App-Overview-PM-Events-per-agent-evolution',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.112',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
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
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.113',
              {
                defaultMessage: 'Groups',
              },
            ),
            id: 'Wazuh-App-Overview-Audit-Groups',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.114',
              {
                defaultMessage: 'Agents',
              },
            ),
            id: 'Wazuh-App-Overview-Audit-Agents',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.115',
              {
                defaultMessage: 'Commands',
              },
            ),
            id: 'Wazuh-App-Overview-Audit-Commands',
            width: 25,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.116',
              {
                defaultMessage: 'Files',
              },
            ),
            id: 'Wazuh-App-Overview-Audit-Files',
            width: 25,
          },
        ],
      },
      {
        height: 310,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.117',
              {
                defaultMessage: 'Alerts over time',
              },
            ),
            id: 'Wazuh-App-Overview-Audit-Alerts-over-time',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.118',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-Audit-Last-alerts',
          },
        ],
      },
    ],
  },
  github: {
    rows: [
      {
        height: 360,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.119',
              {
                defaultMessage: 'Alerts evolution by organization',
              },
            ),
            id: 'Wazuh-App-Overview-GitHub-Alerts-Evolution-By-Organization',
            width: 60,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.120',
              {
                defaultMessage: 'Top 5 organizations by alerts',
              },
            ),
            id: 'Wazuh-App-Overview-GitHub-Top-5-Organizations-By-Alerts',
            width: 40,
          },
        ],
      },
      {
        height: 360,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.121',
              {
                defaultMessage: 'Top alerts by action type and organization',
              },
            ),
            id: 'Wazuh-App-Overview-GitHub-Alert-Action-Type-By-Organization',
            width: 40,
          },
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.122',
              {
                defaultMessage: 'Users with more alerts',
              },
            ),
            id: 'Wazuh-App-Overview-GitHub-Users-With-More-Alerts',
            width: 60,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: i18n.translate(
              'wazuh.components.visualize.visualizations.title.123',
              {
                defaultMessage: 'Alerts summary',
              },
            ),
            id: 'Wazuh-App-Overview-GitHub-Alert-Summary',
          },
        ],
      },
    ],
  },
};
