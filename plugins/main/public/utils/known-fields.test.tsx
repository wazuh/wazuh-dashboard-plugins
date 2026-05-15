import React from 'react';
import { threatHuntingColumns } from '../components/common/wazuh-discover/config/data-grid-columns';
import { vulnerabilitiesColumns } from '../components/overview/vulnerabilities/events/vulnerabilities-columns';
import { dockerColumns } from '../components/overview/docker/events/docker-columns';
import { googleCloudColumns } from '../components/overview/google-cloud/events/google-cloud-columns';
import { amazonWebServicesColumns } from '../components/overview/amazon-web-services/events/amazon-web-services-columns';
import { office365Columns } from '../components/overview/office/events/office-365-columns';
import { fileIntegrityMonitoringColumns } from '../components/overview/fim/events/file-integrity-monitoring-columns';
import { configurationAssessmentColumns } from '../components/overview/sca/events/configuration-assessment-columns';
import { createRegulatoryComplianceColumns } from '../components/overview/regulatory-compliance/shared/create-regulatory-compliance-columns';
import { githubColumns } from '../components/overview/github/events/github-columns';
import { mitreAttackColumns } from '../components/overview/mitre/events/mitre-attack-columns';
import { malwareDetectionColumns } from '../components/overview/malware-detection/events/malware-detection-columns';
import { commonColumns } from '../components/overview/common/data-grid-columns';
import FindingsKnownFields from '../../common/known-fields/findings.json';
import {
  agentTechniquesColumns,
  techniquesColumns,
} from '../components/overview/mitre/framework/components/techniques/components/flyout-technique/flyout-technique-columns';
import { compareColumnsValue } from './functions-to-test';

const eventsColumns = [
  ...threatHuntingColumns,
  ...vulnerabilitiesColumns,
  ...dockerColumns,
  ...googleCloudColumns,
  ...amazonWebServicesColumns,
  ...office365Columns,
  ...fileIntegrityMonitoringColumns,
  ...configurationAssessmentColumns,
  ...createRegulatoryComplianceColumns(
    'wazuh.rule.compliance.pci_dss',
    300,
    240,
  ),
  ...createRegulatoryComplianceColumns('wazuh.rule.compliance.hipaa'),
  ...createRegulatoryComplianceColumns(
    'wazuh.rule.compliance.nist_800_53',
    300,
  ),
  ...createRegulatoryComplianceColumns('wazuh.rule.compliance.gdpr'),
  ...createRegulatoryComplianceColumns('wazuh.rule.compliance.tsc', 260, 240),
  ...githubColumns,
  ...mitreAttackColumns,
  ...malwareDetectionColumns,
];

test.skip('All events columns in KnowFields', () => {
  expect(compareColumnsValue(FindingsKnownFields, eventsColumns)).toBe(true);
});

test.skip('All technique columns in KnowFields', () => {
  expect(
    compareColumnsValue(FindingsKnownFields, [
      ...agentTechniquesColumns,
      ...techniquesColumns,
    ]),
  ).toBe(true);
});

test.skip('All commons columns in KnowFields', () => {
  expect(
    compareColumnsValue(
      FindingsKnownFields,
      Object.keys(commonColumns).map(key => ({ id: key })),
    ),
  ).toBe(true);
});
