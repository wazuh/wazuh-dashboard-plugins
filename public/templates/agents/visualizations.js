/*
 * Wazuh app - Tab name equivalence
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
    rows: [
      {
        height: 400,
        vis: [
          {
            title: 'Alert groups evolution',
            id: 'Wazuh-App-Agents-General-Alert-groups-evolution',
            width: 50
          },
          { title: 'Alerts', id: 'Wazuh-App-Agents-General-Alerts', width: 50 }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'Top 5 agents',
            id: 'Wazuh-App-Agents-General-Top-5-alerts',
            width: 33
          },
          {
            title: 'Top 5 rule groups',
            id: 'Wazuh-App-Agents-General-Top-10-groups',
            width: 33
          },
          {
            title: 'Top 5 PCI DSS Requirements',
            id: 'Wazuh-App-Agents-General-Top-5-PCI-DSS-Requirements',
            width: 33
          }
        ]
      },
    ]
  },
  fim: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Most active users',
            id: 'Wazuh-App-Agents-FIM-Users',
            width: 30
          },
          {
            title: 'Actions',
            id: 'Wazuh-App-Agents-FIM-Actions',
            width: 30
          },
          {
            title: 'Events',
            id: 'Wazuh-App-Agents-FIM-Events',
            width: 40
          }
        ]
      },
      {
        height: 230,
        vis: [
          {
            title: 'Files added',
            id: 'Wazuh-App-Agents-FIM-Files-added',
            width: 33
          },
          {
            title: 'Files modified',
            id: 'Wazuh-App-Agents-FIM-Files-modified',
            width: 33
          },
          {
            title: 'Files deleted',
            id: 'Wazuh-App-Agents-FIM-Files-deleted',
            width: 33
          }
        ]
      },
    ]
  },
  pci: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Top 5 rule groups',
            id: 'Wazuh-App-Agents-PCI-Groups',
            width: 33
          },
          {
            title: 'Top 5 rules',
            id: 'Wazuh-App-Agents-PCI-Rule',
            width: 33
          },
          {
            title: 'Top 5 PCI DSS requirements',
            id: 'Wazuh-App-Agents-PCI-Requirement',
            width: 33
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'PCI Requirements',
            id: 'Wazuh-App-Agents-PCI-Requirements',
            width: 70
          },
          {
            title: 'Rule level distribution',
            id: 'Wazuh-App-Agents-PCI-Rule-level-distribution',
            width: 30
          }
        ]
      },
    ]
  },
  gdpr: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Top 5 rule groups',
            id: 'Wazuh-App-Agents-GDPR-Groups',
            width: 33
          },
          {
            title: 'Top 5 rules',
            id: 'Wazuh-App-Agents-GDPR-Rule',
            width: 33
          },
          {
            title: 'Top 5 GDPR requirements',
            id: 'Wazuh-App-Agents-GDPR-Requirement',
            width: 33
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'GDPR Requirements',
            id: 'Wazuh-App-Agents-GDPR-Requirements',
            width: 70
          },
          {
            title: 'Rule level distribution',
            id: 'Wazuh-App-Agents-GDPR-Rule-level-distribution',
            width: 30
          }
        ]
      },
    ]
  },
  nist: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Stats',
            id: 'Wazuh-App-Agents-NIST-Stats',
            width: 25
          },
          {
            title: 'Top 10 requirements',
            id: 'Wazuh-App-Agents-NIST-top-10-requirements',
            width: 25
          },
          {
            title: 'Requirements distributed by level',
            id: 'Wazuh-App-Agents-NIST-Requirement-by-level',
            width: 50
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'Requirements over time',
            id: 'Wazuh-App-Agents-NIST-Requirements-stacked-overtime'
          }
        ]
      },
    ]
  },
  tsc: {
    rows: [
      {
        height: 400,
        vis: [
          {
            title: 'TSC requirements',
            id: 'Wazuh-App-Overview-TSC-requirements',
            width: 50
          },
          {
            title: 'Top 10 agents by alerts number',
            id: 'Wazuh-App-Overview-TSC-Agents',
            width: 50
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'Top requirements over time',
            id: 'Wazuh-App-Overview-TSC-Requirements-over-time'
          }
        ]
      },
      {
        height: 530,
        vis: [
          {
            title: 'Last alerts',
            id: 'Wazuh-App-Overview-TSC-Requirements-Agents-heatmap'
          }
        ]
      },
      {
        height: 255,
        vis: [
          {
            title: 'Requirements by agent',
            id: 'Wazuh-App-Overview-TSC-Requirements-by-agent'
          }
        ]
      },
    ]
  },
  hipaa: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Requirements over time',
            id: 'Wazuh-App-Agents-HIPAA-Requirements-Stacked-Overtime',
            width: 50
          },
          {
            title: 'Top 10 requirements',
            id: 'Wazuh-App-Agents-HIPAA-top-10',
            width: 50
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'HIPAA requirements',
            id: 'Wazuh-App-Agents-HIPAA-Burbles',
            width: 45
          },
          {
            title: 'Requirements distribution by level',
            id: 'Wazuh-App-Agents-HIPAA-Distributed-By-Level',
            width: 30
          },
          {
            title: 'Most common alerts',
            id: 'Wazuh-App-Agents-HIPAA-Most-Common',
            width: 25
          }
        ]
      },
    ]
  },
  virustotal: {
    rows: [
      {
        height: 250,
        vis: [
          {
            title: 'Last scanned files',
            id: 'Wazuh-App-Agents-Virustotal-Last-Files-Pie',
            width: 33
          },
          {
            title: 'Malicious files alerts Evolution',
            id: 'Wazuh-App-Agents-Virustotal-Malicious-Evolution',
            width: 67
          }
        ]
      },
      {
        height: 570,
        vis: [
          {
            title: 'Last files',
            id: 'Wazuh-App-Agents-Virustotal-Files-Table'
          }
        ]
      },
    ]
  },
  osquery: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Most common Osquery actions',
            id: 'Wazuh-App-Agents-Osquery-most-common-osquery-actions',
            width: 30
          },
          {
            title: 'Evolution of Osquery events per pack over time',
            id: 'Wazuh-App-Agents-Osquery-Evolution',
            width: 70
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'Most common Osquery packs being used',
            id: 'Wazuh-App-Agents-Osquery-top-5-packs-being-used',
            width: 30
          },
          {
            title: 'Most common rules',
            id: 'Wazuh-App-Agents-Osquery-monst-common-rules-being-fired',
            width: 70
          }
        ]
      },
    ]
  },
  docker: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: 'Top 5 images',
            id: 'Wazuh-App-Agents-Docker-top-5-images',
            width: 25
          },
          {
            title: 'Top 5 events',
            id: 'Wazuh-App-Agents-Docker-top-5-actions',
            width: 25
          },
          {
            title: 'Resources usage over time',
            id: 'Wazuh-App-Agents-Docker-Types-over-time',
            width: 50
          }
        ]
      },
      {
        height: 300,
        vis: [
          {
            title: 'Events occurred evolution',
            id: 'Wazuh-App-Agents-Docker-Actions-over-time'
          }
        ]
      },
    ]
  },
  oscap: {
    rows: [
      {
        height: 230,
        vis: [
          {
            title: 'Top 5 Scans',
            id: 'Wazuh-App-Agents-OSCAP-Scans',
            width: 25
          },
          {
            title: 'Top 5 Profiles',
            id: 'Wazuh-App-Agents-OSCAP-Profiles',
            width: 25
          },
          {
            title: 'Top 5 Content',
            id: 'Wazuh-App-Agents-OSCAP-Content',
            width: 25
          },
          {
            title: 'Top 5 Severity',
            id: 'Wazuh-App-Agents-OSCAP-Severity',
            width: 25
          }
        ]
      },
      {
        height: 230,
        vis: [
          {
            title: 'Daily scans evolution',
            id: 'Wazuh-App-Agents-OSCAP-Daily-scans-evolution'
          }
        ]
      },
      {
        height: 250,
        vis: [
          {
            title: 'Top 5 - Alerts',
            id: 'Wazuh-App-Agents-OSCAP-Top-5-Alerts',
            width: 50
          },
          {
            title: 'Top 5 - High risk alerts',
            id: 'Wazuh-App-Agents-OSCAP-Top-5-High-risk-alerts',
            width: 50
          }
        ]
      },
    ]
  },
  ciscat: {
    rows: [
      {
        height: 320,
        vis: [
          {
            title: 'Top 5 CIS-CAT groups',
            id: 'Wazuh-app-Agents-CISCAT-top-5-groups',
            width: 60
          },
          {
            title: 'Scan result evolution',
            id: 'Wazuh-app-Agents-CISCAT-scan-result-evolution',
            width: 40
          }
        ]
      },
    ]
  },
  pm: {
    rows: [
      {
        height: 290,
        vis: [
          {
            title: 'Alerts over time',
            id: 'Wazuh-App-Agents-PM-Events-over-time',
            width: 50
          },
          {
            title: 'Rule distribution',
            id: 'Wazuh-App-Agents-PM-Top-5-rules',
            width: 50
          }
        ]
      },
      {
        height: 240,
        vis: [
          {
            title: 'Events per control type evolution',
            id: 'Wazuh-App-Agents-PM-Events-per-agent-evolution'
          }
        ]
      },
    ]
  },
  audit: {
    rows: [
      {
        height: 250,
        vis: [
          {
            title: 'Groups',
            id: 'Wazuh-App-Agents-Audit-Groups',
            width: 33
          },
          {
            title: 'Commands',
            id: 'Wazuh-App-Agents-Audit-Commands',
            width: 33
          },
          {
            title: 'Files',
            id: 'Wazuh-App-Agents-Audit-Files',
            width: 33
          }
        ]
      },
      {
        height: 310,
        vis: [
          {
            title: 'Alerts over time',
            id: 'Wazuh-App-Agents-Audit-Alerts-over-time'
          }
        ]
      },
    ]
  }
};
