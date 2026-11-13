/*
 * Wazuh app - Regulatory compliance frameworks
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WAZUH_MODULES_ID } from '../constants';
import { pciRequirementsFile } from './pci-requirements';
import {
  gdprRequirementsAliases,
  gdprRequirementsFile,
} from './gdpr-requirements';
import {
  hipaaRequirementsAliases,
  hipaaRequirementsFile,
} from './hipaa-requirements';
import { nistRequirementsFile } from './nist-requirements';
import { nist171RequirementsFile } from './nist-171-requirements';
import { tscRequirementsFile } from './tsc-requirements';
import { iso27001RequirementsFile } from './iso27001-requirements';
import {
  cmmcRequirementsAliases,
  cmmcRequirementsFile,
} from './cmmc-requirements';
import { fedrampRequirementsFile } from './fedramp-requirements';
import { nis2RequirementsFile } from './nis2-requirements';
import { ComplianceRequirement } from './types';
import {
  deriveDottedParent,
  deriveGdprArticle,
  deriveHipaaCitation,
  RequirementResolver,
  resolveRequirement,
} from './requirement-codes';
import { getRequirementName } from './requirement-text';

// HIPAA identifiers name a standard and, under it, its implementation
// specifications: 164.312(a)(1) is the "Access control" standard and
// 164.312(a)(2)(i-iv) are its specifications. The standard is the unit a
// compliance state is assessed against, so every specification groups under it.
const HIPAA_STANDARD = /^(\d+\.\d+\([a-z]\))/;

function getHipaaStandard(requirement: string) {
  return HIPAA_STANDARD.exec(requirement)?.[1] || requirement;
}

// GDPR is not written as a control framework: its hierarchy is chapter,
// article, paragraph and point, and the article is the unit a compliance state
// is cited and assessed against. The chapter is the only grouping the
// Regulation itself defines, and the article number determines it.
const GDPR_CHAPTERS: Array<{ chapter: string; upTo: number }> = [
  { chapter: 'I', upTo: 4 },
  { chapter: 'II', upTo: 11 },
  { chapter: 'III', upTo: 23 },
  { chapter: 'IV', upTo: 43 },
  { chapter: 'V', upTo: 50 },
  { chapter: 'VI', upTo: 59 },
  { chapter: 'VII', upTo: 76 },
  { chapter: 'VIII', upTo: 84 },
  { chapter: 'IX', upTo: 91 },
  { chapter: 'X', upTo: 93 },
  { chapter: 'XI', upTo: 99 },
];

function getGdprChapter(requirement: string) {
  const article = Number(requirement.replace(/\D/g, ''));
  const chapter = GDPR_CHAPTERS.find(({ upTo }) => article <= upTo);

  return chapter && article ? chapter.chapter : requirement;
}

// A NIS2 requirement is an article of the Directive, or one of the points of
// Article 21(2), which is the article the cybersecurity risk-management
// measures live in. A point is assessed as part of its article.
function getNis2Group(requirement: string) {
  return requirement.split('.')[0];
}

export interface FrameworkDefinition {
  // Field of the findings that holds the requirements of the framework.
  field: string;
  requirements: Record<string, ComplianceRequirement>;
  // Grouping of the left panel: the number of segments of the identifier that
  // name the group and their separator, or the rule that derives it.
  entriesBySeparator?: number;
  separator?: string;
  getGroup?: (requirement: string) => string;
  resolver: RequirementResolver;
}

// How each framework names its requirements, groups them, and resolves the
// compliance tag values the Wazuh ruleset writes for them.
const FRAMEWORKS: Record<string, FrameworkDefinition> = {
  [WAZUH_MODULES_ID.PCI_DSS]: {
    field: 'wazuh.rule.compliance.pci_dss',
    requirements: pciRequirementsFile,
    entriesBySeparator: 1,
    separator: '.',
    resolver: {},
  },
  [WAZUH_MODULES_ID.GDPR]: {
    field: 'wazuh.rule.compliance.gdpr',
    requirements: gdprRequirementsFile,
    getGroup: getGdprChapter,
    resolver: {
      aliases: gdprRequirementsAliases,
      derive: deriveGdprArticle,
    },
  },
  [WAZUH_MODULES_ID.HIPAA]: {
    field: 'wazuh.rule.compliance.hipaa',
    requirements: hipaaRequirementsFile,
    getGroup: getHipaaStandard,
    resolver: {
      aliases: hipaaRequirementsAliases,
      derive: deriveHipaaCitation(hipaaRequirementsFile),
    },
  },
  [WAZUH_MODULES_ID.NIST_800_53]: {
    field: 'wazuh.rule.compliance.nist_800_53',
    requirements: nistRequirementsFile,
    entriesBySeparator: 1,
    separator: '-',
    resolver: {},
  },
  [WAZUH_MODULES_ID.NIST_800_171]: {
    field: 'wazuh.rule.compliance.nist_800_171',
    requirements: nist171RequirementsFile,
    entriesBySeparator: 2,
    separator: '.',
    resolver: {},
  },
  [WAZUH_MODULES_ID.TSC]: {
    field: 'wazuh.rule.compliance.tsc',
    requirements: tscRequirementsFile,
    entriesBySeparator: 1,
    separator: '.',
    resolver: {},
  },
  [WAZUH_MODULES_ID.ISO_27001]: {
    field: 'wazuh.rule.compliance.iso_27001',
    requirements: iso27001RequirementsFile,
    entriesBySeparator: 2,
    separator: '.',
    resolver: {},
  },
  [WAZUH_MODULES_ID.CMMC]: {
    field: 'wazuh.rule.compliance.cmmc',
    requirements: cmmcRequirementsFile,
    entriesBySeparator: 1,
    separator: '.',
    resolver: { aliases: cmmcRequirementsAliases },
  },
  [WAZUH_MODULES_ID.NIS2]: {
    field: 'wazuh.rule.compliance.nis2',
    requirements: nis2RequirementsFile,
    getGroup: getNis2Group,
    // The ruleset cites paragraphs and points of an article the Directive
    // does not number as requirements of their own.
    resolver: { derive: deriveDottedParent(nis2RequirementsFile) },
  },
  [WAZUH_MODULES_ID.FEDRAMP]: {
    field: 'wazuh.rule.compliance.fedramp',
    requirements: fedrampRequirementsFile,
    // A FedRAMP identifier is a NIST 800-53 one, so it groups by family.
    entriesBySeparator: 1,
    separator: '-',
    resolver: {},
  },
};

export function getFrameworkDefinition(
  section: string,
): FrameworkDefinition | undefined {
  return FRAMEWORKS[section];
}

/**
 * Label of a compliance tag value of the findings: the value, followed by the
 * name of the requirement it belongs to when it resolves to one. The value is
 * kept as the findings write it, so the label still matches their filters.
 * @param section id of the framework module
 * @param code value of a finding's compliance field
 * @returns the label, the value alone when it is not a known requirement
 */
export function getRequirementCodeLabel(section: string, code: string): string {
  const definition = getFrameworkDefinition(section);

  if (!definition) {
    return code;
  }

  const requirement = resolveRequirement(
    code,
    definition.requirements,
    definition.resolver,
  );
  const name = requirement
    ? getRequirementName(definition.requirements[requirement])
    : '';

  return name ? `${code} - ${name}` : code;
}
