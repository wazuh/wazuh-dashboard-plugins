import { parseColumns, parseData } from './data-grid-service';
import { SearchResponse } from '../../../../../../src/core/server';
import type {
  IFieldType,
  IndexPattern,
} from '../../../../../../src/plugins/data/common';
import type { tDataGridColumn } from './types';

describe('describe-grid-test', () => {
  describe('parseData', () => {
    it('should parse data extract source fields correctly', () => {
      const resultsHits: SearchResponse['hits']['hits'] = [
        {
          _id: 'id-1',
          _index: 'index-1',
          _type: 'type-1',
          _score: 1,
          _source: {
            test: true,
          },
        },
      ];

      const expectedResult = [
        {
          _id: 'id-1',
          _index: 'index-1',
          _type: 'type-1',
          _score: 1,
          test: true,
        },
      ];

      expect(parseData(resultsHits)).toEqual(expectedResult);
    });

    it('should parse data handle invalid hits', () => {
      const resultsHits: SearchResponse['hits']['hits'] = [
        // @ts-expect-error
        undefined,
        // @ts-expect-error
        null,
        // @ts-expect-error
        0,
      ];

      const expectedResult = [{}, {}, {}];

      expect(parseData(resultsHits)).toEqual(expectedResult);
    });
  });

  describe('parseColumns', () => {
    const indexPattern = {
      id: 'index-pattern-id',
      flattenHit: () => ({}),
    };

    const buildField = (overrides: Record<string, unknown>) => ({
      name: 'field',
      type: 'string',
      filterable: false,
      aggregatable: true,
      ...overrides,
    });

    const run = (
      fields: Partial<IFieldType>[],
      defaultColumns: Partial<tDataGridColumn>[] = [],
    ) =>
      parseColumns(
        fields as IFieldType[],
        defaultColumns as tDataGridColumn[],
        indexPattern as unknown as IndexPattern,
        [],
        10,
        [],
        () => {},
      );

    it('marks a non-aggregatable field (e.g. ECS match_only_text) as non-sortable', () => {
      const [column] = run([
        buildField({ name: 'message', aggregatable: false }),
      ]);

      expect(column.isSortable).toBe(false);
    });

    it('marks an aggregatable field as sortable', () => {
      const [column] = run([
        buildField({ name: 'wazuh.agent.name', aggregatable: true }),
      ]);

      expect(column.isSortable).toBe(true);
    });

    it('lets a module default column override take precedence over the field aggregatable flag', () => {
      const [column] = run(
        [buildField({ name: 'wazuh.case.title', aggregatable: true })],
        [{ id: 'wazuh.case.title', isSortable: false }],
      );

      expect(column.isSortable).toBe(false);
    });
  });
});
