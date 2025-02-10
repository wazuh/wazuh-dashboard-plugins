interface IDataSourceAdapter {
  getIndexPattern: () => Promise<any>;
}

export class DataSourceAdapter implements IDataSourceAdapter {
  constructor(private readonly fetchData: any) {}

  async getIndexPattern(): Promise<any> {
    const indexPattern =
      await this.fetchData.data.indexPatterns.get('wazuh-agents*');

    return {
      indexPatterns: indexPattern,
      filters: [],
    };
  }
}
