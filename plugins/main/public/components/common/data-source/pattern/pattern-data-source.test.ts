import { IndexPatternsService } from '../../../../../../../src/plugins/data/common';
import { RecordMock } from '../../../../../test/types';
import { PatternDataSource } from './pattern-data-source';

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

  it('should throw error when pattern not found', () => {
    patternService.get.mockResolvedValue(undefined);
    expect(async () => {
      await patternDataSource.select();
    }).rejects.toThrow(
      'Error selecting index pattern: Error: Error selecting index pattern: pattern not found',
    );
  });

  it('should throw error when get fields for index pattern rejects', () => {
    patternService.getFieldsForIndexPattern.mockRejectedValue(null);
    expect(async () => {
      await patternDataSource.select();
    }).rejects.toThrow('Error selecting index pattern: null');
  });

  it('should not throw error when selecting from pattern data source', async () => {
    await expect(patternDataSource.select()).resolves.not.toThrow();
  });
});
