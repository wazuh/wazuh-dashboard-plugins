import { IndexPattern } from 'src/plugins/data/public';
import { SearchContext } from './search-context';
import {
  DataService,
  IQueryManagerService,
  ISearchContext,
  ICreateSearchContextConfig,
  QueryManagerConfig,
  IIndexPatternRepository,
} from './types';
import { IndexPatternRepository } from './patterns-repository';

export class QueryManagerService implements IQueryManagerService {
  private indexPatterns: IndexPattern[] = [];
  private readonly indexPatternRepository: IIndexPatternRepository;
  private readonly defaultIndexPatternsIds: string[] = [];

  constructor(
    config: QueryManagerConfig,
    private readonly dataService: DataService,
  ) {
    if (!config.indexPatterns || config.indexPatterns.length === 0) {
      throw new Error('Index patterns are required');
    }

    if (!dataService) {
      throw new Error('Search service is required');
    }

    this.defaultIndexPatternsIds = config.indexPatterns.map(
      indexPattern => indexPattern.id,
    );
    this.indexPatternRepository = new IndexPatternRepository(
      dataService.indexPatterns,
    );
    this.loadIndexPatterns(
      config.indexPatterns.map(indexPattern => indexPattern.id),
    );
  }

  async init(): Promise<void> {
    const indexPatternsIds = this.defaultIndexPatternsIds.map(
      indexPattern => indexPattern.id,
    );

    if (indexPatternsIds.length === 0) {
      throw new Error('Index patterns are required');
    }

    const indexPatternsPromises = indexPatternsIds
      .filter(Boolean)
      .map(indexPatternId => this.indexPatternRepository.get(indexPatternId));
    const indexPatterns = await Promise.all(indexPatternsPromises);

    this.indexPatterns = indexPatterns;
  }

  async createSearchContext(
    config: ICreateSearchContextConfig,
  ): ISearchContext {
    if (!config.indexPatternId) {
      throw new Error('Index pattern is required');
    }

    const indexPattern = await this.getIndexPatternById(config.indexPatternId);

    return new SearchContext({
      indexPattern,
      fixedFilters: config.fixedFilters,
      contextId: config.context,
      searchService: this.dataService.search,
    });
  }

  private async getIndexPatternById(id: string): IndexPattern {
    const indexPattern = this.indexPatterns.find(
      indexPattern => indexPattern.id === id,
    );

    try {
      if (!indexPattern) {
        return await this.indexPatternRepository.get(id);
      }

      return indexPattern;
    } catch (error) {
      throw new Error(
        `Index pattern not found with id: ${id}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
