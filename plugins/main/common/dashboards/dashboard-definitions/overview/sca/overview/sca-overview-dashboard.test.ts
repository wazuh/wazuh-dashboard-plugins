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

  describe('score visualization', () => {
    const visState = JSON.parse(
      getSavedObject('check_score').attributes.visState,
    );
    const spec = JSON.parse(visState.params.spec);
    const [scoreMark, captionMark] = spec.marks;

    it('sizes the score from the panel width on every resize', () => {
      expect(scoreMark.encode.enter.fontSize).toBeUndefined();
      expect(scoreMark.encode.update.fontSize.signal).toMatch(
        /^min\(53\.333, width \//,
      );
      expect(scoreMark.encode.update.x.signal).toBe('width / 2');
    });

    it('keeps the caption below the score', () => {
      expect(captionMark.encode.update.y.signal).toContain(
        scoreMark.encode.update.fontSize.signal,
      );
    });
  });

  describe.each(['policies_by_result', 'results_by_agent'])(
    '%s bar chart',
    id => {
      const { params } = JSON.parse(getSavedObject(id).attributes.visState);

      it('leaves room for the bars in narrow panels', () => {
        expect(params.legendPosition).toBe('bottom');
        expect(params.categoryAxes[0].labels.truncate).toBe(30);
      });
    },
  );
});
