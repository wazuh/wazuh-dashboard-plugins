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
    './dev.sh [-o os_version] [-d osd_version] [-a agents_up] [-r repo=absolute_path ...] [default_repo_root] action [saml|server|server-local] [server_version]',
  );
  log.infoPlain('');
  log.infoPlain('where');
  log.infoPlain('  -o os_version Specify the OS version (optional)');
  log.infoPlain('  -d osd_version Specify the OSD version (optional)');
  log.infoPlain(
    "  -a agents_up Specify 'rpm' or 'deb' to deploy an agent with server-local, or 'without' to deploy no agent (optional) (default: deploy 2 agents)",
  );
  log.infoPlain(
    '  -r repo=absolute_path Mount an external plugin repository (repeatable).',
  );
  log.infoPlain(
    '     Use -r only for external repos, e.g.: wazuh-dashboard-reporting/abs/path/wazuh-dashboard-reporting',
  );
  log.infoPlain(
    "     Shorthand: '-r repo' assumes '/sibling/repo' inside the container and resolves it from the sibling root.",
  );
  log.infoPlain(
    '  -base [absolute_path] Set the base directory where required repos (main, wazuh-core, wazuh-check-updates) are located (defaults to sibling wazuh-dashboard)',
  );
  log.infoPlain(
    '  default_repo_root Optional absolute path used as the base location for repositories',
  );
  log.infoPlain('  action is one of up | down | stop | start | manager-local-up');
  log.infoPlain('  saml to deploy a saml enabled environment (optional)');
  log.infoPlain(
    '  server to deploy a real server enabled environment (optional, requires server_version)',
  );
  log.infoPlain(
    '  server-local to deploy a real server enabled environment (optional, requires server_version)',
  );
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
          const inferredHostPath = stripTrailingSlash(resolve(envPaths.siblingRepoHostRoot, repoName));
          // Ensure it's visible from container mounts
          ensureAccessibleHostPath(inferredHostPath, `Repository path for '${repoName}'`, envPaths);
          config.userRepositories.push({ name: repoName, path: inferredHostPath });
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
