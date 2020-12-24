import fs from 'fs';

export const createDirectoryIfNotExists = (path: string): void => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  };
};