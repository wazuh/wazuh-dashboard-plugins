import { version } from '../../package.json';

// Documentation
export const DOCUMENTATION_WEB_BASE_URL = 'https://documentation.wazuh.com';
export const PLUGIN_VERSION_SHORT = version.split('.').splice(0, 2).join('.');

/**
 * Generate a URL to the web documentation taking in account the plugin short version or specified version.
 * @param urlPath Relative path to the base URL + version.
 * @param version version. Optional. It will use the plugin short version by default.
 * @returns
 */
export function buildWebDocUrl<U extends string, V extends string>(
  urlPath: U,
  version: V = PLUGIN_VERSION_SHORT as V,
): `${typeof DOCUMENTATION_WEB_BASE_URL}/${V}/${U}` {
  return `${DOCUMENTATION_WEB_BASE_URL}/${version}/${urlPath}`;
}
