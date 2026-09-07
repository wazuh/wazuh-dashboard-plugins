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
  '1.4':
    'Network connections between trusted and untrusted networks are controlled.',
  '2.2': 'Every system component is configured and managed securely.',
  '2.2.2':
    'Vendor-supplied default accounts are inventoried, and any still in use have their default password changed.',
  '2.2.3':
    'Functions that require different security levels run on separate systems or are otherwise isolated from each other.',
  '2.2.4':
    'Only the services, protocols, daemons, and functions a system needs are enabled; everything else is removed or disabled.',
  '2.2.7':
    'All non-console administrative access uses strong cryptography for encryption.',
  '3.2':
    'Account data is retained only for as long as, and to the extent that, it is actually needed.',
  '3.4':
    'Access to full PAN displays and the ability to copy cardholder data are restricted to those with a business need.',
  '3.5':
    'The primary account number is protected using strong measures wherever it is stored.',
  '3.6':
    'Cryptographic keys that protect stored account data are themselves secured against disclosure or misuse.',
  '4.1':
    'A documented process governs how cardholder data is protected with strong cryptography while transmitted over open, public networks.',
  '5.1':
    'A documented process governs how all systems and networks are protected from malicious software.',
  '5.2':
    'Malicious software is actively prevented from running, or is detected and remediated when found.',
  '5.3':
    'Anti-malware mechanisms remain active, are kept up to date, and are monitored for tampering or being disabled.',
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
  '7.1':
    'A documented process defines how access to system components and cardholder data is restricted by business need to know.',
  '7.2':
    "Access to system components and data is granted deliberately, matching each user's defined role.",
  '7.2.5':
    'Application and system accounts, and the privileges tied to them, are assigned based on least privilege for the role.',
  '8.1':
    'A documented process governs how users are identified and how their access to system components is authenticated.',
  '8.1.1':
    'Every security policy and operating procedure covering identification and authentication is documented and kept current.',
  '8.1.2':
    'Roles and responsibilities for identity and authentication activities are documented, assigned, and understood.',
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
  '10.1':
    'A documented process governs how access to system components and cardholder data is logged and monitored.',
  '10.2':
    'Audit logs capture enough detail to detect anomalies, investigate suspicious activity, and support forensic analysis.',
  '10.2.1':
    'Audit logging is enabled and actively running for every system component that touches cardholder data.',
  '10.2.2':
    'Each logged event records who performed it, along with the other details needed to reconstruct what happened.',
  '10.3':
    'Audit logs are protected against deletion and unauthorized alteration.',
  '10.4':
    'Audit logs are reviewed on a regular basis to catch anomalies or suspicious activity.',
  '10.5':
    'Audit log history is retained long enough, and kept accessible enough, to support later analysis.',
  '10.5.1':
    'At least twelve months of audit log history is retained, with the most recent three months readily available.',
  '10.6':
    'Time-synchronization mechanisms keep clocks consistent across all in-scope systems.',
  '10.6.1':
    'System clocks are synchronized using dedicated time-synchronization technology.',
  '11.2':
    'Wireless access points are inventoried and monitored, and any unauthorized ones are identified and addressed.',
  '11.2.1':
    'Wireless access points are periodically tested for, and both authorized and unauthorized access points are actively managed.',
  '11.3':
    'Internal and external vulnerabilities are identified on a regular basis, prioritized by risk, and addressed.',
  '11.4':
    'Internal and external penetration testing is performed regularly, and any exploitable weakness found is corrected.',
  '11.5':
    'Network intrusions and unexpected changes to critical files are detected and responded to.',
  '12.3':
    'Risks to the cardholder data environment are formally assessed, evaluated, and actively managed.',
  '12.10':
    'Suspected or confirmed security incidents affecting the CDE trigger an immediate response.',
  '12.10.5':
    'The incident response plan covers monitoring and acting on alerts from intrusion detection/prevention, network security controls, and file/change-detection systems.',
  '8.3.2':
    'Strong cryptography renders every authentication factor unreadable during transmission and storage on all system components.',
  '10.2.1.1':
    'Audit logs capture all individual user access to cardholder data.',
  '10.2.1.2':
    'Audit logs capture all actions taken by any individual with administrative access, including interactive use of application or system accounts.',
  '10.2.1.6':
    'Audit logs capture the initialization of new audit logs and the starting, stopping or pausing of existing ones.',
  '10.2.1.7':
    'Audit logs capture all creation and deletion of system-level objects.',
  '10.3.2':
    'Audit log files are protected to prevent modifications by individuals.',
  '10.4.1':
    'Security events and the logs of the system components handling cardholder data are reviewed at least once daily.',
  '11.3.1':
    'Internal vulnerability scans run at least once every three months, and the high-risk and critical findings are resolved and confirmed by a rescan.',
  '11.4.1':
    'A penetration testing methodology is defined, documented and implemented, covering the whole cardholder data environment perimeter and its critical systems.',
  '11.5.1':
    'Intrusion-detection or intrusion-prevention techniques monitor all traffic at the perimeter and at critical points of the cardholder data environment.',
  '11.5.2':
    'A change-detection mechanism alerts on unauthorized modification of critical files and compares them at least once weekly.',
  '1.5':
    'Risks to the CDE from computing devices able to connect to both untrusted networks and the CDE are mitigated.',
  '3.3': 'Sensitive authentication data is not stored after authorization.',
  '3.7':
    'Where cryptography protects stored account data, key management processes covering the whole key lifecycle are defined and implemented.',
  '4.2':
    'Primary account numbers are protected with strong cryptography during transmission.',
  '5.3.5':
    'Anti-malware mechanisms cannot be disabled or altered by users unless documented and authorized by management for a limited time.',
  '6.5.4':
    'Roles and functions are separated between production and pre-production environments so only reviewed and approved changes are deployed.',
  '7.3':
    'Access to system components and data is managed via an access control system.',
  '8.3.9':
    'Where a password or passphrase is the only authentication factor, it is changed at least every 90 days or access is granted dynamically from the account posture.',
  '10.2.1.3': 'Audit logs capture all access to audit logs.',
  '10.2.1.4': 'Audit logs capture all invalid logical access attempts.',
  '10.2.1.5':
    'Audit logs capture every change to identification and authentication credentials, including account creation, privilege elevation and account changes.',
  '10.3.1':
    'Read access to audit log files is limited to those with a job-related need.',
  '10.3.4':
    'File integrity monitoring or change-detection mechanisms run on audit logs so existing log data cannot change without raising an alert.',
  '12.2':
    'Acceptable use policies for end-user technologies are defined and implemented.',
};
