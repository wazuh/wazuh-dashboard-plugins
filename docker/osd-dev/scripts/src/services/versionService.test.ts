import type { EnvironmentPaths } from '../types/config';
import { getPlatformVersionFromPackageJson } from './versionService';
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
    const v = getPlatformVersionFromPackageJson('OSD', envPaths);
    expect(v).toBe('2.9.1');
    expect(readJsonFile).toHaveBeenCalledWith(envPaths.packageJsonPath);
  });

  it('throws VersionResolutionError when version missing', () => {
    (readJsonFile as jest.Mock).mockReturnValue({});
    expect(() => getPlatformVersionFromPackageJson('OSD', envPaths)).toThrow(
      VersionResolutionError,
    );
  });
});
