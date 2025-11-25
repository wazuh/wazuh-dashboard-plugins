import type { EnvironmentPaths } from '../types/config';
import {
  getAppVersionFromPackageJson,
  getPlatformVersionFromPackageJson,
} from './versionService';
import { VersionResolutionError } from '../errors';

// Use manual mock for utils/io (see src/utils/__mocks__/io.ts)
jest.mock('../utils/io');
import { readJsonFile } from '../utils/io';

describe('services/versionService', () => {
  const envPaths: EnvironmentPaths = {
    currentRepoContainerRoot: '/wdp',
    siblingContainerRoot: '/sibling',
    currentRepoHostRoot: '/host',
    siblingRepoHostRoot: '/host/sibling',
    packageJsonPath: '/wdp/plugins/wazuh-core/package.json',
    createNetworksScriptPath: '/wdp/docker/scripts/create_docker_networks.sh',
  };

  it('reads version from package.json pluginPlatform.version', () => {
    (readJsonFile as jest.Mock).mockReturnValue({
      pluginPlatform: { version: '2.9.1' },
    });
    const version = getPlatformVersionFromPackageJson('OSD', envPaths);
    expect(version).toBe('2.9.1');
    expect(readJsonFile).toHaveBeenCalledWith(envPaths.packageJsonPath);
  });

  it('throws VersionResolutionError when version missing', () => {
    (readJsonFile as jest.Mock).mockReturnValue({});
    expect(() => getPlatformVersionFromPackageJson('OSD', envPaths)).toThrow(
      VersionResolutionError,
    );
  });

  it('reads version from package.json version and revision', () => {
    (readJsonFile as jest.Mock).mockReturnValue({
      version: '5.0.0',
      revision: '00',
    });
    const wazuhIndexerVersion = getAppVersionFromPackageJson('OS', envPaths);
    expect(wazuhIndexerVersion).toBe('5.0.0-0');
    expect(readJsonFile).toHaveBeenCalledWith(envPaths.packageJsonPath);
  });

  it('reads version from package.json version and revision', () => {
    (readJsonFile as jest.Mock).mockReturnValue({
      version: '5.0.0',
      revision: '0',
    });
    const wazuhIndexerVersion = getAppVersionFromPackageJson('OS', envPaths);
    expect(wazuhIndexerVersion).toBe('5.0.0-0');
    expect(readJsonFile).toHaveBeenCalledWith(envPaths.packageJsonPath);
  });

  it('reads version from package.json version and revision', () => {
    (readJsonFile as jest.Mock).mockReturnValue({
      version: '5.0.0',
      revision: '13',
    });
    const wazuhIndexerVersion = getAppVersionFromPackageJson('OS', envPaths);
    expect(wazuhIndexerVersion).toBe('5.0.0-13');
    expect(readJsonFile).toHaveBeenCalledWith(envPaths.packageJsonPath);
  });

  it('throws VersionResolutionError when version missing', () => {
    (readJsonFile as jest.Mock).mockReturnValue({});
    expect(() => getAppVersionFromPackageJson('OS', envPaths)).toThrow(
      VersionResolutionError,
    );
  });
});
