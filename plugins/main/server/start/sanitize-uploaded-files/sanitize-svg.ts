import fs from 'fs';
import glob from 'glob';
import path from 'path';
import { PLUGIN_SETTINGS, TPluginSetting } from '../../../common/constants';
import { log } from '../../lib/logger';
import { sanitizeSVG } from '../../lib/sanitizer';
import { getConfiguration } from '../../lib/get-configuration';

/**
 * This task checks for custom SVG files uploaded by the user and sanitizes them.
 * The goal is to sanitize files uploaded in previous versions.
 * @param context
 * @returns
 */
export default function sanitizeUploadedSVG(context) {
  // Create a wrapper function that logs to plugin files and platform logging system
  const createLog = (level: string) => message => {
    log('sanitize:sanitizeUploadedSVG', message, level);
    context.wazuh.logger[level](`sanitize:sanitizeUploadedSVG: ${message}`);
  };

  // Create the logger
  const logger = {
    info: createLog('info'),
    warn: createLog('warn'),
    error: createLog('error'),
    debug: createLog('debug'),
  };

  try {
    logger.debug('Task sanitize SVG started');

    const configuration = getConfiguration();
    const logosSettingKeys = [
      'customization.logo.sidebar',
      'customization.logo.app',
      'customization.logo.healthcheck',
    ];

    // Check each of the possible custom settings uploaded files look for SVG to sanitize
    logosSettingKeys.forEach(logoKey => {
      const logoSetting: TPluginSetting | undefined = PLUGIN_SETTINGS[logoKey];
      const customLogoPath = configuration[logoKey];
      if (!logoSetting || !customLogoPath) {
        return;
      }

      const targetDirectory = path.join(
        __dirname,
        '../../..',
        logoSetting.options.file.store.relativePathFileSystem,
      );

      // If the setting folder doesn't exist abort the task
      if (!fs.existsSync(targetDirectory)) {
        return;
      }

      // Get the files related to the setting and remove them
      const files = glob.sync(path.join(targetDirectory, `${logoKey}.*`));

      // If there are no files saved abort the task
      if (!files?.length) {
        return;
      }

      // Check file extension
      const fileName = path.basename(files[0]);
      const fileExtension = path.extname(fileName);
      if (fileExtension.toLocaleLowerCase() !== '.svg') {
        return;
      }

      // Read the file contents
      const fileFullPath = path.join(targetDirectory, fileName);
      const originalFileBuffer = fs.readFileSync(fileFullPath);

      // Sanitize the file contents
      const svgString = originalFileBuffer.toString();
      const cleanSVG = sanitizeSVG(svgString);
      const cleanFileBuffer = Buffer.from(cleanSVG);

      // Delete the original file
      fs.unlinkSync(fileFullPath);

      // Save the clean file in the target directory
      fs.writeFileSync(fileFullPath, cleanFileBuffer);
    });

    logger.debug('Task finished');
  } catch (error) {
    logger.error(`Error: ${error.message}`);
  }
}
