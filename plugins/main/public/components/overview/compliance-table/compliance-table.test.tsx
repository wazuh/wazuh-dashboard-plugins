/*
 * Wazuh app - Compliance table component tests
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
/* eslint-disable camelcase */
import {
  computeOthersCount,
  buildComplianceObject,
  buildRequirementFilter,
  getFrameworkDefinition,
} from './compliance-table';
import { WAZUH_MODULES_ID } from '../../../../common/constants';
import { gdprRequirementsFile } from '../../../../common/compliance-requirements/gdpr-requirements';
import { hipaaRequirementsFile } from '../../../../common/compliance-requirements/hipaa-requirements';

describe('computeOthersCount', () => {
  it('totals the findings of the codes no requirement claims', () => {
    expect(
      computeOthersCount([
        { key: 'unknown-a', doc_count: 2 },
        { key: 'unknown-b', doc_count: 7 },
      ]),
    ).toBe(9);
  });

  it('returns 0 when every code is known', () => {
    expect(computeOthersCount([])).toBe(0);
  });
});

describe('getFrameworkDefinition', () => {
  // A FedRAMP identifier is a NIST 800-53 one (AC-2(1)) and holds no dot, so
  // splitting it on dots gave one group per control.
  it('groups FedRAMP by control family, like NIST 800-53', () => {
    const fedramp = getFrameworkDefinition(WAZUH_MODULES_ID.FEDRAMP);
    const nist = getFrameworkDefinition(WAZUH_MODULES_ID.NIST_800_53);

    expect([fedramp.entriesBySeparator, fedramp.separator]).toEqual([1, '-']);
    expect([nist.entriesBySeparator, nist.separator]).toEqual([1, '-']);
  });

  it('resolves the ruleset notation of every framework that has one', () => {
    for (const section of [
      WAZUH_MODULES_ID.GDPR,
      WAZUH_MODULES_ID.HIPAA,
      WAZUH_MODULES_ID.CMMC,
      WAZUH_MODULES_ID.NIS2,
    ]) {
      const { resolver } = getFrameworkDefinition(section);

      expect(resolver.aliases || resolver.derive).toBeDefined();
    }
  });
});

describe('buildComplianceObject grouping', () => {
  // GDPR is grouped by the chapter of the Regulation, the only grouping the
  // Regulation itself defines; the article stays the requirement.
  it('groups every GDPR article under its chapter', () => {
    const { complianceObject, descriptions } = buildComplianceObject({
      section: WAZUH_MODULES_ID.GDPR,
    });

    expect(Object.keys(descriptions)).toHaveLength(
      Object.keys(gdprRequirementsFile).length,
    );
    expect(Object.keys(complianceObject).sort()).toEqual(
      [
        'I',
        'II',
        'III',
        'IV',
        'IX',
        'V',
        'VI',
        'VII',
        'VIII',
        'X',
        'XI',
      ].sort(),
    );
    expect(complianceObject['II']).toContain('Article 5');
    expect(complianceObject['IV']).toContain('Article 32');
    // Every article belongs to exactly one chapter.
    expect(Object.values(complianceObject).flat().sort()).toEqual(
      Object.keys(gdprRequirementsFile).sort(),
    );
  });

  // A HIPAA implementation specification is assessed through the standard it
  // belongs to, so 164.312(a)(2)(i) groups under 164.312(a).
  it('groups every HIPAA implementation specification under its standard', () => {
    const { complianceObject } = buildComplianceObject({
      section: WAZUH_MODULES_ID.HIPAA,
    });

    expect(Object.keys(complianceObject)).toHaveLength(15);
    expect(complianceObject['164.312(a)']).toEqual(
      expect.arrayContaining(['164.312(a)(1)', '164.312(a)(2)(i)']),
    );
    expect(Object.values(complianceObject).flat().sort()).toEqual(
      Object.keys(hipaaRequirementsFile).sort(),
    );
  });
});

describe('buildRequirementFilter', () => {
  const field = 'wazuh.rule.compliance.hipaa';

  // The ruleset writes HIPAA in its own notation, so the findings of a
  // requirement can carry no occurrence of the identifier of the standard.
  // Filtering by that identifier would open a view with no findings at all,
  // while the tile counts the ones carrying the ruleset code.
  it('filters by the code the findings carry, not by the requirement', () => {
    const [filter] = buildRequirementFilter(
      field,
      ['164.308.a.1.ii.D'],
      'index-pattern',
    );

    expect(filter.query).toEqual({
      match: {
        [field]: { query: '164.308.a.1.ii.D', type: 'phrase' },
      },
    });
    expect(filter.meta.value).toBe('164.308.a.1.ii.D');
  });

  it('accepts every code when a requirement is written in more than one', () => {
    const [filter] = buildRequirementFilter(
      field,
      ['164.312(e)(1)', '164.312.e', '164.312.e.1'],
      'index-pattern',
    );

    expect(filter.meta.params).toEqual([
      '164.312(e)(1)',
      '164.312.e',
      '164.312.e.1',
    ]);
  });

  it('returns no filter when the requirement has no code', () => {
    expect(buildRequirementFilter(field, [], 'index-pattern')).toEqual([]);
  });
});
