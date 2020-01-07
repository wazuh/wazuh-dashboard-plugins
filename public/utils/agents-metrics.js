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
  totalAlerts: '[id="Wazuh-App-Agents-General-Metric-alerts"]',
  level12: '[id="Wazuh-App-Agents-General-Level-12-alerts"]',
  authFailure: '[id="Wazuh-App-Agents-General-Authentication-failure"]',
  authSuccess: '[id="Wazuh-App-Agents-General-Authentication-success"]'
};

// Metrics Audit
const metricsAudit = {
  auditNewFiles: '[id="Wazuh-App-Agents-Audit-New-files-metric"]',
  auditReadFiles: '[id="Wazuh-App-Agents-Audit-Read-files-metric"]',
  auditModifiedFiles:
    '[id="Wazuh-App-Agents-Audit-Modified-files-metric"]',
  auditRemovedFiles:
    '[id="Wazuh-App-Agents-Audit-Removed-files-metric"]'
};

// Metrics Vulnerability Detector
const metricsVulnerability = {
  vulnCritical: '[id="Wazuh-App-Agents-vuls-Metric-Critical-severity"]',
  vulnHigh: '[id="Wazuh-App-Agents-vuls-Metric-High-severity"]',
  vulnMedium: '[id="Wazuh-App-Agents-vuls-Metric-Medium-severity"]',
  vulnLow: '[id="Wazuh-App-Agents-vuls-Metric-Low-severity"]'
};

// Metrics Scap
const metricsScap = {
  scapLastScore: '[id="Wazuh-App-Agents-OSCAP-Last-score"]',
  scapHighestScore: '[id="Wazuh-App-Agents-OSCAP-Higher-score-metric"]',
  scapLowestScore: '[id="Wazuh-App-Agents-OSCAP-Lower-score-metric"]'
};

// Metrics Mitre
const metricsMitre = {
  mitreMetrics: '[id="Wazuh-App-Overview-MITRE"]'
};


// Metrics CIS-CAT
const metricsCiscat = {
  ciscatScanNotChecked:
    '[id="Wazuh-app-Agents-CISCAT-last-scan-not-checked"]',
  ciscatScanScore: '[id="Wazuh-app-Agents-CISCAT-last-scan-score"]',
  ciscatScanPass: '[id="Wazuh-app-Agents-CISCAT-last-scan-pass"]',
  ciscatScanFail: '[id="Wazuh-app-Agents-CISCAT-last-scan-fail"]',
  ciscatScanTimestamp:
    '[id="Wazuh-app-Agents-CISCAT-last-scan-timestamp"]',
  ciscatScanError: '[id="Wazuh-app-Agents-CISCAT-last-scan-error"]',
  ciscatScanBenchmark:
    '[id="Wazuh-app-Agents-CISCAT-last-scan-benchmark"]',
  ciscatScanUnknown: '[id="Wazuh-app-Agents-CISCAT-last-scan-unknown"]'
};

// Metrics Virustotal
const metricsVirustotal = {
  virusMalicious: '[id="Wazuh-App-Agents-Virustotal-Total-Malicious"]',
  virusPositives: '[id="Wazuh-App-Agents-Virustotal-Total-Positives"]',
  virusTotal: '[id="Wazuh-App-Agents-Virustotal-Total"]'
};

export default {
  metricsGeneral,
  metricsAudit,
  metricsVulnerability,
  metricsScap,
  metricsCiscat,
  metricsVirustotal
};
