import {
  tDataSource,
  tSearchParams,
  tFilter,
  tParsedIndexPattern,
} from '../index';
import { getDataPlugin } from '../../../../kibana-services';
import {
  IndexPatternsContract,
  IndexPattern,
} from '../../../../../../../src/plugins/data/public';
import { search } from '../../search-bar/search-bar-service';
import { PatternDataSourceFilterManager } from './pattern-data-source-filter-manager';

export class PatternDataSource implements tDataSource {
  id: string;
  title: string;
  fields: any[];
  patternService: IndexPatternsContract;
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
    // return all filters
    return [...this.getPinnedAgentFilter()];
  }

  getFetchFilters(): tFilter[] {
    return [...this.getAllowAgentsFilter(), ...this.getExcludeManagerFilter()];
  }

  async select() {
    try {
      const pattern = await this.patternService.get(this.id);
      if (pattern) {
        const fields = await this.patternService.getFieldsForIndexPattern(
          pattern,
        );
        const scripted = pattern.getScriptedFields().map(field => field.spec);
        pattern.fields.replaceAll([...fields, ...scripted]);
        await this.patternService.updateSavedObject(pattern);
      } else {
        throw new Error('Error selecting index pattern: pattern not found');
      }
    } catch (error) {
      throw new Error(`Error selecting index pattern: ${error}`);
    }
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
