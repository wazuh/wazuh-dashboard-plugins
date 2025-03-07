import { IndexPattern } from 'src/plugins/data/public';
import { SearchContext } from './search-context';
import {
  DataService,
  IQueryManagerService,
  ISearchContext,
  TQueyManagerCreateSearchContextConfig,
  IIndexPatternRepository,
  IQueryManagerConfig,
} from './types';

export class QueryManagerService implements IQueryManagerService {
  private indexPatterns: IndexPattern[] = [];
  private readonly defaultIndexPatternsIds: string[] = [];
  private readonly dataService: DataService;
  private readonly indexPatternRepository: IIndexPatternRepository;

  constructor(config: IQueryManagerConfig) {
    const { indexPatterns, dataService, patternsRepository } = config;

    if (!indexPatterns || config.indexPatterns.length === 0) {
      throw new Error('Index patterns are required');
    }

    if (!dataService) {
      throw new Error('Search service is required');
    }

    if (!patternsRepository) {
      throw new Error('Index pattern repository is required');
    }

    this.defaultIndexPatternsIds = indexPatterns
      .filter(indexPattern => indexPattern.id)
      .map(indexPattern => indexPattern.id);

    if (this.defaultIndexPatternsIds.length === 0) {
      throw new Error('Index patterns ids are required');
    }

    this.dataService = dataService;
    this.indexPatternRepository = patternsRepository;
    this.init();
  }

  async init(): Promise<void> {
    try {
      const indexPatternsPromises = this.defaultIndexPatternsIds
        .filter(Boolean)
        .map(indexPatternId => this.indexPatternRepository.get(indexPatternId));
      const indexPatterns = await Promise.all(indexPatternsPromises);

      this.indexPatterns = indexPatterns;
    } catch (error) {
      console.error('Error initializing QueryManagerService', error);
    }
  }

  async createSearchContext(
    config: TQueyManagerCreateSearchContextConfig,
  ): Promise<ISearchContext> {
    if (!config.indexPatternId) {
      throw new Error('Index pattern is required');
    }

    const indexPattern = await this.getIndexPatternById(config.indexPatternId);

    return new SearchContext({
      indexPattern,
      fixedFilters: config.fixedFilters,
      contextId: config.contextId,
      searchService: this.dataService.search,
    });
  }

  private async getIndexPatternById(id: string): Promise<IndexPattern> {
    try {
      const indexPattern = this.indexPatterns.find(
        pattern => pattern.id === id,
      );

      if (indexPattern) {
        return indexPattern;
      } else {
        return await this.indexPatternRepository.get(id);
      }
    } catch (error) {
      throw new Error(
        `Index pattern not found with id: ${id}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
