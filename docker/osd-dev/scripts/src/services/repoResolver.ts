import { existsSync } from 'fs';
import { resolve } from 'path';
import { ScriptConfig, EnvironmentPaths } from '../types/config';
import {
  ensureAccessibleHostPath,
  stripTrailingSlash,
  toContainerPath,
} from '../utils/pathUtils';
import { toRepositoryEnvVar } from '../utils/envUtils';
import { ValidationError, ConfigurationError } from '../errors';

export function resolveRepositoryHostPath(
  repoName: string,
  config: ScriptConfig,
  envPaths: EnvironmentPaths,
): string {
  const override = config.userRepositories.find(
    repoOverride => repoOverride.name === repoName,
  );
  let hostPath = override?.path ? stripTrailingSlash(override.path) : '';

  if (hostPath) {
    if (!hostPath.startsWith('/')) {
      throw new ValidationError(
        `Repository path '${hostPath}' for '${repoName}' must be absolute.`,
      );
    }
  } else {
    if (!envPaths.currentRepoHostRoot) {
      throw new ConfigurationError(
        'CURRENT_REPO_HOST_ROOT environment variable is not set.',
      );
    }

    const candidateBases: string[] = [];
    if (config.pluginsRoot) {
      candidateBases.push(config.pluginsRoot);
    }
    candidateBases.push(envPaths.currentRepoHostRoot);
    if (envPaths.siblingRepoHostRoot) {
      candidateBases.push(
        resolve(envPaths.siblingRepoHostRoot, 'wazuh-dashboard-plugins'),
      );
      candidateBases.push(
        resolve(envPaths.siblingRepoHostRoot, 'wazuh-dashboard'),
      );
    }

    const resolvedBase = candidateBases.map(stripTrailingSlash).find(base => {
      if (!base) return false;

      const candidates = [
        `${base}/plugins/${repoName}`,
        `${base}/${repoName}`,
        base,
      ];

      for (const candidate of candidates) {
        const containerCandidate = toContainerPath(candidate, envPaths);
        if (containerCandidate && existsSync(containerCandidate)) {
          const containerPackage = resolve(containerCandidate, 'package.json');
          if (!existsSync(containerPackage)) continue;
          hostPath = candidate;
          return true;
        }
      }
      return false;
    });

    if (!resolvedBase) {
      throw new ValidationError(
        `Repository path for '${repoName}' not provided. Supply a base directory containing the plugin or use -r ${repoName}=/absolute/path.`,
      );
    }
  }

  ensureAccessibleHostPath(
    hostPath,
    `Repository path for '${repoName}'`,
    envPaths,
  );
  return stripTrailingSlash(hostPath);
}

export function resolveRequiredRepositories(
  requiredRepositories: readonly string[],
  config: ScriptConfig,
  envPaths: EnvironmentPaths,
): Map<string, string> {
  const envMap = new Map<string, string>();
  for (const repo of requiredRepositories) {
    const path = resolveRepositoryHostPath(repo, config, envPaths);
    const varName = toRepositoryEnvVar(repo);
    envMap.set(varName, path);
  }
  return envMap;
}
