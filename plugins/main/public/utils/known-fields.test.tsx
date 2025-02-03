import React from 'react';
import { threatHuntingColumns } from '../components/common/wazuh-discover/config/data-grid-columns';
import { vulnerabilitiesColumns } from '../components/overview/vulnerabilities/events/vulnerabilities-columns';
import { dockerColumns } from '../components/overview/docker/events/docker-columns';
import { googleCloudColumns } from '../components/overview/google-cloud/events/google-cloud-columns';
import { amazonWebServicesColumns } from '../components/overview/amazon-web-services/events/amazon-web-services-columns';
import { office365Columns } from '../components/overview/office/events/office-365-columns';
import { fileIntegrityMonitoringColumns } from '../components/overview/fim/events/file-integrity-monitoring-columns';
import { configurationAssessmentColumns } from '../components/agents/sca/events/configuration-assessment-columns';
import { pciColumns } from '../components/overview/pci/events/pci-columns';
import { hipaaColumns } from '../components/overview/hipaa/events/hipaa-columns';
import { nistColumns } from '../components/overview/nist/events/nist-columns';
import { gdprColumns } from '../components/overview/gdpr/events/gdpr-columns';
import { tscColumns } from '../components/overview/tsc/events/tsc-columns';
import { githubColumns } from '../components/overview/github/events/github-columns';
import { mitreAttackColumns } from '../components/overview/mitre/events/mitre-attack-columns';
import { malwareDetectionColumns } from '../components/overview/malware-detection/events/malware-detection-columns';
import { commonColumns } from '../components/overview/common/data-grid-columns';
import { KnownFields } from './known-fields';
import {
  agentTechniquesColumns,
  techniquesColumns,
} from '../components/overview/mitre/framework/components/techniques/components/flyout-technique/flyout-technique-columns';
import { FieldsStatistics } from './statistics-fields';
import { FieldsMonitoring } from './monitoring-fields';
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
  ...pciColumns,
  ...hipaaColumns,
  ...nistColumns,
  ...gdprColumns,
  ...tscColumns,
  ...githubColumns,
  ...mitreAttackColumns,
  ...malwareDetectionColumns,
];

test('All events columns in KnowFields', () => {
  expect(compareColumnsValue(KnownFields, eventsColumns)).toBe(true);
});

test('All technique columns in KnowFields', () => {
  expect(
    compareColumnsValue(KnownFields, [
      ...agentTechniquesColumns,
      ...techniquesColumns,
    ]),
  ).toBe(true);
});

test('All commons columns in KnowFields', () => {
  expect(
    compareColumnsValue(
      KnownFields,
      Object.keys(commonColumns).map(key => ({ id: key })),
    ),
  ).toBe(true);
});

test('All fields on statistics in KnowFields', () => {
  expect(compareColumnsValue(KnownFields, FieldsStatistics)).toBe(true);
});

test('All fields on monitoring in KnowFields', () => {
  expect(compareColumnsValue(KnownFields, FieldsMonitoring)).toBe(true);
});
