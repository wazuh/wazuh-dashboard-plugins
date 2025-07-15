import fs from 'fs';
import path from 'path';
import { IDataPathService } from './data-path';

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
