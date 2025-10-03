import { existsSync } from 'fs';
import { EnvironmentPaths } from '../types/config';
import { PathAccessError } from '../errors';

/**
 * Remove trailing slashes. Preserve root '/'.
 */
export function stripTrailingSlash(pathValue: string): string {
  if (!pathValue) return '';
  if (pathValue === '/') return '/';
  return pathValue.replace(/\/+$/, '');
}

/**
 * Translate a host absolute path to its container-visible path based on known mount roots.
 * Returns an empty string when the path is outside known roots.
 */
export function toContainerPath(hostAbsolutePath: string, envPaths: EnvironmentPaths): string {
  const normalized = stripTrailingSlash(hostAbsolutePath);
  if (!normalized) return '';

  const { currentRepoHostRoot, siblingRepoHostRoot, currentRepoContainerRoot, siblingContainerRoot } = envPaths;

  if (
    currentRepoHostRoot &&
    (normalized === currentRepoHostRoot || normalized.startsWith(`${currentRepoHostRoot}/`))
  ) {
    const suffix = normalized.slice(currentRepoHostRoot.length);
    return stripTrailingSlash(`${currentRepoContainerRoot}${suffix}`);
  }

  if (
    siblingRepoHostRoot &&
    (normalized === siblingRepoHostRoot || normalized.startsWith(`${siblingRepoHostRoot}/`))
  ) {
    const suffix = normalized.slice(siblingRepoHostRoot.length);
    return stripTrailingSlash(`${siblingContainerRoot}${suffix}`);
  }

  return '';
}

/**
 * Ensure a host path is visible inside the container mounts.
 */
export function ensureAccessibleHostPath(hostAbsolutePath: string, description: string, envPaths: EnvironmentPaths): void {
  const containerPath = toContainerPath(hostAbsolutePath, envPaths);
  if (!containerPath || !existsSync(containerPath)) {
    const allowedRoots = [envPaths.siblingRepoHostRoot]
      .filter(Boolean)
      .join(' or ') || 'the mounted development roots';
    throw new PathAccessError(
      `${description} '${hostAbsolutePath}' does not exist or is not accessible from the development container. Place it under ${allowedRoots}.`
    );
  }
}
