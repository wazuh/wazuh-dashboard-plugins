import {
  tDataSource,
  tSearchParams,
  tFilter,
  tParsedIndexPattern,
} from '../index';
import { getDataPlugin } from '../../../../kibana-services';
import {
  IndexPatternsService,
  IndexPattern,
} from '../../../../../../../src/plugins/data/public';
import { search } from '../../search-bar/search-bar-service';
import { PatternDataSourceFilterManager } from './pattern-data-source-filter-manager';

export class PatternDataSource implements tDataSource {
  id: string;
  title: string;
  fields: any[];
  patternService: IndexPatternsService;
  indexPattern: IndexPattern;

  constructor(id: string, title: string) {
    this.id = id;
    this.title = title;
  }
  /**
   * Initialize the data source
   */
  async init() {
    this.patternService = await getDataPlugin().indexPatterns;
    this.indexPattern = await this.patternService.get(this.id);
  }

  getFields() {
    return this.fields;
  }

  getFixedFilters(): tFilter[] {
    return [...this.getPinnedAgentFilter()];
  }

  getFetchFilters(): tFilter[] {
    return [...this.getAllowAgentsFilter(), ...this.getExcludeManagerFilter()];
  }

  async select() {
    let pattern: IndexPattern;
    try {
      pattern = await this.patternService.get(this.id);
      if (!pattern)
        throw new Error('Error selecting index pattern: pattern not found');

      const fields = await this.patternService.getFieldsForIndexPattern(
        pattern,
      );
      const scripted = pattern.getScriptedFields().map(field => field.spec);
      pattern.fields.replaceAll([...fields, ...scripted]);
    } catch (error) {
      throw new Error(`Error selecting index pattern: ${error}`);
    }
    try {
      // Vulnerability dashboard error loading for read only user
      await this.patternService.updateSavedObject(pattern);
    } catch {}
  }

  async fetch(params: tSearchParams) {
    const indexPattern = await this.patternService.get(this.id);
    const {
      filters: defaultFilters = [],
      query,
      pagination,
      sorting,
      fields,
      dateRange,
      aggs,
    } = params;
    if (!indexPattern) {
      return;
    }

    try {
      const results = await search({
        indexPattern,
        filters: defaultFilters,
        query,
        pagination,
        sorting,
        fields: fields,
        dateRange,
        aggs,
      });

      return results;
    } catch (error) {
      throw new Error(`Error fetching data: ${error}`);
    }
  }

  toJSON(): tParsedIndexPattern {
    return {
      attributes: {
        fields: JSON.stringify(this.fields),
        title: this.title,
      },
      title: this.title,
      id: this.id,
      migrationVersion: {
        'index-pattern': '7.10.0',
      },
      namespace: [],
      references: [],
      score: 0,
      type: 'index-pattern',
      updated_at: new Date().toISOString(),
      version: 'WzPatternDataSource',
      _fields: this.fields,
    };
  }

  /**
   * Returns the filter when an agent is pinned (saved in session storage or redux store)
   */
  getPinnedAgentFilter(): tFilter[] {
    return PatternDataSourceFilterManager.getPinnedAgentFilter(this.id);
  }

  getAllowAgentsFilter(): tFilter[] {
    return PatternDataSourceFilterManager.getAllowAgentsFilter(this.id);
  }

  getExcludeManagerFilter(): tFilter[] {
    return PatternDataSourceFilterManager.getExcludeManagerFilter(this.id);
  }
}
