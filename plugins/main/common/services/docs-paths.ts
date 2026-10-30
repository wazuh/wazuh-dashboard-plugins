/*
 * Wazuh app - Documentation paths of the modules
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * Central map of the pages of the documentation that each module links, from the Help menu
 * (`docsUrl` of the application) and from the "Learn more" link of its About flyout. Paths are
 * relative to the documentation of the version. Build the URL with `webDocumentationLink`.
 */
export const DOCS_PATHS = {
  fileIntegrityMonitoring: 'user-manual/capabilities/file-integrity/index.html',
  fileIntegrityMonitoringConfigure:
    'user-manual/capabilities/file-integrity/how-to-configure-fim.html',
  threatHunting: 'user-manual/capabilities/log-data-collection/index.html',
  vulnerabilityDetection:
    'user-manual/capabilities/vulnerability-detection/index.html',
  mitreAttack: 'user-manual/data-analysis/rules.html#data-analysis-rules-mitre',
  caseManagement: 'user-manual/capabilities/case-management/index.html',
  malwareDetection: 'user-manual/capabilities/malware-detection/index.html',
  configurationAssessment:
    'user-manual/capabilities/sec-config-assessment/index.html',
  itHygiene: 'user-manual/capabilities/system-inventory/index.html',
  itHygieneFields:
    'user-manual/capabilities/system-inventory/available-inventory-fields.html',
  itHygieneConfigure:
    'user-manual/capabilities/system-inventory/configuration.html',
  incidentResponse: 'user-manual/capabilities/active-response/index.html',
  regulatoryCompliance: 'compliance/index.html',
  pciDss: 'compliance/pci-dss/index.html',
  hipaa: 'compliance/hipaa/index.html',
  nist80053: 'compliance/nist/index.html',
  gdpr: 'compliance/gdpr/index.html',
  tsc: 'compliance/tsc/index.html',
  docker: 'user-manual/capabilities/container-security/monitoring-docker.html',
  amazonWebServices: 'cloud-security/amazon/index.html',
  googleCloud: 'cloud-security/gcp/index.html',
  github: 'cloud-security/github/index.html',
  office365: 'cloud-security/office365/index.html',
  microsoftGraphApi: 'cloud-security/azure/index.html',
  centralizedConfiguration:
    'user-manual/reference/centralized-configuration.html',
  apiRbac: 'user-manual/user-administration/rbac.html',
  indexerSecurityRoles: 'user-manual/wazuh-indexer/security.html#roles',
} as const;

export type DocsPathKey = keyof typeof DOCS_PATHS;
