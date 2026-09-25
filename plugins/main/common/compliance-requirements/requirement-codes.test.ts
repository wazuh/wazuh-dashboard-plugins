/*
 * Wazuh app - Tests for the compliance requirement codes
 * Copyright (C) 2015-2026 Wazuh, Inc.
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
  deriveDottedParent,
  deriveGdprArticle,
  deriveHipaaCitation,
  indexRequirementCodes,
  resolveRequirement,
} from './requirement-codes';
import {
  gdprRequirementsAliases,
  gdprRequirementsFile,
} from './gdpr-requirements';
import {
  hipaaRequirementsAliases,
  hipaaRequirementsFile,
} from './hipaa-requirements';
import { nis2RequirementsFile } from './nis2-requirements';

describe('resolveRequirement', () => {
  const requirements = { 'A.5.1': { title: 'Policies' } };

  it('resolves a requirement named by its own identifier', () => {
    expect(resolveRequirement('A.5.1', requirements)).toBe('A.5.1');
  });

  it('resolves a code the alias map bridges', () => {
    expect(
      resolveRequirement('legacy.1', requirements, {
        aliases: { 'legacy.1': 'A.5.1' },
      }),
    ).toBe('A.5.1');
  });

  it('resolves a code the derivation rule claims', () => {
    expect(
      resolveRequirement('anything', requirements, {
        derive: () => 'A.5.1',
      }),
    ).toBe('A.5.1');
  });

  it('returns undefined when nothing claims the code', () => {
    expect(resolveRequirement('A.9.2.1', requirements)).toBeUndefined();
  });

  it('never resolves to a requirement the framework does not define', () => {
    expect(
      resolveRequirement('legacy.1', requirements, {
        aliases: { 'legacy.1': 'A.99.9' },
        derive: () => 'A.99.9',
      }),
    ).toBeUndefined();
  });
});

describe('deriveGdprArticle', () => {
  // The ruleset cites the chapter, the article and, optionally, the paragraph
  // and the point. Every one of those names the same article.
  it.each([
    ['IV_32.1.a', 'Article 32'],
    ['IV_32.2', 'Article 32'],
    ['IV_30.1.g', 'Article 30'],
    ['IV_35.11', 'Article 35'],
    ['II_5.1.b', 'Article 5'],
    ['32', 'Article 32'],
  ])('derives %s to %s', (code, article) => {
    expect(deriveGdprArticle(code)).toBe(article);
  });

  it('resolves every GDPR code the 5.0.0 ruleset writes', () => {
    const codes = [
      'IV_25.1',
      'IV_25.2',
      'IV_30.1.a',
      'IV_30.2.d',
      'IV_30.5',
      'IV_32.3',
      'IV_33.3.b',
      'IV_35.7.d',
      'II_5.1.f',
      'V_5.1.f',
    ];

    for (const code of codes) {
      expect(
        resolveRequirement(code, gdprRequirementsFile, {
          aliases: gdprRequirementsAliases,
          derive: deriveGdprArticle,
        }),
      ).toBeDefined();
    }
  });
});

describe('deriveHipaaCitation', () => {
  const derive = deriveHipaaCitation(hipaaRequirementsFile);

  it('parenthesises the subdivisions the ruleset writes with dots', () => {
    expect(derive('164.312.a.2.iii')).toBe('164.312(a)(2)(iii)');
  });

  it('resolves a standard cited without its first clause', () => {
    expect(derive('164.308.a.1')).toBe('164.308(a)(1)(i)');
    expect(derive('164.312.e')).toBe('164.312(e)(1)');
  });

  it('claims nothing outside the Security Rule', () => {
    // 164.530 belongs to the Privacy Rule, which this framework does not cover.
    expect(
      resolveRequirement('164.530.c', hipaaRequirementsFile, {
        aliases: hipaaRequirementsAliases,
        derive,
      }),
    ).toBeUndefined();
  });
});

describe('deriveDottedParent', () => {
  const derive = deriveDottedParent(nis2RequirementsFile);

  it('resolves a code citing a paragraph of a requirement', () => {
    expect(derive('21.2.a.1')).toBe('21.2.a');
    expect(derive('23.4')).toBe('23');
    expect(derive('21.1')).toBe('21');
  });
});

describe('indexRequirementCodes', () => {
  const requirements = { 'Article 32': { title: 'Security of processing' } };
  const resolver = { derive: deriveGdprArticle };

  it('groups every code of a requirement together', () => {
    const { codesByRequirement } = indexRequirementCodes(
      [
        { key: 'Article 32', doc_count: 3 },
        { key: 'IV_32.1.a', doc_count: 5 },
        { key: 'IV_32.2', doc_count: 7 },
      ],
      requirements,
      resolver,
    );

    expect(codesByRequirement.get('Article 32')).toEqual([
      'Article 32',
      'IV_32.1.a',
      'IV_32.2',
    ]);
  });

  it('collects the codes no requirement claims', () => {
    const { unknownBuckets } = indexRequirementCodes(
      [
        { key: 'IV_32.1.a', doc_count: 5 },
        { key: 'made-up', doc_count: 2 },
      ],
      requirements,
      resolver,
    );

    expect(unknownBuckets).toEqual([{ key: 'made-up', doc_count: 2 }]);
  });
});
