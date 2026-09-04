/*
 * Wazuh app - Module for PCI requirements
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const pciRequirementsFile = {
  '1.1':
    'A documented, formal process governs how network security controls are installed and maintained.',
  '1.1.1':
    'Every security policy and operating procedure covering network security controls is documented and kept current.',
  '1.2':
    'Network security controls, such as firewalls and routers, are properly configured and kept up to date.',
  '1.3':
    'Network access into and out of the cardholder data environment is limited to what is explicitly required.',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '1.3.4':
    'Do not allow unauthorized outbound traffic from the cardholder data environment to the Internet.',
  '1.4':
    'Connections between trusted internal networks and untrusted external networks are controlled and monitored.',
  '1.5':
    'Risks introduced by devices that connect to both untrusted networks and the CDE are identified and mitigated.',
  '2.1':
    'A documented process governs how secure configurations are applied to all system components.',
  '2.2':
    'Every system component is configured and managed according to secure, industry-accepted hardening standards.',
  '2.2.2':
    'Vendor-supplied default accounts are inventoried, and any still in use have their default password changed.',
  '2.2.3':
    'Functions that require different security levels run on separate systems or are otherwise isolated from each other.',
  '2.2.4':
    'Only the services, protocols, daemons, and functions a system needs are enabled; everything else is removed or disabled.',
  '2.2.7':
    'All non-console administrative access uses strong cryptography for encryption.',
  '2.3':
    'Wireless environments connected to or part of the CDE are configured and managed securely.',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '2.4':
    'Maintain an inventory of system components that are in scope for PCI DSS.',
  '3.1': 'A documented process governs how stored account data is protected.',
  '3.2':
    'Account data is retained only for as long as, and to the extent that, it is actually needed.',
  '3.3':
    'Sensitive authentication data is not retained after the authorization process completes.',
  '3.4':
    'Access to full PAN displays and the ability to copy cardholder data are restricted to those with a business need.',
  '3.5':
    'The primary account number is protected using strong measures wherever it is stored.',
  '3.6':
    'Cryptographic keys that protect stored account data are themselves secured against disclosure or misuse.',
  '4.1':
    'A documented process governs how cardholder data is protected with strong cryptography while transmitted over open, public networks.',
  '4.2':
    'The primary account number is protected with strong cryptography whenever it is transmitted.',
  '5.1':
    'A documented process governs how all systems and networks are protected from malicious software.',
  '5.2':
    'Malicious software is actively prevented from running, or is detected and remediated when found.',
  '5.3':
    'Anti-malware mechanisms remain active, are kept up to date, and are monitored for tampering or being disabled.',
  '5.4':
    'Anti-phishing mechanisms are in place to protect personnel against phishing attacks.',
  '6.1':
    'A documented process governs how systems and software are developed and maintained securely.',
  '6.2':
    'Custom and bespoke software is built using secure development practices from the outset.',
  '6.3':
    'Security vulnerabilities in software and systems are identified, ranked, and remediated.',
  '6.3.3':
    'Applicable security patches are installed within a defined time frame based on the risk the vulnerability presents.',
  '6.4':
    'Public-facing web applications are actively protected against known and emerging attacks.',
  '6.4.2':
    'An automated technical control continuously monitors public-facing web applications and blocks web-based attacks.',
  '6.5':
    'Changes to system components follow a controlled, documented change-management process.',
  '6.5.1':
    'Each change to a production system component is documented, including its reason and a description of what changed.',
  '6.5.2':
    'After a significant change, applicable PCI DSS controls are re-verified as being in place and documentation is updated.',
  '6.5.5':
    'Live primary account numbers are kept out of pre-production and test environments unless those environments meet CDE-level protection.',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '6.5.7': 'Cross-site scripting (XSS)',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '6.5.8':
    'Improper access control (such an insecure direct object references, failure to restrict URL access, directory traversal, and failure to restrict user access to functions).',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '6.5.10': 'Broken authentication and session management.',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '6.6':
    'For public-facing web applications, address new threats and vulnerabilities on an ongoing basis and ensure these applications are protected against known attacks by either of the following methods:Reviewing public-facing web applications via manual or automated application vulnerability security assessment tools or methods, at least annually and after any changes. Installing an automated technical solution that detects and prevents web-based attacks (for example, a web-application firewall) in front of public-facing web applications, to continually check all traffic. ',
  '7.1':
    'A documented process defines how access to system components and cardholder data is restricted by business need to know.',
  '7.2':
    "Access to system components and data is granted deliberately, matching each user's defined role.",
  '7.2.5':
    'Application and system accounts, and the privileges tied to them, are assigned based on least privilege for the role.',
  '7.3':
    'Access to system components and data is enforced through a formal access control system.',
  '8.1':
    'A documented process governs how users are identified and how their access to system components is authenticated.',
  '8.1.1':
    'Every security policy and operating procedure covering identification and authentication is documented and kept current.',
  '8.1.2':
    'Roles and responsibilities for identity and authentication activities are documented, assigned, and understood.',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '8.1.4': 'Remove/disable inactive user accounts within 90 days.',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '8.1.5':
    'Manage IDs used by third parties to access, support, or maintain system components via remote access as follows:Enabled only during the time period needed and disabled when not in use. Monitored when in use. ',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '8.1.6':
    'Limit repeated access attempts by locking out the user ID after not more than six attempts.',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '8.1.8':
    'If a session has been idle for more than 15 minutes, require the user to reauthenticate to re-activate the terminal or session.',
  '8.2':
    'Each account is tracked and managed through its full lifecycle, from creation to removal.',
  '8.2.1':
    'Every user is assigned a unique ID before being granted access to system components or cardholder data.',
  '8.2.4':
    'Adding, removing, or modifying a user ID or authentication factor requires prior authorization.',
  '8.3':
    'Strong, multi-factor authentication is required for users and administrators accessing the environment.',
  '8.3.1':
    'Access for users and administrators is authenticated using at least one recognized authentication factor, such as a password.',
  '8.3.4':
    'An account is locked out after no more than ten consecutive invalid authentication attempts.',
  '8.3.6':
    'Passwords used to satisfy authentication requirements are at least 12 characters (8 if the system cannot support 12) and mix letters with numbers.',
  '8.4':
    'Multi-factor authentication secures every path of access into the cardholder data environment.',
  '8.5':
    'Multi-factor authentication systems are configured so they cannot be bypassed or misused.',
  '8.5.1':
    'Multi-factor authentication implementations resist replay attacks and cannot be bypassed with a single factor.',
  '8.6':
    'Application and system accounts, and their authentication factors, are tightly controlled and monitored for misuse.',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '8.7':
    'All access to any database containing cardholder data (including access by applications, administrators, and all other users) is restricted as follows:All user access to, user queries of, and user actions on databases are through programmatic methods. Only database administrators have the ability to directly access or query databases. Application IDs for database applications can only be used by the applications (and not by individual users or other non-application processes).',
  '9.1':
    'A documented process governs how physical access to cardholder data is restricted.',
  '9.2':
    'Physical access controls govern entry into facilities and systems that hold cardholder data.',
  '9.3':
    'Physical access granted to personnel and visitors is authorized and actively managed.',
  '9.4':
    'Media containing cardholder data is stored, accessed, distributed, and destroyed securely.',
  '9.5':
    'Point-of-interaction devices are protected against tampering and unauthorized substitution.',
  '10.1':
    'A documented process governs how access to system components and cardholder data is logged and monitored.',
  '10.2':
    'Audit logs capture enough detail to detect anomalies, investigate suspicious activity, and support forensic analysis.',
  '10.2.1':
    'Audit logging is enabled and actively running for every system component that touches cardholder data.',
  '10.2.2':
    'Each logged event records who performed it, along with the other details needed to reconstruct what happened.',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '10.2.3': 'Access to all audit trails.',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '10.2.4': 'Invalid logical access attempts',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '10.2.5':
    'Use of and changes to identification and authentication mechanisms including but not limited to creation of new accounts and elevation of privileges and all changes, additions, or deletions to accounts with root or administrative privileges.',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '10.2.6': 'Initialization, stopping, or pausing of the audit logs',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '10.2.7': 'Creation and deletion of system level objects',
  '10.3':
    'Audit logs are protected against deletion and unauthorized alteration.',
  '10.4':
    'Audit logs are reviewed on a regular basis to catch anomalies or suspicious activity.',
  '10.5':
    'Audit log history is retained long enough, and kept accessible enough, to support later analysis.',
  '10.5.1':
    'At least twelve months of audit log history is retained, with the most recent three months readily available.',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '10.5.2': 'Protect audit trail files from unauthorized modifications',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '10.5.5':
    'Use file integrity monitoring or change detection software on logs to ensure that existing log data cannot be changed without generating alerts (although new data being added should not cause an alert).',
  '10.6':
    'Time-synchronization mechanisms keep clocks consistent across all in-scope systems.',
  '10.6.1':
    'System clocks are synchronized using dedicated time-synchronization technology.',
  '10.7':
    'Failures in critical security control systems are detected, reported, and responded to promptly.',
  '11.1':
    'A documented process governs how the security of systems and networks is regularly tested.',
  '11.2':
    'Wireless access points are inventoried and monitored, and any unauthorized ones are identified and addressed.',
  '11.2.1':
    'Wireless access points are periodically tested for, and both authorized and unauthorized access points are actively managed.',
  // PCI DSS v4.0 does not define this code; kept for rules still emitting v3.2.1 subrequirement numbering.
  '11.2.3':
    'Perform internal and external scans, and rescans as needed, after any significant change. Scans must be performed by qualified personnel.',
  '11.3':
    'Internal and external vulnerabilities are identified on a regular basis, prioritized by risk, and addressed.',
  '11.4':
    'Internal and external penetration testing is performed regularly, and any exploitable weakness found is corrected.',
  '11.5':
    'Network intrusions and unexpected changes to critical files are detected and responded to.',
  '12.3':
    'Risks to the cardholder data environment are formally assessed, evaluated, and actively managed.',
  '12.5':
    'The scope of applicability for PCI DSS controls is documented and confirmed to be accurate.',
  '12.10':
    'Suspected or confirmed security incidents affecting the CDE trigger an immediate response.',
  '12.10.5':
    'The incident response plan covers monitoring and acting on alerts from intrusion detection/prevention, network security controls, and file/change-detection systems.',
};
