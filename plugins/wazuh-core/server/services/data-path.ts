import path from 'path';
import fs from 'fs';
import { Logger } from 'opensearch-dashboards/server';

export interface DataPathConfig {
  path: {
    data: string;
  };
}

export interface IDataPathService {
  getDataPath(): string;
  getWazuhPath(): string;
  getConfigPath(): string;
  getDownloadsPath(): string;
  getConfigFilePath(): string;
  getRegistryFilePath(): string;
  createDirectories(): void;
  createDataDirectoryIfNotExists(directory?: string): void;
  getDataDirectoryRelative(directory?: string): string;
  setup(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export class DataPathService implements IDataPathService {
  private dataPath: string;

  constructor(private logger: Logger, globalConfig: DataPathConfig) {
    this.dataPath = globalConfig.path.data;
  }

  /**
   * Setup the service
   */
  async setup(): Promise<void> {
    this.logger.debug('Setup');
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    try {
      this.logger.debug('Start');
      this.createDirectories();
      this.logger.debug('Directories created successfully');
    } catch (error) {
      this.logger.error(
        `Error starting: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Stop the service
   */
  async stop(): Promise<void> {
    this.logger.debug('Stop');
  }

  /**
   * Get the base data path
   */
  getDataPath(): string {
    return this.dataPath;
  }

  /**
   * Get the Wazuh data directory path
   */
  getWazuhPath(): string {
    return path.join(this.dataPath, 'wazuh');
  }

  /**
   * Get the Wazuh config directory path
   */
  getConfigPath(): string {
    return path.join(this.getWazuhPath(), 'config');
  }

  /**
   * Get the Wazuh downloads directory path
   */
  getDownloadsPath(): string {
    return path.join(this.getWazuhPath(), 'downloads');
  }

  /**
   * Get the Wazuh config file path
   */
  getConfigFilePath(): string {
    return path.join(this.getConfigPath(), 'wazuh.yml');
  }

  /**
   * Create all necessary Wazuh directories
   */
  createDirectories(): void {
    this.logger.debug('Creating directories');
    const directories = [
      this.getWazuhPath(),
      this.getConfigPath(),
      this.getDownloadsPath(),
    ];

    directories.forEach(directory => {
      this.ensureDirectoryExists(directory);
    });
  }

  /**
   * Create data directory if not exists (compatibility method) and return the absolute path
   */
  createDataDirectoryIfNotExists(directory?: string): void {
    const absoluteRoute = directory
      ? path.join(this.getWazuhPath(), directory)
      : this.getWazuhPath();

    this.ensureDirectoryExists(absoluteRoute);
    return absoluteRoute;
  }

  /**
   * Get data directory relative path (compatibility method)
   */
  getDataDirectoryRelative(directory?: string): string {
    return path.join(this.getWazuhPath(), directory || '');
  }

  /**
   * Private method to ensure a directory exists, creating it if necessary
   */
  private ensureDirectoryExists(directoryPath: string): void {
    if (!fs.existsSync(directoryPath)) {
      this.logger.debug(`Creating directory [${directoryPath}]`);
      fs.mkdirSync(directoryPath, { recursive: true });
    } else {
      this.logger.debug(`Directory already exists [${directoryPath}]`);
    }
  }
}
