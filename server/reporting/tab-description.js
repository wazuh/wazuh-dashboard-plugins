/*
 * Wazuh app - Simple description for each App tabs
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default {
    general: {
        title: 'General',
        description: ''
    },
    fim: {
        title: 'File integrity monitoring',
        description: 'Wazuh\'s File integrity monitoring (FIM) system watches selected files, triggering alerts when these files are modified.'
    },
    pm: {
        title: 'Policy monitoring',
        description: 'Policy monitoring is the process of verifying that all systems conform to a set of predefined rules regarding configuration settings and approved application usage.'
    },
    vuls: {
        title: 'Vulnerability detector',
        description: 'Detect applications that are known to be vulnerable (affected by a CVE).'
    },
    oscap: {
        title: 'Security Content Automation Protocol (SCAP)',
        description: 'SCAP uses several specifications in order to automate continuous monitoring, vulnerability management, and reporting the results of security compliance scans.'
    },
    audit: {
        title: 'Linux Audit',
        description: 'The Linux auditd system is an extensive auditing tool, which we will only touch on here.'
    },
    pci: {
        title: 'PCI DSS',
        description: 'Wazuh helps to implement PCI DSS by performing log analysis, file integrity checking, policy monitoring, intrusion detection, real-time alerting and active response.'
    },
    gdpr: {
        title: 'GDPR',
        description: 'The General Data Protection Regulation took effect on May 25, 2018.  Wazuh helps with most technical requirements by making the most of features such as File Integrity or Policy monitoring.'
    },
    ciscat: {
        title: 'CIS-CAT',
        description: 'Integrates CIS benchmark assessments into Wazuh agents.'
    },
    aws: {
        title: 'Amazon web services',
        description: 'Wazuh AWS rules focus on providing the desired visibility within the Amazon Web Services platform.'
    },
    virustotal: {
        title: 'Virustotal',
        description: 'Scans monitored files for malicious content.'
    },
    syscollector: {
        title: 'Inventory',
        description: 'Scan the system to retrieve information related to OS, hardware and installed packages.'
    },
    configuration: {
        title: 'Configuration',
        description: 'Agents can be configured remotely by using the agent.conf file. Check the agent configuration here.'
    }
}
