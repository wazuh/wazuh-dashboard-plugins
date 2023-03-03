/*
 * Wazuh app - Module for NIST 800-53 requirements
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
 import { i18n } from "@kbn/i18n";

 const ac2 = i18n.translate('wazuh.complianceRequirements.nist.ac2', {
	 defaultMessage:
		 'ACCOUNT MANAGEMENT - Identifies and selects the following types of information system accounts to support organizational missions/business functions.',
 });

 const ac6 = i18n.translate('wazuh.complianceRequirements.nist.ac6', {
	 defaultMessage:
		 'LEAST PRIVILEGE - The organization employs the principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) which are necessary to accomplish assigned tasks in accordance with organizational missions and business functions.',
 });

 const ac7 = i18n.translate('wazuh.complianceRequirements.nist.ac7', {
	 defaultMessage:
		 'UNSUCCESSFUL LOGON ATTEMPTS - Enforces a limit of consecutive invalid logon attempts by a user during a time period.',
 });

 const ac12 = i18n.translate('wazuh.complianceRequirements.nist.ac12', {
	 defaultMessage:
		 'SESSION TERMINATION - The information system automatically terminates a user session.',
 });

	const au5 = i18n.translate('wazuh.complianceRequirements.nist.au5', {
		defaultMessage:
			'RESPONSE TO AUDIT PROCESSING FAILURES - The information system alerts organization-defined personnel or roles in the event of an audit processing failure and takes organization-defined actions to be taken (e.g., shut down information system, overwrite oldest audit records, stop generating audit records).',
	});

	const au6 = i18n.translate('wazuh.complianceRequirements.nist.au66', {
		defaultMessage:
			'AUDIT REVIEW, ANALYSIS, AND REPORTING - Reviews and analyzes information system audit records.',
	});

	const au8 = i18n.translate('wazuh.complianceRequirements.nist.au8', {
		defaultMessage:
			'TIME STAMPS - Uses internal system clocks to generate time stamps for audit records and records time stamps for audit records.',
	});

	const au9 = i18n.translate('wazuh.complianceRequirements.nist.au9', {
		defaultMessage:
			'PROTECTION OF AUDIT INFORMATION - The information system protects audit information and audit tools from unauthorized access, modification, and deletion.',
	});

	const au12 = i18n.translate('wazuh.complianceRequirements.nist.au12', {
		defaultMessage:
			'AUDIT GENERATION - The information system provides audit record generation capability for the auditable events at organization-defined information system components, allows organization-defined personnel or roles to select which auditable events are to be audited by specific components of the information system and generates audit records.',
	});
	const ca3 = i18n.translate('wazuh.complianceRequirements.nist.ca3', {
		defaultMessage:
			'SYSTEM INTERCONNECTIONS - Authorizes connections from the information system to other information systems through the use of Interconnection Security Agreements, Documents, for each interconnection, the interface characteristics, security requirements, and the nature of the information communicated and Reviews and updates Interconnection Security Agreements',
	});

	const cm1 = i18n.translate('wazuh.complianceRequirements.nist.cm1', {
		defaultMessage:
			'CONFIGURATION MANAGEMENT POLICY AND PROCEDURES - Develops, documents, and disseminates to a configuration management policy. Revies and updates the current configuration management policy and procedures.',
	});

	const cm3 = i18n.translate('wazuh.complianceRequirements.nist.cm3', {
		defaultMessage:
			'CONFIGURATION CHANGE CONTROL - The organization determines the types of changes to the information system that are configuration-controlled. ',
	});

	const cm5 = i18n.translate('wazuh.complianceRequirements.nist.cm5', {
		defaultMessage:
			'ACCESS RESTRICTIONS FOR CHANGE - The organization defines, documents, approves, and enforces physical and logical access restrictions associated with changes to the information system.',
	});

	const ia4 = i18n.translate('wazuh.complianceRequirements.nist.ia4', {
		defaultMessage:
			'IDENTIFIER MANAGEMENT - The organization manages information system identifiers by: Receiving authorization from organization-defined personnel or roles to assign an individual, group, role, or device identifier. Selecting an identifier that identifies an individual, group, role, or device. Assigning the identifier to the intended individual, group, role, or device. Preventing reuse of identifiers for a organization-defined time period. Disabling the identifier after organization-defined time period of inactivity.',
	});

	const ia5 = i18n.translate('wazuh.complianceRequirements.nist.ia5', {
		defaultMessage:
			'AUTHENTICATOR MANAGEMENT - The organization manages information system authenticators by verifying, as part of the initial authenticator distribution, the identity of the individual, group role, or device receiving the authenticator.',
	});

	const ia10 = i18n.translate('wazuh.complianceRequirements.nist.ia10', {
		defaultMessage:
			'ADAPTIVE IDENTIFICATION AND AUTHENTICATION - The organization requires that individuals accessing the information system employ organization-defined supplemental authentication techniques or mechanisms under specific organization-defined circumstances or situations. ',
	});

	const sa11 = i18n.translate('wazuh.complianceRequirements.nist.sa11', {
		defaultMessage:
			'DEVELOPER SECURITY TESTING AND EVALUATION - The organization requires the developer of the information system, system component, or information system service to create and implement a security assessment plan.',
	});

	const sc2 = i18n.translate('wazuh.complianceRequirements.nist.sc2', {
		defaultMessage:
			'APPLICATION PARTITIONING - The information system separates user functionality (including user interface services) from information system management functionality.',
	});

	const sc7 = i18n.translate('wazuh.complianceRequirements.nist.sc7', {
		defaultMessage:
			'BOUNDARY PROTECTION - The information system monitors and controls communications at the external boundary of the system and at key internal boundaries within the system.',
	});

	const sc8 = i18n.translate('wazuh.complianceRequirements.nist.sc8', {
		defaultMessage:
			'TRANSMISSION CONFIDENTIALITY AND INTEGRITY - The information system protects the confidentiality and integrity of transmitted information.',
	});

	const si2 = i18n.translate('wazuh.complianceRequirements.nist.si2', {
    defaultMessage:
      'FLAW REMEDIATION - The organization identifies, reports, and corrects information system flaws; tests software and firmware updates related to flaw remediation for effectiveness and potential side effects before installation; installs security-relevant software and firmware updates within organizationdefined time period of the release of the updates and  incorporates flaw remediation into the organizational configuration management process.',
  });

	const si3 = i18n.translate('wazuh.complianceRequirements.nist.si3', {
    defaultMessage:
      'MALICIOUS CODE PROTECTION - The organization employs malicious code protection mechanisms at information system entry and exit points to detect and eradicate malicious code, updates malicious code protection mechanisms whenever new releases are available in accordance with organizational configuration management policy and procedures, configures malicious code protection mechanisms and addresses the receipt of false positives during malicious code detection and eradication and the resulting potential impact on the availability of the information system.',
  });

	const si7 = i18n.translate('wazuh.complianceRequirements.nist.si7', {
    defaultMessage:
      'SOFTWARE, FIRMWARE, AND INFORMATION INTEGRITY - The organization employs integrity verification tools to detect unauthorized changes to organization-defined software, firmware, and information.',
  });
export const nistRequirementsFile = {
	'AC.2': ac2,
	'AC.6': ac6,
	'AC.7': ac7,
	'AC.12': ac12,
	'AU.5': au5,
	'AU.6': au6,
	'AU.8': au8,
	'AU.9': au9,
	'AU.12': au12,
	'CA.3': ca3,
	'CM.1': cm1,
	'CM.3': cm3,
	'CM.5': cm5,
	'IA.4': ia4,
	'IA.5': ia5,
	'IA.10': ia10,
	'SA.11': sa11,
	'SC.2': sc2,
	'SC.7': sc7,
	'SC.8': sc8,
	'SI.2': si2,
	'SI.3': si3,
	'SI.7': si7,
};
