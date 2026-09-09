import { exportSearchToCSV, parseData } from './data-grid-service';
import { SearchResponse } from '../../../../../../src/core/server';
import { search, type SearchParams } from '../search-bar/search-bar-service';
import converter from 'json-2-csv';
import * as FileSaver from '../../../services/file-saver';

jest.mock('../search-bar/search-bar-service', () => ({
  search: jest.fn(),
}));
jest.mock('json-2-csv', () => ({
  json2csvAsync: jest.fn().mockResolvedValue('csv-body'),
}));
jest.mock('../../../services/file-saver', () => ({
  saveAs: jest.fn(),
}));
jest.mock('../../../react-services', () => ({
  formatUIDate: (date: string) => date,
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

    it('keeps the writer options and column selectors untouched', async () => {
      const [, options] = await runExport();

      expect(options).toEqual({
        emptyFieldValue: '',
        keys: ['os.name', 'group', 'agent.id'],
      });
    });
  });
});
