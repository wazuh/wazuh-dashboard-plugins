import fs from 'fs';
import { IDataPathService } from '../../../wazuh-core/server/services/data-path';

export const createDirectoryIfNotExists = (directory: string): void => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Compatibility function that delegates to DataPathService
export const createDataDirectoryIfNotExists = (
  dataPathService: IDataPathService,
  directory?: string,
) => {
  return dataPathService.createDataDirectoryIfNotExists(directory);
};

// Compatibility function that delegates to DataPathService
export const getDataDirectoryRelative = (
  dataPathService: IDataPathService,
  directory?: string,
) => {
  return dataPathService.getDataDirectoryRelative(directory);
};
