import { IConfigurationProvider } from './configuration-provider';

export interface ILogger {
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export interface IConfiguration {
  setup: () => Promise<any>;
  start: () => Promise<any>;
  stop: () => Promise<any>;
  get: (settingsKey: string) => Promise<any>;
  getAll: () => Promise<Record<string, any>>;
}

export type IConfigurationStore = {
  getProviderConfiguration: (key: string) => Promise<Record<string, any>>;
  registerProvider: (name: string, provider: IConfigurationProvider) => void;
  getProvider: (name: string) => IConfigurationProvider;
} & IConfiguration;
