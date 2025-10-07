#!/usr/bin/env ts-node

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import {
  OVERRIDE_COMPOSE_FILE,
  REQUIRED_REPOSITORIES,
  SECURITY_PLUGIN_NAME,
  SECURITY_PLUGIN_REPO_NAME,
  SECURITY_PLUGIN_ALIASES,
  PROFILES,
  DEV_COMPOSE_FILE,
  ACTIONS,
  FLAGS,
} from '../constants/app';
import { getEnvironmentPaths } from '../constants/paths';
import { generateOverrideFile } from '../services/composeOverrideGenerator';
import {
  runDockerCompose,
  printAgentEnrollmentHint,
} from '../services/dockerComposeRunner';
import {
  initializeBaseEnvironment,
  setVersionDerivedEnvironment,
  configureModeAndSecurity,
} from '../services/environmentConfigurator';
import { parseArguments, printUsageAndExit } from '../services/argumentParser';
import {
  resolveRepositoryHostPath,
  resolveRequiredRepositories,
} from '../services/repoResolver';
import { getPlatformVersionFromPackageJson } from '../services/versionService';
import { EnvironmentPaths, ScriptConfig } from '../types/config';
import { toRepositoryEnvVar } from '../utils/envUtils';
import {
  PathAccessError,
  ValidationError,
  ConfigurationError,
} from '../errors';
import { Dependencies } from '../types/deps';
import { execSync, spawn } from 'child_process';
import {
  ensureAccessibleHostPath,
  stripTrailingSlash,
  toContainerPath,
} from '../utils/pathUtils';

const isSecurityPluginName = (name: string): boolean =>
  SECURITY_PLUGIN_ALIASES.some(alias => alias === name);

function ensureDashboardSources(
  config: ScriptConfig,
  envPaths: EnvironmentPaths,
): string {
  const dashboardContainerPath = toContainerPath(
    config.dashboardBase,
    envPaths,
  );
  if (!dashboardContainerPath || !existsSync(dashboardContainerPath)) {
    const allowedRoots =
      [envPaths.siblingRepoHostRoot].filter(Boolean).join(' or ') ||
      'the mounted development roots';
    throw new PathAccessError(
      `Dashboard base path '${config.dashboardBase}' does not exist or is not accessible from the development container. Place it under ${allowedRoots}.`,
    );
  }

  // Use host path for compose variables (not container alias)
  process.env.SRC_DASHBOARD = config.dashboardBase;

  const nvmrcHostPath = resolve(config.dashboardBase, '.nvmrc');
  const nvmrcContainerPath = toContainerPath(nvmrcHostPath, envPaths);
  if (!nvmrcContainerPath || !existsSync(nvmrcContainerPath)) {
    throw new PathAccessError(
      `.nvmrc not found at '${nvmrcHostPath}'. Provide a valid wazuh-dashboard checkout or pass ${FLAGS.BASE} with an absolute path to it.`,
    );
  }

  const nodeVersion = readFileSync(nvmrcContainerPath, 'utf-8').trim();
  if (!nodeVersion) {
    throw new ValidationError(
      `.nvmrc at '${nvmrcHostPath}' is empty. Cannot determine Node version.`,
    );
  }

  process.env.NODE_VERSION = nodeVersion;
  return nvmrcHostPath;
}

function resolveSecurityPluginPath(
  config: ScriptConfig,
  envPaths: EnvironmentPaths,
): string {
  const pluginPathIfValid = (hostPath: string): string => {
    const container = toContainerPath(hostPath, envPaths);
    if (container && existsSync(container)) {
      const packageJsonPath = resolve(container, 'package.json');
      if (existsSync(packageJsonPath)) return hostPath;
    }
    return '';
  };

  const resolveFromBasePath = (baseHostPath: string): string => {
    // Accept either a direct plugin path or the repo root containing it
    const direct = pluginPathIfValid(baseHostPath);
    if (direct) return direct;
    const nested = pluginPathIfValid(
      resolve(baseHostPath, 'plugins', SECURITY_PLUGIN_NAME),
    );
    if (nested) return nested;
    throw new ConfigurationError(
      `Provided path '${baseHostPath}' does not look like the '${SECURITY_PLUGIN_NAME}' plugin directory or a '${SECURITY_PLUGIN_REPO_NAME}' repo root (expected package.json under either path).`,
    );
  };

  // 1) Respect explicit -r override if provided
  const securityOverride = config.userRepositories.find(repoOverride =>
    isSecurityPluginName(repoOverride.name),
  );
  if (securityOverride) {
    const normalized = stripTrailingSlash(securityOverride.path);
    if (!normalized.startsWith('/')) {
      throw new ValidationError(
        `Repository path '${securityOverride.path}' for '${securityOverride.name}' must be absolute.`,
      );
    }
    ensureAccessibleHostPath(
      normalized,
      `Repository path for '${securityOverride.name}'`,
      envPaths,
    );
    // Accept overrides pointing either to the plugin dir or the repo root
    return resolveFromBasePath(normalized);
  }

  // 2) Search common locations
  const candidates: string[] = [];
  if (config.pluginsRoot) {
    candidates.push(resolve(config.pluginsRoot, SECURITY_PLUGIN_NAME));
    // If a full repo lives under plugins root, accept it too
    candidates.push(resolve(config.pluginsRoot, SECURITY_PLUGIN_REPO_NAME));
  }
  if (config.dashboardBase) {
    candidates.push(
      resolve(config.dashboardBase, 'plugins', SECURITY_PLUGIN_NAME),
    );
  }
  if (envPaths.siblingRepoHostRoot) {
    candidates.push(
      resolve(envPaths.siblingRepoHostRoot, SECURITY_PLUGIN_NAME),
    );
    candidates.push(
      resolve(envPaths.siblingRepoHostRoot, SECURITY_PLUGIN_REPO_NAME),
    );
  }

  const seen = new Set<string>();
  for (const candidate of candidates) {
    const normalized = stripTrailingSlash(candidate);
    if (!normalized || !normalized.startsWith('/') || seen.has(normalized))
      continue;
    seen.add(normalized);

    // Try candidate as a direct plugin path first
    const direct = pluginPathIfValid(normalized);
    if (direct) return direct;

    // Then try nested under repo root convention: <repo>/plugins/<plugin>
    try {
      const nested = resolveFromBasePath(normalized);
      if (nested) return nested;
    } catch {
      // ignore and continue exploring other candidates
    }
  }

  throw new ConfigurationError(
    'Unable to locate wazuh-security-dashboards plugin. Provide it with -r wazuh-security-dashboards=/absolute/path or -r wazuh-security-dashboards-plugin=/absolute/path (repo root), or ensure it exists under the chosen plugins root.',
  );
}

export async function mainWithDeps(
  argv: string[],
  deps: Dependencies,
): Promise<void> {
  const envPaths = getEnvironmentPaths();

  if (argv.length === 0) {
    printUsageAndExit(deps.logger);
  }

  let config = parseArguments(argv, envPaths, deps.logger);

  if (!config.action) {
    throw new ValidationError('Missing action argument');
  }

  // Get versions from package.json if not provided
  if (!config.osVersion) {
    deps.logger.info(
      `OS Version not received via flag, getting the version from ${envPaths.packageJsonPath}`,
    );
    const resolvedOs = getPlatformVersionFromPackageJson('OS', envPaths);
    // Record that main resolved this value from package.json
    config.setOsVersion(resolvedOs, 'main');
  }
  if (!config.osdVersion) {
    deps.logger.info(
      `OSD Version not received via flag, getting the version from ${envPaths.packageJsonPath}`,
    );
    const resolvedOsd = getPlatformVersionFromPackageJson('OSD', envPaths);
    config.setOsdVersion(resolvedOsd, 'main');
  }

  // Resolve required repositories and apply env vars
  const repoEnvVars = resolveRequiredRepositories(
    REQUIRED_REPOSITORIES,
    config,
    envPaths,
  );
  for (const [name, value] of repoEnvVars.entries()) process.env[name] = value;

  let securityPluginHostPath = '';
  if (config.useDashboardFromSource) {
    const nvmrcHostPath = ensureDashboardSources(config, envPaths);
    securityPluginHostPath = resolveSecurityPluginPath(config, envPaths);

    ensureAccessibleHostPath(
      securityPluginHostPath,
      'Security plugin path',
      envPaths,
    );
    process.env.SRC_SECURITY_PLUGIN = securityPluginHostPath;

    const entrypointHostPath = resolve(
      envPaths.currentRepoContainerRoot,
      'docker',
      'osd-dev',
      'dashboard-src',
      'entrypoint.sh',
    );
    if (!existsSync(entrypointHostPath)) {
      throw new ConfigurationError(
        `Expected dashboard entrypoint script at '${entrypointHostPath}'.`,
      );
    }
    deps.logger.info(
      `Using wazuh-dashboard sources from ${config.dashboardBase}`,
    );
    deps.logger.info(
      `Using wazuh-security-dashboards sources from ${securityPluginHostPath}`,
    );
    deps.logger.info(
      `Using Node.js version ${process.env.NODE_VERSION} from ${nvmrcHostPath}`,
    );
  }

  // External repositories provided through -r
  const externalDynamicRepos: string[] = [];
  for (const override of config.userRepositories) {
    const normalizedOverride = stripTrailingSlash(override.path);
    const varName = toRepositoryEnvVar(override.name);
    const isRequired = (REQUIRED_REPOSITORIES as readonly string[]).includes(
      override.name,
    );
    const isSecurityPlugin =
      config.useDashboardFromSource && isSecurityPluginName(override.name);

    if (isRequired || isSecurityPlugin) {
      ensureAccessibleHostPath(
        normalizedOverride,
        `Repository path for '${override.name}'`,
        envPaths,
      );
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
  generateOverrideFile(
    {
      externalRepositories: externalDynamicRepos,
      repositoryEnvMap: repoEnvVars,
      useDashboardFromSource: config.useDashboardFromSource,
      includeSecurityPlugin:
        Boolean(securityPluginHostPath) && config.useDashboardFromSource,
    },
    envPaths,
    deps.logger,
  );

  // Compose files
  const composeFiles = [DEV_COMPOSE_FILE];
  if (existsSync(OVERRIDE_COMPOSE_FILE))
    composeFiles.push(OVERRIDE_COMPOSE_FILE);

  // Profiles
  const profiles = new Set<string>([primaryProfile]);
  if (config.useDashboardFromSource) profiles.add(PROFILES.DASHBOARD_SRC);
  // If SAML flag is enabled with another primary profile, include the SAML profile too
  if (
    (config.enableSaml || config.mode === PROFILES.SAML) &&
    primaryProfile !== PROFILES.SAML
  ) {
    profiles.add(PROFILES.SAML);
  }

  const defaultRunner = { execSync, spawn };
  const code = await runDockerCompose(
    config,
    Array.from(profiles),
    composeFiles,
    envPaths,
    deps.logger,
    deps.processRunner || defaultRunner,
  );
  if (code !== 0) {
    process.exit(code);
  }

  if (
    (config.mode === PROFILES.SERVER || Boolean(config.serverFlagVersion)) &&
    (config.action === ACTIONS.UP || config.action === ACTIONS.START)
  ) {
    printAgentEnrollmentHint(deps.logger);
  }
}

export async function main(argv: string[]): Promise<void> {
  const { logger } = await import('../utils/logger');
  const deps: Dependencies = { logger };
  return mainWithDeps(argv, deps);
}
