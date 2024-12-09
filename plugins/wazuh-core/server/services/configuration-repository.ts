export interface IConfigurationRepository {
    getConfiguration(key: string): Promise<any>;
    setConfiguration?(key: string, value: any): Promise<void>;
  }