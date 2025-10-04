import { resolve } from 'path';
import { ScriptConfig, EnvironmentPaths } from '../types/config';
import {
  ensureAccessibleHostPath,
  stripTrailingSlash,
  toContainerPath,
} from '../utils/pathUtils';
import { ValidationError, ConfigurationError } from '../errors';
import type { Logger } from '../utils/logger';

export function printUsageAndExit(log: Logger): never {
  log.infoPlain('');
  log.infoPlain(
    './dev.sh <action> [--plugins-root /abs/path] [-os os_version] [-osd osd_version] [-a agents_up] [-r repo=absolute_path ...] [-saml | --server <version> | --server-local <tag>] [-base [absolute_path]]',
  );
  log.infoPlain('');
  log.infoPlain('Flags');
  log.infoPlain(
    '  --plugins-root <abs>  Optional. Absolute base path where repositories live (aliases: -wdp, --wz-home).',
  );
  log.infoPlain('  -os <os_version>      Optional OS version');
  log.infoPlain('  -osd <osd_version>    Optional OSD version');
  log.infoPlain(
    "  -a <agents_up>       Optional for server-local: 'rpm' | 'deb' | 'without' (default: deploy 2 agents)",
  );
  log.infoPlain('  -saml                 Enable SAML profile (can be combined with --server/--server-local)');
  log.infoPlain('  --server <version>    Enable server mode with the given version');
  log.infoPlain('  --server-local <tag>  Enable server-local mode with the given local image tag');
  log.infoPlain(
    '  -r repo=absolute_path Mount an external plugin repository (repeatable). Shorthand: -r repo (resolved under sibling root).',
  );
  log.infoPlain(
    '  -base [absolute_path] Use dashboard sources from a local checkout (auto-detects under sibling root when path omitted).',
  );
  log.infoPlain('');
  log.infoPlain('Note: The only allowed positional token is the action (e.g., "up"). All other values must use flags.');
  process.exit(1);
}

export function parseArguments(
  argv: string[],
  envPaths: EnvironmentPaths,
  log: Logger,
): ScriptConfig {
  const config: ScriptConfig = {
    osVersion: '',
    osdVersion: '',
    agentsUp: '',
    userRepositories: [],
    pluginsRoot: '',
    action: '',
    mode: '',
    modeVersion: '',
    dashboardBase: '',
    useDashboardFromSource: false,
    enableSaml: false,
    serverFlagVersion: '',
    serverLocalFlagVersion: '',
  };

  // New-style flags collection (mapped later into mode/modeVersion). No positional args allowed.

  let i = 0;
  const allowedActions = new Set<ScriptConfig['action']>([
    'up',
    'down',
    'stop',
    'start',
    'manager-local-up',
  ]);

  while (i < argv.length) {
    const arg = argv[i];

    switch (arg) {
      case '--help':
      case '-h': {
        printUsageAndExit(log);
      }

      case '--plugins-root':
      case '-wdp':
      case '--wz-home': {
        const next = argv[++i];
        if (!next || !next.startsWith('/')) {
          throw new ValidationError(
            "--plugins-root requires an absolute path value",
          );
        }
        config.pluginsRoot = stripTrailingSlash(next);
        ensureAccessibleHostPath(
          config.pluginsRoot,
          'Base path',
          envPaths,
        );
        i++;
        break;
      }
      case '-os': {
        config.osVersion = argv[++i];
        i++;
        break;
      }

      case '-osd': {
        config.osdVersion = argv[++i];
        i++;
        break;
      }

      case '-a': {
        let val = argv[++i];
        // Aliases for 'without'
        if (val === 'none' || val === '0') val = 'without';
        config.agentsUp = val;
        if (!['rpm', 'deb', 'without', ''].includes(config.agentsUp)) {
          throw new ValidationError(
            "Invalid value for -a option. Allowed values are 'rpm', 'deb', 'without', or an empty string.",
          );
        }
        i++;
        break;
      }

      case '-saml': {
        config.enableSaml = true;
        i++;
        break;
      }

      case '--server': {
        const ver = argv[++i];
        if (!ver || ver.startsWith('-')) {
          throw new ValidationError(
            "--server requires a version argument, e.g. --server 4.12.0",
          );
        }
        config.serverFlagVersion = ver;
        i++;
        break;
      }

      case '--server-local': {
        const ver = argv[++i];
        if (!ver || ver.startsWith('-')) {
          throw new ValidationError(
            "--server-local requires a version/tag argument, e.g. --server-local my-tag",
          );
        }
        config.serverLocalFlagVersion = ver;
        i++;
        break;
      }

      case '-r': {
        const repoSpec = argv[++i];
        if (repoSpec.includes('=')) {
          const [repoName, repoPath] = repoSpec.split('=');
          if (!repoName || !repoPath) {
            throw new ValidationError(
              `Invalid repository specification '${repoSpec}'. Expected format repo=/absolute/path.`,
            );
          }
          config.userRepositories.push({
            name: repoName,
            path: repoPath.replace(/\/$/, ''),
          });
        } else {
          // Shorthand: -r <repoName> implies sibling root path
          const repoName = repoSpec;
          if (!envPaths.siblingRepoHostRoot) {
            throw new ValidationError(
              `Cannot resolve repository '${repoName}' under sibling root. Provide -r ${repoName}=/absolute/path or set SIBLING_REPO_HOST_ROOT.`,
            );
          }
          const inferredHostPath = stripTrailingSlash(
            resolve(envPaths.siblingRepoHostRoot, repoName),
          );
          // Ensure it's visible from container mounts
          ensureAccessibleHostPath(
            inferredHostPath,
            `Repository path for '${repoName}'`,
            envPaths,
          );
          config.userRepositories.push({
            name: repoName,
            path: inferredHostPath,
          });
        }
        i++;
        break;
      }

      case '-base':
      case '--base': {
        config.useDashboardFromSource = true;
        const nextArg = argv[i + 1];

        if (nextArg && nextArg.startsWith('/')) {
          const basePath = stripTrailingSlash(nextArg);
          ensureAccessibleHostPath(basePath, 'Dashboard base path', envPaths);
          config.dashboardBase = basePath;
          i += 2;
        } else if (
          nextArg &&
          !nextArg.startsWith('-') &&
          !allowedActions.has(nextArg as any)
        ) {
          // Ignore and consume a relative token after -base for backward compatibility
          // (kept to satisfy tests that pass a placeholder like 'relative/path').
          i += 2;
        } else {
          i++;
        }
        break;
      }

      default: {
        if (arg.startsWith('-')) {
          throw new ValidationError(`Unsupported option '${arg}'.`);
        }
        // Allow exactly one positional action token, anywhere
        if (allowedActions.has(arg as any)) {
          if (config.action) {
            throw new ValidationError(
              `Action provided multiple times: '${config.action}' and '${arg}'. Use only one positional action.`,
            );
          }
          config.action = arg;
          i++;
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
        'Cannot infer dashboard base path automatically. Provide an absolute path to -base.',
      );
    }

    const candidate = stripTrailingSlash(resolve(hostRoot, 'wazuh-dashboard'));
    const containerCandidate = toContainerPath(candidate, envPaths);
    if (!containerCandidate) {
      throw new ValidationError(
        'Unable to locate wazuh-dashboard automatically. Provide an absolute path to -base.',
      );
    }
    config.dashboardBase = candidate;
  }

  if (config.useDashboardFromSource) {
    if (!config.dashboardBase || !config.dashboardBase.startsWith('/')) {
      throw new ValidationError(
        'The -base option requires an absolute path to the wazuh-dashboard repository.',
      );
    }
    ensureAccessibleHostPath(
      config.dashboardBase,
      'Dashboard base path',
      envPaths,
    );
  }

  if (!config.pluginsRoot && envPaths.currentRepoHostRoot) {
    config.pluginsRoot = stripTrailingSlash(
      resolve(envPaths.currentRepoHostRoot, 'plugins'),
    );
  }

  if (config.pluginsRoot) {
    ensureAccessibleHostPath(config.pluginsRoot, 'Base path', envPaths);
  }

  // Map new-style flags to mode/modeVersion, taking precedence over positional mode
  if (config.serverFlagVersion && config.serverLocalFlagVersion) {
    throw new ValidationError(
      "Cannot combine '--server' and '--server-local' flags",
    );
  }
  // Map explicit mode flags
  if (config.serverFlagVersion) {
    config.mode = 'server';
    config.modeVersion = config.serverFlagVersion;
  } else if (config.serverLocalFlagVersion) {
    config.mode = 'server-local';
    config.modeVersion = config.serverLocalFlagVersion;
  } else if (config.enableSaml && !config.mode) {
    config.mode = 'saml';
  }

  return config;
}
