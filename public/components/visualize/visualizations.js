/*
 * Wazuh app - Overview visualizations
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
      {
        id: 'Wazuh-App-Overview-General-Metric-alerts',
        description: 'Total',
        color: 'primary'
      },
      {
        id: 'Wazuh-App-Overview-General-Level-12-alerts',
        description: 'Level 12 or above alerts',
        color: 'accent'
      },
      {
        id: 'Wazuh-App-Overview-General-Authentication-failure',
        description: 'Authentication failure',
        color: 'danger'
      },
      {
        id: 'Wazuh-App-Overview-General-Authentication-success',
        description: 'Authentication success',
        color: 'secondary'
      }
    ],
    rows: [
      {
        height: 360,
        vis: [
          {
            title: 'Alert level evolution',
            id: 'Wazuh-App-Overview-General-Alert-level-evolution',
            width: 50
          },
          {
            title: 'Alerts',
            id: 'Wazuh-App-Overview-General-Alerts',
            width: 50
          }
        ]
      },
      {
        height: 270,
        vis: [
          {
            title: 'Top 5 agents',
            id: 'Wazuh-App-Overview-General-Top-5-agents',
            width: 33
          },
          {
            title: 'Top 5 rule groups',
            id: 'Wazuh-App-Overview-General-Top-5-rule-groups',
            width: 33
          },
          {
            title: 'Agents status',
            id: 'Wazuh-App-Overview-General-Agents-status',
            width: 34
          }
        ]
      },
      {
        height: 360,
        vis: [
          {
            title: 'Alerts evolution - Top 5 agents',
            id: 'Wazuh-App-Overview-General-Alerts-evolution-Top-5-agents'
          }
        ]
      },
      {
        height: 600,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-General-Alerts-summary'
          }
        ]
      }
    ]
  },
  fim: {
    rows: [
      {
        height: 400,
        vis: [
          {
            title: 'Alerts by action over time',
            id: 'Wazuh-App-Agents-FIM-Alerts-by-action-over-time'
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'Top 5 agents',
            id: 'Wazuh-App-Overview-FIM-Top-5-agents-pie',
            width: 30
          },
          {
            title: 'Events summary',
            id: 'Wazuh-App-Overview-FIM-Events-summary',
            width: 70
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'Rule distribution',
            id: 'Wazuh-App-Overview-FIM-Top-5-rules',
            width: 33
          },
          {
            title: 'Actions',
            id: 'Wazuh-App-Overview-FIM-Common-actions',
            width: 33
          },
          {
            title: 'Top 5 users',
            id: 'Wazuh-App-Overview-FIM-top-agents-user',
            width: 34
          }
        ]
      },
      {
        height: 600,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-FIM-Alerts-summary'
          }
        ]
      }
    ]
  },
  aws: {
    rows: [
      {
        height: 250,
        vis: [
          {
            title: 'Sources',
            id: 'Wazuh-App-Overview-AWS-Top-sources',
            width: 25
          },
          {
            title: 'Accounts',
            id: 'Wazuh-App-Overview-AWS-Top-accounts',
            width: 25
          },
          {
            title: 'S3 buckets',
            id: 'Wazuh-App-Overview-AWS-Top-buckets',
            width: 25
          },
          {
            title: 'Regions',
            id: 'Wazuh-App-Overview-AWS-Top-regions',
            width: 25
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'Events by source over time',
            id: 'Wazuh-App-Overview-AWS-Events-by-source',
            width: 50
          },
          {
            title: 'Events by S3 bucket over time',
            id: 'Wazuh-App-Overview-AWS-Events-by-s3-bucket',
            width: 50
          }
        ]
      },
      {
        height: 570,
        vis: [
          {
            title: 'Geolocation map',
            id: 'Wazuh-App-Overview-AWS-geo'
          }
        ]
      },
      {
        height: 570,
        vis: [
          {
            title: 'Top rules',
            id: 'Wazuh-App-Overview-AWS-Top-5-rules'
          }
        ]
      }
    ]
  },
  pci: {
    rows: [
      {
        height: 400,
        vis: [
          {
            title: 'PCI DSS requirements',
            id: 'Wazuh-App-Overview-PCI-DSS-requirements',
            width: 50
          },
          {
            title: 'Top 10 agents by alerts number',
            id: 'Wazuh-App-Overview-PCI-DSS-Agents',
            width: 50
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'Top requirements over time',
            id: 'Wazuh-App-Overview-PCI-DSS-Requirements-over-time'
          }
        ]
      },
      {
        height: 530,
        vis: [
          {
            title: 'Last alerts',
            id: 'Wazuh-App-Overview-PCI-DSS-Requirements-Agents-heatmap'
          }
        ]
      },
      {
        height: 255,
        vis: [
          {
            title: 'Requirements by agent',
            id: 'Wazuh-App-Overview-PCI-DSS-Requirements-by-agent'
          }
        ]
      },
      {
        height: 600,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-PCI-DSS-Alerts-summary'
          }
        ]
      }
    ]
  },
  gdpr: {
    rows: [
      {
        height: 400,
        vis: [
          {
            title: 'Top 10 agents by alerts number',
            id: 'Wazuh-App-Overview-GDPR-Agents',
            width: 30
          },
          {
            title: 'GDPR requirements',
            id: 'Wazuh-App-Overview-GDPR-requirements',
            width: 70
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'Top requirements over time',
            id: 'Wazuh-App-Overview-GDPR-Requirements-heatmap'
          }
        ]
      },
      {
        height: 530,
        vis: [
          {
            title: 'Last alerts',
            id: 'Wazuh-App-Overview-GDPR-Requirements-Agents-heatmap'
          }
        ]
      },
      {
        height: 255,
        vis: [
          {
            title: 'Requirements by agent',
            id: 'Wazuh-App-Overview-GDPR-Requirements-by-agent'
          }
        ]
      },
      {
        height: 600,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-GDPR-Alerts-summary'
          }
        ]
      }
    ]
  },
  nist: {
    rows: [
      {
        height: 400,
        vis: [
          {
            title: 'Most active agents',
            id: 'Wazuh-App-Overview-NIST-Agents',
            width: 20
          },
          {
            title: 'Top requirements over time',
            id: 'Wazuh-App-Overview-NIST-Requirements-over-time',
            width: 50
          },
          {
            title: 'Requiments distribution by agent',
            id: 'Wazuh-App-Overview-NIST-requirements-by-agents',
            width: 30
          }
        ]
      },
      {
        height: 350,
        vis: [
          {
            title: 'Alerts volume by agent',
            id: 'Wazuh-App-Overview-NIST-Requirements-Agents-heatmap',
            width: 50
          },
          {
            title: 'Stats',
            id: 'Wazuh-App-Overview-NIST-Metrics',
            width: 20
          },
          {
            title: 'Top 10 requirements',
            id: 'Wazuh-App-Overview-NIST-Top-10-requirements',
            width: 30
          }
        ]
      },
      {
        height: 600,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-NIST-Alerts-summary'
          }
        ]
      }
    ]
  },
  hipaa: {
    rows: [
      {
        height: 570,
        vis: [
          {
            title: 'Alerts volume by agent',
            id: 'Wazuh-App-Overview-HIPAA-Heatmap',
            width: 50
          },
          {
            hasRows: true,
            width: 50,
            rows: [
              {
                height: 285,
                vis: [
                  {
                    title: 'Most common alerts',
                    id: 'Wazuh-App-Overview-HIPAA-Tag-cloud',
                    width: 50
                  },
                  {
                    title: 'Top 10 requirements',
                    id: 'Wazuh-App-Overview-HIPAA-Top-10-requirements',
                    width: 50
                  }
                ]
              },
              {
                height: 285,
                noMargin: true,
                vis: [
                  {
                    title: 'Most active agents',
                    id: 'Wazuh-App-Overview-HIPAA-Top-10-agents',
                    width: 50
                  },
                  {
                    title: 'Stats',
                    id: 'Wazuh-App-Overview-HIPAA-Metrics',
                    width: 50
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        height: 400,
        vis: [
          {
            title: 'Requirements evolution over time',
            id: 'Wazuh-App-Overview-HIPAA-Top-requirements-over-time',
            width: 50
          },
          {
            title: 'Requirements distribution by agent',
            id:
              'Wazuh-App-Overview-HIPAA-Top-10-requirements-over-time-by-agent',
            width: 50
          }
        ]
      },
      {
        height: 600,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-HIPAA-Alerts-summary'
          }
        ]
      }
    ]
  },
  vuls: {
    metrics: [
      {
        id: 'Wazuh-App-Overview-vuls-Metric-Critical-severity',
        description: 'Critical severity alerts',
        color: 'danger'
      },
      {
        id: 'Wazuh-App-Overview-vuls-Metric-High-severity',
        description: 'High severity alerts',
        color: 'primary'
      },
      {
        id: 'Wazuh-App-Overview-vuls-Metric-Medium-severity',
        description: 'Medium severity alerts',
        color: 'secondary'
      },
      {
        id: 'Wazuh-App-Overview-vuls-Metric-Low-severity',
        description: 'Low severity alerts',
        color: 'subdued'
      }
    ],
    rows: [
      {
        height: 270,
        vis: [
          {
            title: 'Most affected agents',
            id: 'Wazuh-App-Overview-vuls-Most-affected-agents',
            width: 30
          },
          {
            title: 'Alerts severity',
            id: 'Wazuh-App-Overview-vuls-Alerts-severity',
            width: 70
          }
        ]
      },
      {
        height: 270,
        vis: [
          {
            title: 'Severity distribution',
            id: 'Wazuh-App-Overview-vuls-Vulnerability-severity-distribution',
            width: 25
          },
          {
            title: 'Commonly affected packages',
            id: 'Wazuh-App-Overview-vuls-Commonly-affected-packages',
            width: 25
          },
          {
            title: 'Most common CVEs',
            id: 'Wazuh-App-Overview-vuls-Most-common-CVEs',
            width: 25
          },
          {
            title: 'Most common CWEs',
            id: 'Wazuh-App-Overview-vuls-Most-common-CWEs',
            width: 25
          }
        ]
      },
      {
        height: 600,
        vis: [
          {
            title: 'Alert summary',
            id: 'Wazuh-App-Overview-vuls-Alert-summary'
          }
        ]
      }
    ]
  },
  virustotal: {
    metrics: [
      {
        id: 'Wazuh-App-Overview-Virustotal-Total-Malicious',
        description: 'Total malicious',
        color: 'danger'
      },
      {
        id: 'Wazuh-App-Overview-Virustotal-Total-Positives',
        description: 'Total positives',
        color: 'primary'
      },
      {
        id: 'Wazuh-App-Overview-Virustotal-Total',
        description: 'Total',
        color: 'secondary'
      }
    ],
    rows: [
      {
        height: 360,
        vis: [
          {
            title: 'Unique malicious files per agent',
            id: 'Wazuh-App-Overview-Virustotal-Malicious-Per-Agent',
            width: 50
          },
          {
            title: 'Last scanned files',
            id: 'Wazuh-App-Overview-Virustotal-Last-Files-Pie',
            width: 50
          }
        ]
      },
      {
        height: 550,
        vis: [
          {
            title: 'Top 10 agents with positive scans',
            id: 'Wazuh-App-Overview-Virustotal-Positives-Heatmap'
          }
        ]
      },
      {
        height: 250,
        vis: [
          {
            title: 'Malicious files alerts evolution',
            id: 'Wazuh-App-Overview-Virustotal-Malicious-Evolution'
          }
        ]
      },
      {
        height: 570,
        vis: [
          {
            title: 'Last files',
            id: 'Wazuh-App-Overview-Virustotal-Files-Table'
          }
        ]
      }
    ]
  },
  osquery: {
    metrics: [
      {
        id: 'Wazuh-App-Overview-Osquery-Agents-reporting',
        description: 'Agents reporting Osquery events',
        color: 'primary'
      }
    ],
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Top 5 Osquery events added',
            id: 'Wazuh-App-Overview-Osquery-Top-5-added',
            width: 25
          },
          {
            title: 'Top 5 Osquery events removed',
            id: 'Wazuh-App-Overview-Osquery-Top-5-removed',
            width: 25
          },
          {
            title: 'Evolution of Osquery events per pack over time',
            id: 'Wazuh-App-Agents-Osquery-Evolution',
            width: 50
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'Most common packs',
            id: 'Wazuh-App-Overview-Osquery-Most-common-packs',
            width: 30
          },
          {
            title: 'Top 5 rules',
            id: 'Wazuh-App-Overview-Osquery-Top-5-rules',
            width: 70
          }
        ]
      },
      {
        height: 600,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-Osquery-Alerts-summary'
          }
        ]
      }
    ]
  },
  docker: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Top 5 images',
            id: 'Wazuh-App-Overview-Docker-top-5-images',
            width: 25
          },
          {
            title: 'Top 5 events',
            id: 'Wazuh-App-Overview-Docker-top-5-actions',
            width: 25
          },
          {
            title: 'Resources usage over time',
            id: 'Wazuh-App-Overview-Docker-Types-over-time',
            width: 50
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'Events occurred evolution',
            id: 'Wazuh-App-Overview-Docker-Actions-over-time'
          }
        ]
      },
      {
        height: 600,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-Docker-Events-summary'
          }
        ]
      }
    ]
  },
  oscap: {
    metrics: [
      {
        id: 'Wazuh-App-Overview-OSCAP-Last-score',
        description: 'Last score',
        color: 'accent'
      },
      {
        id: 'Wazuh-App-Overview-OSCAP-Highest-score',
        description: 'Highest score',
        color: 'primary'
      },
      {
        id: 'Wazuh-App-Overview-OSCAP-Lowest-score',
        description: 'Lowest score',
        color: 'secondary'
      }
    ],
    rows: [
      {
        height: 215,
        vis: [
          {
            title: 'Top 5 Agents',
            id: 'Wazuh-App-Overview-OSCAP-Agents',
            width: 25
          },
          {
            title: 'Top 5 Profiles',
            id: 'Wazuh-App-Overview-OSCAP-Profiles',
            width: 25
          },
          {
            title: 'Top 5 Content',
            id: 'Wazuh-App-Overview-OSCAP-Content',
            width: 25
          },
          {
            title: 'Top 5 Severity',
            id: 'Wazuh-App-Overview-OSCAP-Severity',
            width: 25
          }
        ]
      },
      {
        height: 240,
        vis: [
          {
            title: 'Top 5 Agents - Severity high',
            id: 'Wazuh-App-Overview-OSCAP-Top-5-agents-Severity-high'
          }
        ]
      },
      {
        height: 320,
        vis: [
          {
            title: 'Top 10 - Alerts',
            id: 'Wazuh-App-Overview-OSCAP-Top-10-alerts',
            width: 50
          },
          {
            title: 'Top 10 - High risk alerts',
            id: 'Wazuh-App-Overview-OSCAP-Top-10-high-risk-alerts',
            width: 50
          }
        ]
      },
      {
        height: 600,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-OSCAP-Last-alerts'
          }
        ]
      }
    ]
  },
  ciscat: {
    metrics: [
      {
        id: 'Wazuh-app-Overview-CISCAT-last-scan-error',
        description: 'Last not checked',
        color: 'accent'
      },
      {
        id: 'Wazuh-app-Overview-CISCAT-last-scan-fail',
        description: 'Last pass',
        color: 'primary'
      },
      {
        id: 'Wazuh-app-Overview-CISCAT-last-scan-not-checked',
        description: 'Last scan score',
        color: 'secondary'
      },
      {
        id: 'Wazuh-app-Overview-CISCAT-last-scan-pass',
        description: 'Last scan date',
        color: 'subdued'
      },
      {
        id: 'Wazuh-app-Overview-CISCAT-last-scan-score',
        description: 'Last errors',
        color: 'accent'
      },
      {
        id: 'Wazuh-app-Overview-CISCAT-last-scan-timestamp',
        description: 'Last fails',
        color: 'primary'
      },
      {
        id: 'Wazuh-app-Overview-CISCAT-last-scan-benchmark',
        description: 'Last unknown',
        color: 'secondary'
      },
      {
        id: 'Wazuh-app-Overview-CISCAT-last-scan-unknown',
        description: 'Last scan benchmark',
        color: 'subdued'
      }
    ],
    rows: [
      {
        height: 320,
        vis: [
          {
            title: 'Top 5 CIS-CAT groups',
            id: 'Wazuh-app-Overview-CISCAT-top-5-groups',
            width: 60
          },
          {
            title: 'Scan result evolution',
            id: 'Wazuh-app-Overview-CISCAT-scan-result-evolution',
            width: 40
          }
        ]
      },
      {
        height: 600,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-app-Overview-CISCAT-alerts-summary'
          }
        ]
      }
    ]
  },
  pm: {
    rows: [
      {
        height: 290,
        vis: [
          {
            title: 'Events over time',
            id: 'Wazuh-App-Overview-PM-Events-over-time',
            width: 50
          },
          {
            title: 'Rule distribution',
            id: 'Wazuh-App-Overview-PM-Top-5-rules',
            width: 25
          },
          {
            title: 'Top 5 agents',
            id: 'Wazuh-App-Overview-PM-Top-5-agents-pie',
            width: 25
          }
        ]
      },
      {
        height: 240,
        vis: [
          {
            title: 'Events per control type evolution',
            id: 'Wazuh-App-Overview-PM-Events-per-agent-evolution'
          }
        ]
      },
      {
        height: 600,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-PM-Alerts-summary'
          }
        ]
      }
    ]
  },
  audit: {
    rows: [
      {
        height: 250,
        vis: [
          {
            title: 'Groups',
            id: 'Wazuh-App-Overview-Audit-Groups',
            width: 25
          },
          {
            title: 'Agents',
            id: 'Wazuh-App-Overview-Audit-Agents',
            width: 25
          },
          {
            title: 'Commands',
            id: 'Wazuh-App-Overview-Audit-Commands',
            width: 25
          },
          {
            title: 'Files',
            id: 'Wazuh-App-Overview-Audit-Files',
            width: 25
          }
        ]
      },
      {
        height: 310,
        vis: [
          {
            title: 'Alerts over time',
            id: 'Wazuh-App-Overview-Audit-Alerts-over-time'
          }
        ]
      },
      {
        height: 600,
        vis: [
          {
            title: 'Alerts summary',
            id: 'Wazuh-App-Overview-Audit-Last-alerts'
          }
        ]
      }
    ]
  }
};
