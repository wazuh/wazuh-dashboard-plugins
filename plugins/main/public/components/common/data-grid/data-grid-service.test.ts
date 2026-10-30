import {
  exportSearchToCSV,
  parseColumns,
  parseData,
} from './data-grid-service';
import { SearchResponse } from '../../../../../../src/core/server';
import { search, type SearchParams } from '../search-bar/search-bar-service';
import converter from 'json-2-csv';
import * as FileSaver from '../../../services/file-saver';
import type {
  IFieldType,
  IndexPattern,
} from '../../../../../../src/plugins/data/common';
import type { tDataGridColumn } from './types';

jest.mock('../search-bar/search-bar-service', () => ({
  search: jest.fn(),
}));
jest.mock('json-2-csv', () => ({
  json2csvAsync: jest.fn().mockResolvedValue('csv-body'),
}));
jest.mock('../../../services/file-saver', () => ({
  saveAs: jest.fn(),
}));
const mockAddSuccess = jest.fn();
jest.mock('../../../kibana-services', () => ({
  ...jest.requireActual('../../../kibana-services'),
  getToasts: () => ({ addSuccess: mockAddSuccess }),
}));

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

  describe('exportSearchToCSV', () => {
    const HIT_WITH_FORMULA = {
      _id: 'id-1',
      _index: 'index-1',
      _source: {
        'os.name': '=1+1',
        group: ['default', '=cmd'],
        'agent.id': '001',
      },
    };

    const indexPattern = {
      fields: { getByType: () => [] },
      flattenHit: (hit: { _source: Record<string, unknown> }) => ({
        ...hit._source,
      }),
    };

    const buildParams = () => ({
      indexPattern,
      filters: [],
      query: { query: '', language: 'kuery' },
      sorting: [],
      fields: ['os.name', 'group', 'agent.id'],
      pagination: { pageIndex: 0, pageSize: 10 },
      dateRange: { from: 'now-1d', to: 'now' },
    });

    const runExport = async () => {
      (search as jest.Mock).mockResolvedValue({
        hits: { hits: [HIT_WITH_FORMULA] },
      });

      await exportSearchToCSV(buildParams() as unknown as SearchParams);

      return (converter.json2csvAsync as jest.Mock).mock.calls[0];
    };

    beforeEach(() => jest.clearAllMocks());

    it('neutralizes a formula-leading field before writing the CSV', async () => {
      const [data] = await runExport();

      expect(data).toEqual([
        {
          'os.name': "'=1+1",
          group: ['default', "'=cmd"],
          'agent.id': '001',
        },
      ]);
      expect(FileSaver.saveAs).toHaveBeenCalled();
    });

    it('formats date fields with the index pattern formatter', async () => {
      const timestamp = '2026-10-27T12:00:00.123456789Z';
      const convert = jest.fn(() => 'formatted-date');
      (search as jest.Mock).mockResolvedValue({
        hits: { hits: [{ _id: 'id-1', _source: { '@timestamp': timestamp } }] },
      });

      await exportSearchToCSV({
        ...buildParams(),
        indexPattern: {
          ...indexPattern,
          fields: { getByType: () => [{ name: '@timestamp' }] },
          getFormatterForField: () => ({ convert }),
        },
      } as unknown as SearchParams);

      expect(convert).toHaveBeenCalledWith(timestamp);
      const [data] = (converter.json2csvAsync as jest.Mock).mock.calls[0];
      expect(data).toEqual([{ '@timestamp': 'formatted-date' }]);
    });

    it('names the file after its content and confirms the download', async () => {
      (search as jest.Mock).mockResolvedValue({
        hits: { hits: [HIT_WITH_FORMULA] },
      });

      await exportSearchToCSV(buildParams() as unknown as SearchParams, {
        fileName: 'packages',
      });

      const [, fileName] = (FileSaver.saveAs as jest.Mock).mock.calls[0];
      expect(fileName).toMatch(/^packages-\d{4}-\d{2}-\d{2}T.*\.csv$/);
      expect(mockAddSuccess).toHaveBeenCalledWith({
        title: `Downloaded ${fileName}`,
        text: '1 row',
      });
    });

    it('keeps the events file name when none is given', async () => {
      await runExport();

      const [, fileName] = (FileSaver.saveAs as jest.Mock).mock.calls[0];
      expect(fileName).toMatch(/^events-.*\.csv$/);
    });

    it('keeps the writer options and column selectors untouched', async () => {
      const [, options] = await runExport();

      expect(options).toEqual({
        emptyFieldValue: '',
        keys: ['os.name', 'group', 'agent.id'],
      });
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
