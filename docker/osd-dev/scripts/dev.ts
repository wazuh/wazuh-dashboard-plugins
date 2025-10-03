#!/usr/bin/env ts-node

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';

// Types
interface RepoOverride {
  name: string;
  path: string;
}

interface Config {
  osVersion: string;
  osdVersion: string;
  agentsUp: string;
  userRepos: RepoOverride[];
  pluginsRoot: string;
  action: string;
  mode: string;
  modeVersion: string;
  dashboardBase: string;
  useDashboardFromSource: boolean;
}

interface GenerateOverrideOptions {
  externalRepos: string[];
  repoEnvVars: Map<string, string>;
  useDashboardFromSource: boolean;
  includeSecurityPlugin: boolean;
}

function stripTrailingSlash(path: string): string {
  if (!path) {
    return '';
  }

  if (path === '/') {
    return '/';
  }

  return path.replace(/\/+$/, '');
}

// Constants
const CURRENT_REPO_CONTAINER_ROOT = stripTrailingSlash(process.env.WDP_CONTAINER_ROOT || '/wdp');
const SIBLING_CONTAINER_ROOT = stripTrailingSlash(process.env.SIBLING_CONTAINER_ROOT || '/sibling');
const REQUIRED_REPOS = ['main', 'wazuh-core', 'wazuh-check-updates'];
const SECURITY_PLUGIN_ALIASES = ['wazuh-security-dashboards', 'wazuh-security-dashboards-plugin'];
const DASHBOARD_SRC_PROFILE = 'dashboard-src';
const DASHBOARD_ENTRYPOINT_PATH = './dashboard-src/entrypoint.sh';
const CURRENT_REPO_HOST_ROOT = stripTrailingSlash(process.env.CURRENT_REPO_HOST_ROOT || '');
const SIBLING_REPO_HOST_ROOT = stripTrailingSlash(process.env.SIBLING_REPO_HOST_ROOT || '');
const PACKAGE_PATH = resolve(CURRENT_REPO_CONTAINER_ROOT, 'plugins', 'wazuh-core', 'package.json');
const CREATE_NETWORKS_SCRIPT = resolve(CURRENT_REPO_CONTAINER_ROOT, 'docker', 'scripts', 'create_docker_networks.sh');

function toContainerPath(path: string): string {
  const normalized = stripTrailingSlash(path);

  if (!normalized) {
    return '';
  }

  if (CURRENT_REPO_HOST_ROOT && (normalized === CURRENT_REPO_HOST_ROOT || normalized.startsWith(`${CURRENT_REPO_HOST_ROOT}/`))) {
    const suffix = normalized.slice(CURRENT_REPO_HOST_ROOT.length);
    return stripTrailingSlash(`${CURRENT_REPO_CONTAINER_ROOT}${suffix}`);
  }

  if (SIBLING_REPO_HOST_ROOT && (normalized === SIBLING_REPO_HOST_ROOT || normalized.startsWith(`${SIBLING_REPO_HOST_ROOT}/`))) {
    const suffix = normalized.slice(SIBLING_REPO_HOST_ROOT.length);
    return stripTrailingSlash(`${SIBLING_CONTAINER_ROOT}${suffix}`);
  }

  return '';
}

const OVERRIDE_FILE = 'dev.override.generated.yml';

// Utility functions
function usage(): void {
  console.log();
  console.log('./dev.sh [-o os_version] [-d osd_version] [-a agents_up] [-r repo=absolute_path ...] [default_repo_root] action [saml|server|server-local] [server_version]');
  console.log();
  console.log('where');
  console.log('  -o os_version Specify the OS version (optional)');
  console.log('  -d osd_version Specify the OSD version (optional)');
  console.log('  -a agents_up Specify \'rpm\' or \'deb\' to deploy an agent with server-local, or \'without\' to deploy no agent (optional) (default: deploy 2 agents)');
  console.log('  -r repo=absolute_path Mount an external plugin repository (repeatable).');
  console.log('     Use -r only for external repos, e.g.: wazuh-dashboard-reporting/abs/path/wazuh-dashboard-reporting');
  console.log('  -base [absolute_path] Set the base directory where required repos (main, wazuh-core, wazuh-check-updates) are located (defaults to sibling wazuh-dashboard)');
  console.log('  default_repo_root Optional absolute path used as the base location for repositories');
  console.log('  action is one of up | down | stop | start | manager-local-up');
  console.log('  saml to deploy a saml enabled environment (optional)');
  console.log('  server to deploy a real server enabled environment (optional, requires server_version)');
  console.log('  server-local to deploy a real server enabled environment (optional, requires server_version)');
  process.exit(1);
}

function exitWithMessage(message: string): never {
  console.error(`[ERROR] ${message}`);
  process.exit(1);
}

function toEnvVarName(repo: string): string {
  const sanitized = repo.replace(/-/g, '_').replace(/\./g, '_');
  const upper = sanitized.toUpperCase();
  return `REPO_${upper}`;
}

function ensureAccessibleHostPath(path: string, description: string): void {
  const containerPath = toContainerPath(path);
  if (!containerPath || !existsSync(containerPath)) {
    const allowedRoots = [CURRENT_REPO_HOST_ROOT, SIBLING_REPO_HOST_ROOT].filter(Boolean).join(' or ') || 'the mounted development roots';
    exitWithMessage(`${description} '${path}' does not exist or is not accessible from the development container. Place it under ${allowedRoots}.`);
  }
}

function resolveRepoPath(repo: string, userRepos: RepoOverride[], pluginsRoot: string): string {
  // Search user overrides first
  const override = userRepos.find(r => r.name === repo);
  let hostPath = override?.path ? stripTrailingSlash(override.path) : '';

  if (hostPath) {
    if (!hostPath.startsWith('/')) {
      exitWithMessage(`Repository path '${hostPath}' for '${repo}' must be absolute.`);
    }
  } else {
    if (!CURRENT_REPO_HOST_ROOT) {
      exitWithMessage('CURRENT_REPO_HOST_ROOT environment variable is not set.');
    }
    const candidateBases: string[] = [];

    if (pluginsRoot) {
      candidateBases.push(pluginsRoot);
    }

    candidateBases.push(CURRENT_REPO_HOST_ROOT);

    if (SIBLING_REPO_HOST_ROOT) {
      candidateBases.push(resolve(SIBLING_REPO_HOST_ROOT, 'wazuh-dashboard-plugins'));
      candidateBases.push(resolve(SIBLING_REPO_HOST_ROOT, 'wazuh-dashboard'));
    }

    const resolvedBase = candidateBases.map(stripTrailingSlash).find(base => {
      if (!base) {
        return false;
      }

      const candidates = [
        `${base}/plugins/${repo}`,
        `${base}/${repo}`,
        base,
      ];

      for (const candidate of candidates) {
        const containerCandidate = toContainerPath(candidate);
        if (containerCandidate && existsSync(containerCandidate)) {
          const containerPackage = resolve(containerCandidate, 'package.json');
          if (!existsSync(containerPackage)) {
            continue;
          }
          hostPath = candidate;
          return true;
        }
      }

      return false;
    });

    if (!resolvedBase) {
      exitWithMessage(`Repository path for '${repo}' not provided. Supply a base directory containing the plugin or use -r ${repo}=/absolute/path.`);
    }
  }

  ensureAccessibleHostPath(hostPath, `Repository path for '${repo}'`);

  return stripTrailingSlash(hostPath);
}

function parseArguments(args: string[]): Config {
  const config: Config = {
    osVersion: '',
    osdVersion: '',
    agentsUp: '',
    userRepos: [],
    pluginsRoot: '',
    action: '',
    mode: '',
    modeVersion: '',
    dashboardBase: '',
    useDashboardFromSource: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '-o') {
      config.osVersion = args[++i];
      i++;
    } else if (arg === '-d') {
      config.osdVersion = args[++i];
      i++;
    } else if (arg === '-a') {
      config.agentsUp = args[++i];
      if (!['rpm', 'deb', 'without', ''].includes(config.agentsUp)) {
        exitWithMessage("Invalid value for -a option. Allowed values are 'rpm', 'deb', 'without', or an empty string.");
      }
      i++;
    } else if (arg === '-r') {
      const repoSpec = args[++i];
      if (!repoSpec.includes('=')) {
        exitWithMessage(`Invalid repository specification '${repoSpec}'. Expected format repo=/absolute/path.`);
      }
      const [repoName, repoPath] = repoSpec.split('=');
      if (!repoName || !repoPath) {
        exitWithMessage(`Invalid repository specification '${repoSpec}'. Expected format repo=/absolute/path.`);
      }
      config.userRepos.push({ name: repoName, path: repoPath.replace(/\/$/, '') });
      i++;
    } else if (arg === '-base' || arg === '--base') {
      config.useDashboardFromSource = true;
      const nextArg = args[i + 1];

      if (nextArg && nextArg.startsWith('/')) {
        const basePath = stripTrailingSlash(nextArg);
        ensureAccessibleHostPath(basePath, 'Dashboard base path');
        config.dashboardBase = basePath;
        i += 2;
      } else {
        i++;
      }
    } else if (arg.startsWith('/')) {
      // This is the default plugins root path
      config.pluginsRoot = stripTrailingSlash(arg);
      ensureAccessibleHostPath(config.pluginsRoot, 'Base path');
      i++;
    } else if (arg.startsWith('-')) {
      exitWithMessage(`Unsupported option '${arg}'.`);
    } else {
      // First non-flag argument is the action
      config.action = arg;
      i++;
      // Optional mode and mode_version
      if (i < args.length && !args[i].startsWith('-')) {
        config.mode = args[i];
        i++;
      }
      if (i < args.length && !args[i].startsWith('-')) {
        config.modeVersion = args[i];
        i++;
      }
      // Check for unexpected arguments
      if (i < args.length) {
        exitWithMessage(`Unexpected arguments: ${args.slice(i).join(' ')}`);
      }
      break;
    }
  }

  if (config.useDashboardFromSource && !config.dashboardBase) {
    const hostRoot = SIBLING_REPO_HOST_ROOT;
    if (!hostRoot) {
      exitWithMessage('Cannot infer dashboard base path automatically. Provide an absolute path to -base.');
    }

    const candidate = stripTrailingSlash(resolve(hostRoot, 'wazuh-dashboard'));
    const containerCandidate = toContainerPath(candidate);
    if (!containerCandidate || !existsSync(containerCandidate)) {
      exitWithMessage('Unable to locate wazuh-dashboard automatically. Provide an absolute path to -base.');
    }

    config.dashboardBase = candidate;
  }

  if (config.useDashboardFromSource) {
    if (!config.dashboardBase || !config.dashboardBase.startsWith('/')) {
      exitWithMessage('The -base option requires an absolute path to the wazuh-dashboard repository.');
    }
    ensureAccessibleHostPath(config.dashboardBase, 'Dashboard base path');
  }

  if (!config.pluginsRoot && CURRENT_REPO_HOST_ROOT) {
    config.pluginsRoot = stripTrailingSlash(resolve(CURRENT_REPO_HOST_ROOT, 'plugins'));
  }

  if (config.pluginsRoot) {
    ensureAccessibleHostPath(config.pluginsRoot, 'Base path');
  }

  return config;
}

function getVersionFromPackageJson(field: string): string {
  if (!existsSync(PACKAGE_PATH)) {
    exitWithMessage('The file package.json was not found.');
  }

  const packageJson = JSON.parse(readFileSync(PACKAGE_PATH, 'utf-8'));
  const version = packageJson?.pluginPlatform?.version;

  if (!version) {
    exitWithMessage(`Could not retrieve the ${field} version from package.json.`);
  }

  return version;
}

function generateOverrideFile(options: GenerateOverrideOptions): void {
  const { externalRepos, repoEnvVars, useDashboardFromSource, includeSecurityPlugin } = options;
  const shouldGenerate = useDashboardFromSource || externalRepos.length > 0;

  if (!shouldGenerate) {
    if (existsSync(OVERRIDE_FILE)) {
      unlinkSync(OVERRIDE_FILE);
      console.log('[INFO] Removed previous compose override file.');
    } else {
      console.log('[INFO] No dynamic compose override required.');
    }
    return;
  }

  const messages: string[] = [];
  if (useDashboardFromSource) {
    messages.push('dashboard sources mode');
  }
  if (externalRepos.length > 0) {
    messages.push(`external repositories: ${externalRepos.join(', ')}`);
  }
  console.log(`[INFO] Generating compose override for ${messages.join(' and ')}`);

  let content = 'services:\n';
  // Add dashboard-src-installer service when using dashboard sources
  if (useDashboardFromSource) {
    content += '  dashboard-src-installer:\n';
    content += '    image: node:${NODE_VERSION}\n';
    content += '    profiles:\n';
    content += `      - '${DASHBOARD_SRC_PROFILE}'\n`;
    content += '    container_name: dashboard-src-installer-${NODE_VERSION}\n';
    content += '    volumes:\n';
    content += "      - '${SRC_DASHBOARD}:/home/node/kbn'\n";
    content += "    user: '1000:1000'\n";
    content += '    working_dir: /home/node/kbn\n';
    content += '    entrypoint: /bin/bash\n';
    content += '    command: >\n';
    content += "      -c '\n";
    content += '        marker_osd_bootstrap="/home/node/kbn/.NO_COMMIT_MARKER_OSD_BOOTSTRAP_WAS_DONE"\n';
    content += '        root_app_dir="/home/node/kbn"\n\n';
    content += '        if [ -f "$$marker_osd_bootstrap" ]; then\n';
    content += '          echo "File $$marker_osd_bootstrap was found. Skip setup.";\n';
    content += '          exit 0;\n';
    content += '        fi\n';
    content += '        echo "Initializating setup"\n';
    content += '        cd $$root_app_dir\n';
    content += '        yarn osd clean && yarn osd bootstrap && touch $$marker_osd_bootstrap\n';
    content += '        echo "Setup was finished"\n';
    content += "      '\n";
  }

  content += '  osd:\n';

  const volumeEntries: string[] = [];

  if (useDashboardFromSource) {
    content += '    depends_on:\n';
    content += '      dashboard-src-installer:\n';
    content += '        condition: service_completed_successfully\n';
    content += '    image: node:${NODE_VERSION}\n';
    content += '    profiles:\n';
    const profileSet = new Set<string>([DASHBOARD_SRC_PROFILE]);
    for (const profile of profileSet) {
      content += `      - '${profile}'\n`;
    }
    content += '    ports:\n';
    content += "    entrypoint: ['/bin/bash', '/entrypoint.sh']\n";
    content += '    working_dir: /home/node/kbn\n';

    volumeEntries.push("      - '${SRC_DASHBOARD}:/home/node/kbn'");
    if (includeSecurityPlugin) {
      volumeEntries.push("      - '${SRC_SECURITY_PLUGIN}:/home/node/kbn/plugins/wazuh-security-dashboards'");
    }
    volumeEntries.push(`      - ${DASHBOARD_ENTRYPOINT_PATH}:/entrypoint.sh:ro`);
  }

  for (const repo of externalRepos) {
    volumeEntries.push(`      - '${repo}:/home/node/kbn/plugins/${repo}'`);
  }

  if (volumeEntries.length > 0) {
    content += '    volumes:\n';
    content += `${volumeEntries.join('\n')}\n`;
  }

  if (externalRepos.length > 0) {
    content += 'volumes:\n';

    for (const repo of externalRepos) {
      const repoPath = repoEnvVars.get(toEnvVarName(repo));
      if (!repoPath) {
        exitWithMessage(`Repository path for '${repo}' not resolved.`);
      }
      content += `  ${repo}:\n`;
      content += `    driver: local\n`;
      content += `    driver_opts:\n`;
      content += `      type: none\n`;
      content += `      o: bind\n`;
      content += `      device: ${repoPath}\n`;
    }
  }

  writeFileSync(OVERRIDE_FILE, content);
}

function runDockerCompose(config: Config, profiles: string[], composeFiles: string[]): void {
  const composeArgs = ['compose'];

  for (const profile of profiles) {
    composeArgs.push('--profile', profile);
  }

  for (const file of composeFiles) {
    composeArgs.push('-f', file);
  }

  switch (config.action) {
    case 'up':
      // Create networks first
      try {
        if (existsSync(CREATE_NETWORKS_SCRIPT)) {
          execSync(`/bin/bash ${CREATE_NETWORKS_SCRIPT}`, { stdio: 'inherit' });
        }
      } catch (error) {
        console.error('[ERROR] Failed to create docker networks');
      }

      composeArgs.push('up', '-Vd');
      break;
    case 'start':
      composeArgs.push('start');
      break;
    case 'down':
      composeArgs.push('down', '-v', '--remove-orphans');
      break;
    case 'stop':
      composeArgs.push('-p', process.env.COMPOSE_PROJECT_NAME || '', 'stop');
      break;
    case 'manager-local-up':
      composeArgs.push('-p', process.env.COMPOSE_PROJECT_NAME || '', 'up', '-d', 'wazuh.manager.local');
      break;
    default:
      exitWithMessage('Action must be up | down | stop | start | manager-local-up');
  }

  console.log(`[INFO] Running: docker ${composeArgs.join(' ')}`);
  const result = spawn('docker', composeArgs, { stdio: 'inherit' });

  result.on('close', (code) => {
    if (code !== 0) {
      process.exit(code || 1);
    }

    // Display agent enrollment command for server mode
    if (config.action === 'up' && config.mode === 'server') {
      const projectName = process.env.COMPOSE_PROJECT_NAME || '';
      const osVersion = process.env.OS_VERSION || '';
      const wazuhStack = process.env.WAZUH_STACK || '';

      console.log();
      console.log('**************WARNING**************');
      console.log('The agent version must be a published one. This uses only released versions.');
      console.log('If you need to change de version, edit the command as you see fit.');
      console.log('***********************************');
      console.log('1. (Optional) Enroll an agent (Ubuntu 20.04):');
      console.log(`docker run --name ${projectName}-agent-$(date +%s) --network os-dev-${osVersion} --label com.docker.compose.project=${projectName} --env WAZUH_AGENT_VERSION=${wazuhStack} -d ubuntu:20.04 bash -c '`);
      console.log('  apt update -y');
      console.log('  apt install -y curl lsb-release');
      console.log('  curl -so \\wazuh-agent-\\${WAZUH_AGENT_VERSION}.deb \\');
      console.log('    https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_\\${WAZUH_AGENT_VERSION}-1_amd64.deb \\');
      console.log('    && WAZUH_MANAGER=\'wazuh.manager\' WAZUH_AGENT_GROUP=\'default\' dpkg -i ./wazuh-agent-\\${WAZUH_AGENT_VERSION}.deb');
      console.log();
      console.log('  /etc/init.d/wazuh-agent start');
      console.log('  tail -f /var/ossec/logs/ossec.log');
      console.log(`'`);
      console.log();
    }
  });
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    usage();
  }

  const config = parseArguments(args);

  if (!config.action) {
    exitWithMessage('Missing action argument');
  }

  // Get versions from package.json if not provided
  if (!config.osVersion) {
    console.log(`[INFO] OS Version not received via flag, getting the version from ${PACKAGE_PATH}`);
    config.osVersion = getVersionFromPackageJson('OS');
  }

  if (!config.osdVersion) {
    console.log(`[INFO] OSD Version not received via flag, getting the version from ${PACKAGE_PATH}`);
    config.osdVersion = getVersionFromPackageJson('OSD');
  }

  // Resolve repository paths
  const repoEnvVars = new Map<string, string>();

  for (const repo of REQUIRED_REPOS) {
    const path = resolveRepoPath(repo, config.userRepos, config.pluginsRoot);
    const varName = toEnvVarName(repo);
    repoEnvVars.set(varName, path);
    process.env[varName] = path;
  }

  let securityPluginHostPath = '';
  if (config.useDashboardFromSource) {
    const dashboardContainerPath = toContainerPath(config.dashboardBase);
    if (!dashboardContainerPath || !existsSync(dashboardContainerPath)) {
      const allowedRoots = [CURRENT_REPO_HOST_ROOT, SIBLING_REPO_HOST_ROOT].filter(Boolean).join(' or ') || 'the mounted development roots';
      exitWithMessage(`Dashboard base path '${config.dashboardBase}' does not exist or is not accessible from the development container. Place it under ${allowedRoots}.`);
    }

    // Use host path for compose variables (not container alias)
    process.env.SRC_DASHBOARD = config.dashboardBase;

    const nvmrcHostPath = resolve(config.dashboardBase, '.nvmrc');
    const nvmrcContainerPath = toContainerPath(nvmrcHostPath);
    if (!nvmrcContainerPath || !existsSync(nvmrcContainerPath)) {
      exitWithMessage(`.nvmrc not found at '${nvmrcHostPath}'. Provide a valid wazuh-dashboard checkout or pass -base with an absolute path to it.`);
    }

    const nodeVersion = readFileSync(nvmrcContainerPath, 'utf-8').trim();
    if (!nodeVersion) {
      exitWithMessage(`.nvmrc at '${nvmrcHostPath}' is empty. Cannot determine Node version.`);
    }
    process.env.NODE_VERSION = nodeVersion;

    const securityOverride = config.userRepos.find(override =>
      SECURITY_PLUGIN_ALIASES.includes(override.name)
    );

    if (securityOverride) {
      const normalized = stripTrailingSlash(securityOverride.path);
      if (!normalized.startsWith('/')) {
        exitWithMessage(`Repository path '${securityOverride.path}' for '${securityOverride.name}' must be absolute.`);
      }
      ensureAccessibleHostPath(normalized, `Repository path for '${securityOverride.name}'`);
      securityPluginHostPath = normalized;
    } else {
      const securityCandidates: string[] = [];

      if (config.pluginsRoot) {
        securityCandidates.push(resolve(config.pluginsRoot, 'wazuh-security-dashboards'));
        securityCandidates.push(resolve(config.pluginsRoot, 'wazuh-security-dashboards-plugin'));
      }

      if (config.dashboardBase) {
        securityCandidates.push(resolve(config.dashboardBase, 'plugins', 'wazuh-security-dashboards'));
        securityCandidates.push(resolve(config.dashboardBase, 'plugins', 'wazuh-security-dashboards-plugin'));
      }

      if (SIBLING_REPO_HOST_ROOT) {
        securityCandidates.push(resolve(SIBLING_REPO_HOST_ROOT, 'wazuh-security-dashboards'));
        securityCandidates.push(resolve(SIBLING_REPO_HOST_ROOT, 'wazuh-security-dashboards-plugin'));
      }

      const seenCandidates = new Set<string>();
      for (const candidate of securityCandidates) {
        const normalizedCandidate = stripTrailingSlash(candidate);
        if (!normalizedCandidate || !normalizedCandidate.startsWith('/') || seenCandidates.has(normalizedCandidate)) {
          continue;
        }
        seenCandidates.add(normalizedCandidate);
        const containerCandidate = toContainerPath(normalizedCandidate);
        if (containerCandidate && existsSync(containerCandidate)) {
          const containerPackage = resolve(containerCandidate, 'package.json');
          if (!existsSync(containerPackage)) {
            continue;
          }
          securityPluginHostPath = normalizedCandidate;
          break;
        }
      }
    }

    if (!securityPluginHostPath) {
      exitWithMessage('Unable to locate wazuh-security-dashboards plugin. Provide it with -r wazuh-security-dashboards=/absolute/path or ensure it exists under the chosen plugins root.');
    }

    ensureAccessibleHostPath(securityPluginHostPath, 'Security plugin path');
    // Use host path for compose variables (not container alias)
    process.env.SRC_SECURITY_PLUGIN = securityPluginHostPath;
    const entrypointHostPath = resolve(CURRENT_REPO_CONTAINER_ROOT, 'docker', 'osd-dev', 'dashboard-src', 'entrypoint.sh');
    if (!existsSync(entrypointHostPath)) {
      exitWithMessage(`Expected dashboard entrypoint script at '${entrypointHostPath}'.`);
    }
    console.log(`[INFO] Using wazuh-dashboard sources from ${config.dashboardBase}`);
    console.log(`[INFO] Using wazuh-security-dashboards sources from ${securityPluginHostPath}`);
    console.log(`[INFO] Using Node.js version ${process.env.NODE_VERSION} from ${nvmrcHostPath}`);
  }

  const externalDynamicRepos: string[] = [];
  for (const override of config.userRepos) {
    const normalizedOverride = stripTrailingSlash(override.path);
    const varName = toEnvVarName(override.name);

    // For required repos and security plugin in dashboard-src mode, keep strict validation.
    // For other external repos, skip container accessibility validation and let Docker bind-mount the host path.
    const isRequired = REQUIRED_REPOS.includes(override.name);
    const isSecurityPlugin = config.useDashboardFromSource && SECURITY_PLUGIN_ALIASES.includes(override.name);
    if (isRequired || isSecurityPlugin) {
      ensureAccessibleHostPath(normalizedOverride, `Repository path for '${override.name}'`);
    }

    repoEnvVars.set(varName, normalizedOverride);
    process.env[varName] = normalizedOverride;

    if (isRequired) {
      continue;
    }

    if (isSecurityPlugin) {
      // Already handled as part of SRC_SECURITY_PLUGIN
      securityPluginHostPath = securityPluginHostPath || normalizedOverride;
      continue;
    }

    externalDynamicRepos.push(override.name);
  }

  const dashboardSourcesEnabled = config.useDashboardFromSource;
  const hasSecurityPlugin = Boolean(securityPluginHostPath);

  // Generate override file
  generateOverrideFile({
    externalRepos: externalDynamicRepos,
    repoEnvVars,
    useDashboardFromSource: dashboardSourcesEnabled,
    includeSecurityPlugin: dashboardSourcesEnabled && hasSecurityPlugin,
  });

  // Prepare compose files
  const composeFiles = ['dev.yml'];
  if (existsSync(OVERRIDE_FILE)) {
    composeFiles.push(OVERRIDE_FILE);
  }

  // Set environment variables
  process.env.PASSWORD = process.env.PASSWORD || 'admin';
  process.env.OS_VERSION = config.osVersion;
  process.env.OSD_VERSION = config.osdVersion;
  process.env.OSD_PORT = process.env.PORT || '5601';
  process.env.IMPOSTER_VERSION = '3.44.1';
  // Use host path for compose variables (not container alias)
  process.env.SRC = config.pluginsRoot || '';

  const osdMajorNumber = parseInt(config.osdVersion.split('.')[0], 10);
  process.env.OSD_MAJOR_NUMBER = osdMajorNumber.toString();
  process.env.COMPOSE_PROJECT_NAME = `os-dev-${config.osdVersion.replace(/\./g, '')}`;
  process.env.WAZUH_STACK = '';

  if (existsSync(PACKAGE_PATH)) {
    const packageJson = JSON.parse(readFileSync(PACKAGE_PATH, 'utf-8'));
    process.env.WAZUH_VERSION_DEVELOPMENT = packageJson.version;
  }

  const osdMajor = osdMajorNumber >= 2 ? '2.x' : '1.x';
  process.env.OSD_MAJOR = osdMajor;

  let primaryProfile = 'standard';
  process.env.WAZUH_DASHBOARD_CONF = `./config/${osdMajor}/osd/opensearch_dashboards.yml`;
  process.env.SEC_CONFIG_FILE = `./config/${osdMajor}/os/config.yml`;

  // Handle modes
  if (config.mode) {
    switch (config.mode) {
      case 'saml':
        try {
          const hostsContent = readFileSync('/etc/hosts', 'utf-8');
          if (!hostsContent.includes('idp')) {
            exitWithMessage('Add idp to /etc/hosts');
          }
        } catch {
          exitWithMessage('Cannot read /etc/hosts');
        }

        primaryProfile = 'saml';
        process.env.WAZUH_DASHBOARD_CONF = `./config/${osdMajor}/osd/opensearch_dashboards_saml.yml`;
        process.env.SEC_CONFIG_FILE = `./config/${osdMajor}/os/config-saml.yml`;
        break;

      case 'server':
        if (!config.modeVersion) {
          exitWithMessage('server mode requires the server_version argument');
        }
        primaryProfile = 'server';
        process.env.WAZUH_STACK = config.modeVersion;
        break;

      case 'server-local':
        if (!config.modeVersion) {
          exitWithMessage('server-local mode requires the server_version argument');
        }
        if (config.agentsUp) {
          primaryProfile = `server-local-${config.agentsUp}`;
        } else {
          primaryProfile = 'server-local';
        }
        process.env.IMAGE_TAG = config.modeVersion;
        break;

      case 'server-local-rpm':
      case 'server-local-deb':
      case 'server-local-without':
        if (!config.modeVersion) {
          exitWithMessage(`${config.mode} mode requires the server_version argument`);
        }
        primaryProfile = config.mode;
        process.env.IMAGE_TAG = config.modeVersion;
        break;

      default:
        exitWithMessage(`Unsupported mode '${config.mode}'`);
    }
  }

  // Set security config path
  process.env.SEC_CONFIG_PATH = osdMajor === '2.x'
    ? '/usr/share/opensearch/config/opensearch-security'
    : '/usr/share/opensearch/plugins/opensearch-security/securityconfig';

  // Run docker compose
  const profileSelection = new Set<string>([primaryProfile]);
  if (config.useDashboardFromSource) {
    profileSelection.add(DASHBOARD_SRC_PROFILE);
  }

  runDockerCompose(config, Array.from(profileSelection), composeFiles);
}

// Run main
main();
