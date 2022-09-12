import fs from 'fs';
import path from 'path';
import { WAZUH_DATA_ABSOLUTE_PATH } from '../../common/constants';

export const createDirectoryIfNotExists = (directory: string): void => {
  const directories = directory.split('/').reduce((accum, subPath: string) => ([
    ...accum,
    path.join(accum[accum.length-1] || '/', subPath)
  ]),[]);

  directories.forEach((dir: string) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    };
  });
};

export const createLogFileIfNotExists = (filePath: string): void => {
  if (!fs.existsSync(filePath)) {
    fs.closeSync(fs.openSync(filePath, 'w'));
  }
};

export const createDataDirectoryIfNotExists = (directory?: string) => {
  const absoluteRoute = directory
    ? path.join(WAZUH_DATA_ABSOLUTE_PATH, directory)
    : WAZUH_DATA_ABSOLUTE_PATH;
  if (!fs.existsSync(absoluteRoute)) {
    fs.mkdirSync(absoluteRoute);
  }
};

export const getDataDirectoryRelative = (directory?: string) => {
  return path.join(WAZUH_DATA_ABSOLUTE_PATH, directory);
};
