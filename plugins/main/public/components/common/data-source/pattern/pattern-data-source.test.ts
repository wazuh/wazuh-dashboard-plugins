import { IndexPatternsService } from '../../../../../../../src/plugins/data/common';
import { RecordMock } from '../../../../../test/types';
import { PatternDataSource } from './pattern-data-source';
import { search } from '../../search-bar/search-bar-service';

jest.mock('../../search-bar/search-bar-service', () => ({
  search: jest.fn(),
}));

const mockSearch = search as jest.Mock;

let patternService: RecordMock<IndexPatternsService>;
let patternDataSource: PatternDataSource;
const TEST_ID = 'test-id';
const TEST_TITLE = 'test-title';

describe('PatternDataSource', () => {
  beforeEach(() => {
    patternDataSource = new PatternDataSource(TEST_ID, TEST_TITLE);
    // @ts-expect-error
    patternService = {
      get: jest.fn().mockImplementation(() => ({
        getScriptedFields: jest.fn().mockImplementation(() => []),
        fields: {
          replaceAll: jest.fn(),
        },
      })),
      getFieldsForIndexPattern: jest.fn().mockResolvedValue([]),
      updateSavedObject: jest.fn(),
    };
    // @ts-expect-error
    patternDataSource.patternService = patternService;
  });

  it('should throw error when pattern not found', async () => {
    patternService.get.mockResolvedValue(undefined);
    await expect(patternDataSource.select()).rejects.toThrow(
      'Error selecting index pattern: Error: Error selecting index pattern: pattern not found',
    );
  });

  it('should not throw error when get fields for index pattern rejects', async () => {
    // The catch block in select() silently catches errors from getFieldsForIndexPattern
    patternService.getFieldsForIndexPattern.mockRejectedValue(
      new Error('Fields error'),
    );
    await expect(patternDataSource.select()).resolves.not.toThrow();
  });

  it('should not throw error when selecting from pattern data source', async () => {
    await expect(patternDataSource.select()).resolves.not.toThrow();
  });

  describe('fetch', () => {
    beforeEach(() => {
      mockSearch.mockReset();
    });

    type WrappedError = Error & { status?: number };

    async function fetchAndCatch(): Promise<WrappedError | undefined> {
      try {
        await patternDataSource.fetch({});
        return undefined;
      } catch (error) {
        return error as WrappedError;
      }
    }

    it('returns the search results on success', async () => {
      mockSearch.mockResolvedValue({ hits: { total: 0 } });
      await expect(patternDataSource.fetch({})).resolves.toEqual({
        hits: { total: 0 },
      });
    });

    it('wraps a plain search failure without a status', async () => {
      mockSearch.mockRejectedValue(new Error('boom'));
      const caught = await fetchAndCatch();
      expect(caught).toBeInstanceOf(Error);
      expect(caught?.message).toBe('Error fetching data: boom');
      expect(caught?.status).toBeUndefined();
    });

    it.each([
      { statusCode: 403 },
      { status: 403 },
      { response: { status: 403 } },
    ])(
      'preserves a 403 status from shape %j onto the thrown error',
      async shape => {
        mockSearch.mockRejectedValue({ message: 'Forbidden', ...shape });
        const caught = await fetchAndCatch();
        expect(caught).toBeInstanceOf(Error);
        expect(caught?.status).toBe(403);
        expect(caught?.message).toBe('Error fetching data: Forbidden');
      },
    );
  });
});
