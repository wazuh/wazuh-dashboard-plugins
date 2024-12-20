export interface IConfigurationProvider {
  get(key: string): Promise<any>;
  set?(key: string, value: any): Promise<void>;
  getAll(): Promise<any>;
  setName(name: string): void;
  getName(): string;
}
