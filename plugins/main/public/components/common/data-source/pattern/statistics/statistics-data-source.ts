import { AppState } from '../../../../../react-services';
import { tFilter } from '../../index';
import { PatternDataSource } from '../pattern-data-source';
import { WAZUH_STATISTICS_PATTERN } from '../../../../../../common/constants';

export class StatisticsDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  static getIdentifierDataSourcePattern(): string {
    // Return Statistics Identifier Index Pattern
    return WAZUH_STATISTICS_PATTERN;
  }

  getFetchFilters(): tFilter[] {
    return [...this.getAPIFilter()];
  }

  getFixedFilters(): tFilter[] {
    // getFixedFilters is overridden so that it does not return the pinned agent's fixed filter.
    return [];
  }

  getAPIFilter(): tFilter[] {
    const currentApi = AppState.getCurrentAPI();
    const parsedCurrentApi = currentApi ? JSON.parse(currentApi) : undefined;
    const apiNameFilter = {
      meta: {
        removable: false,
        index: this.id,
        negate: false,
        disabled: false,
        alias: null,
        type: 'phrase',
        key: null,
        value: null,
        params: {
          query: null,
          type: 'phrase',
        },
      },
      query: {
        match_phrase: {
          apiName: parsedCurrentApi?.id,
        },
      },
      $state: {
        store: 'appState',
      },
    };
    return [apiNameFilter];
  }
}
