import fs from 'fs';
import path from 'path';
import { RequestHandlerContext } from 'opensearch-dashboards/server';
import { generateSampleDataWithDataset } from './sample-data';

/**
 * Reads a template file from the filesystem
 * @param {string} dataSet - Dataset name to build the template path
 * @param {RequestHandlerContext} context - Request context for logging
 * @returns {object|null} - Parsed JSON template object or null if error
 */
const readTemplateFile = (
  dataSet: string,
  context: RequestHandlerContext,
): string | null => {
  try {
    const templatePath = path.join(
      __dirname,
      `../../server/lib/sample-data/dataset/${dataSet}/template.json`,
    );

    const templateNormalizedPath = path.normalize(templatePath);

    const templateFile = fs.readFileSync(templateNormalizedPath, 'utf8');
    context.wazuh.logger.debug(
      `Template file loaded from: ${templateNormalizedPath}`,
    );

    const templateJSON = JSON.parse(templateFile);

    return templateJSON;
  } catch (err) {
    context.wazuh.logger.error(
      `Error reading template file: ${err.message || err}`,
    );
    return null;
  }
};

/**
 * Generate random sample data based on dataset type
 * @param {Object} options - Configuration options
 * @param {string} options.settingIndexPattern - Index pattern setting
 * @param {string} options.dataSet - Dataset name to generate data for
 * @param {Object} options.params - Additional parameters for data generation
 * @param {number} numAlerts - Number of alerts to generate
 * @param {RequestHandlerContext} context - Request context for logging
 * @return {Object} - Object containing generated alerts and template (if applicable)
 * @return {Array} return.alerts - Array of generated alert objects
 * @return {Object} [return.template] - Template object (only for non-WAZUH_SETTING_ALERTS_SAMPLE_PREFIX)
 */
export const generateSampleData = (
  {
    settingIndexPattern,
    dataSet,
    ...params
  }: {
    dataSet: string;
    settingIndexPattern: string;
  },
  numDocuments: number = 1,
  context: RequestHandlerContext,
) => {
  /** @type {import('./types').Alert[]} */
  const sampleData = [];
  // Get template
  const template = readTemplateFile(dataSet, context);

  // Generate sample data
  for (let i = 0; i < numDocuments; i++) {
    sampleData.push(generateSampleDataWithDataset(dataSet, params));
  }
  return { sampleData, template };
};
