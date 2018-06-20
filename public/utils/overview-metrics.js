/*
 * Wazuh app - Hardcoded overview metrics
 * Copyright (C) 2018 Wazuh, Inc.
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
    totalAlerts: '[vis-id="\'Wazuh-App-Overview-General-Metric-alerts\'"]',
    level12    : '[vis-id="\'Wazuh-App-Overview-General-Level-12-alerts\'"]',
    authFailure: '[vis-id="\'Wazuh-App-Overview-General-Authentication-failure\'"]',
    authSuccess: '[vis-id="\'Wazuh-App-Overview-General-Authentication-success\'"]'
}

// Metrics FIM
const metricsFim = {
    fimAdded   : '[vis-id="\'Wazuh-App-Overview-FIM-Added\'"]',
    fimModified: '[vis-id="\'Wazuh-App-Overview-FIM-Modified\'"]',
    fimDeleted : '[vis-id="\'Wazuh-App-Overview-FIM-Deleted\'"]'
}

// Metrics Audit
const metricsAudit = {
    auditNewFiles     : '[vis-id="\'Wazuh-App-Overview-Audit-New-files\'"]',
    auditReadFiles    : '[vis-id="\'Wazuh-App-Overview-Audit-Read-files\'"]',
    auditModifiedFiles: '[vis-id="\'Wazuh-App-Overview-Audit-Modified-files\'"]',
    auditRemovedFiles : '[vis-id="\'Wazuh-App-Overview-Audit-Removed-files\'"]'
}

// Metrics Vulnerability Detector
const metricsVulnerability = {
    vulnCritical: '[vis-id="\'Wazuh-App-Overview-VULS-Metric-Critical-severity\'"]',
    vulnHigh    : '[vis-id="\'Wazuh-App-Overview-VULS-Metric-High-severity\'"]',
    vulnMedium  : '[vis-id="\'Wazuh-App-Overview-VULS-Metric-Medium-severity\'"]',
    vulnLow     : '[vis-id="\'Wazuh-App-Overview-VULS-Metric-Low-severity\'"]'
}

// Metrics Scap
const metricsScap = {
    scapLastScore   : '[vis-id="\'Wazuh-App-Overview-OSCAP-Last-score\'"]',
    scapHighestScore: '[vis-id="\'Wazuh-App-Overview-OSCAP-Highest-score\'"]',
    scapLowestScore : '[vis-id="\'Wazuh-App-Overview-OSCAP-Lowest-score\'"]'
}

// Metrics CIS-CAT
const metricsCiscat = {
    ciscatScanNotChecked: '[vis-id="\'Wazuh-app-Overview-CISCAT-last-scan-not-checked\'"]',
    ciscatScanScore     : '[vis-id="\'Wazuh-app-Overview-CISCAT-last-scan-score\'"]',
    ciscatScanPass      : '[vis-id="\'Wazuh-app-Overview-CISCAT-last-scan-pass\'"]',
    ciscatScanFail      : '[vis-id="\'Wazuh-app-Overview-CISCAT-last-scan-fail\'"]',
    ciscatScanTimestamp : '[vis-id="\'Wazuh-app-Overview-CISCAT-last-scan-timestamp\'"]',
    ciscatScanError     : '[vis-id="\'Wazuh-app-Overview-CISCAT-last-scan-error\'"]',
    ciscatScanBenchmark : '[vis-id="\'Wazuh-app-Overview-CISCAT-last-scan-benchmark\'"]',
    ciscatScanUnknown   : '[vis-id="\'Wazuh-app-Overview-CISCAT-last-scan-unknown\'"]'
}

// Metrics Virustotal
const metricsVirustotal = {
    virusMalicious: '[vis-id="\'Wazuh-App-Overview-Virustotal-Total-Malicious\'"]',
    virusPositives: '[vis-id="\'Wazuh-App-Overview-Virustotal-Total-Positives\'"]',
    virusTotal    : '[vis-id="\'Wazuh-App-Overview-Virustotal-Total\'"]'
}

// Metrics AWS
const metricsAws = {
    awsLogins        :'[vis-id="\'Wazuh-App-Overview-AWS-Metric-Successful-logins\'"]',
    awsMostActiveUser:'[vis-id="\'Wazuh-App-Overview-AWS-Most-active-user\'"]',
    awsAuthorized    :'[vis-id="\'Wazuh-App-Overview-AWS-Metric-Authorize-security\'"]',
    awsRevoked       :'[vis-id="\'Wazuh-App-Overview-AWS-Metric-Revoke-security\'"]'
}

export default { metricsGeneral, metricsFim, metricsAudit, metricsVulnerability, metricsScap, metricsCiscat, metricsVirustotal, metricsAws }
