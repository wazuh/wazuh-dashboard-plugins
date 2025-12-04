/*
 * Wazuh app - Script to generate sample alerts
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// General
const {
  IPs,
  USERS,
  PORTS,
  PATHS,
  WIN_HOSTNAMES,
  GEO_LOCATION,
  AGENTS,
  DECODER,
  AS_DATA,
  DOMAINS,
  USER_GROUPS,
  USER_ROLES,
} = require('./sample-data/common');
const {
  PCI_DSS,
  GDPR,
  HIPAA,
  GPG13,
  NIST_800_53,
  tsc,
} = require('./sample-data/regulatory-compliance');
const Audit = require('./sample-data/audit');
const Authentication = require('./sample-data/authentication');
const AWS = require('./sample-data/aws');
const Azure = require('./sample-data/azure');
const IntegrityMonitoring = require('./sample-data/integrity-monitoring');
const GCP = require('./sample-data/gcp');
const Docker = require('./sample-data/docker');
const Mitre = require('./sample-data/mitre');
const PolicyMonitoring = require('./sample-data/policy-monitoring');
const Virustotal = require('./sample-data/virustotal');
const Vulnerability = require('./sample-data/vulnerabilities');
const SSH = require('./sample-data/ssh');
const Apache = require('./sample-data/apache');
const Web = require('./sample-data/web');
const GitHub = require('./sample-data/github');
const Office = require('./sample-data/office');
const Yara = require('./sample-data/yara');
const {
  ALERT_ID_MAX,
  RULE_DESCRIPTION,
  RULE_MAX_LEVEL,
} = require('./constants');
const { Random } = require('./helpers/random');
const { DateFormatter } = require('./helpers/date-formatter');
const { interpolateAlertProps } = require('./helpers/interpolate-alert-props');

const {
  EVENT_CATEGORIES,
  EVENT_TYPES,
  EVENT_KINDS,
  EVENT_OUTCOMES,
  generateEvent,
  generateLog,
  generateMessage,
  generateHost,
  generateUser,
  generateNetworkEndpoint,
} = require('./helpers/ecs-generator');
const {
  generateWazuhField,
  getDecodersForModule,
  getRulesForModule,
  generateAgent,
  generateRule,
} = require('./helpers/wazuh-generator');

/**
 * Generate an alert in Wazuh ECS format
 * @param {import('./types').Params} params
 * @returns {import('./types').SampleAlert}
 **/
function generateAlert(params) {
  // Generate random date for the alert
  const alertDate = Random.date();
  const timestamp = DateFormatter.format(
    alertDate,
    DateFormatter.DATE_FORMAT.ISO_TIMESTAMP,
  );

  // Select random agent
  const selectedAgent = Random.arrayItem(AGENTS);

  /** @type {import('./types').Alert} */
  let alert = {
    '@timestamp': timestamp,
    tags: ['wazuh', '@sampledata'],

    // Event categorization (will be set by specific alert type)
    event: generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.AUTHENTICATION],
      type: [EVENT_TYPES.INFO],
      outcome: EVENT_OUTCOMES.UNKNOWN,
      created: alertDate,
    }),

    // Message (human-readable)
    message: 'Sample security alert',

    agent: generateAgent(selectedAgent, {
      groups: ['default'],
    }),

    // Wazuh-specific fields
    wazuh: generateWazuhField({
      clusterName: params.cluster?.name,
      clusterNode: params.cluster?.node,
    }),

    // Rule information
    rule: generateRule({
      id: `${Random.number(1, ALERT_ID_MAX)}`,
      description: Random.arrayItem(RULE_DESCRIPTION),
      level: Random.number(1, RULE_MAX_LEVEL),
    }),
  };

  // Initialize data object for modules that haven't been migrated yet
  alert.data = {};

  if (params.aws) {
    const randomType = Random.arrayItem([
      'guarddutyPortProbe',
      'apiCall',
      'networkConnection',
      'iamPolicyGrantGlobal',
    ]);

    const beforeDate = new Date(
      new Date(alert['@timestamp']).getTime() - 3 * 24 * 60 * 60 * 1000,
    );

    // Update event categorization for cloud
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.INTRUSION_DETECTION],
      type: [EVENT_TYPES.INFO],
      outcome: EVENT_OUTCOMES.UNKNOWN,
      module: 'aws',
      severity: 5,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = getDecodersForModule('aws');
    alert.wazuh.rules = getRulesForModule('aws');
    switch (randomType) {
      case 'guarddutyPortProbe': {
        const typeAlert = AWS.guarddutyPortProbe;

        alert.data = { ...typeAlert.data };
        alert.data.integration = 'aws';
        alert.data.aws.region = Random.arrayItem(AWS.region);
        alert.data.aws.resource.instanceDetails = {
          ...Random.arrayItem(AWS.instanceDetails),
        };
        alert.data.aws.resource.instanceDetails.iamInstanceProfile.arn =
          interpolateAlertProps(
            typeAlert.data.aws.resource?.instanceDetails?.iamInstanceProfile
              ?.arn,
            alert,
          );
        alert.data.aws.title = interpolateAlertProps(
          alert.data.aws.title,
          alert,
        );
        alert.data.aws.accountId = Random.arrayItem(AWS.accountId);
        alert.data.aws.service.eventFirstSeen = DateFormatter.format(
          beforeDate,
          DateFormatter.DATE_FORMAT.ISO_FULL,
        );
        alert.data.aws.service.eventLastSeen = DateFormatter.format(
          new Date(alert['@timestamp']),
          DateFormatter.DATE_FORMAT.ISO_FULL,
        );
        alert.data.aws.service.action.portProbeAction.portProbeDetails.remoteIpDetails =
          {
            ...Random.arrayItem(AWS.remoteIpDetails),
          };
        alert.data.aws.log_info = {
          s3bucket: Random.arrayItem(AWS.buckets),
          log_file: `guardduty/${DateFormatter.format(
            new Date(alert['@timestamp']),
            DateFormatter.DATE_FORMAT.SHORT_DATE_TIME_SLASH,
          )}/firehose_guardduty-1-${DateFormatter.format(
            new Date(alert['@timestamp']),
            DateFormatter.DATE_FORMAT.FULL_HYPHENATED,
          )}b5b9b-ec62-4a07-85d7-b1699b9c031e.zip`,
        };
        alert.data.aws.service.count = `${Random.number(400, 4000)}`;
        alert.data.aws.createdAt = DateFormatter.format(
          beforeDate,
          DateFormatter.DATE_FORMAT.ISO_FULL,
        );

        alert.rule = { ...typeAlert.rule };
        alert.rule.firedtimes = Random.number(1, 50);
        alert.rule.description = interpolateAlertProps(
          typeAlert.rule.description,
          alert,
        );

        // Generate message and cloud fields (guarddutyPortProbe)
        alert.message = `AWS GuardDuty: ${alert.data.aws.title}`;
        alert.cloud = {
          provider: 'aws',
          region: alert.data.aws.region,
          account: { id: alert.data.aws.accountId },
          service: { name: 'guardduty' },
        };
        break;
      }
      case 'apiCall': {
        const typeAlert = AWS.apiCall;

        alert.data = { ...typeAlert.data };
        alert.data.integration = 'aws';
        alert.data.aws.region = Random.arrayItem(AWS.region);
        alert.data.aws.resource.accessKeyDetails.userName =
          Random.arrayItem(USERS);
        alert.data.aws.log_info = {
          s3bucket: Random.arrayItem(AWS.buckets),
          log_file: `guardduty/${DateFormatter.format(
            new Date(alert['@timestamp']),
            DateFormatter.DATE_FORMAT.SHORT_DATE_TIME_SLASH,
          )}/firehose_guardduty-1-${DateFormatter.format(
            new Date(alert['@timestamp']),
            DateFormatter.DATE_FORMAT.FULL_HYPHENATED,
          )}b5b9b-ec62-4a07-85d7-b1699b9c031e.zip`,
        };
        alert.data.aws.accountId = Random.arrayItem(AWS.accountId);
        alert.data.aws.service.action.awsApiCallAction.remoteIpDetails = {
          ...Random.arrayItem(AWS.remoteIpDetails),
        };
        alert.data.aws.service.eventFirstSeen = DateFormatter.format(
          beforeDate,
          DateFormatter.DATE_FORMAT.ISO_FULL,
        );
        alert.data.aws.service.eventLastSeen = DateFormatter.format(
          new Date(alert['@timestamp']),
          DateFormatter.DATE_FORMAT.ISO_FULL,
        );
        alert.data.aws.createdAt = DateFormatter.format(
          beforeDate,
          DateFormatter.DATE_FORMAT.ISO_FULL,
        );
        alert.data.aws.title = interpolateAlertProps(
          alert.data.aws.title,
          alert,
        );
        alert.data.aws.description = interpolateAlertProps(
          alert.data.aws.description,
          alert,
        );
        const count = `${Random.number(400, 4000)}`;
        alert.data.aws.service.additionalInfo.recentApiCalls.count = count;
        alert.data.aws.service.count = count;

        alert.rule = { ...typeAlert.rule };
        alert.rule.firedtimes = Random.number(1, 50);
        alert.rule.description = interpolateAlertProps(
          typeAlert.rule.description,
          alert,
        );

        // Generate message and cloud fields
        alert.message = `AWS GuardDuty: ${alert.data.aws.title}`;
        alert.cloud = {
          provider: 'aws',
          region: alert.data.aws.region,
          account: { id: alert.data.aws.accountId },
          service: { name: 'guardduty' },
        };
        break;
      }
      case 'networkConnection': {
        const typeAlert = AWS.networkConnection;

        alert.data = { ...typeAlert.data };
        alert.data.integration = 'aws';
        alert.data.aws.region = Random.arrayItem(AWS.region);
        alert.data.aws.resource.instanceDetails = {
          ...Random.arrayItem(AWS.instanceDetails),
        };
        alert.data.aws.log_info = {
          s3bucket: Random.arrayItem(AWS.buckets),
          log_file: `guardduty/${DateFormatter.format(
            new Date(alert['@timestamp']),
            DateFormatter.DATE_FORMAT.SHORT_DATE_TIME_SLASH,
          )}/firehose_guardduty-1-${DateFormatter.format(
            new Date(alert['@timestamp']),
            DateFormatter.DATE_FORMAT.FULL_HYPHENATED,
          )}b5b9b-ec62-4a07-85d7-b1699b9c031e.zip`,
        };
        alert.data.aws.description = interpolateAlertProps(
          alert.data.aws.description,
          alert,
        );
        alert.data.aws.title = interpolateAlertProps(
          alert.data.aws.title,
          alert,
        );
        alert.data.aws.accountId = Random.arrayItem(AWS.accountId);
        alert.data.aws.createdAt = DateFormatter.format(
          beforeDate,
          DateFormatter.DATE_FORMAT.ISO_FULL,
        );
        alert.data.aws.service.action.networkConnectionAction.remoteIpDetails =
          {
            ...Random.arrayItem(AWS.remoteIpDetails),
          };
        alert.data.aws.service.eventFirstSeen = DateFormatter.format(
          beforeDate,
          DateFormatter.DATE_FORMAT.ISO_FULL,
        );
        alert.data.aws.service.eventLastSeen = DateFormatter.format(
          new Date(alert['@timestamp']),
          DateFormatter.DATE_FORMAT.ISO_FULL,
        );
        alert.data.aws.service.additionalInfo = {
          localPort: `${Random.arrayItem(PORTS)}`,
          outBytes: `${Random.number(1000, 3000)}`,
          inBytes: `${Random.number(1000, 10000)}`,
          unusual: `${Random.number(1000, 10000)}`,
        };
        alert.data.aws.service.count = `${Random.number(400, 4000)}`;
        alert.data.aws.service.action.networkConnectionAction.localIpDetails.ipAddressV4 =
          alert.data.aws.resource.instanceDetails.networkInterfaces.privateIpAddress;
        alert.data.aws.arn = interpolateAlertProps(
          typeAlert.data.aws.arn,
          alert,
        );
        alert.rule = { ...typeAlert.rule };
        alert.rule.firedtimes = Random.number(1, 50);
        alert.rule.description = interpolateAlertProps(
          typeAlert.rule.description,
          alert,
        );

        // Generate message and cloud fields (networkConnection)
        alert.message = `AWS GuardDuty: ${alert.data.aws.title}`;
        alert.cloud = {
          provider: 'aws',
          region: alert.data.aws.region,
          account: { id: alert.data.aws.accountId },
          service: { name: 'guardduty' },
        };
        break;
      }
      case 'iamPolicyGrantGlobal': {
        const typeAlert = AWS.iamPolicyGrantGlobal;

        alert.data = { ...typeAlert.data };
        alert.data.integration = 'aws';
        alert.data.aws.region = Random.arrayItem(AWS.region);
        alert.data.aws.summary.Timestamps = DateFormatter.format(
          beforeDate,
          DateFormatter.DATE_FORMAT.ISO_FULL,
        );
        alert.data.aws.log_info = {
          s3bucket: Random.arrayItem(AWS.buckets),
          log_file: `macie/${DateFormatter.format(
            new Date(alert['@timestamp']),
            DateFormatter.DATE_FORMAT.SHORT_DATE_TIME_SLASH,
          )}/firehose_macie-1-${DateFormatter.format(
            new Date(alert['@timestamp']),
            DateFormatter.DATE_FORMAT.COMPACT_DATE_TIME_HYPHENATED,
          )}-0b1ede94-f399-4e54-8815-1c6587eee3b1//firehose_guardduty-1-${DateFormatter.format(
            new Date(alert['@timestamp']),
            DateFormatter.DATE_FORMAT.FULL_HYPHENATED,
          )}b5b9b-ec62-4a07-85d7-b1699b9c031e.zip`,
        };
        alert.data.aws['created-at'] = DateFormatter.format(
          beforeDate,
          DateFormatter.DATE_FORMAT.ISO_FULL,
        );
        alert.data.aws.url = interpolateAlertProps(
          typeAlert.data.aws.url,
          alert,
        );
        alert.data.aws['alert-arn'] = interpolateAlertProps(
          typeAlert.data.aws['alert-arn'],
          alert,
        );

        alert.rule = { ...typeAlert.rule };
        alert.rule.firedtimes = Random.number(1, 50);

        // Generate message and cloud fields
        alert.message = `AWS Macie: ${typeAlert.data.aws.name}`;
        alert.cloud = {
          provider: 'aws',
          region: alert.data.aws.region,
          account: { id: Random.arrayItem(AWS.accountId) },
          service: { name: 'macie' },
        };
        break;
      }
      default: {
        /* empty */
      }
    }

    // Log information
    alert.log = generateLog({
      level: 'info',
      filePath: alert.data.aws.log_info?.log_file || '/var/log/aws.log',
      originFile: 'aws',
    });
  }

  if (params.azure) {
    const beforeDate = new Date(
      new Date(alert['@timestamp']).getTime() - 3 * 24 * 60 * 60 * 1000,
    );
    const typeAlert = Azure.auditLogs;

    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.IAM],
      type: [EVENT_TYPES.CHANGE],
      outcome: EVENT_OUTCOMES.SUCCESS,
      module: 'azure',
      severity: 3,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = getDecodersForModule('azure');
    alert.wazuh.rules = getRulesForModule('azure');

    alert.rule = { ...typeAlert.rule };
    alert.rule.description = Random.arrayItem(Azure.ruleDescriptions);
    alert.rule.id = `${Random.number(1, ALERT_ID_MAX)}`;
    alert.rule.level = Random.number(1, RULE_MAX_LEVEL);

    alert.data = {
      ...typeAlert.data,
      'ms-graph': { ...typeAlert.data['ms-graph'] },
    };
    alert.data['ms-graph'].tenantId = Random.arrayItem(Azure.TenantId);
    alert.data['ms-graph'].activityOperationType = Random.arrayItem(
      Azure.activityOperationType,
    );
    alert.data['ms-graph'].category = Random.arrayItem(Azure.category);
    alert.data['ms-graph'].title = Random.arrayItem(Azure.title);
    alert.data['ms-graph'].status = Random.arrayItem(Azure.status);
    alert.data['ms-graph'].activityResult = Random.arrayItem(Azure.results);
    alert.data['ms-graph'].id = Random.createHash(32);
    alert.data['ms-graph'].requestId = Random.createHash(32);
    alert.data['ms-graph'].correlationId = Random.createHash(32);
    alert.data['ms-graph'].riskEventType = Random.arrayItem(
      Azure.riskEventTypes,
    );
    alert.data['ms-graph'].riskState = Random.arrayItem(Azure.riskState);
    alert.data['ms-graph'].riskLevel = Random.arrayItem(Azure.riskLevels);
    alert.data['ms-graph'].riskDetail = Random.arrayItem(Azure.riskDetail);
    alert.data['ms-graph'].detectionTimingType = Random.arrayItem(
      Azure.detectionTimingType,
    );
    alert.data['ms-graph'].activity = Random.arrayItem(Azure.activity);
    alert.data['ms-graph'].ipAddress = Random.arrayItem(IPs);
    alert.data['ms-graph'].displayName = Random.arrayItem(Azure.displayName);
    alert.data['ms-graph'].activityDateTime = DateFormatter.format(
      new Date(Random.date()),
      DateFormatter.DATE_FORMAT.ISO_FULL,
    );
    alert.data['ms-graph'].detectedDateTime = DateFormatter.format(
      Random.date(),
      DateFormatter.DATE_FORMAT.ISO_FULL,
    );
    alert.data['ms-graph'].lastUpdatedDateTime = DateFormatter.format(
      Random.date(),
      DateFormatter.DATE_FORMAT.ISO_FULL,
    );
    alert.data['ms-graph'].userId = Random.createHash(32);

    // Cloud fields for Azure
    alert.cloud = {
      provider: 'azure',
      account: { id: alert.data['ms-graph'].tenantId },
    };

    // Message
    alert.message = `Azure: ${alert.data['ms-graph'].title} - ${alert.data['ms-graph'].category}`;

    // Log information
    alert.log = generateLog({
      level: 'info',
      filePath: '/var/log/azure.log',
      originFile: 'azure',
    });
  }

  if (params.office) {
    const beforeDate = new Date(
      new Date(alert['@timestamp']).getTime() - 3 * 24 * 60 * 60 * 1000,
    );
    const IntraID = Random.arrayItem(Office.arrayUuidOffice);
    const OrgID = Random.arrayItem(Office.arrayUuidOffice);
    const objID = Random.arrayItem(Office.arrayUuidOffice);
    const userKey = Random.arrayItem(Office.arrayUuidOffice);
    const userID = Random.arrayItem(Office.arrayUserId);
    const userType = Random.arrayItem([0, 2, 4]);
    const resultStatus = Random.arrayItem([
      'Succeeded',
      'PartiallySucceeded',
      'Failed',
    ]);
    const log = Random.arrayItem(Office.arrayLogs);
    const ruleData = Office.officeRules[log.RecordType];

    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.IAM],
      type: [EVENT_TYPES.CHANGE],
      outcome:
        resultStatus === 'Succeeded'
          ? EVENT_OUTCOMES.SUCCESS
          : EVENT_OUTCOMES.FAILURE,
      module: 'office365',
      severity: 3,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = getDecodersForModule('office');
    alert.wazuh.rules = getRulesForModule('office');

    // User from Office365
    alert.user = generateUser({
      name: userID,
      id: userKey,
    });

    // Source IP
    const sourceIp = Random.arrayItem(Office.arrayIp);
    const sourceGeo = Random.arrayItem(GEO_LOCATION);
    alert.source = generateNetworkEndpoint({
      ip: sourceIp,
      geo: sourceGeo,
    });

    alert.rule = ruleData.rule;
    alert.data.integration = 'Office365';
    alert.data.office365 = {
      ...log,
      ...ruleData.data.office365,
      Id: IntraID,
      CreationTime: DateFormatter.format(
        beforeDate,
        DateFormatter.DATE_FORMAT.ISO_FULL,
      ),
      OrganizationId: OrgID,
      UserType: userType,
      UserKey: userKey,
      ResultStatus: resultStatus,
      ObjectId: objID,
      UserId: userID,
      ClientIP: sourceIp,
    };

    // Message
    alert.message = `Office 365: ${log.Operation} by ${userID} (${resultStatus})`;

    // Log information
    alert.log = generateLog({
      level: resultStatus === 'Succeeded' ? 'info' : 'warning',
      filePath: '/var/log/office365.log',
      originFile: 'office365',
    });
  }

  if (params.gcp) {
    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.NETWORK],
      type: [EVENT_TYPES.INFO],
      outcome: EVENT_OUTCOMES.SUCCESS,
      module: 'gcp',
      severity: 3,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = getDecodersForModule('gcp');
    alert.wazuh.rules = getRulesForModule('gcp');

    alert.rule = Random.arrayItem(GCP.arrayRules);
    alert.data.integration = 'gcp';
    alert.data.gcp = {
      insertId: 'uk1zpe23xcj',
      jsonPayload: {
        authAnswer:
          GCP.arrayAuthAnswer[
            Math.floor(GCP.arrayAuthAnswer.length * Math.random())
          ],
        protocol:
          GCP.arrayProtocol[
            Math.floor(GCP.arrayProtocol.length * Math.random())
          ],
        queryName:
          GCP.arrayQueryName[
            Math.floor(GCP.arrayQueryName.length * Math.random())
          ],
        queryType:
          GCP.arrayQueryType[
            Math.floor(GCP.arrayQueryType.length * Math.random())
          ],
        responseCode:
          GCP.arrayResponseCode[
            Math.floor(GCP.arrayResponseCode.length * Math.random())
          ],
        sourceIP:
          GCP.arraySourceIP[
            Math.floor(GCP.arraySourceIP.length * Math.random())
          ],
        vmInstanceId: '4980113928800839680.000000',
        vmInstanceName: '531339229531.instance-1',
      },
      logName: 'projects/wazuh-dev/logs/dns.googleapis.com%2Fdns_queries',
      receiveTimestamp: '2019-11-11T02:42:05.05853152Z',
      resource: {
        labels: {
          location:
            GCP.arrayLocation[
              Math.floor(GCP.arrayLocation.length * Math.random())
            ],
          project_id:
            GCP.arrayProject[
              Math.floor(GCP.arrayProject.length * Math.random())
            ],
          source_type:
            GCP.arraySourceType[
              Math.floor(GCP.arraySourceType.length * Math.random())
            ],
          target_type: 'external',
        },
        type: GCP.arrayType[Math.floor(GCP.arrayType.length * Math.random())],
      },
      severity:
        GCP.arraySeverity[Math.floor(GCP.arraySeverity.length * Math.random())],
      timestamp: '2019-11-11T02:42:04.34921449Z',
    };

    // Cloud fields for GCP
    alert.cloud = {
      provider: 'gcp',
      project: { id: alert.data.gcp.resource.labels.project_id },
      region: alert.data.gcp.resource.labels.location,
      service: { name: 'dns' },
    };

    // Message
    alert.message = `GCP DNS Query: ${alert.data.gcp.jsonPayload.queryName} (${alert.data.gcp.jsonPayload.queryType})`;

    // Log information
    alert.log = generateLog({
      level: alert.data.gcp.severity?.toLowerCase() || 'info',
      filePath: alert.data.gcp.logName,
      originFile: 'gcp',
    });
  }

  if (params.audit) {
    const dataAudit = Random.arrayItem(Audit.dataAudit);

    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.PROCESS],
      type: [EVENT_TYPES.CHANGE],
      outcome: EVENT_OUTCOMES.SUCCESS,
      module: 'audit',
      severity: 5,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = ['audit'];
    alert.wazuh.rules = getRulesForModule('audit', 'modified');

    alert.data = dataAudit.data;
    alert.data.audit.file
      ? alert.data.audit.file.name === ''
        ? (alert.data.audit.file.name = Random.arrayItem(Audit.fileName))
        : null
      : null;
    alert.rule = dataAudit.rule;

    // Message
    alert.message = `Audit: ${dataAudit.rule.description}`;

    // Log
    alert.log = generateLog({
      level: 'info',
      filePath: '/var/log/audit/audit.log',
      originFile: 'audit',
    });
  }

  if (params.docker) {
    const dataDocker = Random.arrayItem(Docker.dataDocker);

    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.PROCESS],
      type: [EVENT_TYPES.INFO],
      outcome: EVENT_OUTCOMES.SUCCESS,
      module: 'docker',
      severity: 3,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = getDecodersForModule('docker');
    alert.wazuh.rules = getRulesForModule('docker');

    alert.data = dataDocker.data;
    alert.rule = dataDocker.rule;

    // Container information
    alert.container = {
      id: Random.createHash(12),
      name: `container-${Random.number(1, 100)}`,
      image: {
        name: Random.arrayItem([
          'nginx:latest',
          'redis:alpine',
          'postgres:14',
          'node:18-alpine',
        ]),
      },
    };

    // Message
    alert.message = `Docker: ${dataDocker.rule.description}`;

    // Log information
    alert.log = generateLog({
      level: 'info',
      filePath: '/var/log/docker.log',
      originFile: 'docker',
    });
  }

  if (params.mitre) {
    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.INTRUSION_DETECTION],
      type: [EVENT_TYPES.INFO],
      outcome: EVENT_OUTCOMES.UNKNOWN,
      module: 'mitre',
      severity: 5,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = getDecodersForModule('mitre');

    // Message
    alert.message = `MITRE ATT&CK: ${alert.rule.description}`;

    // Log
    alert.log = generateLog({
      level: 'info',
      filePath: Random.arrayItem(Mitre.arrayLocation),
      originFile: 'mitre',
    });
  }

  if (params.rootcheck) {
    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.MALWARE],
      type: [EVENT_TYPES.INFO],
      outcome: EVENT_OUTCOMES.UNKNOWN,
      module: 'wazuh-rootcheck',
      severity: 7,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = ['wazuh-rootcheck'];
    alert.wazuh.rules = getRulesForModule('wazuh-rootcheck');

    const alertCategory = Random.arrayItem(['Rootkit', 'Trojan']);

    switch (alertCategory) {
      case 'Rootkit': {
        const rootkitCategory = Random.arrayItem(
          Object.keys(PolicyMonitoring.rootkits),
        );
        const rootkit = Random.arrayItem(
          PolicyMonitoring.rootkits[rootkitCategory],
        );
        alert.data = {
          title: interpolateAlertProps(
            PolicyMonitoring.rootkitsData.data.title,
            alert,
            {
              _rootkit_category: rootkitCategory,
              _rootkit_file: rootkit,
            },
          ),
        };
        alert.rule = { ...PolicyMonitoring.rootkitsData.rule };
        alert.rule.firedtimes = Random.number(1, 10);
        alert.message = alert.data.title;
        break;
      }
      case 'Trojan': {
        const trojan = Random.arrayItem(PolicyMonitoring.trojans);
        alert.data = {
          file: trojan.file,
          title: 'Trojaned version of file detected.',
        };
        alert.rule = { ...PolicyMonitoring.trojansData.rule };
        alert.rule.firedtimes = Random.number(1, 10);
        alert.message = `Trojaned file detected: ${trojan.file}`;
        break;
      }
      default: {
        /* empty */
      }
    }

    // Log
    alert.log = generateLog({
      level: 'warning',
      filePath: PolicyMonitoring.location,
      originFile: 'rootcheck',
    });
  }

  if (params.syscheck) {
    // Determine FIM event type
    const eventType = Random.arrayItem(IntegrityMonitoring.events); // 'added', 'modified', 'deleted'

    // Select file path based on OS
    const isWindows = alert.agent.host.os.type === 'windows';
    const filePath = Random.arrayItem(
      isWindows
        ? IntegrityMonitoring.pathsWindows
        : IntegrityMonitoring.pathsLinux,
    );

    // Extract file components
    const separator = isWindows ? '\\' : '/';
    const fileName = filePath.split(separator).pop();
    const fileDirectory = filePath.substring(
      0,
      filePath.lastIndexOf(separator),
    );

    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.FILE],
      type:
        eventType === 'added'
          ? [EVENT_TYPES.CREATION]
          : eventType === 'modified'
          ? [EVENT_TYPES.CHANGE]
          : [EVENT_TYPES.DELETION],
      action: `file-${eventType}`,
      outcome: EVENT_OUTCOMES.SUCCESS,
      module: 'fim',
      severity: eventType === 'deleted' ? 7 : eventType === 'modified' ? 5 : 3,
    });

    const fileOwner = Random.arrayItem(USERS);
    const fileGroup = 'root';
    const fileUid = Random.arrayItem(IntegrityMonitoring.uid_after);
    const fileGid = Random.arrayItem(IntegrityMonitoring.gid_after);

    alert.file = {
      path: filePath,
      name: fileName,
      directory: fileDirectory,
      size: Random.number(1024, 1000000),
      mtime: new Date(alertDate).toISOString(),
      inode: String(Random.number(1000, 100000)),
      owner: fileOwner,
      group: fileGroup,
      mode: '0644',
      uid: String(fileUid),
      gid: String(fileGid),
    };

    // Add hashes for modified/deleted files
    if (eventType === 'modified' || eventType === 'deleted') {
      alert.file.hash = {
        md5: Random.createHash(32),
        sha1: Random.createHash(40),
        sha256: Random.createHash(64),
      };
    }

    // For modified files, add changed attributes
    if (eventType === 'modified') {
      alert.file.attributes = [
        Random.arrayItem(IntegrityMonitoring.attributes),
      ];
    }

    // For deleted files, add process and user information
    if (eventType === 'deleted') {
      const processUser = Random.arrayItem(USERS);
      const processUserId = Random.number(0, 100);
      const processGroup = Random.arrayItem(USERS);
      const processGroupId = Random.number(0, 100);

      alert.process = {
        pid: Random.number(100, 100000),
        parent: {
          pid: Random.number(1, 1000),
        },
        name: Random.arrayItem(PATHS).split('/').pop(),
        executable: Random.arrayItem(PATHS),
        user: {
          id: String(processUserId),
          name: processUser,
        },
        group: {
          id: String(processGroupId),
          name: processGroup,
        },
      };

      alert.user = generateUser({
        name: processUser,
        id: String(processUserId),
        groupName: processGroup,
        groupId: String(processGroupId),
      });

      // Add tags for deleted files
      if (Random.probability(0.5)) {
        alert.tags.push(Random.arrayItem(IntegrityMonitoring.tags));
      }
    }

    // Generate message
    const actionDescriptions = {
      added: 'File created',
      modified: 'File modified',
      deleted: 'File deleted',
    };

    alert.message = generateMessage({
      action: actionDescriptions[eventType],
      fileName: filePath,
      user: eventType === 'deleted' ? alert.user?.name : undefined,
    });

    // Log information
    alert.log = generateLog({
      level: eventType === 'deleted' ? 'warning' : 'info',
      filePath: '/var/ossec/logs/ossec.log',
      originFile: 'syscheck',
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = ['syscheck'];
    alert.wazuh.rules = getRulesForModule('fim', eventType);

    // Update rule based on event type
    switch (eventType) {
      case 'added':
        alert.rule = { ...IntegrityMonitoring.regulatory[0] };
        break;
      case 'modified':
        alert.rule = { ...IntegrityMonitoring.regulatory[1] };
        break;
      case 'deleted':
        alert.rule = { ...IntegrityMonitoring.regulatory[2] };
        break;
    }
    alert.wazuh.integration.decoders = ['syscheck', 'fim'];
    alert.rule.firedtimes = Random.number(1, 10);
  }

  if (params.virustotal) {
    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.MALWARE],
      type: [EVENT_TYPES.INFO],
      outcome: EVENT_OUTCOMES.UNKNOWN,
      module: 'virustotal',
      severity: 7,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = getDecodersForModule('virustotal');
    alert.wazuh.rules = getRulesForModule('virustotal');
    alert.wazuh.integration.decoders.push('virustotal');

    alert.data.virustotal = {};
    alert.data.virustotal.found = Random.arrayItem(['0', '1', '1', '1']);

    alert.data.virustotal.source = {
      sha1: Random.createHash(40),
      file: Random.arrayItem(Virustotal.sourceFile),
      alert_id: `${Random.createHash(10, Random.NUMBERS)}.${Random.createHash(
        7,
        Random.NUMBERS,
      )}`,
      md5: Random.createHash(32),
    };

    if (alert.data.virustotal.found === '1') {
      alert.data.virustotal.malicious = Random.arrayItem(Virustotal.malicious);
      alert.data.virustotal.positives = `${Random.number(0, 65)}`;
      alert.data.virustotal.total =
        alert.data.virustotal.malicious + alert.data.virustotal.positives;

      alert.rule.description = `VirusTotal: Alert - ${alert.data.virustotal.source.file} - ${alert.data.virustotal.positives} engines detected this file`;
      alert.data.virustotal.permalink = Random.arrayItem(Virustotal.permalink);
      alert.data.virustotal.scan_date = new Date(
        Date.parse(alert['@timestamp']) - 4 * 60000,
      );

      // Message for malicious file
      alert.message = `VirusTotal: Malicious file detected - ${alert.data.virustotal.source.file} (${alert.data.virustotal.positives} engines)`;
    } else {
      alert.data.virustotal.malicious = '0';
      alert.rule.description =
        'VirusTotal: Alert - No records in VirusTotal database';
      alert.message = `VirusTotal: No records found for ${alert.data.virustotal.source.file}`;
    }

    // Log
    alert.log = generateLog({
      level: alert.data.virustotal.found === '1' ? 'warning' : 'info',
      filePath: '/var/ossec/logs/ossec.log',
      originFile: 'virustotal',
    });
  }

  if (params.vulnerabilities) {
    const dataVulnerability = Random.arrayItem(Vulnerability.data);

    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.VULNERABILITY],
      type: [EVENT_TYPES.INFO],
      outcome: EVENT_OUTCOMES.SUCCESS,
      module: 'vulnerability-detector',
      severity:
        dataVulnerability.data.vulnerability.severity === 'Critical'
          ? 9
          : dataVulnerability.data.vulnerability.severity === 'High'
          ? 7
          : 5,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = ['json', 'vulnerability-detector'];
    alert.wazuh.rules = getRulesForModule('vulnerability');

    alert.rule = {
      ...dataVulnerability.rule,
      mail: false,
      groups: ['vulnerability-detector'],
      gdpr: ['IV_35.7.d'],
      pci_dss: ['11.2.1', '11.2.3'],
      tsc: ['CC7.1', 'CC7.2'],
    };
    alert.data = {
      ...dataVulnerability.data,
    };

    // Vulnerability field
    alert.vulnerability = {
      id: dataVulnerability.data.vulnerability.cve,
      severity: dataVulnerability.data.vulnerability.severity.toLowerCase(),
      score: {
        base: parseFloat(
          dataVulnerability.data.vulnerability.cvss?.cvss2?.base_score || 5.0,
        ),
      },
    };

    // Message
    alert.message = `Vulnerability: ${dataVulnerability.data.vulnerability.cve} found in ${dataVulnerability.data.vulnerability.package.name}`;

    // Log
    alert.log = generateLog({
      level: 'warning',
      filePath: '/var/ossec/logs/ossec.log',
      originFile: 'vulnerability-detector',
    });
  }

  // Regulatory compliance
  if (
    params.pci_dss ||
    params.regulatory_compliance ||
    (params.random_probability_regulatory_compliance &&
      Random.probability(params.random_probability_regulatory_compliance))
  ) {
    alert.rule.pci_dss = [Random.arrayItem(PCI_DSS)];
  }
  if (
    params.gdpr ||
    params.regulatory_compliance ||
    (params.random_probability_regulatory_compliance &&
      Random.probability(params.random_probability_regulatory_compliance))
  ) {
    alert.rule.gdpr = [Random.arrayItem(GDPR)];
  }
  if (
    params.gpg13 ||
    params.regulatory_compliance ||
    (params.random_probability_regulatory_compliance &&
      Random.probability(params.random_probability_regulatory_compliance))
  ) {
    alert.rule.gpg13 = [Random.arrayItem(GPG13)];
  }
  if (
    params.hipaa ||
    params.regulatory_compliance ||
    (params.random_probability_regulatory_compliance &&
      Random.probability(params.random_probability_regulatory_compliance))
  ) {
    alert.rule.hipaa = [Random.arrayItem(HIPAA)];
  }
  if (
    params.nist_800_83 ||
    params.regulatory_compliance ||
    (params.random_probability_regulatory_compliance &&
      Random.probability(params.random_probability_regulatory_compliance))
  ) {
    alert.rule.nist_800_53 = [Random.arrayItem(NIST_800_53)];
  }

  if (params.authentication) {
    // Select authentication event type
    const typeAlert = Random.arrayItem([
      'invalidLoginPassword',
      'invalidLoginUser',
      'multipleAuthenticationFailures',
      'windowsInvalidLoginPassword',
      'userLoginFailed',
      'passwordCheckFailed',
      'nonExistentUser',
      'bruteForceTryingAccessSystem',
      'authenticationSuccess',
      'maximumAuthenticationAttemptsExceeded',
    ]);

    // Determine if authentication was successful
    const isSuccess = typeAlert === 'authenticationSuccess';
    const isBruteForce =
      typeAlert === 'multipleAuthenticationFailures' ||
      typeAlert === 'bruteForceTryingAccessSystem' ||
      typeAlert === 'maximumAuthenticationAttemptsExceeded';

    // Generate user information
    const userName = Random.arrayItem(USERS);
    alert.user = generateUser({
      name: userName,
      id: String(Random.number(0, 1000)),
    });

    // Generate source network information
    const sourceGeo = Random.arrayItem(GEO_LOCATION);
    const sourceAs = Random.arrayItem(AS_DATA);
    const sourceIp = Random.arrayItem(IPs);
    const sourcePort = parseInt(Random.arrayItem(PORTS), 10);

    alert.source = generateNetworkEndpoint({
      ip: sourceIp,
      port: sourcePort,
      geo: sourceGeo,
      as: sourceAs,
    });

    // Generate destination (target system - the agent)
    alert.destination = generateNetworkEndpoint({
      ip: alert.agent.host.ip[0],
      port: 22, // SSH port
    });

    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.AUTHENTICATION],
      type: isSuccess ? [EVENT_TYPES.START] : [EVENT_TYPES.DENIED],
      action: isSuccess ? 'ssh-login-success' : 'ssh-login-failure',
      outcome: isSuccess ? EVENT_OUTCOMES.SUCCESS : EVENT_OUTCOMES.FAILURE,
      module: 'authentication',
      severity: isBruteForce ? 8 : isSuccess ? 3 : 5,
    });

    // Log information
    alert.log = generateLog({
      level: isSuccess ? 'info' : 'warning',
      filePath: '/var/log/auth.log',
      originFile: 'sshd',
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = getDecodersForModule('authentication');
    alert.wazuh.rules = getRulesForModule(
      'authentication',
      isSuccess ? 'success' : 'failure',
    );

    switch (typeAlert) {
      case 'invalidLoginPassword': {
        alert.rule = { ...Authentication.invalidLoginPassword.rule };
        alert.wazuh.integration.decoders = [
          ...Authentication.invalidLoginPassword.wazuh.integration.decoders,
        ];
        alert.message = generateMessage({
          action: 'Invalid password for SSH login',
          user: userName,
          sourceIp: sourceIp,
        });
        break;
      }
      case 'invalidLoginUser': {
        alert.rule = { ...Authentication.invalidLoginUser.rule };
        alert.wazuh.integration.decoders = [...Authentication.invalidLoginUser.wazuh.integration.decoders];
        alert.message = generateMessage({
          action: 'Invalid user for SSH login',
          user: userName,
          sourceIp: sourceIp,
        });
        break;
      }
      case 'multipleAuthenticationFailures': {
        alert.rule = { ...Authentication.multipleAuthenticationFailures.rule };
        alert.wazuh.integration.decoders = [
          ...Authentication.multipleAuthenticationFailures.wazuh.integration.decoders,
        ];
        alert.rule.frequency = Random.number(5, 50);
        alert.message = generateMessage({
          action: 'Multiple authentication failures detected',
          user: userName,
          sourceIp: sourceIp,
        });
        break;
      }
      case 'windowsInvalidLoginPassword': {
        alert.rule = { ...Authentication.windowsInvalidLoginPassword.rule };
        alert.wazuh.integration.decoders = [
          ...Authentication.windowsInvalidLoginPassword.wazuh.integration.decoders,
        ];
        alert.rule.frequency = Random.number(5, 50);
        // Windows event data
        alert.data = {
          win: {
            ...Authentication.windowsInvalidLoginPassword.data_win,
          },
        };
        alert.data.win.eventdata.ipAddress = sourceIp;
        alert.data.win.eventdata.ipPort = String(sourcePort);
        alert.data.win.system.computer = Random.arrayItem(WIN_HOSTNAMES);
        alert.data.win.system.eventID = `${Random.number(1, 600)}`;
        alert.data.win.system.eventRecordID = `${Random.number(10000, 50000)}`;
        alert.data.win.system.processID = `${Random.number(1, 1200)}`;
        alert.data.win.system.systemTime = alert['@timestamp'];
        alert.data.win.system.task = `${Random.number(1, 1800)}`;
        alert.data.win.system.threadID = `${Random.number(1, 500)}`;
        alert.message = generateMessage({
          action: 'Windows invalid password',
          user: userName,
          sourceIp: sourceIp,
        });
        break;
      }
      case 'userLoginFailed': {
        alert.rule = { ...Authentication.userLoginFailed.rule };
        alert.wazuh.integration.decoders = [...Authentication.userLoginFailed.wazuh.integration.decoders];
        alert.message = generateMessage({
          action: 'User login failed',
          user: userName,
          sourceIp: sourceIp,
        });
        break;
      }
      case 'passwordCheckFailed': {
        alert.rule = { ...Authentication.passwordCheckFailed.rule };
        alert.wazuh.integration.decoders = [...Authentication.passwordCheckFailed.wazuh.integration.decoders];
        alert.message = generateMessage({
          action: 'Password check failed',
          user: userName,
        });
        break;
      }
      case 'nonExistentUser': {
        alert.rule = { ...Authentication.nonExistentUser.rule };
        alert.wazuh.integration.decoders = [...Authentication.nonExistentUser.wazuh.integration.decoders];
        alert.message = generateMessage({
          action: 'Attempt to login with non-existent user',
          user: userName,
          sourceIp: sourceIp,
        });
        break;
      }
      case 'bruteForceTryingAccessSystem': {
        alert.rule = { ...Authentication.bruteForceTryingAccessSystem.rule };
        alert.wazuh.integration.decoders = [
          ...Authentication.bruteForceTryingAccessSystem.wazuh.integration.decoders,
        ];
        alert.message = generateMessage({
          action: 'Brute force attack detected',
          user: userName,
          sourceIp: sourceIp,
        });
        break;
      }
      case 'reverseLoockupError': {
        alert.rule = { ...Authentication.reverseLoockupError.rule };
        alert.wazuh.integration.decoders = [...Authentication.reverseLoockupError.wazuh.integration.decoders];
        alert.message = generateMessage({
          action: 'Reverse DNS lookup error',
          sourceIp: sourceIp,
        });
        break;
      }
      case 'insecureConnectionAttempt': {
        alert.rule = { ...Authentication.insecureConnectionAttempt.rule };
        alert.wazuh.integration.decoders = [
          ...Authentication.insecureConnectionAttempt.wazuh.integration.decoders,
        ];
        alert.message = generateMessage({
          action: 'Insecure connection attempt',
          sourceIp: sourceIp,
        });
        break;
      }
      case 'authenticationSuccess':
        {
          alert.rule = { ...Authentication.authenticationSuccess.rule };
          alert.wazuh.integration.decoders = [
            ...Authentication.authenticationSuccess.wazuh.integration.decoders,
          ];
          alert.message = generateMessage({
            action: 'SSH authentication successful',
            user: userName,
            sourceIp: sourceIp,
          });
        }
        break;
      case 'maximumAuthenticationAttemptsExceeded':
        {
          alert.rule = {
            ...Authentication.maximumAuthenticationAttemptsExceeded.rule,
          };
          alert.wazuh.integration.decoders = [
            ...Authentication.maximumAuthenticationAttemptsExceeded.wazuh.integration.decoders,
          ];
          alert.message = generateMessage({
            action: 'Maximum authentication attempts exceeded',
            user: userName,
            sourceIp: sourceIp,
          });
        }
        break;
      default: {
        /* empty */
      }
    }
    alert.rule.firedtimes = Random.number(2, 15);
    alert.rule.tsc = [Random.arrayItem(tsc)];
  }

  if (params.ssh) {
    const userName = Random.arrayItem(USERS);
    const sourceGeo = Random.arrayItem(GEO_LOCATION);
    const sourceAs = Random.arrayItem(AS_DATA);
    const sourceIp = Random.arrayItem(IPs);
    const sourcePort = parseInt(Random.arrayItem(PORTS), 10);

    // Generate user information
    alert.user = generateUser({
      name: userName,
      id: String(Random.number(0, 1000)),
    });

    // Generate source network information
    alert.source = generateNetworkEndpoint({
      ip: sourceIp,
      port: sourcePort,
      geo: sourceGeo,
      as: sourceAs,
    });

    // Generate destination
    alert.destination = generateNetworkEndpoint({
      ip: alert.agent.host.ip[0],
      port: 22,
    });

    // Update event categorization
    const typeAlert = Random.arrayItem(SSH.data);
    const isSuccess =
      typeAlert.rule.id === '5715' || typeAlert.rule.id === '5710';

    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.AUTHENTICATION],
      type: isSuccess ? [EVENT_TYPES.START] : [EVENT_TYPES.DENIED],
      action: isSuccess ? 'ssh-login' : 'ssh-login-failed',
      outcome: isSuccess ? EVENT_OUTCOMES.SUCCESS : EVENT_OUTCOMES.FAILURE,
      module: 'ssh',
      severity: isSuccess ? 3 : 5,
    });

    // Log information
    alert.log = generateLog({
      level: isSuccess ? 'info' : 'warning',
      filePath: '/var/log/auth.log',
      originFile: 'sshd',
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = ['sshd'];
    alert.wazuh.rules = [typeAlert.rule.id];

    // Set rule
    alert.rule = { ...typeAlert.rule };
    alert.wazuh.integration.decoders = [...typeAlert.wazuh.integration.decoders];
    alert.rule.firedtimes = Random.number(1, 15);

    // Generate message
    alert.message = generateMessage({
      action: typeAlert.rule.description || 'SSH event',
      user: userName,
      sourceIp: sourceIp,
    });
  }

  if (params.windows) {
    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.CONFIGURATION],
      type: [EVENT_TYPES.CHANGE],
      outcome: EVENT_OUTCOMES.SUCCESS,
      module: 'windows',
      severity: 3,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = ['windows_eventchannel'];
    alert.wazuh.rules = getRulesForModule('windows', 'service');
    alert.wazuh.integration.decoders.push('windows');

    if (params.windows.service_control_manager) {
      alert.data = {
        extra_data: 'Service Control Manager',
        dstuser: 'SYSTEM',
        system_name: Random.arrayItem(WIN_HOSTNAMES),
        id: '7040',
        type: 'type',
        status: 'INFORMATION',
      };
      alert.rule.description = 'Windows: Service startup type was changed.';
      alert.rule.firedtimes = Random.number(1, 20);
      alert.rule.mail = false;
      alert.rule.level = 3;
      alert.wazuh.integration.decoders.push('windows', 'policy_changed');
      alert.rule.pci = ['10.6'];
      alert.rule.hipaa = ['164.312.b'];
      alert.rule.gdpr = ['IV_35.7.d'];
      alert.rule.nist_800_53 = ['AU.6'];
      alert.rule.info = 'This does not appear to be logged on Windows 2000.';

      // Message
      alert.message = 'Windows: Service startup type was changed';

      // Log
      alert.log = generateLog({
        level: 'info',
        filePath: 'WinEvtLog',
        originFile: 'windows',
      });
    }
  }

  if (params.apache) {
    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.WEB],
      type: [EVENT_TYPES.ERROR],
      outcome: EVENT_OUTCOMES.FAILURE,
      module: 'apache',
      severity: 5,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = getDecodersForModule('apache');
    alert.wazuh.rules = getRulesForModule('apache');

    const typeAlert = { ...Apache.data[0] };
    const sourceIp = Random.arrayItem(IPs);
    const sourcePort = parseInt(Random.arrayItem(PORTS), 10);
    const sourceGeo = Random.arrayItem(GEO_LOCATION);

    alert.data = {
      srcip: sourceIp,
      srcport: String(sourcePort),
      id: `AH${Random.number(10000, 99999)}`,
    };

    // Source
    alert.source = generateNetworkEndpoint({
      ip: sourceIp,
      port: sourcePort,
      geo: sourceGeo,
    });

    alert.rule = { ...typeAlert.rule };
    alert.rule.firedtimes = Random.number(2, 10);

    // Message
    alert.message = `Apache: ${typeAlert.rule.description}`;

    // Log
    alert.log = generateLog({
      level: 'error',
      filePath: Apache.location,
      originFile: 'apache',
    });
  }

  if (params.web) {
    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.WEB],
      type: [EVENT_TYPES.ACCESS],
      outcome: EVENT_OUTCOMES.FAILURE,
      module: 'web',
      severity: 5,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = getDecodersForModule('web');
    alert.wazuh.rules = getRulesForModule('web');

    const sourceIp = Random.arrayItem(IPs);
    const sourceGeo = Random.arrayItem(GEO_LOCATION);
    const urlPath = Random.arrayItem(Web.urls);
    const statusCode = parseInt(Random.arrayItem(['404', '403', '500', '401']));

    alert.data = {
      protocol: 'GET',
      srcip: sourceIp,
      id: String(statusCode),
      url: urlPath,
    };

    // Source
    alert.source = generateNetworkEndpoint({
      ip: sourceIp,
      geo: sourceGeo,
    });

    // HTTP and URL fields
    alert.http = {
      request: {
        method: 'GET',
      },
      response: {
        status_code: statusCode,
      },
    };

    alert.url = {
      path: urlPath,
      domain: Random.arrayItem(DOMAINS),
    };

    const typeAlert = Random.arrayItem(Web.data);
    const userAgent = Random.arrayItem(Web.userAgents);
    alert.rule = { ...typeAlert.rule };
    alert.rule.firedtimes = Random.number(1, 10);

    // User agent
    alert.user_agent = {
      original: userAgent,
    };

    // Message
    alert.message = `Web: ${typeAlert.rule.description} from ${sourceIp} (${statusCode})`;

    // Log
    alert.log = generateLog({
      level: 'warning',
      filePath: typeAlert.location,
      originFile: 'web-access',
    });
  }

  if (params.github) {
    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.WEB],
      type: [EVENT_TYPES.CHANGE],
      outcome: EVENT_OUTCOMES.SUCCESS,
      module: 'github',
      severity: 3,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = getDecodersForModule('github');
    alert.wazuh.rules = getRulesForModule('github');
    const alertType = Random.arrayItem(GitHub.ALERT_TYPES);
    const actor = Random.arrayItem(GitHub.ACTORS);
    alert.data = {
      github: { ...alertType.data.github },
    };
    alert.data.github.org = Random.arrayItem(GitHub.ORGANIZATION_NAMES);
    alert.data.github.repo &&
      (alert.data.github.repo = `${alert.data.github.org}/${Random.arrayItem(
        GitHub.REPOSITORY_NAMES,
      )}`);
    alert.data.github.repository &&
      (alert.data.github.repository = `${
        alert.data.github.org
      }/${Random.arrayItem(GitHub.REPOSITORY_NAMES)}`);
    alert.data.github.actor = actor.name;
    alert.data.github.actor_location &&
      alert.data.github.actor_location.country_code &&
      (alert.data.github.actor_location.country_code = actor.country_code);
    alert.data.github.user &&
      (alert.data.github.user = Random.arrayItem(GitHub.USER_NAMES));
    alert.data.github.config &&
      alert.data.github.config.url &&
      (alert.data.github.config.url = Random.arrayItem(
        GitHub.SERVER_ADDRESS_WEBHOOK,
      ));
    alert.data.github['@timestamp'] = alert['@timestamp'];
    alert.data.github.created_at &&
      (alert.data.github.created_at = alert['@timestamp']);
    alert.rule = {
      ...alertType.rule,
    };

    // Message
    alert.message = `GitHub: ${alertType.data.github.action} by ${alert.data.github.actor}`;

    // Log
    alert.log = generateLog({
      level: 'info',
      filePath: GitHub.LOCATION,
      originFile: 'github',
    });
  }

  if (params.yara) {
    // Update event categorization
    alert.event = generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.MALWARE],
      type: [EVENT_TYPES.INFO],
      outcome: EVENT_OUTCOMES.SUCCESS,
      module: 'yara',
      severity: 8,
    });

    // Update wazuh fields
    alert.wazuh.integration.decoders = ['YARA_decoder'];
    alert.wazuh.rules = getRulesForModule('yara', 'detected');

    const yaraAlert = Yara.createAlert();
    alert.data = { ...alert.data, ...(yaraAlert.data || {}) };
    if (yaraAlert.rule) {
      alert.rule = { ...alert.rule, ...yaraAlert.rule };
    }
    if (yaraAlert.location) {
      alert.data.location = yaraAlert.location;
    }

    // Message
    alert.message = `YARA: Malware signature detected`;

    // Log
    alert.log = generateLog({
      level: 'critical',
      filePath: '/var/ossec/logs/ossec.log',
      originFile: 'yara',
    });
  }

  // Ensure @sampledata marker is set
  alert['@sampledata'] = true;

  return alert;
}

/**
 * Generate random alerts
 * @param {*} params
 * @param {number} numAlerts - Define number of alerts
 * @return {*} - Random generated alerts defined with params
 */
function generateAlerts(params, numAlerts = 1) {
  /** @type {import('./types').Alert[]} */
  const alerts = [];
  for (let i = 0; i < numAlerts; i++) {
    alerts.push(generateAlert(params));
  }
  return alerts;
}

module.exports = { generateAlert, generateAlerts };
