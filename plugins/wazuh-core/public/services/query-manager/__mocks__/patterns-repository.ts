import { IndexPattern } from 'src/plugins/data/public';
import { IIndexPatternRepository } from '../types';

export class MockIndexPatternRepository implements IIndexPatternRepository {
  private readonly mockPatterns = new Map<string, IndexPattern>();

  constructor(initialPatterns: IndexPattern[] = []) {
    for (const pattern of initialPatterns) {
      this.mockPatterns.set(pattern.id, pattern);
    }
  }

  async get(id: string): Promise<IndexPattern> {
    const pattern = this.mockPatterns.get(id);

    if (!pattern) {
      throw new Error(`Index pattern with id ${id} not found`);
    }

    return pattern;
  }

  async getAll(): Promise<IndexPattern[]> {
    return [...this.mockPatterns.values()];
  }

  setPattern(pattern: IndexPattern): void {
    this.mockPatterns.set(pattern.id, pattern);
  }

  clear(): void {
    this.mockPatterns.clear();
  }
}
