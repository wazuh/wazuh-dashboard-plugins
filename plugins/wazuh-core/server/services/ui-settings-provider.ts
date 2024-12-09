import { IConfigurationProvider } from "./configuration-provider";

export class UISettingsConfigProvider implements IConfigurationProvider {
    constructor(private uiSettings: any) {}
  
    async get(key: string): Promise<any> {
      return this.uiSettings.get(key);
    }
  
    async set(key: string, value: any): Promise<void> {
      await this.uiSettings.set(key, value);
    }
  }