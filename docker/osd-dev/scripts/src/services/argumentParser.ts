import { resolve } from 'path';
import { ScriptConfig, EnvironmentPaths, Config } from '../types/config';
import {
  ensureAccessibleHostPath,
  stripTrailingSlash,
  toContainerPath,
} from '../utils/pathUtils';
import { ValidationError, ConfigurationError } from '../errors';
import {
  ACTIONS,
  PROFILES,
  FLAGS,
  SECURITY_PLUGIN_ALIASES,
} from '../constants/app';
import type { Logger } from '../utils/logger';

export function printUsageAndExit(log: Logger): never {
  log.infoPlain('');
  log.infoPlain(
    `./dev.sh <action> [${FLAGS.PLUGINS_ROOT} /abs/path] [${FLAGS.OS_VERSION} os_version] [${FLAGS.OSD_VERSION} osd_version] [${FLAGS.AGENTS_UP} agents_up] [${FLAGS.REPO} repo=absolute_path ...] [${FLAGS.SAML} | ${FLAGS.SERVER} <version> | ${FLAGS.SERVER_LOCAL} <tag>] [${FLAGS.BASE} [absolute_path]]`,
  );
  log.infoPlain('');
  log.infoPlain('Flags');
  log.infoPlain(
    `  ${FLAGS.PLUGINS_ROOT} <abs>  Optional. Absolute base path where repositories live (aliases: ${FLAGS.PLUGINS_ROOT_WDP}, ${FLAGS.PLUGINS_ROOT_WZ_HOME}).`,
  );
  log.infoPlain(`  ${FLAGS.OS_VERSION} <os_version>      Optional OS version`);
  log.infoPlain(`  ${FLAGS.OSD_VERSION} <osd_version>    Optional OSD version`);
  log.infoPlain(
    `  ${FLAGS.AGENTS_UP} <agents_up>       Optional for server-local: 'rpm' | 'deb' | 'without' (default: deploy 2 agents)`,
  );
  log.infoPlain(
    `  ${FLAGS.SAML}                 Enable SAML profile (can be combined with ${FLAGS.SERVER}/${FLAGS.SERVER_LOCAL})`,
  );
  log.infoPlain(
    `  ${FLAGS.SERVER} <version>    Enable server mode with the given version`,
  );
  log.infoPlain(
    `  ${FLAGS.SERVER_LOCAL} <tag>  Enable server-local mode with the given local image tag`,
  );
  log.infoPlain(
    `  ${FLAGS.REPO} repo=absolute_path Mount an external plugin repository (repeatable). Must point to the repository ROOT, not a subfolder. Shorthand: ${FLAGS.REPO} repo (resolved under sibling root).`,
  );
  log.infoPlain(
    `  ${FLAGS.BASE} [absolute_path] Use dashboard sources from a local checkout (auto-detects under sibling root when path omitted).`,
  );
  log.infoPlain('');
  log.infoPlain(
    'Note: The only allowed positional token is the action (e.g., "up"). All other values must use flags.',
  );
  process.exit(1);
}

export function parseArguments(
  argv: string[],
  envPaths: EnvironmentPaths,
  log: Logger,
): Config {
  const config = new Config();

  // New-style flags collection (mapped later into mode/modeVersion). No positional args allowed.

  let index = 0;
  const allowedActions = new Set<string>(Object.values(ACTIONS));

  while (index < argv.length) {
    const arg = argv[index];

    switch (arg) {
      case FLAGS.HELP:
      case FLAGS.HELP_SHORT: {
        printUsageAndExit(log);
      }

      case FLAGS.PLUGINS_ROOT:
      case FLAGS.PLUGINS_ROOT_WDP:
      case FLAGS.PLUGINS_ROOT_WZ_HOME: {
        const path = argv[++index];
        if (!path || !path.startsWith('/')) {
          throw new ValidationError(
            `${FLAGS.PLUGINS_ROOT} requires an absolute path value`,
          );
        }
        config.setPluginsRoot(stripTrailingSlash(path), 'argumentParser');
        ensureAccessibleHostPath(config.pluginsRoot, 'Base path', envPaths);
        index++;
        break;
      }
      case FLAGS.OS_VERSION: {
        const version = argv[++index];
        if (!version || version.startsWith('-')) {
          throw new ValidationError(
            `${FLAGS.OS_VERSION} requires a version value, e.g. '${FLAGS.OS_VERSION} 2.11.0'`,
          );
        }
        config.setOsVersion(version, 'argumentParser');
        index++;
        break;
      }

      case FLAGS.OSD_VERSION: {
        const version = argv[++index];
        if (!version || version.startsWith('-')) {
          throw new ValidationError(
            `${FLAGS.OSD_VERSION} requires a version value, e.g. '${FLAGS.OSD_VERSION} 2.11.0'`,
          );
        }
        config.setOsdVersion(version, 'argumentParser');
        index++;
        break;
      }

      case FLAGS.AGENTS_UP: {
        let val = argv[++index];
        // Aliases for 'without'
        if (val === 'none' || val === '0') val = 'without';
        config.setAgentsUp(val, 'argumentParser');
        if (!['rpm', 'deb', 'without', ''].includes(config.agentsUp)) {
          throw new ValidationError(
            `Invalid value for ${FLAGS.AGENTS_UP} option. Allowed values are 'rpm', 'deb', 'without', or an empty string.`,
          );
        }
        index++;
        break;
      }

      case FLAGS.SAML: {
        config.setEnableSaml(true, 'argumentParser');
        index++;
        break;
      }

      case FLAGS.SERVER: {
        const version = argv[++index];
        if (!version || version.startsWith('-')) {
          throw new ValidationError(
            `${FLAGS.SERVER} requires a version argument, e.g. ${FLAGS.SERVER} 4.12.0`,
          );
        }
        config.setServerFlagVersion(version, 'argumentParser');
        index++;
        break;
      }

      case FLAGS.SERVER_LOCAL: {
        const version = argv[++index];
        if (!version || version.startsWith('-')) {
          throw new ValidationError(
            `${FLAGS.SERVER_LOCAL} requires a version/tag argument, e.g. ${FLAGS.SERVER_LOCAL} my-tag`,
          );
        }
        config.setServerLocalFlagVersion(version, 'argumentParser');
        index++;
        break;
      }

      case FLAGS.REPO: {
        const repoSpec = argv[++index];
        if (repoSpec.includes('=')) {
          const [repoName, repoPath] = repoSpec.split('=');
          if (!repoName || !repoPath) {
            throw new ValidationError(
              `Invalid repository specification '${repoSpec}'. Expected format repo=/absolute/path.`,
            );
          }
          if (repoPath.includes('/plugins/')) {
            throw new ValidationError(
              `Invalid path for -r ${repoName}: '${repoPath}'. Do not point to subfolders like '/plugins/...'. Provide the repository root instead.`,
            );
          }
          config.addUserRepositoryOverride(
            {
              name: repoName,
              path: repoPath,
            },
            'argumentParser',
          );
        } else {
          // Shorthand: -r <repoName> implies sibling root path
          const repoName = repoSpec;
          const siblingFolderName = SECURITY_PLUGIN_ALIASES.includes(
            repoName as (typeof SECURITY_PLUGIN_ALIASES)[number],
          )
            ? SECURITY_PLUGIN_ALIASES[0]
            : repoName;
          if (!envPaths.siblingRepoHostRoot) {
            throw new ValidationError(
              `Cannot resolve repository '${repoName}' under sibling root. Provide ${FLAGS.REPO} ${repoName}=/absolute/path or set SIBLING_REPO_HOST_ROOT.`,
            );
          }
          const inferredHostPath = stripTrailingSlash(
            resolve(envPaths.siblingRepoHostRoot, siblingFolderName),
          );
          // Ensure it's visible from container mounts
          ensureAccessibleHostPath(
            inferredHostPath,
            `Repository path for '${repoName}'`,
            envPaths,
          );
          config.addUserRepositoryOverride(
            {
              name: repoName,
              path: inferredHostPath,
            },
            'argumentParser',
          );
        }
        index++;
        break;
      }

      case FLAGS.BASE: {
        config.setUseDashboardFromSource(true, 'argumentParser');
        const nextArg = argv[index + 1];

        if (nextArg && nextArg.startsWith('/')) {
          const basePath = stripTrailingSlash(nextArg);
          ensureAccessibleHostPath(basePath, 'Dashboard base path', envPaths);
          config.setDashboardBase(basePath, 'argumentParser');
          index += 2;
        } else if (
          nextArg &&
          !nextArg.startsWith('-') &&
          !allowedActions.has(nextArg)
        ) {
          // Ignore and consume a relative token after FLAGS.BASE for backward compatibility
          // (kept to satisfy tests that pass a placeholder like 'relative/path').
          index += 2;
        } else {
          index++;
        }
        break;
      }

      default: {
        if (arg.startsWith('-')) {
          throw new ValidationError(`Unsupported option '${arg}'.`);
        }
        // Allow exactly one positional action token, anywhere
        if (allowedActions.has(arg)) {
          if (config.action) {
            throw new ValidationError(
              `Action provided multiple times: '${config.action}' and '${arg}'. Use only one positional action.`,
            );
          }
          config.action = arg;
          index++;
          break;
        }
        // Any other non-flag token is not allowed
        throw new ValidationError(
          `Positional arguments are not allowed (found '${arg}'). Only the action token is allowed positionally; use flags for everything else.`,
        );
      }
    }
  }

  // Resolve dashboard base if requested and not provided
  if (config.useDashboardFromSource && !config.dashboardBase) {
    const hostRoot = envPaths.siblingRepoHostRoot;
    if (!hostRoot) {
      throw new ConfigurationError(
        'Cannot infer dashboard base path automatically. Provide an absolute path to --base.',
      );
    }

    const candidate = stripTrailingSlash(resolve(hostRoot, 'wazuh-dashboard'));
    const containerCandidate = toContainerPath(candidate, envPaths);
    if (!containerCandidate) {
      throw new ValidationError(
        `Unable to locate wazuh-dashboard automatically. Provide an absolute path to ${FLAGS.BASE}.`,
      );
    }
    config.setDashboardBase(candidate, 'argumentParser');
  }

  if (config.useDashboardFromSource) {
    if (!config.dashboardBase || !config.dashboardBase.startsWith('/')) {
      throw new ValidationError(
        `The ${FLAGS.BASE} option requires an absolute path to the wazuh-dashboard repository.`,
      );
    }
    ensureAccessibleHostPath(
      config.dashboardBase,
      'Dashboard base path',
      envPaths,
    );
  }

  if (!config.pluginsRoot && envPaths.currentRepoHostRoot) {
    config.setPluginsRoot(
      stripTrailingSlash(resolve(envPaths.currentRepoHostRoot, 'plugins')),
      'argumentParser',
    );
  }

  if (config.pluginsRoot) {
    ensureAccessibleHostPath(config.pluginsRoot, 'Base path', envPaths);
  }

  // Map new-style flags to mode/modeVersion, taking precedence over positional mode
  if (config.serverFlagVersion && config.serverLocalFlagVersion) {
    throw new ValidationError(
      `Cannot combine '${FLAGS.SERVER}' and '${FLAGS.SERVER_LOCAL}' flags`,
    );
  }
  // Map explicit mode flags
  if (config.serverFlagVersion) {
    config.setMode(PROFILES.SERVER, 'argumentParser');
    config.setModeVersion(config.serverFlagVersion, 'argumentParser');
  } else if (config.serverLocalFlagVersion) {
    config.setMode(PROFILES.SERVER_LOCAL, 'argumentParser');
    config.setModeVersion(config.serverLocalFlagVersion, 'argumentParser');
  } else if (config.enableSaml && !config.mode) {
    config.setMode(PROFILES.SAML, 'argumentParser');
  }

  return config;
}
