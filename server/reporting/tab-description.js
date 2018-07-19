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
    general   : {
        title: 'General',
        description: ''
    },
    fim       : {
        title: 'File integrity monitoring',
        description: 'Wazuh’s File integrity monitoring (FIM) watches specified files triggering alerts when these files are modified. The component responsible for this task is called syscheck. This component stores the cryptographic checksum and other attributes of a known good file or Windows registry key and regularly compares it to the current file being used by the system, watching for changes.'
    },
    pm        : {
        title: 'Policy monitoring',
        description: 'Wazuh monitors configuration files to ensure they are compliant with your security policies, standards or hardening guides. Agents perform periodic scans to detect applications that are known to be vulnerable, unpatched, misconfigured.'
    },
    vuls      : {
        title: 'Vulnerability detector',
        description: 'This capability can be used to detect applications that are known to be vulnerable (affected by a CVE). To be able to detect vulnerabilities, now agents are able to natively collect a list of installed applications, sending it periodically to the manager (where it is stored in local sqlite databases, one per agent). In addition, the manager builds a global vulnerabilities database, using public OVAL CVE repositories, using it later to cross correlate this information with agent’s applications inventory data.'
    },
    oscap     : {
        title: 'Security Content Automation Protocol (SCAP)',
        description: 'The Security Content Automation Protocol (SCAP) is a specification for expressing and manipulating security data in standardized ways. SCAP jointly uses several specifications in order to automate continuous monitoring, vulnerability management, and reporting on results of security compliance scans.'
    },
    audit     : {
        title: 'Linux Audit',
        description: 'The Linux Audit system provides a way to track security-relevant information on your machine. Based on preconfigured rules, Audit proves detailed real-time logging about the events that are happening on your system. This information is crucial for mission-critical environments to determine the violator of the security policy and the actions they performed.'
    },
    pci       : {
        title: 'PCI DSS',
        description: 'The Payment Card Industry Data Security Standard (PCI DSS) is a proprietary information security standard for organizations that handle branded credit cards from the major card companies including Visa, MasterCard, American Express, Discover, and JCB. The standard was created to increase controls around cardholder data to reduce credit card fraud.'
    },
    gdpr      : {
        title: 'GDPR',
        description: 'The General Data Protection Regulation took effect on 25th May 2018. Wazuh helps with most technical requirements, taking advantage of features such as File Integrity or Policy monitoring. In addition, the entire Ruleset has been mapped following the GDPR regulation, enriching all the alerts related to this purpose.'
    },
    ciscat    : {
        title: 'CIS-CAT',
        description: 'CIS (Center for Internet Security) is an entity dedicated to safeguard private and public organizations against cyber threats. This entity provides CIS benchmarks guidelines, which are a recognized global standard and best practices for securing IT systems and data against cyberattacks.'
    },
    aws       : {
        title: 'Amazon web services',
        description: 'Wazuh AWS rules focus on providing the desired visibility within the Amazon Web Services platform.'
    },
    virustotal: {
        title: 'Virustotal',
        description:'From version 3.0.0, Wazuh incorporates a new integration which scans monitored files for malicious content. This solution is possible through an integration with VirusTotal, which is a powerful platform that aggregates multiple antivirus products along with an online scanning engine. Combining this tool with our FIM engine provides a simple means of scanning the files that are monitored by syscheck to inspect them for malicious content.'
    },
    syscollector: {
        title: 'Inventory',
        description: 'Scan the system to retrieve OS, hardware and installed packages related information.'
    }
}
