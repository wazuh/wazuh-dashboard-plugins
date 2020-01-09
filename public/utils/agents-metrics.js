/*
 * Wazuh app - Hardcoded agents metrics
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Metrics General
const metricsGeneral = {
  totalAlerts: '[vis-id="\'Wazuh-App-Agents-General-Metric-alerts\'"]',
  level12: '[vis-id="\'Wazuh-App-Agents-General-Level-12-alerts\'"]',
  authFailure: '[vis-id="\'Wazuh-App-Agents-General-Authentication-failure\'"]',
  authSuccess: '[vis-id="\'Wazuh-App-Agents-General-Authentication-success\'"]'
};

// Metrics Audit
const metricsAudit = {
  auditNewFiles: '[vis-id="\'Wazuh-App-Agents-Audit-New-files-metric\'"]',
  auditReadFiles: '[vis-id="\'Wazuh-App-Agents-Audit-Read-files-metric\'"]',
  auditModifiedFiles:
    '[vis-id="\'Wazuh-App-Agents-Audit-Modified-files-metric\'"]',
  auditRemovedFiles:
    '[vis-id="\'Wazuh-App-Agents-Audit-Removed-files-metric\'"]'
};

// Metrics Vulnerability Detector
const metricsVulnerability = {
  vulnCritical: '[vis-id="\'Wazuh-App-Agents-vuls-Metric-Critical-severity\'"]',
  vulnHigh: '[vis-id="\'Wazuh-App-Agents-vuls-Metric-High-severity\'"]',
  vulnMedium: '[vis-id="\'Wazuh-App-Agents-vuls-Metric-Medium-severity\'"]',
  vulnLow: '[vis-id="\'Wazuh-App-Agents-vuls-Metric-Low-severity\'"]'
};

// Metrics Scap
const metricsScap = {
  scapLastScore: '[vis-id="\'Wazuh-App-Agents-OSCAP-Last-score\'"]',
  scapHighestScore: '[vis-id="\'Wazuh-App-Agents-OSCAP-Higher-score-metric\'"]',
  scapLowestScore: '[vis-id="\'Wazuh-App-Agents-OSCAP-Lower-score-metric\'"]'
};

// Metrics Mitre
const metricsMitre = {
  mitreMetrics: '[vis-id="\'Wazuh-App-Overview-MITRE\'"]'
};


// Metrics CIS-CAT
const metricsCiscat = {
  ciscatScanNotChecked:
    '[vis-id="\'Wazuh-app-Agents-CISCAT-last-scan-not-checked\'"]',
  ciscatScanScore: '[vis-id="\'Wazuh-app-Agents-CISCAT-last-scan-score\'"]',
  ciscatScanPass: '[vis-id="\'Wazuh-app-Agents-CISCAT-last-scan-pass\'"]',
  ciscatScanFail: '[vis-id="\'Wazuh-app-Agents-CISCAT-last-scan-fail\'"]',
  ciscatScanTimestamp:
    '[vis-id="\'Wazuh-app-Agents-CISCAT-last-scan-timestamp\'"]',
  ciscatScanError: '[vis-id="\'Wazuh-app-Agents-CISCAT-last-scan-error\'"]',
  ciscatScanBenchmark:
    '[vis-id="\'Wazuh-app-Agents-CISCAT-last-scan-benchmark\'"]',
  ciscatScanUnknown: '[vis-id="\'Wazuh-app-Agents-CISCAT-last-scan-unknown\'"]'
};

// Metrics Virustotal
const metricsVirustotal = {
  virusMalicious: '[vis-id="\'Wazuh-App-Agents-Virustotal-Total-Malicious\'"]',
  virusPositives: '[vis-id="\'Wazuh-App-Agents-Virustotal-Total-Positives\'"]',
  virusTotal: '[vis-id="\'Wazuh-App-Agents-Virustotal-Total\'"]'
};

export default {
  metricsGeneral,
  metricsAudit,
  metricsVulnerability,
  metricsScap,
  metricsCiscat,
  metricsVirustotal
};
