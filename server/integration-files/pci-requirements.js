/*
 * Wazuh app - Module for PCI requirements
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
	"1.1.1": "A formal process for approving and testing all network connections and changes to the firewall and router configurations",
	"1.3.4": "Do not allow unauthorized outbound traffic from the cardholder data environment to the Internet.",
	"1.4": "Install personal firewall software or equivalent functionality on any portable computing devices (including company and/or employee-owned) that connect to the Internet when outside the network (for example, laptops used by employees), and which are also used to access the CDE. Firewall (or equivalent) configurations include:<br><ul><li>Specific configuration settings are defined.</li><li>Personal firewall (or equivalent functionality) is actively running.</li><li>Personal firewall (or equivalent functionality) is not alterable by users of the portable computing devices.</li></ul>",
	"2.2": "Develop configuration standards for all system components. Assure that these standards address all known security vulnerabilities and are consistent with industry accepted system hardening standards (CIS, ISO, SANS, NIST).",
	"2.2.2": "Enable only necessary services, protocols, daemons, etc., as required for the function of the system. ",
	"2.2.3": "Implement additional security features for any required services, protocols, or daemons that are considered to be insecure",
	"2.2.4": "Configure system security parameters to prevent misuse.",
	"4.1": "Use strong cryptography and security protocols (for example, SSL/TLS, IPSEC, SSH, etc.) to safeguard sensitive cardholder data during transmission over open, public networks, including the following:<br><ul><li>Only trusted keys and certificates are accepted.</li><li>The protocol in use only supports secure versions or configurations.</li><li>The encryption strength is appropriate for the encryption methodology in use</li></ul>",
	"5.1": "Deploy anti-virus software on all systems commonly affected by malicious software (particularly personal computers and servers).",
	"5.2": "Ensure that all anti-virus mechanisms are maintained as follows:<br><ul><li>Are kept current</li><li>Perform periodic scans</li><li>Generate audit logs which are retained per PCI DSS Requirement 10.7.</li></ul>",
	"6.2": "Ensure that all system components and software are protected from known vulnerabilities by installing applicable vendor-supplied security patches. Install critical security patches within one month of release.",
	"6.5": "Address common coding vulnerabilities in software development processes as follows:<br><ul><li>Train developers in secure coding techniques, including how to avoid common coding vulnerabilities, and understanding how sensitive data is handled in memory.</li><li>Develop applications based on secure coding guidelines</li></ul>",
	"6.5.1": "Injection flaws, particularly SQL injection. Also consider OS Command Injection, LDAP and XPath injection flaws as well as other injection flaws.",
	"6.5.2": "Buffer overflows",
	"6.5.5": "Improper error handling",
	"6.5.7": "Cross-site scripting (XSS)",
	"6.5.8": "Improper access control (such an insecure direct object references, failure to restrict URL access, directory traversal, and failure to restrict user access to functions).",
	"6.5.10": "Broken authentication and session management.",
	"6.6": "For public-facing web applications, address new threats and vulnerabilities on an ongoing basis and ensure these applications are protected against known attacks by either of the following methods:<ul><li>Reviewing public-facing web applications via manual or automated application vulnerability security assessment tools or methods, at least annually and after any changes</li><li>Installing an automated technical solution that detects and prevents web-based attacks (for example, a web-application firewall) in front of public-facing web applications, to continually check all traffic.</li></ul>",
	"8.1.2": "Control addition, deletion, and modification of user IDs, credentials, and other identifier objects.",
	"8.1.4": "Remove/disable inactive user accounts within 90 days.",
	"8.1.5": "Manage IDs used by third parties to access, support, or maintain system components via remote access as follows:<ul><li>Enabled only during the time period needed and disabled when not in use.</li><li>Monitored when in use.</li></ul>",
	"8.1.6": "Limit repeated access attempts by locking out the user ID after not more than six attempts.",
	"8.1.8": "If a session has been idle for more than 15 minutes, require the user to reauthenticate to re-activate the terminal or session.",
	"8.2.4": "Change user passwords/passphrases at least once every 90 days.",
	"8.5.1": "Additional requirement for service providers: Service providers with remote access to customer premises (for example, for support of POS systems or servers) must use a unique authentication credential (such as a password/phrase) for each customer.",
	"8.7": "All access to any database containing cardholder data (including access by applications, administrators, and all other users) is restricted as follows:<ul><li>All user access to, user queries of, and user actions on databases are through programmatic methods.</li><li>Only database administrators have the ability to directly access or query databases.</li><li>Application IDs for database applications can only be used by the applications (and not by individual users or other non-application processes).</li></ul>",
	"10.1": "Implement audit trails to link all access to system components to each individual user.",
	"10.2.1": "All individual user accesses to cardholder data",
	"10.2.2": "All actions taken by any individual with root or administrative privileges.",
	"10.2.4": "Invalid logical access attempts",
	"10.2.5": "Use of and changes to identification and authentication mechanisms including but not limited to creation of new accounts and elevation of privileges and all changes, additions, or deletions to accounts with root or administrative privileges.",
	"10.2.6": "Initialization, stopping, or pausing of the audit logs",
	"10.2.7": "Creation and deletion of system level objects",
	"10.5.2": "Protect audit trail files from unauthorized modifications",
	"10.5.5": "Use file integrity monitoring or change detection software on logs to ensure that existing log data cannot be changed without generating alerts (although new data being added should not cause an alert).",
	"10.4": "Using time-synchronization technology, synchronize all critical system clocks and times and ensure that the following is implemented for acquiring, distributing, and storing time.",
	"10.6": "Review logs and security events for all system components to identify anomalies or suspicious activity",
	"10.6.1": "Review the following at least daily: <br><ul><li>All security events</li><li>Logs of all system components that store, process, or transmit CHD and/or SAD, or that could</li>impact the security of CHD and/or SAD</li><li>Logs of all critical system components</li><li>Logs of all servers and system components that perform security functions (for example, firewalls, intrusion detection systems/intrusion prevention systems (IDS/IPS), authentication servers, ecommerce redirection servers, etc.)</li></ul>",
	"11.4": "Use intrusion detection and/or intrusion prevention techniques to detect and/or prevent intrusions into the network.<br>Monitor all traffic at the perimeter of the cardholder data environment as well as at critical points in the cardholder data environment, and alert personnel to suspected compromises. Keep all intrusion detection and prevention engines, baselines, and signatures up to date.",
	"11.5": "Deploy a change detection mechanism (for example, file integrity monitoring tools) to alert personnel to unauthorized modification of critical system files, configuration files, or content files; and configure the software to perform critical file comparisons at least weekly."
};