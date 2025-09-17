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
    if (!currentApi) {
      throw new Error(
        'The filter related to the selected server API context can not be created due to the required data was not found. This is usually caused because there is no selected a server API. Ensure the server API is available and select it in the server API selector.',
      );
    }
    const parsedCurrentApi = JSON.parse(currentApi);
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
