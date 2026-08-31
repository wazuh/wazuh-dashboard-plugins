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
import { computeOthersCount, getOthersBuckets } from './compliance-table';

describe('getOthersBuckets', () => {
  const descriptions = {
    '1.1': 'Known requirement 1.1',
    '1.2': 'Known requirement 1.2',
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
});

describe('computeOthersCount', () => {
  const descriptions = {
    '1.1': 'Known requirement 1.1',
    '1.2': 'Known requirement 1.2',
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
});
