import fs from 'fs';
import path from 'path';
import { WAZUH_DATA_ABSOLUTE_PATH } from '../../util/constants';

export function createDirectoryIfNotExists(directory: string): void {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  };
};

export function createDataDirectoryIfNotExists(directory?: string){
  const absoluteRoute = directory ? path.join(WAZUH_DATA_ABSOLUTE_PATH, directory) : WAZUH_DATA_ABSOLUTE_PATH;
  if (!fs.existsSync(absoluteRoute)) {
    fs.mkdirSync(absoluteRoute);
  };
}

export function getDataDirectoryRelative(directory?: string){
  return path.join(WAZUH_DATA_ABSOLUTE_PATH, directory);
}