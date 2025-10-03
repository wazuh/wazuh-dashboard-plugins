#!/usr/bin/env ts-node

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { OVERRIDE_COMPOSE_FILE, REQUIRED_REPOSITORIES, SECURITY_PLUGIN_ALIASES, DASHBOARD_SRC_PROFILE } from '../constants/app';
import { getEnvironmentPaths } from '../constants/paths';
import { generateOverrideFile } from '../services/composeOverrideGenerator';
import { runDockerCompose, printAgentEnrollmentHint } from '../services/dockerComposeRunner';
import { initializeBaseEnvironment, setVersionDerivedEnvironment, configureModeAndSecurity } from '../services/environmentConfigurator';
import { parseArguments, printUsageAndExit } from '../services/argumentParser';
import { resolveRepositoryHostPath, resolveRequiredRepositories } from '../services/repoResolver';
import { getPlatformVersionFromPackageJson } from '../services/versionService';
import { EnvironmentPaths, ScriptConfig } from '../types/config';
import { toRepositoryEnvVar } from '../utils/envUtils';
import { PathAccessError, ValidationError, ConfigurationError } from '../errors';
import { logger } from '../utils/logger';
import { ensureAccessibleHostPath, stripTrailingSlash, toContainerPath } from '../utils/pathUtils';

function ensureDashboardSources(config: ScriptConfig, envPaths: EnvironmentPaths): string {
  const dashboardContainerPath = toContainerPath(config.dashboardBase, envPaths);
  if (!dashboardContainerPath || !existsSync(dashboardContainerPath)) {
    const allowedRoots = [envPaths.currentRepoHostRoot, envPaths.siblingRepoHostRoot].filter(Boolean).join(' or ') || 'the mounted development roots';
    throw new PathAccessError(
      `Dashboard base path '${config.dashboardBase}' does not exist or is not accessible from the development container. Place it under ${allowedRoots}.`
    );
  }

  // Use host path for compose variables (not container alias)
  process.env.SRC_DASHBOARD = config.dashboardBase;

  const nvmrcHostPath = resolve(config.dashboardBase, '.nvmrc');
  const nvmrcContainerPath = toContainerPath(nvmrcHostPath, envPaths);
  if (!nvmrcContainerPath || !existsSync(nvmrcContainerPath)) {
    throw new PathAccessError(`.nvmrc not found at '${nvmrcHostPath}'. Provide a valid wazuh-dashboard checkout or pass -base with an absolute path to it.`);
  }

  const nodeVersion = readFileSync(nvmrcContainerPath, 'utf-8').trim();
  if (!nodeVersion) {
    throw new ValidationError(`.nvmrc at '${nvmrcHostPath}' is empty. Cannot determine Node version.`);
  }

  process.env.NODE_VERSION = nodeVersion;
  return nvmrcHostPath;
}

function resolveSecurityPluginPath(config: ScriptConfig, envPaths: EnvironmentPaths): string {
  // 1) Respect explicit -r override if provided
  const securityOverride = config.userRepositories.find((o) => SECURITY_PLUGIN_ALIASES.includes(o.name as any));
  if (securityOverride) {
    const normalized = stripTrailingSlash(securityOverride.path);
    if (!normalized.startsWith('/')) {
      throw new ValidationError(`Repository path '${securityOverride.path}' for '${securityOverride.name}' must be absolute.`);
    }
    ensureAccessibleHostPath(normalized, `Repository path for '${securityOverride.name}'`, envPaths);
    return normalized;
  }

  // 2) Search common locations
  const candidates: string[] = [];
  if (config.pluginsRoot) {
    candidates.push(resolve(config.pluginsRoot, 'wazuh-security-dashboards'));
    candidates.push(resolve(config.pluginsRoot, 'wazuh-security-dashboards-plugin'));
  }
  if (config.dashboardBase) {
    candidates.push(resolve(config.dashboardBase, 'plugins', 'wazuh-security-dashboards'));
    candidates.push(resolve(config.dashboardBase, 'plugins', 'wazuh-security-dashboards-plugin'));
  }
  if (envPaths.siblingRepoHostRoot) {
    candidates.push(resolve(envPaths.siblingRepoHostRoot, 'wazuh-security-dashboards'));
    candidates.push(resolve(envPaths.siblingRepoHostRoot, 'wazuh-security-dashboards-plugin'));
  }

  const seen = new Set<string>();
  for (const candidate of candidates) {
    const normalized = stripTrailingSlash(candidate);
    if (!normalized || !normalized.startsWith('/') || seen.has(normalized)) continue;
    seen.add(normalized);
    const containerCandidate = toContainerPath(normalized, envPaths);
    if (containerCandidate && existsSync(containerCandidate)) {
      const containerPackage = resolve(containerCandidate, 'package.json');
      if (!existsSync(containerPackage)) continue;
      return normalized;
    }
  }

  throw new ConfigurationError(
    'Unable to locate wazuh-security-dashboards plugin. Provide it with -r wazuh-security-dashboards=/absolute/path or ensure it exists under the chosen plugins root.'
  );
}

export async function main(argv: string[]): Promise<void> {
  const envPaths = getEnvironmentPaths();

  if (argv.length === 0) {
    printUsageAndExit();
  }

  let config = parseArguments(argv, envPaths);

  if (!config.action) {
    throw new ValidationError('Missing action argument');
  }

  // Get versions from package.json if not provided
  if (!config.osVersion) {
    logger.info(`OS Version not received via flag, getting the version from ${envPaths.packageJsonPath}`);
    config = { ...config, osVersion: getPlatformVersionFromPackageJson('OS', envPaths) };
  }
  if (!config.osdVersion) {
    logger.info(`OSD Version not received via flag, getting the version from ${envPaths.packageJsonPath}`);
    config = { ...config, osdVersion: getPlatformVersionFromPackageJson('OSD', envPaths) };
  }

  // Resolve required repositories and apply env vars
  const repoEnvVars = resolveRequiredRepositories(REQUIRED_REPOSITORIES, config, envPaths);
  for (const [name, value] of repoEnvVars.entries()) process.env[name] = value;

  let securityPluginHostPath = '';
  if (config.useDashboardFromSource) {
    const nvmrcHostPath = ensureDashboardSources(config, envPaths);
    securityPluginHostPath = resolveSecurityPluginPath(config, envPaths);

    ensureAccessibleHostPath(securityPluginHostPath, 'Security plugin path', envPaths);
    process.env.SRC_SECURITY_PLUGIN = securityPluginHostPath;

    const entrypointHostPath = resolve(envPaths.currentRepoContainerRoot, 'docker', 'osd-dev', 'dashboard-src', 'entrypoint.sh');
    if (!existsSync(entrypointHostPath)) {
      throw new ConfigurationError(`Expected dashboard entrypoint script at '${entrypointHostPath}'.`);
    }
    logger.info(`Using wazuh-dashboard sources from ${config.dashboardBase}`);
    logger.info(`Using wazuh-security-dashboards sources from ${securityPluginHostPath}`);
    logger.info(`Using Node.js version ${process.env.NODE_VERSION} from ${nvmrcHostPath}`);
  }

  // External repositories provided through -r
  const externalDynamicRepos: string[] = [];
  for (const override of config.userRepositories) {
    const normalizedOverride = stripTrailingSlash(override.path);
    const varName = toRepositoryEnvVar(override.name);
    const isRequired = (REQUIRED_REPOSITORIES as readonly string[]).includes(override.name);
    const isSecurityPlugin = config.useDashboardFromSource && SECURITY_PLUGIN_ALIASES.includes(override.name as any);

    if (isRequired || isSecurityPlugin) {
      ensureAccessibleHostPath(normalizedOverride, `Repository path for '${override.name}'`, envPaths);
    }
    repoEnvVars.set(varName, normalizedOverride);
    process.env[varName] = normalizedOverride;

    if (isRequired) continue;
    if (isSecurityPlugin) {
      securityPluginHostPath = securityPluginHostPath || normalizedOverride;
      continue;
    }
    externalDynamicRepos.push(override.name);
  }

  // Environment variables not tied to repos
  initializeBaseEnvironment(config);
  setVersionDerivedEnvironment(config.osdVersion, envPaths);
  const primaryProfile = configureModeAndSecurity(config);

  // Generate override file if needed
  generateOverrideFile({
    externalRepositories: externalDynamicRepos,
    repositoryEnvMap: repoEnvVars,
    useDashboardFromSource: config.useDashboardFromSource,
    includeSecurityPlugin: Boolean(securityPluginHostPath) && config.useDashboardFromSource,
  }, envPaths);

  // Compose files
  const composeFiles = ['dev.yml'];
  if (existsSync(OVERRIDE_COMPOSE_FILE)) composeFiles.push(OVERRIDE_COMPOSE_FILE);

  // Profiles
  const profiles = new Set<string>([primaryProfile]);
  if (config.useDashboardFromSource) profiles.add(DASHBOARD_SRC_PROFILE);

  const code = await runDockerCompose(config, Array.from(profiles), composeFiles, envPaths);
  if (code !== 0) {
    process.exit(code);
  }

  printAgentEnrollmentHint(config);
}
