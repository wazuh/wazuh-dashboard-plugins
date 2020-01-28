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
export const metrics = {
  general: {
    totalAlerts: '[id="Wazuh-App-Overview-General-Metric-alerts"]',
    level12: '[id="Wazuh-App-Overview-General-Level-12-alerts"]',
    authFailure:
      '[id="Wazuh-App-Overview-General-Authentication-failure"]',
    authSuccess:
      '[id="Wazuh-App-Overview-General-Authentication-success"]'
  },
  vuls: {
    vulnCritical:
      '[id="Wazuh-App-Overview-vuls-Metric-Critical-severity"]',
    vulnHigh: '[id="Wazuh-App-Overview-vuls-Metric-High-severity"]',
    vulnMedium: '[id="Wazuh-App-Overview-vuls-Metric-Medium-severity"]',
    vulnLow: '[id="Wazuh-App-Overview-vuls-Metric-Low-severity"]'
  },
  oscap: {
    scapLastScore: '[id="Wazuh-App-Overview-OSCAP-Last-score"]',
    scapHighestScore: '[id="Wazuh-App-Overview-OSCAP-Highest-score"]',
    scapLowestScore: '[id="Wazuh-App-Overview-OSCAP-Lowest-score"]'
  },
  mitre: {
    mitreMetrics: '[id="Wazuh-App-Overview-MITRE"]'
  },
  ciscat: {
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
  },
  virustotal: {
    virusMalicious:
      '[id="Wazuh-App-Overview-Virustotal-Total-Malicious"]',
    virusPositives:
      '[id="Wazuh-App-Overview-Virustotal-Total-Positives"]',
    virusTotal: '[id="Wazuh-App-Overview-Virustotal-Total"]'
  },
  osquery: {
    osqueryAgentsReporting:
      '[id="Wazuh-App-Overview-Osquery-Agents-reporting"]'
  }
}
