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
    this.init();
  }

  async init(): Promise<void> {
    try {
      if (this.defaultIndexPatternsIds.length === 0) {
        throw new Error('Index patterns are required');
      }

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
