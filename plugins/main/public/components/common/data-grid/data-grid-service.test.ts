import { parseData } from './data-grid-service';
import { SearchResponse } from '../../../../../../src/core/server';

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
});
