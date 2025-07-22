import fs from 'fs';
import { IDataPathService } from './data-path';

// Mantener solo las funciones relacionadas a DataPathService
export const createDataDirectoryIfNotExists = (
  dataPathService: IDataPathService,
  directory?: string,
) => {
  return dataPathService.createDataDirectoryIfNotExists(directory);
};

export const getDataDirectoryRelative = (
  dataPathService: IDataPathService,
  directory?: string,
) => {
  return dataPathService.getDataDirectoryRelative(directory);
};
