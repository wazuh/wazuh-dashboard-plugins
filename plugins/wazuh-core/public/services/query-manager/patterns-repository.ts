import { IndexPatternsContract, IndexPattern } from 'src/plugins/data/public';
import { IIndexPatternRepository } from './types';

export class IndexPatternRepository implements IIndexPatternRepository {
  private readonly indexPatternService: IndexPatternsContract;

  constructor(searchService: IndexPatternsContract) {
    this.indexPatternService = searchService;
  }

  async get(id: string): Promise<IndexPattern> {
    try {
      return await this.indexPatternService.get(id);
    } catch (error) {
      throw new Error(
        `Error getting index pattern: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async getAll(): Promise<IndexPattern[]> {
    try {
      return await this.indexPatternService.find('');
    } catch (error) {
      throw new Error(
        `Error getting index patterns: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
