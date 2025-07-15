import path from 'path';
import fs from 'fs';

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
  createDirectory(subDirectory?: string): void;
  createDataDirectoryIfNotExists(directory?: string): void;
  getDataDirectoryRelative(directory?: string): string;
}

export class DataPathService implements IDataPathService {
  private dataPath: string;

  constructor(globalConfig: DataPathConfig) {
    this.dataPath = globalConfig.path.data || './data';
  }

  /**
   * Get the base data path from OpenSearch Dashboards configuration
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
   * Get the Wazuh registry file path
   */
  getRegistryFilePath(): string {
    return path.join(this.getConfigPath(), 'wazuh-registry.json');
  }

  /**
   * Create all necessary Wazuh directories
   */
  createDirectories(): void {
    const directories = [
      this.getWazuhPath(),
      this.getConfigPath(),
      this.getDownloadsPath(),
    ];

    directories.forEach(directory => {
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
    });
  }

  /**
   * Create a specific directory under Wazuh path
   */
  createDirectory(subDirectory?: string): void {
    const targetPath = subDirectory
      ? path.join(this.getWazuhPath(), subDirectory)
      : this.getWazuhPath();

    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
  }

  /**
   * Create data directory if not exists (compatibility method)
   */
  createDataDirectoryIfNotExists(directory?: string): void {
    const absoluteRoute = directory
      ? path.join(this.getWazuhPath(), directory)
      : this.getWazuhPath();

    if (!fs.existsSync(absoluteRoute)) {
      fs.mkdirSync(absoluteRoute, { recursive: true });
    }
  }

  /**
   * Get data directory relative path (compatibility method)
   */
  getDataDirectoryRelative(directory?: string): string {
    return path.join(this.getWazuhPath(), directory || '');
  }
}
