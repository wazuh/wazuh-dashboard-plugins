import fs from 'fs';
import md5 from 'md5';
import path from 'path';
import { WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH } from '../../../common/constants';
import { log } from '../../lib/logger';

/**
 * This task renames the report user folder from username to hashed username.
 * @param context 
 * @returns 
 */
export default function migrateReportsDirectoryName(context) {

  // Create a wrapper function that logs to plugin files and platform logging system
  const createLog = (level: string) => (message) => {
    log('migration:reportsDirectoryName', message, level);
    context.wazuh.logger[level](`migration:reportsDirectoryName: ${message}`);
  };

  // Create the logger
  const logger = {
    info: createLog('info'),
    warn: createLog('warn'),
    error: createLog('error'),
    debug: createLog('debug'),
  };

  try {
    logger.debug('Task started');

    // Skip the task if the directory that stores the reports files doesn't exist in the file system
    if (!fs.existsSync(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH)) {
      logger.debug("Reports directory doesn't exist. The task is not required. Skip.");
      return;
    };

    // Read the directories/files in the reports path
    logger.debug(`Reading reports directory: ${WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH}`);
    fs.readdirSync(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, { withFileTypes: true })
      .forEach((fileDirent) => {
        // If it is a directory and has not a valid MD5 hash, continue the task.
        if (fileDirent.isDirectory() && !isMD5(fileDirent.name)) {
          // Generate the origin and target path and hash the name
          const originDirectoryPath = path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, fileDirent.name);
          const targetDirectoryName = md5(fileDirent.name);
          const targetDirectoryPath = path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, targetDirectoryName);
          try {
            logger.info(`Found reports directory to migrate: [${fileDirent.name}]`);
            // Rename the directory from origin to target path
            fs.renameSync(originDirectoryPath, targetDirectoryPath);
            logger.info(`Renamed directory [${fileDirent.name} (${originDirectoryPath})] to [${targetDirectoryName} (${targetDirectoryPath})]`);
          } catch (error) {
            logger.error(`Error renaming directory [${fileDirent.name} (${originDirectoryPath})] to [${targetDirectoryName} (${targetDirectoryPath})]: ${error.message}`);
          }
        };
      });
    logger.debug('Task finished');
  } catch (error) {
    logger.error(`Error: ${error.message}`);
  };
}

// Check that the text is a valid MD5 hash
// https://melvingeorge.me/blog/check-if-string-is-valid-md5-hash-javascript
export function isMD5(text: string) {
  const regexMD5 = /^[a-f0-9]{32}$/gi;
  return regexMD5.test(text);
}