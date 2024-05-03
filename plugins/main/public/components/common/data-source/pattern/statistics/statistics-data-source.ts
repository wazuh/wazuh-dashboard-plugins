import { AppState } from '../../../../../react-services';
import { tFilter } from '../../index';
import { PatternDataSource } from '../pattern-data-source';
import store from '../../../../../redux/store';

export class StatisticsDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  static getIdentifierDataSourcePattern(): string {
    // Return Statistics Identifier Index Pattern
    const appConfig = store.getState().appConfig;
    return `${appConfig.data['cron.prefix']}-${appConfig.data['cron.statistics.index.name']}-*`;
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
    return [apiNameFilter];
  }
}
