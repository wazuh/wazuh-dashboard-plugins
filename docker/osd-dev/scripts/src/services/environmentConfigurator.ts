import { existsSync, readFileSync } from 'fs';
import { DEFAULTS } from '../constants/app';
import { EnvironmentPaths, ScriptConfig } from '../types/config';
import {
  ConfigurationError,
  PathAccessError,
  ValidationError,
} from '../errors';

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
    try {
      const packageJson = JSON.parse(
        readFileSync(envPaths.packageJsonPath, 'utf-8'),
      );
      process.env.WAZUH_VERSION_DEVELOPMENT = packageJson.version;
    } catch {
      // best effort
    }
  }

  const osdMajor = osdMajorNumber >= 2 ? '2.x' : '1.x';
  process.env.OSD_MAJOR = osdMajor;
}

export function configureModeAndSecurity(config: ScriptConfig): string {
  // Defaults for standard mode
  let primaryProfile = 'standard';

  // Paths that depend on OSD_MAJOR
  const osdMajor = process.env.OSD_MAJOR || '2.x';
  process.env.WAZUH_DASHBOARD_CONF = `./config/${osdMajor}/osd/opensearch_dashboards.yml`;
  process.env.SEC_CONFIG_FILE = `./config/${osdMajor}/os/config.yml`;

  // Set security config path for OpenSearch 1.x vs 2.x
  process.env.SEC_CONFIG_PATH =
    osdMajor === '2.x'
      ? '/usr/share/opensearch/config/opensearch-security'
      : '/usr/share/opensearch/plugins/opensearch-security/securityconfig';

  if (!config.mode) return primaryProfile;

  switch (config.mode) {
    case 'saml': {
      try {
        const hostsContent = readFileSync('/etc/hosts', 'utf-8');
        if (!hostsContent.includes('idp')) {
          throw new ConfigurationError('Add idp to /etc/hosts');
        }
      } catch {
        throw new PathAccessError('Cannot read /etc/hosts');
      }

      primaryProfile = 'saml';
      process.env.WAZUH_DASHBOARD_CONF = `./config/${osdMajor}/osd/opensearch_dashboards_saml.yml`;
      process.env.SEC_CONFIG_FILE = `./config/${osdMajor}/os/config-saml.yml`;
      return primaryProfile;
    }

    case 'server': {
      if (!config.modeVersion) {
        throw new ValidationError(
          'server mode requires the server_version argument',
        );
      }
      primaryProfile = 'server';
      process.env.WAZUH_STACK = config.modeVersion;
      return primaryProfile;
    }

    case 'server-local': {
      if (!config.modeVersion) {
        throw new ValidationError(
          'server-local mode requires the server_version argument',
        );
      }
      if (config.agentsUp) {
        primaryProfile = `server-local-${config.agentsUp}`;
      } else {
        primaryProfile = 'server-local';
      }
      process.env.IMAGE_TAG = config.modeVersion;
      return primaryProfile;
    }

    default:
      throw new ValidationError(`Unsupported mode '${config.mode}'`);
  }
}
