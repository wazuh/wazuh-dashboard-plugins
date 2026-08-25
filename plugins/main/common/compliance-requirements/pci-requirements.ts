/*
 * Wazuh app - Module for PCI requirements
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
    'Establish and implement firewall and router configuration standards that include a formal process for approving and testing all network connections and changes to firewall and router configurations.',
  '1.1.1':
    'A formal process for approving and testing all network connections and changes to the firewall and router configurations',
  '1.2':
    'Build firewall and router configurations that restrict connections between untrusted networks and any system components in the cardholder data environment.',
  '1.3':
    'Prohibit direct public access between the Internet and any system component in the cardholder data environment.',
  '1.3.4':
    'Do not allow unauthorized outbound traffic from the cardholder data environment to the Internet.',
  '1.4':
    'Install personal firewall software or equivalent functionality on any portable computing devices (including company and/or employee-owned) that connect to the Internet when outside the network (for example, laptops used by employees), and which are also used to access the CDE. Firewall (or equivalent) configurations include:Specific configuration settings are defined. Personal firewall (or equivalent functionality) is actively running. Personal firewall (or equivalent functionality) is not alterable by users of the portable computing devices. ',
  '2.2':
    'Develop configuration standards for all system components. Assure that these standards address all known security vulnerabilities and are consistent with industry accepted system hardening standards (CIS, ISO, SANS, NIST).',
  '2.2.2':
    'Enable only necessary services, protocols, daemons, etc., as required for the function of the system. ',
  '2.2.3':
    'Implement additional security features for any required services, protocols, or daemons that are considered to be insecure',
  '2.2.4': 'Configure system security parameters to prevent misuse.',
  '2.2.7':
    'All non-console administrative access is encrypted using strong cryptography.',
  '3.2': 'Storage of account data is kept to a minimum.',
  '3.4':
    'Access to displays of full PAN and the ability to copy PAN are restricted.',
  '3.5': 'Primary account number (PAN) is secured wherever it is stored.',
  '3.6': 'Cryptographic keys used to protect stored account data are secured.',
  '4.1':
    'Use strong cryptography and security protocols (for example, SSL/TLS, IPSEC, SSH, etc.) to safeguard sensitive cardholder data during transmission over open, public networks, including the following:Only trusted keys and certificates are accepted. The protocol in use only supports secure versions or configurations. The encryption strength is appropriate for the encryption methodology in use. ',
  '5.1':
    'Deploy anti-virus software on all systems commonly affected by malicious software (particularly personal computers and servers).',
  '5.2':
    'Ensure that all anti-virus mechanisms are maintained as follows:Are kept current. Perform periodic scans. Generate audit logs which are retained per PCI DSS Requirement 10.7. ',
  '5.3':
    'Ensure that anti-virus mechanisms are actively running and cannot be disabled or altered by users, unless specifically authorized by management on a case-by-case basis for a limited time period.',
  '6.2':
    'Ensure that all system components and software are protected from known vulnerabilities by installing applicable vendor-supplied security patches. Install critical security patches within one month of release.',
  '6.3':
    'Develop internal and external software applications (including web-based administrative access to applications) securely, in accordance with PCI DSS and based on industry standards, incorporating information security throughout the software-development life cycle.',
  '6.3.3':
    'All system components are protected from known vulnerabilities by installing applicable security patches/updates within an identified time frame from release of the patches/updates.',
  '6.4':
    'Follow change control processes and procedures for all changes to system components.',
  '6.4.2':
    'Separation of duties between development/test and production environments.',
  '6.5':
    'Address common coding vulnerabilities in software development processes as follows:Train developers in secure coding techniques, including how to avoid common coding vulnerabilities, and understanding how sensitive data is handled in memory. Develop applications based on secure coding guidelines. ',
  '6.5.1':
    'Injection flaws, particularly SQL injection. Also consider Operating System Command Injection, LDAP and XPath injection flaws as well as other injection flaws.',
  '6.5.2': 'Buffer overflows',
  '6.5.5': 'Improper error handling',
  '6.5.7': 'Cross-site scripting (XSS)',
  '6.5.8':
    'Improper access control (such an insecure direct object references, failure to restrict URL access, directory traversal, and failure to restrict user access to functions).',
  '6.5.10': 'Broken authentication and session management.',
  '6.6':
    'For public-facing web applications, address new threats and vulnerabilities on an ongoing basis and ensure these applications are protected against known attacks by either of the following methods:Reviewing public-facing web applications via manual or automated application vulnerability security assessment tools or methods, at least annually and after any changes. Installing an automated technical solution that detects and prevents web-based attacks (for example, a web-application firewall) in front of public-facing web applications, to continually check all traffic. ',
  '7.1':
    'Processes and mechanisms for restricting access to system components and cardholder data by business need to know are defined and understood.',
  '7.2':
    'Access to system components and data is appropriately defined and assigned.',
  '7.2.5':
    'All application and system accounts and related access privileges are assigned and managed based on the least privileges necessary for the role.',
  '8.1':
    'Define and implement policies and procedures to ensure proper user identification management for non-consumer users and administrators on all system components.',
  '8.1.1':
    'Assign all users a unique ID before allowing them to access system components or cardholder data.',
  '8.1.2':
    'Control addition, deletion, and modification of user IDs, credentials, and other identifier objects.',
  '8.1.4': 'Remove/disable inactive user accounts within 90 days.',
  '8.1.5':
    'Manage IDs used by third parties to access, support, or maintain system components via remote access as follows:Enabled only during the time period needed and disabled when not in use. Monitored when in use. ',
  '8.1.6':
    'Limit repeated access attempts by locking out the user ID after not more than six attempts.',
  '8.1.8':
    'If a session has been idle for more than 15 minutes, require the user to reauthenticate to re-activate the terminal or session.',
  '8.2':
    'In addition to assigning a unique ID, ensure proper user-authentication management for non-consumer users and administrators on all system components.',
  '8.2.1':
    'Using strong cryptography, render all authentication credentials (such as passwords/phrases) unreadable during transmission and storage on all system components.',
  '8.2.4': 'Change user passwords/passphrases at least once every 90 days.',
  '8.3':
    'Secure all individual non-console administrative access and all remote access to the cardholder data environment using multi-factor authentication.',
  '8.3.1':
    'Incorporate multi-factor authentication for all non-console access into the CDE for personnel with administrative access.',
  '8.3.4':
    'Invalid authentication attempts are limited by locking out the user ID after not more than 10 attempts, with the lockout duration lasting a minimum of 30 minutes or until an administrator resets the account or the user’s identity is confirmed.',
  '8.3.6':
    'If passwords/passphrases are used as an authentication factor, they meet the minimum level of complexity: a minimum length of 12 characters (or 8 if the system does not support 12) and contain both numeric and alphabetic characters.',
  '8.4':
    'Document and communicate authentication policies and procedures to all users, including guidance on selecting strong authentication credentials, protecting credentials, and not reusing previously used passwords.',
  '8.5':
    'Do not use group, shared, or generic IDs, passwords, or other authentication methods.',
  '8.5.1':
    'Additional requirement for service providers: Service providers with remote access to customer premises (for example, for support of POS systems or servers) must use a unique authentication credential (such as a password/phrase) for each customer.',
  '8.6':
    'Where other authentication mechanisms are used (for example, physical or logical security tokens, smart cards, or certificates), assign use of these mechanisms to an individual account and ensure physical and/or logical controls guarantee only the intended account can use that mechanism to gain access.',
  '8.7':
    'All access to any database containing cardholder data (including access by applications, administrators, and all other users) is restricted as follows:All user access to, user queries of, and user actions on databases are through programmatic methods. Only database administrators have the ability to directly access or query databases. Application IDs for database applications can only be used by the applications (and not by individual users or other non-application processes).',
  '10.1':
    'Implement audit trails to link all access to system components to each individual user.',
  '10.2':
    'Implement automated audit trails for all system components to reconstruct events.',
  '10.2.1': 'All individual user accesses to cardholder data',
  '10.2.2':
    'All actions taken by any individual with root or administrative privileges.',
  '10.2.3': 'Access to all audit trails.',
  '10.2.4': 'Invalid logical access attempts',
  '10.2.5':
    'Use of and changes to identification and authentication mechanisms including but not limited to creation of new accounts and elevation of privileges and all changes, additions, or deletions to accounts with root or administrative privileges.',
  '10.2.6': 'Initialization, stopping, or pausing of the audit logs',
  '10.2.7': 'Creation and deletion of system level objects',
  '10.3':
    'Record at least the following audit trail entries for all system components for each event: user identification, type of event, date and time, success or failure indication, origination of event, and identity or name of affected data, system component, or resource.',
  '10.4':
    'Using time-synchronization technology, synchronize all critical system clocks and times and ensure that the following is implemented for acquiring, distributing, and storing time.',
  '10.5': 'Secure audit trails so they cannot be altered.',
  '10.5.1': 'Limit viewing of audit trails to those with a job-related need.',
  '10.5.2': 'Protect audit trail files from unauthorized modifications',
  '10.5.5':
    'Use file integrity monitoring or change detection software on logs to ensure that existing log data cannot be changed without generating alerts (although new data being added should not cause an alert).',
  '10.6':
    'Review logs and security events for all system components to identify anomalies or suspicious activity',
  '10.6.1':
    'Review the following at least daily: All security events. Logs of all system components that store, process, or transmit CHD and/or SAD, or that could. impact the security of CHD and/or SAD. Logs of all critical system components. Logs of all servers and system components that perform security functions (for example, firewalls, intrusion detection systems/intrusion prevention systems (IDS/IPS), authentication servers, ecommerce redirection servers, etc.). ',
  '11.2':
    'Run internal and external network vulnerability scans at least quarterly and after any significant change in the network.',
  '11.2.1':
    'Perform quarterly internal vulnerability scans. Address vulnerabilities and perform rescans to verify all “high risk” vulnerabilities are resolved in accordance with the entity’s vulnerability ranking. Scans must be performed by qualified personnel.',
  '11.2.3':
    'Perform internal and external scans, and rescans as needed, after any significant change. Scans must be performed by qualified personnel.',
  '11.3':
    'Implement a methodology for penetration testing that includes industry-accepted approaches, coverage for the entire CDE perimeter and critical systems, and testing from both inside and outside the network.',
  '11.4':
    'Use intrusion detection and/or intrusion prevention techniques to detect and/or prevent intrusions into the network.Monitor all traffic at the perimeter of the cardholder data environment as well as at critical points in the cardholder data environment, and alert personnel to suspected compromises. Keep all intrusion detection and prevention engines, baselines, and signatures up to date.',
  '11.5':
    'Deploy a change detection mechanism (for example, file integrity monitoring tools) to alert personnel to unauthorized modification of critical system files, configuration files, or content files; and configure the software to perform critical file comparisons at least weekly.',
  '12.3':
    'Develop usage policies for critical technologies and define proper use of these technologies for all personnel.',
  '12.10':
    'Implement an incident response plan. Be prepared to respond immediately to a system breach.',
  '12.10.5':
    'Include alerts from security monitoring systems, including but not limited to intrusion-detection, intrusion-prevention, firewalls, and file-integrity monitoring systems.',
};
