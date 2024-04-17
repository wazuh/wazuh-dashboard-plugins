import fs from 'fs';
import path from 'path';
import { WAZUH_DATA_ABSOLUTE_PATH } from '../../common/constants';

export const createDirectoryIfNotExists = (directory: string): void => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

export const createDataDirectoryIfNotExists = (directory?: string) => {
  const absoluteRoute = directory
    ? path.join(WAZUH_DATA_ABSOLUTE_PATH, directory)
    : WAZUH_DATA_ABSOLUTE_PATH;
  if (!fs.existsSync(absoluteRoute)) {
    fs.mkdirSync(absoluteRoute, { recursive: true });
  }
};

export const getDataDirectoryRelative = (directory?: string) => {
  return path.join(WAZUH_DATA_ABSOLUTE_PATH, directory);
};
