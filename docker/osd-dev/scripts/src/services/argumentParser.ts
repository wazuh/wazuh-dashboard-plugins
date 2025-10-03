import { resolve } from 'path';
import { ScriptConfig, EnvironmentPaths } from '../types/config';
import {
  ensureAccessibleHostPath,
  stripTrailingSlash,
  toContainerPath,
} from '../utils/pathUtils';
import { ValidationError, ConfigurationError } from '../errors';
import { logger } from '../utils/logger';

export function printUsageAndExit(): never {
  logger.infoPlain('');
  logger.infoPlain(
    './dev.sh [-o os_version] [-d osd_version] [-a agents_up] [-r repo=absolute_path ...] [default_repo_root] action [saml|server|server-local] [server_version]',
  );
  logger.infoPlain('');
  logger.infoPlain('where');
  logger.infoPlain('  -o os_version Specify the OS version (optional)');
  logger.infoPlain('  -d osd_version Specify the OSD version (optional)');
  logger.infoPlain(
    "  -a agents_up Specify 'rpm' or 'deb' to deploy an agent with server-local, or 'without' to deploy no agent (optional) (default: deploy 2 agents)",
  );
  logger.infoPlain(
    '  -r repo=absolute_path Mount an external plugin repository (repeatable).',
  );
  logger.infoPlain(
    '     Use -r only for external repos, e.g.: wazuh-dashboard-reporting/abs/path/wazuh-dashboard-reporting',
  );
  logger.infoPlain(
    '  -base [absolute_path] Set the base directory where required repos (main, wazuh-core, wazuh-check-updates) are located (defaults to sibling wazuh-dashboard)',
  );
  logger.infoPlain(
    '  default_repo_root Optional absolute path used as the base location for repositories',
  );
  logger.infoPlain('  action is one of up | down | stop | start | manager-local-up');
  logger.infoPlain('  saml to deploy a saml enabled environment (optional)');
  logger.infoPlain(
    '  server to deploy a real server enabled environment (optional, requires server_version)',
  );
  logger.infoPlain(
    '  server-local to deploy a real server enabled environment (optional, requires server_version)',
  );
  process.exit(1);
}

export function parseArguments(
  argv: string[],
  envPaths: EnvironmentPaths,
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
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    switch (arg) {
      case '-o': {
        config.osVersion = argv[++i];
        i++;
        break;
      }

      case '-d': {
        config.osdVersion = argv[++i];
        i++;
        break;
      }

      case '-a': {
        config.agentsUp = argv[++i];
        if (!['rpm', 'deb', 'without', ''].includes(config.agentsUp)) {
          throw new ValidationError(
            "Invalid value for -a option. Allowed values are 'rpm', 'deb', 'without', or an empty string.",
          );
        }
        i++;
        break;
      }

      case '-r': {
        const repoSpec = argv[++i];
        if (!repoSpec.includes('=')) {
          throw new ValidationError(
            `Invalid repository specification '${repoSpec}'. Expected format repo=/absolute/path.`,
          );
        }
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
        } else {
          i++;
        }
        break;
      }

      default: {
        if (arg.startsWith('/')) {
          // This is the default plugins root path
          config.pluginsRoot = stripTrailingSlash(arg);
          ensureAccessibleHostPath(config.pluginsRoot, 'Base path', envPaths);
          i++;
        } else if (arg.startsWith('-')) {
          throw new ValidationError(`Unsupported option '${arg}'.`);
        } else {
          // First non-flag argument is the action
          config.action = arg;
          i++;
          // Optional mode and mode_version
          if (i < argv.length && !argv[i].startsWith('-')) {
            config.mode = argv[i];
            i++;
          }
          if (i < argv.length && !argv[i].startsWith('-')) {
            config.modeVersion = argv[i];
            i++;
          }
          // Check for unexpected arguments
          if (i < argv.length) {
            throw new ValidationError(
              `Unexpected arguments: ${argv.slice(i).join(' ')}`,
            );
          }
          // Break to allow post-processing (auto-detection) after parsing action/mode
          break;
        }
        break;
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

  return config;
}
