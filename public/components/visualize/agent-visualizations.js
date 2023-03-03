/*
 * Wazuh app - Agents visualizations
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

const title1 = i18n.translate('wazuh.components.visualize.agent.title1', {
  defaultMessage: 'Alert groups evolution',
});
const title2 = i18n.translate('wazuh.components.visualize.agent.title2', {
  defaultMessage: 'Alerts',
});
const title3 = i18n.translate('wazuh.components.visualize.agent.title3', {
  defaultMessage: 'Select policies',
});
const title4 = i18n.translate('wazuh.components.visualize.agent.title4', {
  defaultMessage: 'Top 5 alerts',
});
const title5 = i18n.translate('wazuh.components.visualize.agent.title5', {
  defaultMessage: 'Top 5 rule groups',
});
const title6 = i18n.translate('wazuh.components.visualize.agent.title6', {
  defaultMessage: 'Medium Severity Alerts',
});
const title7 = i18n.translate('wazuh.components.visualize.agent.title7', {
  defaultMessage: 'Alerts summary',
});
const title8 = i18n.translate('wazuh.components.visualize.agent.title8', {
  defaultMessage: 'Groups summary',
});
const title9 = i18n.translate('wazuh.components.visualize.agent.title9', {
  defaultMessage: 'Sources',
});
const title10 = i18n.translate('wazuh.components.visualize.agent.regkeytitle', {
  defaultMessage: 'Accounts',
});
const title11 = i18n.translate('wazuh.components.visualize.agent.regkeytitle11', {
  defaultMessage: 'S3 buckets',
});
const title12 = i18n.translate('wazuh.components.visualize.agent.regkeytitle12', {
  defaultMessage: 'Regions',
});
const title13 = i18n.translate('wazuh.components.visualize.agent.regkeytitle13', {
  defaultMessage: 'Events by source over time',
});
const title14 = i18n.translate('wazuh.components.visualize.agent.regkeytitle14', {
  defaultMessage: 'Events by S3 bucket over time',
});
const title15 = i18n.translate('wazuh.components.visualize.agent.regkeytitle15', {
  defaultMessage: 'Geolocation map',
});
const title16 = i18n.translate('wazuh.components.visualize.agent.regkeytitle16', {
  defaultMessage: 'Alerts summary',
});
const title17 = i18n.translate('wazuh.components.visualize.agent.regkeytitle17', {
  defaultMessage: 'Most active users',
});
const title18 = i18n.translate('wazuh.components.visualize.agent.regkeytitle18', {
  defaultMessage: 'Actions',
});
const title19 = i18n.translate('wazuh.components.visualize.agent.regkeytitle19', {
  defaultMessage: "Events'",
});
const title20 = i18n.translate('wazuh.components.visualize.agent.regkeytitle20', {
  defaultMessage: 'Files added',
});
const title21 = i18n.translate('wazuh.components.visualize.agent.regkeytitle21', {
  defaultMessage: 'Files modified',
});
const title22 = i18n.translate('wazuh.components.visualize.agent.regkeytitle22', {
  defaultMessage: 'Files deleted',
});
const title23 = i18n.translate('wazuh.components.visualize.agent.regkeytitle23', {
  defaultMessage: 'Alerts summary',
});
const title24 = i18n.translate('wazuh.components.visualize.agent.regkeytitle24', {
  defaultMessage: 'Top 5 rules',
});
const title25 = i18n.translate('wazuh.components.visualize.agent.regkeytitle25', {
  defaultMessage: 'Top query events',
});
const title26 = i18n.translate('wazuh.components.visualize.agent.regkeytitle26', {
  defaultMessage: 'Top 5 instances',
});
const title27 = i18n.translate('wazuh.components.visualize.agent.regkeytitle27', {
  defaultMessage: 'Top project id by sourcetype',
});
const title28 = i18n.translate('wazuh.components.visualize.agent.regkeytitle28', {
  defaultMessage: 'GCP alerts evolution',
});
const title29 = i18n.translate('wazuh.components.visualize.agent.regkeytitle29', {
  defaultMessage: 'Auth answer count',
});
const title30 = i18n.translate('wazuh.components.visualize.agent.regkeytitle30', {
  defaultMessage: 'Resource type by project id',
});
const title31 = i18n.translate('wazuh.components.visualize.agent.regkeytitle31', {
  defaultMessage: 'Alerts summary',
});
const title32 = i18n.translate('wazuh.components.visualize.agent.regkeytitle32', {
  defaultMessage: 'Top 5 rule groups',
});
const title33 = i18n.translate('wazuh.components.visualize.agent.regkeytitle33', {
  defaultMessage: 'Top 5 rules',
});
const title34 = i18n.translate('wazuh.components.visualize.agent.regkeytitle34', {
  defaultMessage: 'Top 5 PCI DSS requirements',
});
const title35 = i18n.translate('wazuh.components.visualize.agent.regkeytitle35', {
  defaultMessage: 'PCI Requirements',
});
const title36 = i18n.translate('wazuh.components.visualize.agent.regkeytitle36', {
  defaultMessage: 'Rule level distribution',
});
const title37 = i18n.translate('wazuh.components.visualize.agent.regkeytitle37', {
  defaultMessage: 'Alerts summary',
});
const title38 = i18n.translate('wazuh.components.visualize.agent.regkeytitle38', {
  defaultMessage: 'Top 5 rule groups',
});
const title39 = i18n.translate('wazuh.components.visualize.agent.regkeytitle39', {
  defaultMessage: 'Top 5 rules',
});
const title40 = i18n.translate('wazuh.components.visualize.agent.regkeytitle40', {
  defaultMessage: 'Top 5 GDPR requirements',
});
const title401 = i18n.translate('wazuh.components.visualize.agent.regkeytitle401', {
  defaultMessage: 'GDPR Requirements',
});
const title41 = i18n.translate('wazuh.components.visualize.agent.regkeytitle41', {
  defaultMessage: 'Rule level distribution',
});
const title42 = i18n.translate('wazuh.components.visualize.agent.regkeytitle42', {
  defaultMessage: 'Alerts summary',
});
const title43 = i18n.translate('wazuh.components.visualize.agent.regkeytitle43', {
  defaultMessage: 'Stats',
});
const title44 = i18n.translate('wazuh.components.visualize.agent.regkeytitle44', {
  defaultMessage: 'Top 10 requirements',
});
const title45 = i18n.translate('wazuh.components.visualize.agent.regkeytitle45', {
  defaultMessage: 'Requirements distributed by level',
});
const title46 = i18n.translate('wazuh.components.visualize.agent.regkeytitle46', {
  defaultMessage: 'Requirements over time',
});
const title47 = i18n.translate('wazuh.components.visualize.agent.regkeytitle47', {
  defaultMessage: 'Alerts summary',
});
const title48 = i18n.translate('wazuh.components.visualize.agent.regkeytitle48', {
  defaultMessage: 'Top 5 rule groups',
});
const title49 = i18n.translate('wazuh.components.visualize.agent.regkeytitle49', {
  defaultMessage: 'Top 5 rules',
});
const title50 = i18n.translate('wazuh.components.visualize.agent.regkeytitle50', {
  defaultMessage: 'Top 5 TSC requirements',
});
const title51 = i18n.translate('wazuh.components.visualize.agent.regkeytitle51', {
  defaultMessage: 'TSC Requirements',
});
const title52 = i18n.translate('wazuh.components.visualize.agent.regkeytitle52', {
  defaultMessage: 'Rule level distribution',
});
const title53 = i18n.translate('wazuh.components.visualize.agent.regkeytitle53', {
  defaultMessage: 'Alerts summary',
});
const title54 = i18n.translate('wazuh.components.visualize.agent.regkeytitle54', {
  defaultMessage: 'Requirements over time',
});
const title55 = i18n.translate('wazuh.components.visualize.agent.regkeytitle55', {
  defaultMessage: 'Top 10 requirements',
});
const title56 = i18n.translate('wazuh.components.visualize.agent.regkeytitle56', {
  defaultMessage: 'HIPAA requirements',
});
const title57 = i18n.translate('wazuh.components.visualize.agent.regkeytitle57', {
  defaultMessage: 'Requirements distribution by level',
});
const title58 = i18n.translate('wazuh.components.visualize.agent.regkeytitle58', {
  defaultMessage: 'Most common alerts',
});
const title59 = i18n.translate('wazuh.components.visualize.agent.regkeytitle59', {
  defaultMessage: 'Alerts summary',
});
const title60 = i18n.translate('wazuh.components.visualize.agent.regkeytitle60', {
  defaultMessage: 'Last scanned files',
});
const title61 = i18n.translate('wazuh.components.visualize.agent.regkeytitle61', {
  defaultMessage: 'Malicious files alerts Evolution',
});
const title62 = i18n.translate('wazuh.components.visualize.agent.regkeytitle62', {
  defaultMessage: 'Last files',
});
const title63 = i18n.translate('wazuh.components.visualize.agent.regkeytitle63', {
  defaultMessage: 'Alerts summary',
});
const title64 = i18n.translate('wazuh.components.visualize.agent.regkeytitle64', {
  defaultMessage: 'Most common Osquery actions',
});
const title65 = i18n.translate('wazuh.components.visualize.agent.regkeytitle65', {
  defaultMessage: 'Evolution of Osquery events per pack over time',
});
const title66 = i18n.translate('wazuh.components.visualize.agent.regkeytitle66', {
  defaultMessage: 'Most common Osquery packs being used',
});
const title67 = i18n.translate('wazuh.components.visualize.agent.regkeytitle67', {
  defaultMessage: 'Most common rules',
});
const title68 = i18n.translate('wazuh.components.visualize.agentVisualization.regkeytitle68', {
  defaultMessage: 'Alerts summary',
});
const title681 = i18n.translate('wazuh.components.visualize.agent.regkeytitle68', {
  defaultMessage: 'Alerts evolution over time',
});
const title69 = i18n.translate('wazuh.components.visualize.agent.regkeytitle69', {
  defaultMessage: 'Top tactics',
});
const title70 = i18n.translate('wazuh.components.visualize.agent.regkeytitle70', {
  defaultMessage: 'Rule level by attack',
});
const title71 = i18n.translate('wazuh.components.visualize.agent.regkeytitle71', {
  defaultMessage: 'MITRE attacks by tactic',
});
const title72 = i18n.translate('wazuh.components.visualize.agent.regkeytitle72', {
  defaultMessage: 'Rule level by tactic',
});
const title73 = i18n.translate('wazuh.components.visualize.agent.regkeytitle73', {
  defaultMessage: 'Alerts summary',
});
const title74 = i18n.translate('wazuh.components.visualize.agent.regkeytitle74', {
  defaultMessage: 'Top 5 images',
});
const title75 = i18n.translate('wazuh.components.visualize.agent.regkeytitle75', {
  defaultMessage: 'Top 5 events',
});
const title76 = i18n.translate('wazuh.components.visualize.agent.regkeytitle76', {
  defaultMessage: 'Resources usage over time',
});
const title77 = i18n.translate('wazuh.components.visualize.agent.regkeytitle77', {
  defaultMessage: 'Events occurred evolution',
});
const title78 = i18n.translate('wazuh.components.visualize.agent.regkeytitle78', {
  defaultMessage: 'Alerts summary',
});
const title79 = i18n.translate('wazuh.components.visualize.agent.regkeytitle79', {
  defaultMessage: 'Top 5 Scans',
});
const title80 = i18n.translate('wazuh.components.visualize.agent.regkeytitle80', {
  defaultMessage: 'Top 5 Profiles',
});
const title81 = i18n.translate('wazuh.components.visualize.agent.regkeytitle81', {
  defaultMessage: 'Top 5 Content',
});
const title82 = i18n.translate('wazuh.components.visualize.agent.regkeytitle82', {
  defaultMessage: 'Top 5 Severity',
});
const title83 = i18n.translate('wazuh.components.visualize.agent.regkeytitle83', {
  defaultMessage: 'Daily scans evolution',
});
const title84 = i18n.translate('wazuh.components.visualize.agent.regkeytitle84', {
  defaultMessage: 'Top 5 - Alerts',
});
const title85 = i18n.translate('wazuh.components.visualize.agent.regkeytitle85', {
  defaultMessage: 'Top 5 - High risk alerts',
});
const title86 = i18n.translate('wazuh.components.visualize.agent.regkeytitle86', {
  defaultMessage: 'Alerts summary',
});
const title87 = i18n.translate('wazuh.components.visualize.agent.regkeytitle87', {
  defaultMessage: 'Top 5 CIS-CAT groups',
});
const title88 = i18n.translate('wazuh.components.visualize.agent.regkeytitle88', {
  defaultMessage: 'Scan result evolution',
});
const title89 = i18n.translate('wazuh.components.visualize.agent.regkeytitle89', {
  defaultMessage: 'Alerts summary',
});
const title90 = i18n.translate('wazuh.components.visualize.agent.regkeytitle90', {
  defaultMessage: 'Alerts over time',
});
const title91 = i18n.translate('wazuh.components.visualize.agent.regkeytitle91', {
  defaultMessage: 'Rule distribution',
});
const title92 = i18n.translate('wazuh.components.visualize.agent.regkeytitle92', {
  defaultMessage: 'Events per control type evolution',
});
const title93 = i18n.translate('wazuh.components.visualize.agent.regkeytitle93', {
  defaultMessage: 'Alerts summary',
});
const title94 = i18n.translate('wazuh.components.visualize.agent.regkeytitle94', {
  defaultMessage: 'Groups',
});
const title95 = i18n.translate('wazuh.components.visualize.agent.regkeytitle95', {
  defaultMessage: 'Commands',
});
const title96 = i18n.translate('wazuh.components.visualize.agent.regkeytitle96', {
  defaultMessage: 'Files',
});
const title97 = i18n.translate('wazuh.components.visualize.agent.regkeytitle97', {
  defaultMessage: 'Alerts over time',
});
const title98 = i18n.translate('wazuh.components.visualize.agent.regkeytitle98', {
  defaultMessage: 'Alerts summary',
});
const title99 = i18n.translate('wazuh.components.visualize.agent.regkeytitle99', {
  defaultMessage: 'Alerts evolution by organization',
});
const title100 = i18n.translate('wazuh.components.visualize.agent.regkeytitle100', {
  defaultMessage: 'Top 5 organizations by alerts',
});
const title101 = i18n.translate('wazuh.components.visualize.agent.regkeytitle101', {
  defaultMessage: 'Top alerts by action type and organization',
});
const title102 = i18n.translate('wazuh.components.visualize.agent.regkeytitle102', {
  defaultMessage: 'Users with more alerts',
});
const title103 = i18n.translate('wazuh.components.visualize.agent.regkeytitle103', {
  defaultMessage: 'Alerts summary',
});

export const agentVisualizations = {
  general: {
    rows: [
      {
        height: 400,
        vis: [
          {
            title: title1,
            id: 'Wazuh-App-Agents-General-Alert-groups-evolution',
            width: 50,
          },
          { title: title2, id: 'Wazuh-App-Agents-General-Alerts', width: 50 },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: title3,
            id: 'Wazuh-App-Agents-General-Top-5-alerts',
            width: 33,
          },
          {
            title: title4,
            id: 'Wazuh-App-Agents-General-Top-10-groups',
            width: 33,
          },
          {
            title: title5,
            id: 'Wazuh-App-Agents-General-Top-5-PCI-DSS-Requirements',
            width: 34,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title6,
            id: 'Wazuh-App-Agents-General-Alerts-summary',
            width: 60,
          },
          {
            title: title7,
            id: 'Wazuh-App-Agents-General-Groups-summary',
            width: 40,
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
            title: title8,
            id: 'Wazuh-App-Agents-AWS-Top-sources',
            width: 25,
          },
          {
            title: title9,
            id: 'Wazuh-App-Agents-AWS-Top-accounts',
            width: 25,
          },
          {
            title: title10,
            id: 'Wazuh-App-Agents-AWS-Top-buckets',
            width: 25,
          },
          {
            title: title11,
            id: 'Wazuh-App-Agents-AWS-Top-regions',
            width: 25,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: title12,
            id: 'Wazuh-App-Agents-AWS-Events-by-source',
            width: 50,
          },
          {
            title: title13,
            id: 'Wazuh-App-Agents-AWS-Events-by-s3-bucket',
            width: 50,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: title14,
            id: 'Wazuh-App-Agents-AWS-geo',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title15,
            id: 'Wazuh-App-Agents-AWS-Alerts-summary',
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
            title: title16,
            id: 'Wazuh-App-Agents-FIM-Users',
            width: 25,
          },
          {
            title: title17,
            id: 'Wazuh-App-Agents-FIM-Actions',
            width: 25,
          },
          {
            title: title18,
            id: 'Wazuh-App-Agents-FIM-Events',
            width: 50,
          },
        ],
      },
      {
        height: 230,
        vis: [
          {
            title: title19,
            id: 'Wazuh-App-Agents-FIM-Files-added',
            width: 33,
          },
          {
            title: title20,
            id: 'Wazuh-App-Agents-FIM-Files-modified',
            width: 33,
          },
          {
            title: title21,
            id: 'Wazuh-App-Agents-FIM-Files-deleted',
            width: 34,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title22,
            id: 'Wazuh-App-Agents-FIM-Alerts-summary',
          },
        ],
      },
    ],
  },
  gcp: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: title23,
            id: 'Wazuh-App-Agents-GCP-Top-5-rules',
            width: 50,
          },
          {
            title: title24,
            id: 'Wazuh-App-Agents-GCP-Event-Query-Name',
            width: 25,
          },
          {
            title: title25,
            id: 'Wazuh-App-Agents-GCP-Top-5-instances',
            width: 25,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: title26,
            id: 'Wazuh-App-Agents-GCP-Top-ProjectId-By-SourceType',
            width: 25,
          },
          {
            title: title27,
            id: 'Wazuh-App-Agents-GCP-Events-Over-Time',
            width: 75,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: title28,
            id: 'Wazuh-App-Agents-GCP-authAnswer-Bar',
            width: 40,
          },
          {
            title: title29,
            id: 'Wazuh-App-Agents-GCP-Top-ResourceType-By-Project-Id',
            width: 60,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title30,
            id: 'Wazuh-App-Agents-GCP-Alerts-summary',
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
            title: title31,
            id: 'Wazuh-App-Agents-PCI-Groups',
            width: 33,
          },
          {
            title: title32,
            id: 'Wazuh-App-Agents-PCI-Rule',
            width: 33,
          },
          {
            title: title33,
            id: 'Wazuh-App-Agents-PCI-Requirement',
            width: 34,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: title34,
            id: 'Wazuh-App-Agents-PCI-Requirements',
            width: 75,
          },
          {
            title: title35,
            id: 'Wazuh-App-Agents-PCI-Rule-level-distribution',
            width: 25,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title36,
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
            title: title37,
            id: 'Wazuh-App-Agents-GDPR-Groups',
            width: 33,
          },
          {
            title: title38,
            id: 'Wazuh-App-Agents-GDPR-Rule',
            width: 33,
          },
          {
            title: title39,
            id: 'Wazuh-App-Agents-GDPR-Requirement',
            width: 34,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: title40,
            id: 'Wazuh-App-Agents-GDPR-Requirements',
            width: 75,
          },
          {
            title: title41,
            id: 'Wazuh-App-Agents-GDPR-Rule-level-distribution',
            width: 25,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title42,
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
            title: title43,
            id: 'Wazuh-App-Agents-NIST-Stats',
            width: 25,
          },
          {
            title: title44,
            id: 'Wazuh-App-Agents-NIST-top-10-requirements',
            width: 25,
          },
          {
            title: title45,
            id: 'Wazuh-App-Agents-NIST-Requirement-by-level',
            width: 50,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: title46,
            id: 'Wazuh-App-Agents-NIST-Requirements-stacked-overtime',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title47,
            id: 'Wazuh-App-Agents-NIST-Last-alerts',
          },
        ],
      },
    ],
  },
  tsc: {
    rows: [
      {
        height: 300,
        vis: [
          {
            title: title48,
            id: 'Wazuh-App-Agents-TSC-Groups',
            width: 33,
          },
          {
            title: title49,
            id: 'Wazuh-App-Agents-TSC-Rule',
            width: 33,
          },
          {
            title: title50,
            id: 'Wazuh-App-Agents-TSC-Requirement',
            width: 34,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: title51,
            id: 'Wazuh-App-Agents-TSC-Requirements',
            width: 75,
          },
          {
            title: title52,
            id: 'Wazuh-App-Agents-TSC-Rule-level-distribution',
            width: 25,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title53,
            id: 'Wazuh-App-Overview-TSC-Alerts-summary',
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
            title: title54,
            id: 'Wazuh-App-Agents-HIPAA-Requirements-Stacked-Overtime',
            width: 50,
          },
          {
            title: title55,
            id: 'Wazuh-App-Agents-HIPAA-top-10',
            width: 50,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: title56,
            id: 'Wazuh-App-Agents-HIPAA-Burbles',
            width: 50,
          },
          {
            title: title57,
            id: 'Wazuh-App-Agents-HIPAA-Distributed-By-Level',
            width: 25,
          },
          {
            title: title58,
            id: 'Wazuh-App-Agents-HIPAA-Most-Common',
            width: 25,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title59,
            id: 'Wazuh-App-Agents-HIPAA-Last-alerts',
          },
        ],
      },
    ],
  },
  virustotal: {
    rows: [
      {
        height: 250,
        vis: [
          {
            title: title60,
            id: 'Wazuh-App-Agents-Virustotal-Last-Files-Pie',
            width: 25,
          },
          {
            title: title61,
            id: 'Wazuh-App-Agents-Virustotal-Malicious-Evolution',
            width: 75,
          },
        ],
      },
      {
        height: 570,
        vis: [
          {
            title: title62,
            id: 'Wazuh-App-Agents-Virustotal-Files-Table',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title63,
            id: 'Wazuh-App-Agents-Virustotal-Alerts-summary',
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
            title: title64,
            id: 'Wazuh-App-Agents-Osquery-most-common-osquery-actions',
            width: 25,
          },
          {
            title: title65,
            id: 'Wazuh-App-Agents-Osquery-Evolution',
            width: 75,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: title66,
            id: 'Wazuh-App-Agents-Osquery-top-5-packs-being-used',
            width: 25,
          },
          {
            title: title67,
            id: 'Wazuh-App-Agents-Osquery-monst-common-rules-being-fired',
            width: 75,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title68,
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
            title: title69,
            id: 'Wazuh-App-Agents-MITRE-Alerts-Evolution',
            width: 70,
          },
          {
            title: title70,
            id: 'Wazuh-App-Agents-MITRE-Top-Tactics',
            width: 30,
          },
        ],
      },
      {
        height: 360,
        vis: [
          {
            title: title71,
            id: 'Wazuh-App-Agents-MITRE-Level-By-Attack',
            width: 33,
          },
          {
            title: title72,
            id: 'Wazuh-App-Agents-MITRE-Attacks-By-Tactic',
            width: 34,
          },
          {
            title: title73,
            id: 'Wazuh-App-Agents-MITRE-Level-By-Tactic',
            width: 34,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title74,
            id: 'Wazuh-App-Agents-MITRE-Alerts-summary',
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
            title: title75,
            id: 'Wazuh-App-Agents-Docker-top-5-images',
            width: 25,
          },
          {
            title: title76,
            id: 'Wazuh-App-Agents-Docker-top-5-actions',
            width: 25,
          },
          {
            title: title77,
            id: 'Wazuh-App-Agents-Docker-Types-over-time',
            width: 50,
          },
        ],
      },
      {
        height: 300,
        vis: [
          {
            title: title78,
            id: 'Wazuh-App-Agents-Docker-Actions-over-time',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title79,
            id: 'Wazuh-App-Agents-Docker-Events-summary',
          },
        ],
      },
    ],
  },
  oscap: {
    rows: [
      {
        height: 230,
        vis: [
          {
            title: title80,
            id: 'Wazuh-App-Agents-OSCAP-Scans',
            width: 25,
          },
          {
            title: title81,
            id: 'Wazuh-App-Agents-OSCAP-Profiles',
            width: 25,
          },
          {
            title: title82,
            id: 'Wazuh-App-Agents-OSCAP-Content',
            width: 25,
          },
          {
            title: title83,
            id: 'Wazuh-App-Agents-OSCAP-Severity',
            width: 25,
          },
        ],
      },
      {
        height: 230,
        vis: [
          {
            title: title84,
            id: 'Wazuh-App-Agents-OSCAP-Daily-scans-evolution',
          },
        ],
      },
      {
        height: 250,
        vis: [
          {
            title: title85,
            id: 'Wazuh-App-Agents-OSCAP-Top-5-Alerts',
            width: 50,
          },
          {
            title: title86,
            id: 'Wazuh-App-Agents-OSCAP-Top-5-High-risk-alerts',
            width: 50,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title87,
            id: 'Wazuh-App-Agents-OSCAP-Last-alerts',
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
            title: title88,
            id: 'Wazuh-app-Agents-CISCAT-top-5-groups',
            width: 60,
          },
          {
            title: title89,
            id: 'Wazuh-app-Agents-CISCAT-scan-result-evolution',
            width: 40,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title90,
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
            title: title91,
            id: 'Wazuh-App-Agents-PM-Events-over-time',
            width: 50,
          },
          {
            title: title92,
            id: 'Wazuh-App-Agents-PM-Top-5-rules',
            width: 50,
          },
        ],
      },
      {
        height: 240,
        vis: [
          {
            title: title93,
            id: 'Wazuh-App-Agents-PM-Events-per-agent-evolution',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title94,
            id: 'Wazuh-App-Agents-PM-Alerts-summary',
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
            title: title95,
            id: 'Wazuh-App-Agents-Audit-Groups',
            width: 33,
          },
          {
            title: title96,
            id: 'Wazuh-App-Agents-Audit-Commands',
            width: 33,
          },
          {
            title: title97,
            id: 'Wazuh-App-Agents-Audit-Files',
            width: 34,
          },
        ],
      },
      {
        height: 310,
        vis: [
          {
            title: title98,
            id: 'Wazuh-App-Agents-Audit-Alerts-over-time',
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title99,
            id: 'Wazuh-App-Agents-Audit-Last-alerts',
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
            title: title100,
            id: 'Wazuh-App-Overview-GitHub-Alerts-Evolution-By-Organization',
            width: 60,
          },
          {
            title: title101,
            id: 'Wazuh-App-Overview-GitHub-Top-5-Organizations-By-Alerts',
            width: 40,
          },
        ],
      },
      {
        height: 360,
        vis: [
          {
            title: title102,
            id: 'Wazuh-App-Overview-GitHub-Alert-Action-Type-By-Organization',
            width: 40,
          },
          {
            title: title103,
            id: 'Wazuh-App-Overview-GitHub-Users-With-More-Alerts',
            width: 60,
          },
        ],
      },
      {
        hide: true,
        vis: [
          {
            title: title681,
            id: 'Wazuh-App-Overview-GitHub-Alert-Summary',
          },
        ],
      },
    ],
  },
};
