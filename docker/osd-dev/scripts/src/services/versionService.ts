import { EnvironmentPaths } from '../types/config';
import { readJsonFile } from '../utils/io';
import { DevScriptError } from '../utils/errors';

export function getPlatformVersionFromPackageJson(_fieldLabel: string, envPaths: EnvironmentPaths): string {
  const pkg = readJsonFile<any>(envPaths.packageJsonPath);
  const version = pkg?.pluginPlatform?.version;
  if (!version) {
    throw new DevScriptError(`Could not retrieve the platform version from package.json.`);
  }
  return version as string;
}

