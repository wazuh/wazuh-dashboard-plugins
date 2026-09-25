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
  getOthersBuckets,
  buildComplianceObject,
} from './compliance-table';
import { WAZUH_MODULES_ID } from '../../../../common/constants';
import { gdprRequirementsFile } from '../../../../common/compliance-requirements/gdpr-requirements';
import { hipaaRequirementsFile } from '../../../../common/compliance-requirements/hipaa-requirements';

describe('getOthersBuckets', () => {
  const descriptions = {
    '1.1': { title: 'Known requirement 1.1' },
    '1.2': { title: 'Known requirement 1.2' },
  };

  it('returns an empty array when every bucket key is known', () => {
    const buckets = [
      { key: '1.1', doc_count: 5 },
      { key: '1.2', doc_count: 3 },
    ];
    expect(getOthersBuckets(descriptions, buckets)).toEqual([]);
  });

  it('returns only the buckets whose key is not known, including mixed known/unknown data', () => {
    const buckets = [
      { key: '1.1', doc_count: 5 },
      { key: 'unknown-code-a', doc_count: 2 },
      { key: 'unknown-code-b', doc_count: 7 },
    ];
    expect(getOthersBuckets(descriptions, buckets)).toEqual([
      { key: 'unknown-code-a', doc_count: 2 },
      { key: 'unknown-code-b', doc_count: 7 },
    ]);
  });

  it('returns an empty array for an empty bucket list', () => {
    expect(getOthersBuckets(descriptions, [])).toEqual([]);
  });

  // A finding can name a requirement with the ruleset's own compliance tag
  // instead of the standard's identifier; that is a known code, not an "Other".
  it('treats a bucket keyed by an alias as known', () => {
    const buckets = [
      { key: '1.1.legacy', doc_count: 4 },
      { key: 'unknown-code', doc_count: 2 },
    ];
    expect(
      getOthersBuckets(descriptions, buckets, { '1.1.legacy': '1.1' }),
    ).toEqual([{ key: 'unknown-code', doc_count: 2 }]);
  });
});

describe('computeOthersCount', () => {
  const descriptions = {
    '1.1': { title: 'Known requirement 1.1' },
    '1.2': { title: 'Known requirement 1.2' },
  };

  it('returns 0 when every bucket key is known', () => {
    const buckets = [
      { key: '1.1', doc_count: 5 },
      { key: '1.2', doc_count: 3 },
    ];
    expect(computeOthersCount(descriptions, buckets)).toBe(0);
  });

  it('sums doc_count for every bucket key that is not known', () => {
    const buckets = [
      { key: '1.1', doc_count: 5 },
      { key: 'unknown-code-a', doc_count: 2 },
      { key: 'unknown-code-b', doc_count: 7 },
    ];
    expect(computeOthersCount(descriptions, buckets)).toBe(9);
  });

  it('sums doc_count across only-unknown buckets', () => {
    const buckets = [
      { key: 'unknown-code-a', doc_count: 2 },
      { key: 'unknown-code-b', doc_count: 7 },
    ];
    expect(computeOthersCount(descriptions, buckets)).toBe(9);
  });

  it('returns 0 for an empty bucket list', () => {
    expect(computeOthersCount(descriptions, [])).toBe(0);
  });

  it('does not count buckets keyed by an alias', () => {
    const buckets = [
      { key: '1.1.legacy', doc_count: 4 },
      { key: 'unknown-code', doc_count: 2 },
    ];
    expect(
      computeOthersCount(descriptions, buckets, { '1.1.legacy': '1.1' }),
    ).toBe(2);
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
