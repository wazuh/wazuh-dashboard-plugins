import { AppState } from '../../../../../react-services';
import { tFilter } from '../../index';
import { PatternDataSource } from '../pattern-data-source';

export class StatisticsDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFetchFilters(): tFilter[] {
    return [...this.getAPIFilter()];
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
    return parsedCurrentApi ? [apiNameFilter] : [];
  }
}
