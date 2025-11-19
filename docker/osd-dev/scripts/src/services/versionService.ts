import { EnvironmentPaths } from '../types/config';
import { readJsonFile } from '../utils/io';
import { VersionResolutionError } from '../errors';

export function getPlatformVersionFromPackageJson(
  _fieldLabel: string,
  envPaths: EnvironmentPaths,
): string {
  const pkg = readJsonFile<any>(envPaths.packageJsonPath);
  const version = pkg?.pluginPlatform?.version;
  if (!version) {
    throw new VersionResolutionError(
      `Could not retrieve the platform version from package.json.`,
    );
  }
  return version as string;
}

// This function retrieves the application version and revision following the format MAJOR.MINOR.PATCH-REVISION ej: 1.0.0-0

export function getAppVersionFromPackageJson(
  _fieldLabel: string,
  envPaths: EnvironmentPaths,
): string {
  const pkg = readJsonFile<any>(envPaths.packageJsonPath);
  const version = pkg?.version;
  const revision =
    pkg?.revision?.startsWith('0') && pkg?.revision.length > 1
      ? pkg.revision.slice(1)
      : pkg.revision;

  const appVersionWithRevision = `${version}-${revision}`;

  if (!version) {
    throw new VersionResolutionError(
      `Could not retrieve the app version from package.json.`,
    );
  }
  return appVersionWithRevision as string;
}
