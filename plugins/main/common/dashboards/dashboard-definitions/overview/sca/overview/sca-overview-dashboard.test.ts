/*
 * Wazuh app - Tests for the SCA overview dashboard definition
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import fs from 'fs';
import path from 'path';

const definitionPath = path.join(__dirname, 'sca-overview-dashboard.ndjson');

const savedObjects = fs
  .readFileSync(definitionPath, 'utf8')
  .split(/\r?\n/)
  .filter(line => line.trim())
  .map(line => JSON.parse(line));

const getSavedObject = (id: string) =>
  savedObjects.find(savedObject => savedObject.id === id);

describe('SCA overview dashboard definition', () => {
  describe('top checks visualization', () => {
    const visualization = getSavedObject('sca-top-checks-check.name');
    const searchSource = JSON.parse(
      visualization.attributes.kibanaSavedObjectMeta.searchSourceJSON,
    );

    it('counts only failed checks', () => {
      expect(searchSource.filter).toEqual([
        expect.objectContaining({
          meta: expect.objectContaining({
            key: 'check.result',
            type: 'phrase',
            negate: false,
            disabled: false,
            params: { query: 'Failed' },
          }),
          // eslint-disable-next-line camelcase -- OpenSearch query DSL key
          query: { match_phrase: { 'check.result': 'Failed' } },
        }),
      ]);
    });

    it('is named after what it shows and keeps its saved-object id', () => {
      const visState = JSON.parse(visualization.attributes.visState);
      const termsAgg = visState.aggs.find(
        (agg: { type: string }) => agg.type === 'terms',
      );

      expect(visualization.id).toBe('sca-top-checks-check.name');
      expect(visState.title).toBe('Top 5 failed checks');
      expect(termsAgg.params.customLabel).toBe('Top 5 failed checks');
    });

    it('references the index pattern of every filter', () => {
      const referenceNames = visualization.references.map(
        (reference: { name: string }) => reference.name,
      );

      searchSource.filter.forEach(
        (filter: { meta: { indexRefName: string } }) => {
          expect(referenceNames).toContain(filter.meta.indexRefName);
        },
      );
    });
  });
});
