import fs from 'fs';
import glob from 'glob';
import path from 'path';
import { PLUGIN_SETTINGS, TPluginSetting } from '../../../common/constants';
import { log } from '../../lib/logger';
import { sanitizeSVG } from '../../lib/sanitizer';
import { getConfiguration } from '../../lib/get-configuration';
import { UpdateConfigurationFile } from '../../lib/update-configuration';

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
    logger.debug('Task sanitize SVG started');

    logger.debug('Get Wazuh configuration');
    const updateConfigurationFile = new UpdateConfigurationFile();
    const configuration = getConfiguration();
    const logosSettingKeys = [
      'customization.logo.sidebar',
      'customization.logo.app',
      'customization.logo.healthcheck',
    ];

    logger.debug('Check configuration for custom branding uploaded SVG files');
    // Check each of the possible custom settings uploaded files look for SVG to sanitize
    logosSettingKeys.forEach(async logoKey => {
      const logoSetting: TPluginSetting | undefined = PLUGIN_SETTINGS[logoKey];
      const customLogoPath = configuration[logoKey];
      if (!logoSetting || !customLogoPath) {
        logger.debug(`Logo [${logoKey}] not customized. Skip.`);
        return;
      }

      // Parse the configured logo information and remove the timestamp used as version control
      const configuredCustomLogo = {
        subpath: path.dirname(customLogoPath),
        fileName: path.basename(customLogoPath.replace(/\?v=[\d].*/g, '')),
        fileExtension: path.extname(customLogoPath.replace(/\?v=[\d].*/g, '')),
      };

      // If the configured custom logo is not a SVG file there's nothing to do
      if (configuredCustomLogo.fileExtension.toLocaleLowerCase() !== '.svg') {
        return;
      }

      // The assets folder is the base folder used in the frontend. It's concatenated with the path configured in the
      const targetDirectory = path.join(
        __dirname,
        '../../../public/assets',
        configuredCustomLogo.subpath,
      );

      // If the setting folder doesn't exist abort
      if (!fs.existsSync(targetDirectory)) {
        return;
      }

      // Read the file contents
      const fileFullPath = path.join(
        targetDirectory,
        configuredCustomLogo.fileName,
      );

      // Get the files related to the setting
      const file = glob.sync(fileFullPath);

      // If the file doesn't exists abort
      if (!file?.length) {
        return;
      }

      const originalFileBuffer = fs.readFileSync(fileFullPath);

      // Sanitize the file contents
      const originalSVGString = originalFileBuffer.toString();
      const cleanSVG = sanitizeSVG(originalSVGString);
      const cleanFileBuffer = Buffer.from(cleanSVG);

      // Check if any changes were made in the sanitization process ignoring white spaces
      // If any change was made then save the sanitized content
      if (originalSVGString.replace(/\s/g, '') != cleanSVG.replace(/\s/g, '')) {
        logger.debug(` ${configuredCustomLogo.fileName} SVG file sanitized`);
        // Delete the original file
        fs.unlinkSync(fileFullPath);

        // Save the clean file in the target directory
        fs.writeFileSync(fileFullPath, cleanFileBuffer);

        // Update the setting in the configuration cache
        const pluginSettingValue =
          logoSetting.options.file.store.resolveStaticURL(
            configuredCustomLogo.fileName,
          );
        await updateConfigurationFile.updateConfiguration({
          [logoKey]: pluginSettingValue,
        });
      }
    });

    logger.debug(' Task finished');
  } catch (error) {
    logger.error(`Error: ${error.message}`);
  }
}
