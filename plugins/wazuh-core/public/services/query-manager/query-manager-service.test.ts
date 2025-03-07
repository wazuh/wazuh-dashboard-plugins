import { QueryManagerService } from './query-manager-service';
import { DataService } from './types';
import { MockIndexPatternRepository } from './__mocks__/patterns-repository';
import { FILTER_OPERATOR, FiltersService } from './filters-service';

const searchResponse = {
  hits: {
    hits: [],
    total: 0,
  },
};
const mockSetParent = jest.fn();
const mockSetField = jest.fn();
const mockFetch = jest.fn();

mockSetParent.mockReturnThis();
mockSetField.mockReturnThis();
mockFetch.mockResolvedValue(searchResponse);

const mockSearchService = {
  search: {
    searchSource: {
      create: () => ({
        setParent: mockSetParent,
        setField: mockSetField,
        fetch: mockFetch,
      }),
    },
  },
  indexPatterns: {
    get: jest.fn(),
  },
} as DataService;

describe('QueryManagerService', () => {
  let mockIndexPatternRepository: MockIndexPatternRepository;

  beforeEach(() => {
    mockIndexPatternRepository = new MockIndexPatternRepository([
      {
        id: 'wazuh-alerts-*',
        title: 'wazuh-alerts-*',
      },
    ]);
  });

  it('should create a query Manager Instance', async () => {
    const queryManagerService = new QueryManagerService({
      indexPatterns: [
        {
          id: 'wazuh-alerts-*',
        },
      ],
      dataService: mockSearchService,
      patternsRepository: mockIndexPatternRepository,
    });

    expect(queryManagerService).toBeDefined();
  });

  it('should throw an error if no index patterns are provided', async () => {
    expect(() => {
      new QueryManagerService({
        indexPatterns: [],
        dataService: mockSearchService,
        patternsRepository: mockIndexPatternRepository,
      });
    }).toThrowError('Index patterns are required');
  });

  it('should throw an error if no data service is provided', async () => {
    expect(() => {
      new QueryManagerService({
        indexPatterns: [
          {
            id: 'wazuh-alerts-*',
          },
        ],
        dataService: null,
        patternsRepository: mockIndexPatternRepository,
      });
    }).toThrowError('Search service is required');
  });

  it('should throw an error if no index pattern repository is provided', async () => {
    expect(() => {
      new QueryManagerService({
        indexPatterns: [
          {
            id: 'wazuh-alerts-*',
          },
        ],
        dataService: mockSearchService,
        patternsRepository: null,
      });
    }).toThrowError('Index pattern repository is required');
  });

  it('should initialize the index patterns', async () => {
    const queryManagerService = new QueryManagerService({
      indexPatterns: [
        {
          id: 'wazuh-alerts-*',
        },
      ],
      dataService: mockSearchService,
      patternsRepository: mockIndexPatternRepository,
    });

    await queryManagerService.init();

    expect(queryManagerService.indexPatterns).toBeDefined();
    expect(queryManagerService.indexPatterns.length).toBe(1);
    expect(queryManagerService.indexPatterns[0].id).toBe('wazuh-alerts-*');
  });

  it('should create a search context', async () => {
    const queryManagerService = new QueryManagerService({
      indexPatterns: [
        {
          id: 'wazuh-alerts-*',
        },
      ],
      dataService: mockSearchService,
      patternsRepository: mockIndexPatternRepository,
    });

    await queryManagerService.init();

    const searchContext = await queryManagerService.createSearchContext({
      indexPatternId: 'wazuh-alerts-*',
      fixedFilters: [],
    });

    expect(searchContext).toBeDefined();
    expect(searchContext.indexPattern).toBeDefined();
    expect(searchContext.indexPattern.id).toBe('wazuh-alerts-*');
  });

  it('should not search the index pattern the exists on the query manager instance', async () => {
    const queryManagerService = new QueryManagerService({
      indexPatterns: [
        {
          id: 'wazuh-alerts-*',
        },
      ],
      dataService: mockSearchService,
      patternsRepository: mockIndexPatternRepository,
    });

    await queryManagerService.init();

    const searchContext = await queryManagerService.createSearchContext({
      indexPatternId: 'wazuh-alerts-*',
      fixedFilters: [],
    });

    expect(searchContext).toBeDefined();
    expect(searchContext.indexPattern).toBeDefined();
    expect(searchContext.indexPattern.id).toBe('wazuh-alerts-*');
    expect(mockSearchService.indexPatterns.get).toBeCalledTimes(0);
  });

  it('should search the index pattern that does not exists on the query manager instance', async () => {
    const queryManagerService = new QueryManagerService({
      indexPatterns: [
        {
          id: 'wazuh-alerts-*',
        },
      ],
      dataService: mockSearchService,
      patternsRepository: mockIndexPatternRepository,
    });

    await queryManagerService.init();

    // mock repository get method to retreive the index pattern wazuh-alerts-2-*
    mockIndexPatternRepository.get = jest.fn().mockResolvedValue({
      id: 'wazuh-alerts-2-*',
      title: 'wazuh-alerts-2-*',
    });

    const searchContext = await queryManagerService.createSearchContext({
      indexPatternId: 'wazuh-alerts-2-*',
      fixedFilters: [],
    });

    expect(searchContext).toBeDefined();
    expect(searchContext.indexPattern).toBeDefined();
    expect(searchContext.indexPattern.id).toBe('wazuh-alerts-2-*');
    expect(mockIndexPatternRepository.get).toBeCalledTimes(1);
  });

  it('should save fixed filters on the search context', async () => {
    const queryManagerService = new QueryManagerService({
      indexPatterns: [
        {
          id: 'wazuh-alerts-*',
        },
      ],
      dataService: mockSearchService,
      patternsRepository: mockIndexPatternRepository,
    });

    await queryManagerService.init();

    const filter = FiltersService.createFilter(
      FILTER_OPERATOR.EXISTS,
      'field1',
      'value1',
      'wazuh-alerts-*',
    );
    const searchContext = await queryManagerService.createSearchContext({
      indexPatternId: 'wazuh-alerts-*',
      fixedFilters: [filter],
    });

    expect(searchContext).toBeDefined();
    expect(searchContext.getFixedFilters()).toBeDefined();
    expect(searchContext.getFixedFilters()).toHaveLength(1);
    expect(searchContext.getFixedFilters()[0]).toBe(filter);
  });

  it('should save user filters on the search context', async () => {
    const queryManagerService = new QueryManagerService({
      indexPatterns: [
        {
          id: 'wazuh-alerts-*',
        },
      ],
      dataService: mockSearchService,
      patternsRepository: mockIndexPatternRepository,
    });

    await queryManagerService.init();

    const filter = FiltersService.createFilter(
      FILTER_OPERATOR.EXISTS,
      'field1',
      'value1',
      'wazuh-alerts-*',
    );
    const searchContext = await queryManagerService.createSearchContext({
      indexPatternId: 'wazuh-alerts-*',
      fixedFilters: [],
    });

    searchContext.setUserFilters([filter]);

    expect(searchContext).toBeDefined();
    expect(searchContext.getUserFilters()).toBeDefined();
    expect(searchContext.getUserFilters()).toHaveLength(1);
    expect(searchContext.getUserFilters()[0]).toBe(filter);
  });

  it('should return all filters on the search context', async () => {
    const queryManagerService = new QueryManagerService({
      indexPatterns: [
        {
          id: 'wazuh-alerts-*',
        },
      ],
      dataService: mockSearchService,
      patternsRepository: mockIndexPatternRepository,
    });

    await queryManagerService.init();

    const filter1 = FiltersService.createFilter(
      FILTER_OPERATOR.EXISTS,
      'field1',
      'value1',
      'wazuh-alerts-*',
    );
    const filter2 = FiltersService.createFilter(
      FILTER_OPERATOR.EXISTS,
      'field2',
      'value2',
      'wazuh-alerts-*',
    );
    const searchContext = await queryManagerService.createSearchContext({
      indexPatternId: 'wazuh-alerts-*',
      fixedFilters: [filter1],
    });

    searchContext.setUserFilters([filter2]);

    expect(searchContext).toBeDefined();
    expect(searchContext.getAllFilters()).toBeDefined();
    expect(searchContext.getAllFilters()).toHaveLength(2);
    expect(searchContext.getAllFilters()).toEqual([filter1, filter2]);
  });

  it('should execute a query on the search context', async () => {
    const queryManagerService = new QueryManagerService({
      indexPatterns: [
        {
          id: 'wazuh-alerts-*',
        },
      ],
      dataService: mockSearchService,
      patternsRepository: mockIndexPatternRepository,
    });

    await queryManagerService.init();

    const filter1 = FiltersService.createFilter(
      FILTER_OPERATOR.EXISTS,
      'field1',
      'value1',
      'wazuh-alerts-*',
    );
    const filter2 = FiltersService.createFilter(
      FILTER_OPERATOR.EXISTS,
      'field2',
      'value2',
      'wazuh-alerts-*',
    );
    const searchContext = await queryManagerService.createSearchContext({
      indexPatternId: 'wazuh-alerts-*',
      fixedFilters: [filter1],
    });

    searchContext.setUserFilters([filter2]);

    const result = await searchContext.executeQuery();

    expect(result).toBeDefined();
    expect(result).toBe(searchResponse);
  });
});
