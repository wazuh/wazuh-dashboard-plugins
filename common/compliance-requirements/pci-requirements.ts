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

import { i18n } from '@kbn/i18n';
import vulnerabilities from '../../public/controllers/management/components/management/configuration/vulnerabilities/vulnerabilities';

const networkConnection = i18n.translate(
  'complianceRequirements.pci.networkConnection',
  {
    defaultMessage:
      'A formal process for approving and testing all network connections and changes to the firewall and router configurations',
  },
);

const unauthorizedTraffic = i18n.translate(
  'complianceRequirements.pci.unauthorizedTraffic',
  {
    defaultMessage:
      'Do not allow unauthorized outbound traffic from the cardholder data environment to the Internet.',
  },
);

const personalFirewall = i18n.translate(
  'complianceRequirements.pci.personalFirewall',
  {
    defaultMessage:
      'Install personal firewall software or equivalent functionality on any portable computing devices (including company and/or employee-owned) that connect to the Internet when outside the network (for example, laptops used by employees), and which are also used to access the CDE. Firewall (or equivalent) configurations include:Specific configuration settings are defined. Personal firewall (or equivalent functionality) is actively running. Personal firewall (or equivalent functionality) is not alterable by users of the portable computing devices. ',
  },
);

const configurationStandards = i18n.translate(
  'complianceRequirements.pci.configurationStandards',
  {
    defaultMessage:
      'Develop configuration standards for all system components. Assure that these standards address all known security vulnerabilities and are consistent with industry accepted system hardening standards (CIS, ISO, SANS, NIST).',
  },
);

const enableNecessaryServices = i18n.translate(
  'complianceRequirements.pci.enableNecessaryServices',
  {
    defaultMessage:
      'Enable only necessary services, protocols, daemons, etc., as required for the function of the system. ',
  },
);

const additionalSecurityFeatures = i18n.translate(
  'complianceRequirements.pci.additionalSecurityFeatures',
  {
    defaultMessage:
      'Implement additional security features for any required services, protocols, or daemons that are considered to be insecure',
  },
);

const securityParameters = i18n.translate(
  'complianceRequirements.pci.securityParameters',
  {
    defaultMessage: 'Configure system security parameters to prevent misuse.',
  },
);

const strongCryptography = i18n.translate(
  'complianceRequirements.pci.strongCryptography',
  {
    defaultMessage:
      'Use strong cryptography and security protocols (for example, SSL/TLS, IPSEC, SSH, etc.) to safeguard sensitive cardholder data during transmission over open, public networks, including the following:Only trusted keys and certificates are accepted. The protocol in use only supports secure versions or configurations. The encryption strength is appropriate for the encryption methodology in use. ',
  },
);

const antiVirusSoftwares = i18n.translate(
  'complianceRequirements.pci.antiVirusSoftwares',
  {
    defaultMessage:
      'Deploy anti-virus software on all systems commonly affected by malicious software (particularly personal computers and servers).',
  },
);

const antiVirusMechanisms = i18n.translate(
  'complianceRequirements.pci.antiVirusMechanisms',
  {
    defaultMessage:
      'Ensure that all anti-virus mechanisms are maintained as follows:Are kept current. Perform periodic scans. Generate audit logs which are retained per PCI DSS Requirement 10.7. ',
  },
);

const systemComponents = i18n.translate(
  'complianceRequirements.pci.systemComponents',
  {
    defaultMessage:
      'Ensure that all system components and software are protected from known vulnerabilities by installing applicable vendor-supplied security patches. Install critical security patches within one month of release.',
  },
);

const vulnerabilities = i18n.translate(
  'complianceRequirements.pci.vulnerabilities',
  {
    defaultMessage:
      'Address common coding vulnerabilities in software development processes as follows:Train developers in secure coding techniques, including how to avoid common coding vulnerabilities, and understanding how sensitive data is handled in memory. Develop applications based on secure coding guidelines. ',
  },
);

const injectionFlaws = i18n.translate(
  'complianceRequirements.pci.injectionFlaws',
  {
    defaultMessage:
      'Injection flaws, particularly SQL injection. Also consider OS Command Injection, LDAP and XPath injection flaws as well as other injection flaws.',
  },
);

const bufferOverflow = i18n.translate(
  'complianceRequirements.pci.bufferOverflow',
  {
    defaultMessage: 'Buffer overflows',
  },
);

const improperErrorHandling = i18n.translate(
  'complianceRequirements.pci.improperErrorHandling',
  {
    defaultMessage: 'Improper error handling',
  },
);

const crossSiteScripting = i18n.translate(
  'complianceRequirements.pci.crossSiteScripting',
  {
    defaultMessage: 'Cross-site scripting (XSS)',
  },
);
const descp1 = i18n.translate('common.compliance.req.pcidescp1', {
  defaultMessage:
    'Improper access control (such an insecure direct object references, failure to restrict URL access, directory traversal, and failure to restrict user access to functions).',
});
const descp2 = i18n.translate('common.compliance.req.pcidescp2', {
  defaultMessage: 'Broken authentication and session management.',
});
const descp3 = i18n.translate('common.compliance.req.pcidescp3', {
  defaultMessage:
    'For public-facing web applications, address new threats and vulnerabilities on an ongoing basis and ensure these applications are protected against known attacks by either of the following methods:Reviewing public-facing web applications via manual or automated application vulnerability security assessment tools or methods, at least annually and after any changes. Installing an automated technical solution that detects and prevents web-based attacks (for example, a web-application firewall) in front of public-facing web applications, to continually check all traffic.',
});
const descp4 = i18n.translate('common.compliance.req.pcidescp4', {
  defaultMessage:
    'DControl addition, deletion, and modification of user IDs, credentials, and other identifier objects.',
});
const descp5 = i18n.translate('common.compliance.req.pcidescp5', {
  defaultMessage: 'Remove/disable inactive user accounts within 90 days.',
});
const descp6 = i18n.translate('common.compliance.req.pcidescp6', {
  defaultMessage:
    'Manage IDs used by third parties to access, support, or maintain system components via remote access as follows:Enabled only during the time period needed and disabled when not in use. Monitored when in use. ',
});
const descp7 = i18n.translate('common.compliance.req.pcidescp7', {
  defaultMessage:
    'Limit repeated access attempts by locking out the user ID after not more than six attempts.',
});
const descp8 = i18n.translate('common.compliance.req.pcidescp8', {
  defaultMessage:
    'If a session has been idle for more than 15 minutes, require the user to reauthenticate to re-activate the terminal or session.',
});
const descp9 = i18n.translate('common.compliance.req.pcidescp9', {
  defaultMessage:
    'Change user passwords/passphrases at least once every 90 days.',
});
const descp10 = i18n.translate('common.compliance.req.pci.descp10', {
  defaultMessage:
    'Additional requirement for service providers: Service providers with remote access to customer premises (for example, for support of POS systems or servers) must use a unique authentication credential (such as a password/phrase) for each customer.',
});
const descp11 = i18n.translate('common.compliance.req.pci.descp11', {
  defaultMessage:
    'All access to any database containing cardholder data (including access by applications, administrators, and all other users) is restricted as follows:All user access to, user queries of, and user actions on databases are through programmatic methods. Only database administrators have the ability to directly access or query databases. Application IDs for database applications can only be used by the applications (and not by individual users or other non-application processes).',
});
const descp12 = i18n.translate('common.compliance.req.pci.descp12', {
  defaultMessage:
    'Implement audit trails to link all access to system components to each individual user.',
});
const descp13 = i18n.translate('common.compliance.req.pci.descp13', {
  defaultMessage: 'All individual user accesses to cardholder data',
});
const descp14 = i18n.translate('common.compliance.req.pci.descp14', {
  defaultMessage:
    'All actions taken by any individual with root or administrative privileges.',
});
const descp15 = i18n.translate('common.compliance.req.pci.descp15', {
  defaultMessage: 'Invalid logical access attempts',
});
const descp16 = i18n.translate('common.compliance.req.pci.descp16', {
  defaultMessage:
    'Use of and changes to identification and authentication mechanisms including but not limited to creation of new accounts and elevation of privileges and all changes, additions, or deletions to accounts with root or administrative privileges.',
});
const descp17 = i18n.translate('common.compliance.req.pci.descp17', {
  defaultMessage: 'Initialization, stopping, or pausing of the audit logs',
});
const descp18 = i18n.translate('common.compliance.req.pci.descp18', {
  defaultMessage: 'Creation and deletion of system level objects',
});
const descp19 = i18n.translate('common.compliance.req.pci.descp19', {
  defaultMessage: 'Protect audit trail files from unauthorized modifications',
});
const descp20 = i18n.translate('common.compliance.req.pci.descp20', {
  defaultMessage:
    'Use file integrity monitoring or change detection software on logs to ensure that existing log data cannot be changed without generating alerts (although new data being added should not cause an alert).',
});
const descp21 = i18n.translate('common.compliance.req.pci.descp21', {
  defaultMessage:
    'Using time-synchronization technology, synchronize all critical system clocks and times and ensure that the following is implemented for acquiring, distributing, and storing time.',
});
const descp22 = i18n.translate('common.compliance.req.pci.descp22', {
  defaultMessage:
    'Review logs and security events for all system components to identify anomalies or suspicious activity',
});
const descp23 = i18n.translate('common.compliance.req.pci.descp23', {
  defaultMessage:
    'Review the following at least daily: All security events. Logs of all system components that store, process, or transmit CHD and/or SAD, or that could. impact the security of CHD and/or SAD. Logs of all critical system components. Logs of all servers and system components that perform security functions (for example, firewalls, intrusion detection systems/intrusion prevention systems (IDS/IPS), authentication servers, ecommerce redirection servers, etc.).',
});
const descp24 = i18n.translate('common.compliance.req.pci.descp24', {
  defaultMessage:
    'Use intrusion detection and/or intrusion prevention techniques to detect and/or prevent intrusions into the network.Monitor all traffic at the perimeter of the cardholder data environment as well as at critical points in the cardholder data environment, and alert personnel to suspected compromises. Keep all intrusion detection and prevention engines, baselines, and signatures up to date.',
});
const descp25 = i18n.translate('common.compliance.req.pci.descp25', {
  defaultMessage:
    'Deploy a change detection mechanism (for example, file integrity monitoring tools) to alert personnel to unauthorized modification of critical system files, configuration files, or content files; and configure the software to perform critical file comparisons at least weekly.',
});
const descp26 = i18n.translate('common.compliance.req.pci.descp26', {
  defaultMessage:
    'Perform quarterly internal vulnerability scans. Address vulnerabilities and perform rescans to verify all “high risk” vulnerabilities are resolved in accordance with the entity’s vulnerability ranking. Scans must be performed by qualified personnel.',
});
const descp27 = i18n.translate('common.compliance.req.pci.descp27', {
  defaultMessage:
    'Perform internal and external scans, and rescans as needed, after any significant change. Scans must be performed by qualified personnel.',
});
export const pciRequirementsFile = {
  '1.1.1': networkConnection,
  '1.3.4': unauthorizedTraffic,
  '1.4': personalFirewall,
  '2.2': configurationStandards,
  '2.2.2': enableNecessaryServices,
  '2.2.3': additionalSecurityFeatures,
  '2.2.4': securityParameters,
  '4.1': strongCryptography,
  '5.1': antiVirusSoftwares,
  '5.2': antiVirusMechanisms,
  '6.2': systemComponents,
  '6.5': vulnerabilities,
  '6.5.1': injectionFlaws,
  '6.5.2': bufferOverflow,
  '6.5.5': improperErrorHandling,
  '6.5.7': crossSiteScripting,
  '6.5.8': descp1,
  '6.5.10': descp2,
  '6.6': descp3,
  '8.1.2': descp4,
  '8.1.4': descp5,
  '8.1.5': descp6,
  '8.1.6': descp7,
  '8.1.8': descp8,
  '8.2.4': descp9,
  '8.5.1': descp10,
  '8.7': descp11,
  '10.1': descp12,
  '10.2.1': descp13,
  '10.2.2': descp14,
  '10.2.4': descp15,
  '10.2.5': descp16,
  '10.2.6': descp17,
  '10.2.7': descp18,
  '10.5.2': descp19,
  '10.5.5': descp20,
  '10.4': descp21,
  '10.6': descp22,
  '10.6.1': descp23,
  '11.4': descp24,
  '11.5': descp25,
  '11.2.1': descp26,
  '11.2.3': descp27,
};
