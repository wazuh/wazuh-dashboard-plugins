import {
  existsSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { resolve } from 'path';
import { DEFAULTS, PROFILES, SECURITY_CONFIG_PATH } from '../constants/app';
import type { Logger } from '../utils/logger';
import { EnvironmentPaths, ScriptConfig } from '../types/config';
import { ValidationError } from '../errors';
import {
  MSG_SERVER_LOCAL_MODE_REQUIRES_VERSION,
  MSG_SERVER_MODE_REQUIRES_VERSION,
  msgUnsupportedModeToken,
} from '../constants/messages';

export const GENERATED_SERVER_LOCAL_SUFFIX = '.generated.server-local.yml';

export function removeGeneratedServerLocalDashboardFiles(
  envPaths: EnvironmentPaths,
  log: Logger,
): void {
  const configRoot = resolve(
    envPaths.currentRepoContainerRoot,
    'docker',
    'osd-dev',
    'config',
  );
  if (!existsSync(configRoot)) {
    return;
  }
  for (const major of [OSD_MAJOR_1X, OSD_MAJOR_2X]) {
    const osdDir = resolve(configRoot, major, 'osd');
    if (!existsSync(osdDir)) continue;
    for (const name of readdirSync(osdDir)) {
      if (!name.endsWith(GENERATED_SERVER_LOCAL_SUFFIX)) continue;
      const full = resolve(osdDir, name);
      try {
        unlinkSync(full);
        log.info(`Removed generated dashboard config: ${name}`);
      } catch (err) {
        log.warn(
          `Could not remove generated dashboard config ${full}: ${
            (err as Error).message
          }`,
        );
      }
    }
  }
}

export function initializeBaseEnvironment(config: ScriptConfig): void {
  process.env.PASSWORD = process.env.PASSWORD || DEFAULTS.defaultPassword;
  process.env.OS_VERSION = config.osVersion;
  process.env.OSD_VERSION = config.osdVersion;
  process.env.OSD_PORT = process.env.PORT || DEFAULTS.osdPort;
  process.env.IMPOSTER_VERSION = DEFAULTS.imposterVersion;
  // Use host path for compose variables (not container alias)
  process.env.SRC = config.pluginsRoot || '';
}

export function setVersionDerivedEnvironment(
  osdVersion: string,
  envPaths: EnvironmentPaths,
): void {
  const osdMajorNumber = parseInt(osdVersion.split('.')[0], 10);
  process.env.OSD_MAJOR_NUMBER = osdMajorNumber.toString();
  process.env.COMPOSE_PROJECT_NAME = `os-dev-${osdVersion.replace(/\./g, '')}`;
  process.env.WAZUH_STACK = process.env.WAZUH_STACK || '';

  if (existsSync(envPaths.packageJsonPath)) {
    const packageJson = JSON.parse(
      readFileSync(envPaths.packageJsonPath, 'utf-8'),
    );
    process.env.WAZUH_VERSION_DEVELOPMENT = packageJson.version;
  }
}

export function configureModeAndSecurity(config: ScriptConfig): string {
  const buildServerLocalDashboardConfig = (
    baseConfigPath: string,
    primaryHostId: string,
  ) => {
    const absoluteBaseConfigPath = resolve(baseConfigPath);
    const content = readFileSync(absoluteBaseConfigPath, 'utf-8');
    const lines = content.split('\n');
    const hostsRootIndex = lines.findIndex(
      line => line.trim() === 'wazuh_core.hosts:',
    );
    if (hostsRootIndex === -1) {
      return baseConfigPath;
    }

    const hostBlocks: Array<{ id: string; lines: string[] }> = [];
    let index = hostsRootIndex + 1;
    while (index < lines.length) {
      const line = lines[index];
      if (!line.startsWith('  ')) {
        break;
      }
      const hostMatch = /^ {2}([^:\s]+):\s*$/.exec(line);
      if (!hostMatch) {
        break;
      }
      const blockLines = [line];
      index++;
      while (index < lines.length) {
        const currentLine = lines[index];
        if (
          /^ {2}[^:\s]+:\s*$/.test(currentLine) ||
          !currentLine.startsWith('  ')
        ) {
          break;
        }
        blockLines.push(currentLine);
        index++;
      }
      hostBlocks.push({ id: hostMatch[1], lines: blockLines });
    }

    const primaryIndex = hostBlocks.findIndex(
      hostBlock => hostBlock.id === primaryHostId,
    );
    if (primaryIndex <= 0) {
      return baseConfigPath;
    }

    const orderedHostBlocks = [
      hostBlocks[primaryIndex],
      ...hostBlocks.slice(0, primaryIndex),
      ...hostBlocks.slice(primaryIndex + 1),
    ];

    const generatedConfigPath = baseConfigPath.replace(
      /\.yml$/,
      GENERATED_SERVER_LOCAL_SUFFIX,
    );
    const generatedContent = [
      ...lines.slice(0, hostsRootIndex + 1),
      ...orderedHostBlocks.flatMap(block => block.lines),
      ...lines.slice(index),
    ].join('\n');
    writeFileSync(resolve(generatedConfigPath), generatedContent);
    return generatedConfigPath;
  };
  // Defaults for standard mode
  let primaryProfile = PROFILES.STANDARD;

  process.env.WAZUH_DASHBOARD_CONF = './config/osd/opensearch_dashboards.yml';
  process.env.SEC_CONFIG_FILE = './config/os/config.yml';
  process.env.SEC_CONFIG_PATH = SECURITY_CONFIG_PATH;

  const enableSaml =
    Boolean(config.enableSaml) || config.mode === PROFILES.SAML;

  if (enableSaml) {
    process.env.WAZUH_DASHBOARD_CONF =
      './config/osd/opensearch_dashboards_saml.yml';
    process.env.SEC_CONFIG_FILE = './config/os/config-saml.yml';
  }

  // Reject direct server-local-* composite modes; users must set -a together with FLAGS.SERVER_LOCAL
  if (new RegExp(`^${PROFILES.SERVER_LOCAL}-`).test(config.mode)) {
    throw new ValidationError(msgUnsupportedModeToken());
  }

  if (config.mode === PROFILES.SERVER) {
    if (!config.modeVersion) {
      throw new ValidationError(MSG_SERVER_MODE_REQUIRES_VERSION);
    }
    process.env.WAZUH_STACK = config.modeVersion;
    process.env.WAZUH_DASHBOARD_CONF = buildServerLocalDashboardConfig(
      process.env.WAZUH_DASHBOARD_CONF,
      'manager',
    );
    return PROFILES.SERVER;
  }

  if (config.mode === PROFILES.SERVER_LOCAL) {
    if (!config.modeVersion) {
      throw new ValidationError(MSG_SERVER_LOCAL_MODE_REQUIRES_VERSION);
    }
    process.env.WAZUH_DASHBOARD_CONF = buildServerLocalDashboardConfig(
      process.env.WAZUH_DASHBOARD_CONF,
      'manager-local',
    );
    process.env.IMAGE_TAG = config.modeVersion;
    return config.agentsUp
      ? `${PROFILES.SERVER_LOCAL}-${config.agentsUp}`
      : PROFILES.SERVER_LOCAL;
  }

  if (config.mode === PROFILES.SAML) {
    return PROFILES.SAML;
  }

  return primaryProfile;
}
