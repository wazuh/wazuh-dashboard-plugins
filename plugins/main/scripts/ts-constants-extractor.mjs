import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Extract constants from TypeScript files
 * @param {string} tsFilePath - Path to TypeScript file
 * @param {string[]} constantNames - Names of constants to extract
 * @returns {Promise<Object>} Object with extracted constants
 */
export async function extractConstants(tsFilePath, constantNames) {
  const extractScript = `
    import * as constants from '${tsFilePath}';
    const result = {};
    ${constantNames
      .map(
        name => `
    if ('${name}' in constants) {
      result['${name}'] = constants['${name}'];
    }
    `,
      )
      .join('')}
    console.log(JSON.stringify(result));
  `;

  try {
    // Try tsx first
    const { stdout } = await execAsync(`npx tsx -e "${extractScript}"`, {
      cwd: __dirname,
    });
    return JSON.parse(stdout.trim());
  } catch (error) {
    console.warn('tsx failed, trying ts-node:', error.message);
    try {
      const { stdout } = await execAsync(
        `npx ts-node --esm -e "${extractScript}"`,
        { cwd: __dirname },
      );
      return JSON.parse(stdout.trim());
    } catch (tsNodeError) {
      console.warn('ts-node failed, using fallbacks:', tsNodeError.message);
      return {};
    }
  }
}

/**
 * Get plugin version from various sources
 * @returns {Promise<string>} Plugin version short
 */
export async function getPluginVersion() {
  try {
    // Try to extract from TypeScript constants
    const constants = await extractConstants('../common/constants.ts', [
      'PLUGIN_VERSION_SHORT',
    ]);
    if (constants.PLUGIN_VERSION_SHORT) {
      return constants.PLUGIN_VERSION_SHORT;
    }
  } catch (error) {
    console.warn('Could not extract from TypeScript:', error.message);
    process.exit(1);
  }
}
