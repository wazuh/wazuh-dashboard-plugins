/*
 * Wazuh app - Hardcoded overview metrics
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
  totalAlerts: '[id="Wazuh-App-Overview-General-Metric-alerts"]',
  level12: '[id="Wazuh-App-Overview-General-Level-12-alerts"]',
  authFailure:
    '[id="Wazuh-App-Overview-General-Authentication-failure"]',
  authSuccess:
    '[id="Wazuh-App-Overview-General-Authentication-success"]'
};

// Metrics Vulnerability Detector
const metricsVulnerability = {
  vulnCritical:
    '[id="Wazuh-App-Overview-vuls-Metric-Critical-severity"]',
  vulnHigh: '[id="Wazuh-App-Overview-vuls-Metric-High-severity"]',
  vulnMedium: '[id="Wazuh-App-Overview-vuls-Metric-Medium-severity"]',
  vulnLow: '[id="Wazuh-App-Overview-vuls-Metric-Low-severity"]'
};

// Metrics Scap
const metricsScap = {
  scapLastScore: '[id="Wazuh-App-Overview-OSCAP-Last-score"]',
  scapHighestScore: '[id="Wazuh-App-Overview-OSCAP-Highest-score"]',
  scapLowestScore: '[id="Wazuh-App-Overview-OSCAP-Lowest-score"]'
};

// Metrics Mitre
const metricsMitre = {
  mitreMetrics: '[id="Wazuh-App-Overview-MITRE"]'
};

// Metrics CIS-CAT
const metricsCiscat = {
  ciscatScanNotChecked:
    '[id="Wazuh-app-Overview-CISCAT-last-scan-not-checked"]',
  ciscatScanScore: '[id="Wazuh-app-Overview-CISCAT-last-scan-score"]',
  ciscatScanPass: '[id="Wazuh-app-Overview-CISCAT-last-scan-pass"]',
  ciscatScanFail: '[id="Wazuh-app-Overview-CISCAT-last-scan-fail"]',
  ciscatScanTimestamp:
    '[id="Wazuh-app-Overview-CISCAT-last-scan-timestamp"]',
  ciscatScanError: '[id="Wazuh-app-Overview-CISCAT-last-scan-error"]',
  ciscatScanBenchmark:
    '[id="Wazuh-app-Overview-CISCAT-last-scan-benchmark"]',
  ciscatScanUnknown:
    '[id="Wazuh-app-Overview-CISCAT-last-scan-unknown"]'
};

// Metrics Virustotal
const metricsVirustotal = {
  virusMalicious:
    '[id="Wazuh-App-Overview-Virustotal-Total-Malicious"]',
  virusPositives:
    '[id="Wazuh-App-Overview-Virustotal-Total-Positives"]',
  virusTotal: '[id="Wazuh-App-Overview-Virustotal-Total"]'
};

// Metrics OSQuery
const metricsOsquery = {
  osqueryAgentsReporting:
    '[id="Wazuh-App-Overview-Osquery-Agents-reporting"]'
};

export default {
  metricsGeneral,
  metricsVulnerability,
  metricsScap,
  metricsCiscat,
  metricsVirustotal,
  metricsOsquery,
  metricsMitre
};
