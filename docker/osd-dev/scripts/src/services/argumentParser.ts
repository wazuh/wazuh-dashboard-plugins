import { resolve } from 'path';
import { ScriptConfig, EnvironmentPaths } from '../types/config';
import {
  ensureAccessibleHostPath,
  stripTrailingSlash,
  toContainerPath,
} from '../utils/pathUtils';
import { DevScriptError } from '../utils/errors';

export function printUsageAndExit(): never {
  /* eslint-disable no-console */
  console.log();
  console.log(
    './dev.sh [-o os_version] [-d osd_version] [-a agents_up] [-r repo=absolute_path ...] [default_repo_root] action [saml|server|server-local] [server_version]',
  );
  console.log();
  console.log('where');
  console.log('  -o os_version Specify the OS version (optional)');
  console.log('  -d osd_version Specify the OSD version (optional)');
  console.log(
    "  -a agents_up Specify 'rpm' or 'deb' to deploy an agent with server-local, or 'without' to deploy no agent (optional) (default: deploy 2 agents)",
  );
  console.log(
    '  -r repo=absolute_path Mount an external plugin repository (repeatable).',
  );
  console.log(
    '     Use -r only for external repos, e.g.: wazuh-dashboard-reporting/abs/path/wazuh-dashboard-reporting',
  );
  console.log(
    '  -base [absolute_path] Set the base directory where required repos (main, wazuh-core, wazuh-check-updates) are located (defaults to sibling wazuh-dashboard)',
  );
  console.log(
    '  default_repo_root Optional absolute path used as the base location for repositories',
  );
  console.log('  action is one of up | down | stop | start | manager-local-up');
  console.log('  saml to deploy a saml enabled environment (optional)');
  console.log(
    '  server to deploy a real server enabled environment (optional, requires server_version)',
  );
  console.log(
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
          throw new DevScriptError(
            "Invalid value for -a option. Allowed values are 'rpm', 'deb', 'without', or an empty string.",
          );
        }
        i++;
        break;
      }

      case '-r': {
        const repoSpec = argv[++i];
        if (!repoSpec.includes('=')) {
          throw new DevScriptError(
            `Invalid repository specification '${repoSpec}'. Expected format repo=/absolute/path.`,
          );
        }
        const [repoName, repoPath] = repoSpec.split('=');
        if (!repoName || !repoPath) {
          throw new DevScriptError(
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
          throw new DevScriptError(`Unsupported option '${arg}'.`);
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
            throw new DevScriptError(
              `Unexpected arguments: ${argv.slice(i).join(' ')}`,
            );
          }
          return config;
        }
        break;
      }
    }
  }

  // Resolve dashboard base if requested and not provided
  if (config.useDashboardFromSource && !config.dashboardBase) {
    const hostRoot = envPaths.siblingRepoHostRoot;
    if (!hostRoot) {
      throw new DevScriptError(
        'Cannot infer dashboard base path automatically. Provide an absolute path to -base.',
      );
    }

    const candidate = stripTrailingSlash(resolve(hostRoot, 'wazuh-dashboard'));
    const containerCandidate = toContainerPath(candidate, envPaths);
    if (!containerCandidate) {
      throw new DevScriptError(
        'Unable to locate wazuh-dashboard automatically. Provide an absolute path to -base.',
      );
    }
    config.dashboardBase = candidate;
  }

  if (config.useDashboardFromSource) {
    if (!config.dashboardBase || !config.dashboardBase.startsWith('/')) {
      throw new DevScriptError(
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
