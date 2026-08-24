import { parseData, parseColumns } from './data-grid-service';
import { SearchResponse } from '../../../../../../src/core/server';
import {
  IFieldType,
  IndexPattern,
} from '../../../../../../src/plugins/data/common';
import { tDataGridColumn } from './types';

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
    const indexPattern = { id: 'index-pattern-id' } as IndexPattern;
    // The module column definitions only declare the field `id`
    const defaultColumns: tDataGridColumn[] = [
      { id: '@timestamp', isSortable: true },
      { id: 'wazuh.rule.level', initialWidth: 150 },
    ];

    const parse = (fields: IFieldType[]) =>
      parseColumns(fields, defaultColumns, indexPattern, [], 10, [], () => {});

    it('should name the columns after the index pattern fields', () => {
      const fields = [
        { name: '@timestamp', type: 'date' },
        { name: 'wazuh.rule.level', type: 'number' },
      ] as IFieldType[];

      expect(parse(fields).map(({ id, name }) => ({ id, name }))).toEqual([
        { id: '@timestamp', name: '@timestamp' },
        { id: 'wazuh.rule.level', name: 'wazuh.rule.level' },
      ]);
    });

    // Regression test for https://github.com/wazuh/wazuh-dashboard-plugins/issues/8300
    // Without the index pattern fields the default columns were returned as is,
    // so they reached the Available fields selector without the `name` it
    // searches on and the Events tab crashed on `name.toLowerCase()`.
    it('should derive the column name from the id without fields', () => {
      expect(parse([]).map(({ id, name }) => ({ id, name }))).toEqual([
        { id: '@timestamp', name: '@timestamp' },
        { id: 'wazuh.rule.level', name: 'wazuh.rule.level' },
      ]);
    });

    it('should keep the default column properties without fields', () => {
      expect(parse([])).toEqual([
        { id: '@timestamp', name: '@timestamp', isSortable: true },
        { id: 'wazuh.rule.level', name: 'wazuh.rule.level', initialWidth: 150 },
      ]);
    });
  });
});
