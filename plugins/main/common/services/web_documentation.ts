import { DOCUMENTATION_WEB_BASE_URL, PLUGIN_VERSION_SHORT } from '../constants';

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
