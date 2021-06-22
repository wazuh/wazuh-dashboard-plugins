import fs from 'fs';
import path from 'path';
import { WAZUH_DATA_ABSOLUTE_PATH } from '../../common/constants';

export const createDirectoryIfNotExists = (directory: string): void  => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  };
};

export const createLogFileIfNotExists = (filePath : string): void => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        date: new Date(),
        level: 'info',
        location: 'logger',
        message: 'Log file creation',
      }) + '\n'
    );
  };
};

export const createDataDirectoryIfNotExists = (directory?: string) => {
  const absoluteRoute = directory ? path.join(WAZUH_DATA_ABSOLUTE_PATH, directory) : WAZUH_DATA_ABSOLUTE_PATH;
  if (!fs.existsSync(absoluteRoute)) {
    fs.mkdirSync(absoluteRoute);
  };
}

export const getDataDirectoryRelative = (directory?: string) => {
  return path.join(WAZUH_DATA_ABSOLUTE_PATH, directory);
}
