/*
 * Wazuh app - AWS sample data
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const TenantId = [
  '204deb58-7681-4702-8b46-487615384c11',
  '0fea4e03-8146-453b-b889-54b4bd11565b',
  'f3c8d2e1-5a6b-4c3b-8d2f-9e1a2b3c45d6',
  'a1b2c3d4-e5f6-78a9-b0c1-d2e3f4g5h6i7',
  '12345678-1234-1234-1234-123456789012',
  '87654321-4321-4321-4321-210987654321',
  'abcdefab-cdef-abcd-efab-cdefabcdefab',
];

const status = ['new', 'active', 'resolved', 'redirected'];

const riskEventTypes = [
  'anomalousToken',
  'anonymizedIPAddress',
  'investigationsThreatIntelligence',
  'maliciousIPAddress',
  'unfamiliarFeatures',
  'unlikelyTravel',
];

const riskLevels = ['low', 'medium', 'high'];

const ruleDescriptions = [
  'MS Graph message: Alert related events.',
  'MS Graph message: Behaviors and indicators that are commonly associated with advanced persistent threats (APT) activity were detected. There is a high risk of severe damage to affected assets. Requires immediate action.',
  'MS Graph message: Behaviors and indicators that might be a part of an advanced persistent threat (APT) were detected. This includes observed behaviors typical of attack stages, anomalous registry change, execution of suspicious files, and so forth.',
  'MS Graph message: Indicators associated with prevalent malware and common threats were detected.',
  'MS Graph message: MDM Intune audit event.',
  'MS Graph message: No malicious activity has been detected. This alert indicates a false positive.',
  'MS Graph message: Risk detection event.',
  'MS Graph message: This indicates that the alert has been resolved.',
];

const activityOperationType = ['Create', 'Action', 'Patch', 'Delete'];

const results = ['success', 'failure', 'timeout', 'unknownFutureValue'];

const category = ['Application', 'DeviceConfiguration', 'Enrollment', 'Device'];

const riskState = ['atRisk', 'dismissed', 'remediated'];

const riskDetail = [
  'aiConfirmedSigninSafe',
  'none',
  'userPassedMFADrivenByRiskBasedPolicy',
];

const detectionTimingType = ['offline', 'realTime'];

const activity = ['signin', 'user'];

const title = [
  'Unfamiliar sign-in properties',
  'Anomalous Token',
  'Malicious IP address',
  'Threat Intelligence Session',
  'Email reported by user as malware or phish',
];

const auditLogs = {
  timestamp: '2025-07-22T13:22:10.213+0000',
  rule: {
    level: 3,
    description: 'MS Graph message: Alert related events.',
    id: '99501',
    firedtimes: 11,
    mail: false,
    groups: ['ms-graph'],
  },
  agent: {
    id: '000',
    name: 'wazuh-test',
  },
  manager: {
    name: 'wazuh',
  },
  id: '1753190530.87338',
  decoder: {
    name: 'json-msgraph',
  },
  data: {
    integration: 'ms-graph',
    'ms-graph': {
      id: 'adfc42fdba71ff63845eb980ef79cf005919d5e338',
      providerAlertId:
        'afeaa0a6f464bc518db47d8890d176d34eec14a4893c3c14e659ea008916d48f',
      incidentId: '14',
      status: 'new',
      severity: 'low',
      serviceSource: 'azureAdIdentityProtection',
      detectionSource: 'azureAdIdentityProtection',
      productName: 'AAD Identity Protection',
      detectorId: 'UnfamiliarLocation',
      tenantId: '0fea4e03-8146-453b-b889-54b4bd11565b',
      title: 'Unfamiliar sign-in properties',
      description:
        'The following properties of this sign-in are unfamiliar for the given user: ASN, Browser, Device, IP, Location, EASId, TenantIPsubnet',
      category: 'InitialAccess',
      alertWebUrl:
        'https://security.microsoft.com/alerts/adfc42fdba71ff63845eb980ef79cf005919d5e338?tid=0fea4e03-8146-453b-b889-54b4bd11565b',
      incidentWebUrl:
        'https://security.microsoft.com/incident2/14/overview?tid=0fea4e03-8146-453b-b889-54b4bd11565b',
      mitreTechniques: ['T1078', 'T1078.004'],
      createdDateTime: '2025-07-18T19:54:06.1933333Z',
      lastUpdateDateTime: '2025-07-18T19:54:07.08Z',
      firstActivityDateTime: '2025-07-18T19:49:46.7576227Z',
      lastActivityDateTime: '2025-07-18T19:49:46.7576227Z',
      systemTags: ['Critical asset'],
      comments: [],
      evidence: [
        {
          '@odata.type': '#microsoft.graph.security.userEvidence',
          createdDateTime: '2025-07-18T19:54:06.2633333Z',
          verdict: 'suspicious',
          remediationStatus: 'none',
          remediationStatusDetails: null,
          roles: [],
          detailedRoles: [],
          tags: ['Critical asset'],
          stream: null,
          userAccount: {
            accountName: 'sample.data',
            domainName: null,
            userSid: 'S-1-12-1-2433668554-1095519951-903200417-2783035153',
            azureAdUserId: '910ed5ca-4ecf-414c-a1be-d53511bfe1a5',
            userPrincipalName: 'sample.data@wazuh.com',
            displayName: 'Sample',
          },
        },
        {
          '@odata.type': '#microsoft.graph.security.cloudLogonSessionEvidence',
          createdDateTime: '2025-07-18T19:54:06.2633333Z',
          verdict: 'suspicious',
          remediationStatus: 'none',
          remediationStatusDetails: null,
          roles: [],
          detailedRoles: [],
          tags: [],
          sessionId: '006d96c9-c5d2-5a8d-886f-084357b15b41',
          protocol: null,
          deviceName: null,
          operatingSystem: null,
          browser: null,
          userAgent:
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0',
          startUtcDateTime: '2025-07-18T19:49:46.7576227Z',
          previousLogonDateTime: null,
          account: {
            createdDateTime: '0001-01-01T00:00:00Z',
            verdict: 'unknown',
            remediationStatus: 'none',
            remediationStatusDetails: null,
            roles: [],
            detailedRoles: [],
            tags: [],
            stream: null,
            userAccount: {
              accountName: 'sample.data',
              domainName: null,
              userSid: 'S-1-12-1-2433668554-1095519951-903200417-2783035153',
              azureAdUserId: '910ed5ca-4ecf-414c-a1be-d53511bfe1a5',
              userPrincipalName: null,
              displayName: 'Sample',
            },
          },
        },
        {
          '@odata.type': '#microsoft.graph.security.ipEvidence',
          createdDateTime: '2025-07-18T19:54:06.2633333Z',
          verdict: 'suspicious',
          remediationStatus: 'none',
          remediationStatusDetails: null,
          roles: [],
          detailedRoles: [],
          tags: [],
          ipAddress: '179.49.126.14',
          countryLetterCode: 'AR',
          stream: null,
          location: {
            countryName: null,
            state: 'Buenos Aires',
            city: 'Bragado',
            longitude: -60.48966,
            latitude: -35.11912,
          },
        },
        {
          '@odata.type': '#microsoft.graph.security.cloudLogonRequestEvidence',
          createdDateTime: '2025-07-18T19:54:06.2633333Z',
          verdict: 'suspicious',
          remediationStatus: 'none',
          remediationStatusDetails: null,
          roles: [],
          detailedRoles: [],
          tags: [],
          requestId: 'c4105988-055b-429b-95f2-fac3dc690600',
        },
      ],
      resource: 'security',
      relationship: 'alerts_v2',
    },
  },
  location: 'ms-graph',
};

module.exports = {
  TenantId,
  auditLogs,
  category,
  ruleDescriptions,
  activityOperationType,
  riskEventTypes,
  riskState,
  riskLevels,
  riskDetail,
  detectionTimingType,
  activity,
  status,
  title,
  results,
};
