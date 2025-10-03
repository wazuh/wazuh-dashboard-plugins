import { resolve } from 'path';
import { EnvironmentPaths } from '../types/config';
import { stripTrailingSlash } from '../utils/pathUtils';

/**
 * Read environment variables and derive container/host roots and important paths.
 */
export function getEnvironmentPaths(): EnvironmentPaths {
  const currentRepoContainerRoot = stripTrailingSlash(process.env.WDP_CONTAINER_ROOT || '/wdp');
  const siblingContainerRoot = stripTrailingSlash(process.env.SIBLING_CONTAINER_ROOT || '/sibling');
  const currentRepoHostRoot = stripTrailingSlash(process.env.CURRENT_REPO_HOST_ROOT || '');
  const siblingRepoHostRoot = stripTrailingSlash(process.env.SIBLING_REPO_HOST_ROOT || '');

  const packageJsonPath = resolve(currentRepoContainerRoot, 'plugins', 'wazuh-core', 'package.json');
  const createNetworksScriptPath = resolve(currentRepoContainerRoot, 'docker', 'scripts', 'create_docker_networks.sh');

  return {
    currentRepoContainerRoot,
    siblingContainerRoot,
    currentRepoHostRoot,
    siblingRepoHostRoot,
    packageJsonPath,
    createNetworksScriptPath,
  };
}

