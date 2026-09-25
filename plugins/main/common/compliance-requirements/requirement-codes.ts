/*
 * Wazuh app - Codes of a regulatory compliance requirement
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { ComplianceRequirement } from './types';

/**
 * How the compliance tag values of a framework resolve to its requirements.
 *
 * `aliases` is the bridge the definition file declares. `derive` covers the
 * codes it does not list one by one: the Wazuh ruleset writes a requirement
 * down to its paragraph and point, and a standard defines no bound on those,
 * so they cannot be enumerated.
 */
export interface RequirementResolver {
  aliases?: Record<string, string>;
  derive?: (code: string) => string | undefined;
}

/**
 * Resolve one compliance tag value to the requirement it belongs to
 * @param code value of a finding's compliance field
 * @param requirements requirements of the framework
 * @param resolver aliases and derivation rule of the framework
 * @returns the requirement, or undefined when the code is not one of the
 * framework's documented requirements
 */
export function resolveRequirement(
  code: string,
  requirements: Record<string, ComplianceRequirement>,
  resolver: RequirementResolver = {},
): string | undefined {
  if (requirements[code]) {
    return code;
  }

  const alias = resolver.aliases?.[code];

  if (alias && requirements[alias]) {
    return alias;
  }

  const derived = resolver.derive?.(code);

  return derived && requirements[derived] ? derived : undefined;
}

/**
 * Index the compliance values a search returned by the requirement they belong
 * to.
 *
 * The codes come from the data rather than from the definitions because a
 * derived code cannot be enumerated, and because only the codes findings
 * actually carry need counting or filtering.
 * @param buckets buckets of the terms aggregation over the compliance field
 * @param requirements requirements of the framework
 * @param resolver aliases and derivation rule of the framework
 * @returns the codes of each requirement, and the codes no requirement claims
 */
export function indexRequirementCodes(
  buckets: Array<{ key: string; doc_count: number }>,
  requirements: Record<string, ComplianceRequirement>,
  resolver: RequirementResolver = {},
) {
  const codesByRequirement = new Map<string, string[]>();
  const unknownBuckets: Array<{ key: string; doc_count: number }> = [];

  for (const bucket of buckets) {
    const requirement = resolveRequirement(bucket.key, requirements, resolver);

    if (!requirement) {
      unknownBuckets.push(bucket);
      continue;
    }

    codesByRequirement.set(requirement, [
      ...(codesByRequirement.get(requirement) || []),
      bucket.key,
    ]);
  }

  return { codesByRequirement, unknownBuckets };
}

/**
 * Wazuh ruleset notation for GDPR: the chapter in roman numerals, the article,
 * and optionally the paragraph and the point (`IV_32.1.a`). Some rules cite the
 * article alone (`32`). The article is the requirement.
 */
const GDPR_RULESET_CODE = /^(?:[IVXLC]+_)?(\d+)(?:[._]\S*)?$/;

export function deriveGdprArticle(code: string) {
  const article = GDPR_RULESET_CODE.exec(code)?.[1];

  return article ? `Article ${article}` : undefined;
}

/**
 * Wazuh ruleset notation for HIPAA: the CFR citation with every subdivision as
 * a dotted segment (`164.312.a.2.iii`), where the CFR parenthesises them
 * (`164.312(a)(2)(iii)`).
 *
 * A code that cites a standard without the clause the CFR numbers it with
 * (`164.312.e`) resolves to that first clause, the way the definition files
 * already bridge `164.312.e` to `164.312(e)(1)`.
 */
const HIPAA_RULESET_CODE = /^(\d+\.\d+)((?:\.[A-Za-z0-9]+)+)$/;
const HIPAA_FIRST_CLAUSES = ['(1)', '(i)'];

export function deriveHipaaCitation(
  requirements: Record<string, ComplianceRequirement>,
) {
  return (code: string) => {
    const match = HIPAA_RULESET_CODE.exec(code);

    if (!match) {
      return undefined;
    }

    const [, section, subdivisions] = match;
    const citation = `${section}${subdivisions
      .slice(1)
      .split('.')
      .map(subdivision => `(${subdivision})`)
      .join('')}`;

    if (requirements[citation]) {
      return citation;
    }

    return HIPAA_FIRST_CLAUSES.map(clause => `${citation}${clause}`).find(
      candidate => requirements[candidate],
    );
  };
}

/**
 * Codes that cite a parent of a requirement, from the most specific parent to
 * the least, so a code the framework no longer defines still resolves to the
 * requirement that superseded it (`21.2.a.1` to `21.2.a`, `23.4` to `23`).
 */
export function deriveDottedParent(
  requirements: Record<string, ComplianceRequirement>,
) {
  return (code: string) => {
    const segments = code.split('.');

    for (let length = segments.length - 1; length > 0; length--) {
      const parent = segments.slice(0, length).join('.');

      if (requirements[parent]) {
        return parent;
      }
    }

    return undefined;
  };
}
