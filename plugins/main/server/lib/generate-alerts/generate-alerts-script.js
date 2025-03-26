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
const IntegrityMonitoring = require('./sample-data/integrity-monitoring');
const CISCAT = require('./sample-data/ciscat');
const GCP = require('./sample-data/gcp');
const Docker = require('./sample-data/docker');
const Mitre = require('./sample-data/mitre');
const Osquery = require('./sample-data/osquery');
const OpenSCAP = require('./sample-data/openscap');
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
  WAZUH_SETTING_ALERTS_SAMPLE_PREFIX,
} = require('../../../common/constants');
const { generateSampleData } = require('../sample-data');

/**
 * Generate a alert
 * @param {import('./types').Params} params
 * @returns {import('./types').SampleAlert}
 **/
function generateAlert(params) {
  /** @type {import('./types').Alert} */
  let alert = {
    timestamp: '2020-01-27T11:08:47.777+0000',
    rule: {
      level: 3,
      description: 'Sample alert',
      id: '5502',
      mail: false,
      groups: [],
    },
    agent: {
      id: '000',
      name: 'master',
    },
    manager: {
      name: 'master',
    },
    cluster: {
      name: 'wazuh',
    },
    id: '1580123327.49031',
    predecoder: {},
    decoder: {},
    data: {},
    location: '',
  };
  alert.agent = Random.arrayItem(AGENTS);
  alert.rule.description = Random.arrayItem(RULE_DESCRIPTION);
  alert.rule.id = `${Random.number(1, ALERT_ID_MAX)}`;
  alert.rule.level = Random.number(1, RULE_MAX_LEVEL);

  alert.timestamp = DateFormatter.format(
    Random.date(),
    DateFormatter.DATE_FORMAT.ISO_TIMESTAMP,
  );

  if (params.manager) {
    if (params.manager.name) {
      alert.manager.name = params.manager.name;
    }
  }

  if (params.cluster) {
    if (params.cluster.name) {
      alert.cluster.name = params.cluster.name;
    }
    if (params.cluster.node) {
      alert.cluster.node = params.cluster.node;
    }
  }

  if (params.aws) {
    const randomType = Random.arrayItem([
      'guarddutyPortProbe',
      'apiCall',
      'networkConnection',
      'iamPolicyGrantGlobal',
    ]);

    const beforeDate = new Date(
      new Date(alert.timestamp).getTime() - 3 * 24 * 60 * 60 * 1000,
    );
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
          new Date(alert.timestamp),
          DateFormatter.DATE_FORMAT.ISO_FULL,
        );
        alert.data.aws.service.action.portProbeAction.portProbeDetails.remoteIpDetails =
          {
            ...Random.arrayItem(AWS.remoteIpDetails),
          };
        alert.data.aws.log_info = {
          s3bucket: Random.arrayItem(AWS.buckets),
          log_file: `guardduty/${DateFormatter.format(
            new Date(alert.timestamp),
            DateFormatter.DATE_FORMAT.SHORT_DATE_TIME_SLASH,
          )}/firehose_guardduty-1-${DateFormatter.format(
            new Date(alert.timestamp),
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

        alert.decoder = { ...typeAlert.decoder };
        alert.location = typeAlert.location;
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
            new Date(alert.timestamp),
            DateFormatter.DATE_FORMAT.SHORT_DATE_TIME_SLASH,
          )}/firehose_guardduty-1-${DateFormatter.format(
            new Date(alert.timestamp),
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
          new Date(alert.timestamp),
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

        alert.decoder = { ...typeAlert.decoder };
        alert.location = typeAlert.location;
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
            new Date(alert.timestamp),
            DateFormatter.DATE_FORMAT.SHORT_DATE_TIME_SLASH,
          )}/firehose_guardduty-1-${DateFormatter.format(
            new Date(alert.timestamp),
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
          new Date(alert.timestamp),
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

        alert.decoder = { ...typeAlert.decoder };
        alert.location = typeAlert.location;
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
            new Date(alert.timestamp),
            DateFormatter.DATE_FORMAT.SHORT_DATE_TIME_SLASH,
          )}/firehose_macie-1-${DateFormatter.format(
            new Date(alert.timestamp),
            DateFormatter.DATE_FORMAT.COMPACT_DATE_TIME_HYPHENATED,
          )}-0b1ede94-f399-4e54-8815-1c6587eee3b1//firehose_guardduty-1-${DateFormatter.format(
            new Date(alert.timestamp),
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

        alert.decoder = { ...typeAlert.decoder };
        alert.location = typeAlert.location;
        break;
      }
      default: {
        /* empty */
      }
    }
    alert.input = { type: 'log' };
    alert.GeoLocation = Random.arrayItem(GEO_LOCATION);
  }

  if (params.office) {
    alert.agent = {
      id: '000',
      ip: alert.agent.ip,
      name: alert.agent.name,
    };

    if (params.manager && params.manager.name) {
      alert.agent.name = params.manager.name;
    }

    const beforeDate = new Date(
      new Date(alert.timestamp).getTime() - 3 * 24 * 60 * 60 * 1000,
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

    alert.agent.id = '000';
    alert.rule = ruleData.rule;
    alert.decoder = Random.arrayItem(Office.arrayDecoderOffice);
    alert.GeoLocation = Random.arrayItem(GEO_LOCATION);
    alert.data.integration = 'Office365';
    alert.location = Office.arrayLocationOffice;
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
      ClientIP: Random.arrayItem(Office.arrayIp),
    };
  }

  if (params.gcp) {
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

    alert.GeoLocation = Random.arrayItem(GEO_LOCATION);
  }

  if (params.audit) {
    const dataAudit = Random.arrayItem(Audit.dataAudit);
    alert.data = dataAudit.data;
    alert.data.audit.file
      ? alert.data.audit.file.name === ''
        ? (alert.data.audit.file.name = Random.arrayItem(Audit.fileName))
        : null
      : null;
    alert.rule = dataAudit.rule;
  }

  if (params.ciscat) {
    alert.rule.groups.push('ciscat');
    alert.data.cis = {};

    alert.data.cis.group = Random.arrayItem(CISCAT.group);
    alert.data.cis.fail = Random.number(0, 100);
    alert.data.cis.rule_title = Random.arrayItem(CISCAT.ruleTitle);
    alert.data.cis.notchecked = Random.number(0, 100);
    alert.data.cis.score = Random.number(0, 100);
    alert.data.cis.pass = Random.number(0, 100);
    alert.data.cis.timestamp = new Date(Random.date());
    alert.data.cis.error = Random.number(0, 1);
    alert.data.cis.benchmark = Random.arrayItem(CISCAT.benchmark);
    alert.data.cis.unknown = Random.number(0, 100);
    alert.data.cis.notchecked = Random.number(0, 5);
    alert.data.cis.result = Random.arrayItem(CISCAT.result);
  }

  if (params.docker) {
    const dataDocker = Random.arrayItem(Docker.dataDocker);
    alert.data = {};
    alert.data = dataDocker.data;
    alert.rule = dataDocker.rule;
  }

  if (params.mitre) {
    alert.rule = Random.arrayItem(Mitre.arrayMitreRules);
    alert.location = Random.arrayItem(Mitre.arrayLocation);
  }

  if (params.openscap) {
    alert.data = {};
    alert.data.oscap = {};
    const typeAlert = { ...Random.arrayItem(OpenSCAP.data) };
    alert.data = { ...typeAlert.data };
    alert.rule = { ...typeAlert.rule };
    alert.rule.firedtimes = Random.number(2, 10);
    alert.input = {
      type: 'log',
    };
    alert.decoder = { ...OpenSCAP.decoder };
    alert.location = OpenSCAP.location;
    if (typeAlert.full_log) {
      alert.full_log = interpolateAlertProps(typeAlert.full_log, alert);
    }
  }

  if (params.rootcheck) {
    alert.location = PolicyMonitoring.location;
    alert.decoder = { ...PolicyMonitoring.decoder };
    alert.input = {
      type: 'log',
    };

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
        alert.full_log = alert.data.title;
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
        alert.full_log = interpolateAlertProps(
          PolicyMonitoring.trojansData.full_log,
          alert,
          {
            _trojan_signature: trojan.signature,
          },
        );
        break;
      }
      default: {
        /* empty */
      }
    }
  }

  if (params.syscheck) {
    alert.rule.groups.push('syscheck');
    alert.syscheck = {};
    alert.syscheck.event = Random.arrayItem(IntegrityMonitoring.events);
    alert.syscheck.path = Random.arrayItem(
      alert.agent.name === 'Windows'
        ? IntegrityMonitoring.pathsWindows
        : IntegrityMonitoring.pathsLinux,
    );
    alert.syscheck.uname_after = Random.arrayItem(USERS);
    alert.syscheck.gname_after = 'root';
    alert.syscheck.mtime_after = new Date(Random.date());
    alert.syscheck.size_after = Random.number(0, 65);
    alert.syscheck.uid_after = Random.arrayItem(IntegrityMonitoring.uid_after);
    alert.syscheck.gid_after = Random.arrayItem(IntegrityMonitoring.gid_after);
    alert.syscheck.perm_after = 'rw-r--r--';
    alert.syscheck.inode_after = Random.number(0, 100000);
    switch (alert.syscheck.event) {
      case 'added':
        alert.rule = IntegrityMonitoring.regulatory[0];
        break;
      case 'modified':
        alert.rule = IntegrityMonitoring.regulatory[1];
        alert.syscheck.mtime_before = new Date(
          alert.syscheck.mtime_after.getTime() - 1000 * 60,
        );
        alert.syscheck.inode_before = Random.number(0, 100000);
        alert.syscheck.sha1_after = Random.createHash(40);
        alert.syscheck.changed_attributes = [
          Random.arrayItem(IntegrityMonitoring.attributes),
        ];
        alert.syscheck.md5_after = Random.createHash(32);
        alert.syscheck.sha256_after = Random.createHash(64);
        break;
      case 'deleted':
        alert.rule = IntegrityMonitoring.regulatory[2];
        alert.syscheck.tags = [Random.arrayItem(IntegrityMonitoring.tags)];
        alert.syscheck.sha1_after = Random.createHash(40);
        alert.syscheck.audit = {
          process: {
            name: Random.arrayItem(PATHS),
            id: Random.number(0, 100000),
            ppid: Random.number(0, 100000),
          },
          effective_user: {
            name: Random.arrayItem(USERS),
            id: Random.number(0, 100),
          },
          user: {
            name: Random.arrayItem(USERS),
            id: Random.number(0, 100),
          },
          group: {
            name: Random.arrayItem(USERS),
            id: Random.number(0, 100),
          },
        };
        alert.syscheck.md5_after = Random.createHash(32);
        alert.syscheck.sha256_after = Random.createHash(64);
        break;
      default: {
        /* empty */
      }
    }
  }

  if (params.virustotal) {
    alert.rule.groups.push('virustotal');
    alert.location = 'virustotal';
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
      // eslint-disable-next-line max-len
      alert.rule.description = `VirusTotal: Alert - ${alert.data.virustotal.source.file} - ${alert.data.virustotal.positives} engines detected this file`;
      alert.data.virustotal.permalink = Random.arrayItem(Virustotal.permalink);
      alert.data.virustotal.scan_date = new Date(
        Date.parse(alert.timestamp) - 4 * 60000,
      );
    } else {
      alert.data.virustotal.malicious = '0';
      alert.rule.description =
        'VirusTotal: Alert - No records in VirusTotal database';
    }
  }

  if (params.vulnerabilities) {
    const dataVulnerability = Random.arrayItem(Vulnerability.data);
    alert.rule = {
      ...dataVulnerability.rule,
      mail: false,
      groups: ['vulnerability-detector'],
      gdpr: ['IV_35.7.d'],
      pci_dss: ['11.2.1', '11.2.3'],
      tsc: ['CC7.1', 'CC7.2'],
    };
    alert.location = 'vulnerability-detector';
    alert.decoder = DECODER.JSON;
    alert.data = {
      ...dataVulnerability.data,
    };
  }

  if (params.osquery) {
    alert.rule.groups.push('osquery');
    alert.data.osquery = {};
    if (Random.number(0, 5) === 0) {
      alert.rule.description = 'osquery error message';
    } else {
      const dataOsquery = Random.arrayItem(Osquery.dataOsquery);
      alert.data.osquery = dataOsquery.osquery;
      alert.data.osquery.calendarTime = alert.timestamp;
      alert.rule.description = dataOsquery.rule.description;
      Random.number(0, 99) === 0
        ? (alert.data.osquery.action = 'removed')
        : null;
    }
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
      Random.number(params.random_probability_regulatory_compliance))
  ) {
    alert.rule.hipaa = [Random.arrayItem(HIPAA)];
  }
  if (
    params.nist_800_83 ||
    params.regulatory_compliance ||
    (params.random_probability_regulatory_compliance &&
      Random.number(params.random_probability_regulatory_compliance))
  ) {
    alert.rule.nist_800_53 = [Random.arrayItem(NIST_800_53)];
  }

  if (params.authentication) {
    alert.data = {
      srcip: Random.arrayItem(IPs),
      srcuser: Random.arrayItem(USERS),
      srcport: Random.arrayItem(PORTS),
    };
    alert.GeoLocation = Random.arrayItem(GEO_LOCATION);
    alert.decoder = DECODER.SSHD;
    alert.input = {
      type: 'log',
    };
    alert.predecoder = {
      program_name: 'sshd',
      timestamp: DateFormatter.format(
        new Date(alert.timestamp),
        DateFormatter.DATE_FORMAT.SHORT_READABLE_FORMAT,
      ),
      hostname: alert.manager.name,
    };
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

    switch (typeAlert) {
      case 'invalidLoginPassword': {
        alert.location = Authentication.invalidLoginPassword.location;
        alert.rule = { ...Authentication.invalidLoginPassword.rule };
        alert.rule.groups = [
          ...Authentication.invalidLoginPassword.rule.groups,
        ];
        alert.full_log = interpolateAlertProps(
          Authentication.invalidLoginPassword.full_log,
          alert,
        );
        break;
      }
      case 'invalidLoginUser': {
        alert.location = Authentication.invalidLoginUser.location;
        alert.rule = { ...Authentication.invalidLoginUser.rule };
        alert.rule.groups = [...Authentication.invalidLoginUser.rule.groups];
        alert.full_log = interpolateAlertProps(
          Authentication.invalidLoginUser.full_log,
          alert,
        );
        break;
      }
      case 'multipleAuthenticationFailures': {
        alert.location = Authentication.multipleAuthenticationFailures.location;
        alert.rule = { ...Authentication.multipleAuthenticationFailures.rule };
        alert.rule.groups = [
          ...Authentication.multipleAuthenticationFailures.rule.groups,
        ];
        alert.rule.frequency = Random.number(5, 50);
        alert.full_log = interpolateAlertProps(
          Authentication.multipleAuthenticationFailures.full_log,
          alert,
        );
        break;
      }
      case 'windowsInvalidLoginPassword': {
        alert.location = Authentication.windowsInvalidLoginPassword.location;
        alert.rule = { ...Authentication.windowsInvalidLoginPassword.rule };
        alert.rule.groups = [
          ...Authentication.windowsInvalidLoginPassword.rule.groups,
        ];
        alert.rule.frequency = Random.number(5, 50);
        alert.data.win = {
          ...Authentication.windowsInvalidLoginPassword.data_win,
        };
        alert.data.win.eventdata.ipAddress = Random.arrayItem(IPs);
        alert.data.win.eventdata.ipPort = Random.arrayItem(PORTS);
        alert.data.win.system.computer = Random.arrayItem(WIN_HOSTNAMES);
        alert.data.win.system.eventID = `${Random.number(1, 600)}`;
        alert.data.win.system.eventRecordID = `${Random.number(10000, 50000)}`;
        alert.data.win.system.processID = `${Random.number(1, 1200)}`;
        alert.data.win.system.systemTime = alert.timestamp;
        alert.data.win.system.processID = `${Random.number(1, 1200)}`;
        alert.data.win.system.task = `${Random.number(1, 1800)}`;
        alert.data.win.system.threadID = `${Random.number(1, 500)}`;
        alert.full_log = interpolateAlertProps(
          Authentication.windowsInvalidLoginPassword.full_log,
          alert,
        );
        break;
      }
      case 'userLoginFailed': {
        alert.location = Authentication.userLoginFailed.location;
        alert.rule = { ...Authentication.userLoginFailed.rule };
        alert.rule.groups = [...Authentication.userLoginFailed.rule.groups];
        alert.data = {
          srcip: Random.arrayItem(IPs),
          dstuser: Random.arrayItem(USERS),
          uid: `${Random.number(0, 50)}`,
          euid: `${Random.number(0, 50)}`,
          tty: 'ssh',
        };
        alert.decoder = { ...Authentication.userLoginFailed.decoder };
        alert.full_log = interpolateAlertProps(
          Authentication.userLoginFailed.full_log,
          alert,
        );
        break;
      }
      case 'passwordCheckFailed': {
        alert.location = Authentication.passwordCheckFailed.location;
        alert.rule = { ...Authentication.passwordCheckFailed.rule };
        alert.rule.groups = [...Authentication.passwordCheckFailed.rule.groups];
        alert.data = {
          srcuser: Random.arrayItem(USERS),
        };
        alert.predecoder.program_name = 'unix_chkpwd';
        alert.decoder = { ...Authentication.passwordCheckFailed.decoder };
        alert.full_log = interpolateAlertProps(
          Authentication.passwordCheckFailed.full_log,
          alert,
        );
        break;
      }
      case 'nonExistentUser': {
        alert.location = Authentication.nonExistentUser.location;
        alert.rule = { ...Authentication.nonExistentUser.rule };
        alert.rule.groups = [...Authentication.nonExistentUser.rule.groups];
        alert.full_log = interpolateAlertProps(
          Authentication.nonExistentUser.full_log,
          alert,
        );
        break;
      }
      case 'bruteForceTryingAccessSystem': {
        alert.location = Authentication.bruteForceTryingAccessSystem.location;
        alert.rule = { ...Authentication.bruteForceTryingAccessSystem.rule };
        alert.rule.groups = [
          ...Authentication.bruteForceTryingAccessSystem.rule.groups,
        ];
        alert.full_log = interpolateAlertProps(
          Authentication.bruteForceTryingAccessSystem.full_log,
          alert,
        );
        break;
      }
      case 'reverseLoockupError': {
        alert.location = Authentication.reverseLoockupError.location;
        alert.rule = { ...Authentication.reverseLoockupError.rule };
        alert.rule.groups = [...Authentication.reverseLoockupError.rule.groups];
        alert.data = {
          srcip: Random.arrayItem(IPs),
        };
        alert.full_log = interpolateAlertProps(
          Authentication.reverseLoockupError.full_log,
          alert,
        );
        break;
      }
      case 'insecureConnectionAttempt': {
        alert.location = Authentication.insecureConnectionAttempt.location;
        alert.rule = { ...Authentication.insecureConnectionAttempt.rule };
        alert.rule.groups = [
          ...Authentication.insecureConnectionAttempt.rule.groups,
        ];
        alert.data = {
          srcip: Random.arrayItem(IPs),
          srcport: Random.arrayItem(PORTS),
        };
        alert.full_log = interpolateAlertProps(
          Authentication.insecureConnectionAttempt.full_log,
          alert,
        );
        break;
      }
      case 'authenticationSuccess':
        {
          alert.location = Authentication.authenticationSuccess.location;
          alert.rule = { ...Authentication.authenticationSuccess.rule };
          alert.rule.groups = [
            ...Authentication.authenticationSuccess.rule.groups,
          ];
          alert.data = {
            srcip: Random.arrayItem(IPs),
            srcport: Random.arrayItem(PORTS),
            dstuser: Random.arrayItem(USERS),
          };
          alert.full_log = interpolateAlertProps(
            Authentication.authenticationSuccess.full_log,
            alert,
          );
        }
        break;
      case 'maximumAuthenticationAttemptsExceeded':
        {
          alert.location =
            Authentication.maximumAuthenticationAttemptsExceeded.location;
          alert.rule = {
            ...Authentication.maximumAuthenticationAttemptsExceeded.rule,
          };
          alert.rule.groups = [
            ...Authentication.maximumAuthenticationAttemptsExceeded.rule.groups,
          ];
          alert.data = {
            srcip: Random.arrayItem(IPs),
            srcport: Random.arrayItem(PORTS),
            dstuser: Random.arrayItem(USERS),
          };
          alert.full_log = interpolateAlertProps(
            Authentication.maximumAuthenticationAttemptsExceeded.full_log,
            alert,
          );
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
    alert.data = {
      srcip: Random.arrayItem(IPs),
      srcuser: Random.arrayItem(USERS),
      srcport: Random.arrayItem(PORTS),
    };
    alert.GeoLocation = Random.arrayItem(GEO_LOCATION);
    alert.decoder = DECODER.SSHD;
    alert.input = {
      type: 'log',
    };
    alert.predecoder = {
      program_name: 'sshd',
      timestamp: DateFormatter.format(
        new Date(alert.timestamp),
        DateFormatter.DATE_FORMAT.SHORT_READABLE_FORMAT,
      ),
      hostname: alert.manager.name,
    };
    const typeAlert = Random.arrayItem(SSH.data);
    alert.location = typeAlert.location;
    alert.rule = { ...typeAlert.rule };
    alert.rule.groups = [...typeAlert.rule.groups];
    alert.rule.firedtimes = Random.number(1, 15);
    alert.full_log = interpolateAlertProps(typeAlert.full_log, alert);
  }

  if (params.windows) {
    alert.rule.groups.push('windows');
    if (params.windows.service_control_manager) {
      alert.predecoder = {
        program_name: 'WinEvtLog',
        timestamp: '2020 Apr 17 05:59:05',
      };
      alert.input = {
        type: 'log',
      };
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
      alert.rule.groups.push('windows', 'policy_changed');
      alert.rule.pci = ['10.6'];
      alert.rule.hipaa = ['164.312.b'];
      alert.rule.gdpr = ['IV_35.7.d'];
      alert.rule.nist_800_53 = ['AU.6'];
      alert.rule.info = 'This does not appear to be logged on Windows 2000.';
      alert.location = 'WinEvtLog';
      alert.decoder = DECODER.WINDOWS;
      alert.full_log = `2020 Apr 17 05:59:05 WinEvtLog: type: INFORMATION(7040): Service Control Manager: SYSTEM: NT AUTHORITY: ${alert.data.system_name}: Background Intelligent Transfer Service auto start demand start BITS `; // TODO: date
      alert.id = '18145';
      alert.fields = {
        timestamp: alert.timestamp,
      };
    }
  }

  if (params.apache) {
    // there is only one type alert in data array at the moment. Randomize if
    // add more type of alerts to data array
    const typeAlert = { ...Apache.data[0] };
    alert.data = {
      srcip: Random.arrayItem(IPs),
      srcport: Random.arrayItem(PORTS),
      id: `AH${Random.number(10000, 99999)}`,
    };
    alert.GeoLocation = { ...Random.arrayItem(GEO_LOCATION) };
    alert.rule = { ...typeAlert.rule };
    alert.rule.firedtimes = Random.number(2, 10);
    alert.input = { type: 'log' };
    alert.location = Apache.location;
    alert.decoder = { ...Apache.decoder };

    alert.full_log = interpolateAlertProps(typeAlert.full_log, alert, {
      _timestamp_apache: DateFormatter.format(
        new Date(alert.timestamp),
        DateFormatter.DATE_FORMAT.READABLE_FORMAT,
      ),
      _pi_id: Random.number(10000, 30000),
    });
  }

  if (params.web) {
    alert.input = {
      type: 'log',
    };
    alert.data = {
      protocol: 'GET',
      srcip: Random.arrayItem(IPs),
      id: '404',
      url: Random.arrayItem(Web.urls),
    };
    alert.GeoLocation = { ...Random.arrayItem(GEO_LOCATION) };

    const typeAlert = Random.arrayItem(Web.data);
    const userAgent = Random.arrayItem(Web.userAgents);
    alert.rule = { ...typeAlert.rule };
    alert.rule.firedtimes = Random.number(1, 10);
    alert.decoder = { ...typeAlert.decoder };
    alert.location = typeAlert.location;
    alert.full_log = interpolateAlertProps(typeAlert.full_log, alert, {
      _user_agent: userAgent,
      _date: DateFormatter.format(
        new Date(alert.timestamp),
        DateFormatter.DATE_FORMAT.ISO_TIMESTAMP,
      ),
    });
    if (typeAlert.previous_output) {
      /** @type {string[]} */
      const previousOutput = [];
      const beforeSeconds = 4;
      for (let i = beforeSeconds; i > 0; i--) {
        const beforeDate = new Date(
          new Date(alert.timestamp).getTime() - (2 + i) * 1000,
        );
        previousOutput.push(
          interpolateAlertProps(typeAlert.full_log, alert, {
            _user_agent: userAgent,
            _date: DateFormatter.format(
              new Date(beforeDate),
              DateFormatter.DATE_FORMAT.ISO_TIMESTAMP,
            ),
          }),
        );
      }
      alert.previous_output = previousOutput.join('\n');
    }
  }

  if (params.github) {
    alert.location = GitHub.LOCATION;
    alert.decoder = GitHub.decoder;
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
    alert.data.github['@timestamp'] = alert.timestamp;
    alert.data.github.created_at &&
      (alert.data.github.created_at = alert.timestamp);
    alert.rule = {
      ...alertType.rule,
    };
  }

  if (params.yara) {
    alert = { ...alert, ...Yara.createAlert() };
  }

  return {
    ...alert,
    ['@sampledata']: true,
    ['@timestamp']: alert.timestamp,
  };
}

/**
 * Generate random alerts
 * @param {*} params
 * @param {number} numAlerts - Define number of alerts
 * @return {*} - Random generated alerts defined with params
 */
function generateAlerts(
  { settingIndexPattern, dataSet, ...params },
  numAlerts = 1,
) {
  /** @type {import('./types').Alert[]} */
  const alerts = [];
  console.log(params);
  if (settingIndexPattern === WAZUH_SETTING_ALERTS_SAMPLE_PREFIX) {
    for (let i = 0; i < numAlerts; i++) {
      alerts.push(generateAlert(params));
    }
  } else {
    for (let i = 0; i < numAlerts; i++) {
      alerts.push(generateSampleData(dataSet, params));
    }
  }
  return alerts;
}

module.exports = { generateAlert, generateAlerts };
