import React from 'react';
import { threatHuntingColumns } from '../wazuh-discover/config/data-grid-columns';
import { vulnerabilitiesColumns } from '../../overview/vulnerabilities/events/vulnerabilities-columns';
import { dockerColumns } from '../../overview/docker/events/docker-columns';
import { googleCloudColumns } from '../../overview/google-cloud/events/google-cloud-columns';
import { amazonWebServicesColumns } from '../../overview/amazon-web-services/events/amazon-web-services-columns';
import { office365Columns } from '../../overview/office/events/office-365-columns';
import { fileIntegrityMonitoringColumns } from '../../overview/fim/events/file-integrity-monitoring-columns';
import { configurationAssessmentColumns } from '../../agents/sca/events/configuration-assessment-columns';
import { pciColumns } from '../../overview/pci/events/pci-columns';
import { hipaaColumns } from '../../overview/hipaa/events/hipaa-columns';
import { nistColumns } from '../../overview/nist/events/nist-columns';
import { gdprColumns } from '../../overview/gdpr/events/gdpr-columns';
import { tscColumns } from '../../overview/tsc/events/tsc-columns';
import { githubColumns } from '../../overview/github/events/github-columns';
import { mitreAttackColumns } from '../../overview/mitre/events/mitre-attack-columns';
import { malwareDetectionColumns } from '../../overview/malware-detection/events/malware-detection-columns';
import { KnownFields } from '../../../utils/known-fields';

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

function compareColumnsValue(knownColumns, columnsToCompare) {
  const unmatchedColumns = columnsToCompare.filter(
    column => !knownColumns.some(knowColumn => knowColumn.name === column.id),
  );
  return unmatchedColumns.length === 0
    ? true
    : `This columns doesn't match: ${unmatchedColumns
        .map(column => column.id)
        .join(', ')}`;
}

test('All events columns in KnowFields', () => {
  const result = compareColumnsValue(KnownFields, eventsColumns);
  if (result !== true) {
    console.log(result);
  }
  expect(result).toBe(true);
});
