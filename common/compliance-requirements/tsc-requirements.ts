/*
 * Wazuh app - Module for TSC requirements
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

const a11 = i18n.translate('wazuh.complianceRequirements.tsc.a11', {
	defaultMessage:
		'The entity maintains, monitors, and evaluates current processing capacity and use of system components (infrastructure, data, and software) to manage capacity demand and to enable the implementation of additional capacity to help meet its objectives.',
});

const a12 = i18n.translate('wazuh.complianceRequirements.tsc.a12', {
	defaultMessage:
		'The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections, software, data backup processes, and recovery infrastructure to meet its objectives.',
});

const cc51 = i18n.translate('wazuh.complianceRequirements.tsc.cc51', {
	defaultMessage:
		'The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels.',
});

const cc52 = i18n.translate('wazuh.complianceRequirements.tsc.cc52', {
	defaultMessage:
		'The entity also selects and develops general control activities over technology to support the achievement of objectives.',
});

const cc61 = i18n.translate('wazuh.complianceRequirements.tsc.cc61', {
	defaultMessage:
		"The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity's objectives.",
});

const cc62 = i18n.translate('wazuh.complianceRequirements.tsc.cc62', {
	defaultMessage:
		'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users whose access is administered by the entity. For those users whose access is administered by the entity, user system credentials are removed when user access is no longer authorized.',
});

const cc63 = i18n.translate('wazuh.complianceRequirements.tsc.cc63', {
	defaultMessage:
		"The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles, responsibilities, or the system design and changes, giving consideration to the concepts of least privilege and segregation of duties, to meet the entity’s objectives.",
});

const cc64 = i18n.translate('wazuh.complianceRequirements.tsc.cc64', {
	defaultMessage:
		"The entity restricts physical access to facilities and protected information assets (for example, data center facilities, backup media storage, and other sensitive locations) to authorized personnel to meet the entity’s objectives",
});
const cc66 = i18n.translate('wazuh.complianceRequirements.tsc.cc66', {
	defaultMessage:
		'The entity implements logical access security measures to protect against threats from sources outside its system boundaries.',
});

const cc67 = i18n.translate('wazuh.complianceRequirements.tsc.cc67', {
	defaultMessage:
		"The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes, and protects it during transmission, movement, or removal to meet the entity’s objectives.",
});

const cc68 = i18n.translate('wazuh.complianceRequirements.tsc.cc68', {
	defaultMessage:
		"The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software to meet the entity’s objectives.",
});

const cc71 = i18n.translate('wazuh.complianceRequirements.tsc.cc71', {
	defaultMessage:
		"To meet its objectives, the entity uses detection and monitoring procedures to identify (1) changes to configurations that result in the introduction of new vulnerabilities, and (2) susceptibilities to newly discovered vulnerabilities.",
});

const cc72 = i18n.translate('wazuh.complianceRequirements.tsc.cc72', {
	defaultMessage:
		"The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors affecting the entity's ability to meet its objectives; anomalies are analyzed to determine whether they represent security events.",
});

const cc73 = i18n.translate('wazuh.complianceRequirements.tsc.cc73', {
  defaultMessage:
    'The entity evaluates security events to determine whether they could or have resulted in a failure of the entity to meet its objectives (security incidents) and, if so, takes actions to prevent or address such failures.',
});

const cc74 = i18n.translate('wazuh.complianceRequirements.tsc.cc74', {
  defaultMessage:
    'The entity responds to identified security incidents by executing a defined incident-response program to understand, contain, remediate, and communicate security incidents, as appropriate.',
});

const cc81 = i18n.translate('wazuh.complianceRequirements.tsc.cc81', {
  defaultMessage:
    "The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives",
});

const pt14 = i18n.translate('wazuh.complianceRequirements.tsc.pt14', {
  defaultMessage:
    "The entity implements policies and procedures to make available or deliver output completely, accurately, and timely in accordance with specifications to meet the entity’s objectives.",
});

const pt15 = i18n.translate('wazuh.complianceRequirements.tsc.pt15', {
  defaultMessage:
    "The entity implements policies and procedures to store inputs, items in processing, and outputs completely, accurately, and timely in accordance with system specifications to meet the entity’s objectives.",
});
export const tscRequirementsFile = {
	'A1.1': a11,
	'A1.2': a12,
	'CC5.1': cc51,
	'CC5.2': cc52,
	'CC6.1': cc61,
	'CC6.2': cc62,
	'CC6.3': cc63,
	'CC6.4': cc64,
	'CC6.6': cc66,
	'CC6.7': cc67,
	'CC6.8': cc68,
	'CC7.1': cc71,
	'CC7.2': cc72,
	'CC7.3': cc73,
	'CC7.4': cc74,
	'CC8.1': cc81,
	'PI1.4': pt14,
	'PI1.5': pt15,
};
