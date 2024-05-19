import fs from 'fs';
import glob from 'glob';
import path from 'path';
import { PLUGIN_SETTINGS, TPluginSetting } from '../../../common/constants';
import { log } from '../../lib/logger';
import { sanitizeSVG } from '../../lib/sanitizer';
import { getConfiguration } from '../../lib/get-configuration';

/**
 * This task checks for custom SVG files uploaded by the user and sanitizes them.
 * The goal is to sanitize any previously uploaded SVG file.
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
    logger.info('Task sanitize SVG started');

    logger.debug('Get Wazuh configuration');
    const configuration = getConfiguration();
    const logosSettingKeys = [
      'customization.logo.sidebar',
      'customization.logo.app',
      'customization.logo.healthcheck',
    ];

    logger.debug('Check configuration for custom branding uploaded SVG files');
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

      // If the setting folder doesn't exist abort
      if (!fs.existsSync(targetDirectory)) {
        return;
      }

      // Get the files related to the setting
      const files = glob.sync(path.join(targetDirectory, `${logoKey}.*`));

      // If there are no files saved abort
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
      const originalSVGString = originalFileBuffer.toString();
      const cleanSVG = sanitizeSVG(originalSVGString);
      const cleanFileBuffer = Buffer.from(cleanSVG);

      // Check if any changes were made in the sanitization process ignoring white spaces
      // If any change was made then save the sanitized content
      if (originalSVGString.replace(/\s/g, '') != cleanSVG.replace(/\s/g, '')) {
        logger.info(
          `[sanitize:sanitizeUploadedSVG] ${fileName} SVG file sanitized`,
        );
        // Delete the original file
        fs.unlinkSync(fileFullPath);

        // Save the clean file in the target directory
        fs.writeFileSync(fileFullPath, cleanFileBuffer);
      }
    });

    logger.info('[sanitize:sanitizeUploadedSVG] Task finished');
  } catch (error) {
    logger.error(`Error [sanitize:sanitizeUploadedSVG]: ${error.message}`);
  }
}
