import fs from 'fs';
import path from 'path';
import { getWazuhDataBasePath } from '../../common/constants';

export const createDirectoryIfNotExists = (directory: string): void => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

export const createDataDirectoryIfNotExists = (directory?: string) => {
  const wazuhPath = path.join(getWazuhDataBasePath(), 'wazuh');
  const absoluteRoute = directory ? path.join(wazuhPath, directory) : wazuhPath;
  if (!fs.existsSync(absoluteRoute)) {
    fs.mkdirSync(absoluteRoute, { recursive: true });
  }
};

export const getDataDirectoryRelative = (directory?: string) => {
  return path.join(getWazuhDataBasePath(), 'wazuh', directory || '');
};
