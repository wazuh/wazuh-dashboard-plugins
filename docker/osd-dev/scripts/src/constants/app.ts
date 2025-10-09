/**
 * Application-wide constants used across services.
 */

/** Required repositories that must always be present. */
export const REQUIRED_REPOSITORIES = [
  'main',
  'wazuh-core',
  'wazuh-check-updates',
] as const;

/** Canonical repository name for the security plugin sources. */
export const SECURITY_PLUGIN_REPO_NAME =
  'wazuh-security-dashboards-plugin' as const;

/**
 * Names accepted for identifying the security plugin via -r overrides.
 */
// Only one alias is accepted for CLI overrides of the security plugin
export const SECURITY_PLUGIN_ALIASES = ['security'] as const;

/** Name of the Docker Compose profile that enables dashboard-from-source. */
export const PROFILES = {
  STANDARD: 'standard',
  SAML: 'saml',
  SERVER: 'server',
  SERVER_LOCAL: 'server-local',
  SERVER_LOCAL_RPM: 'server-local-rpm',
  SERVER_LOCAL_DEB: 'server-local-deb',
  SERVER_LOCAL_WITHOUT: 'server-local-without',
  DASHBOARD_SRC: 'dashboard-src',
} as const;

/** CLI flags used by the development script. */
export const FLAGS = {
  HELP: '--help',
  HELP_SHORT: '-h',
  PLUGINS_ROOT: '--plugins-root',
  PLUGINS_ROOT_WDP: '-wdp',
  PLUGINS_ROOT_WZ_HOME: '--wz-home',
  OS_VERSION: '-os',
  OSD_VERSION: '-osd',
  AGENTS_UP: '-a',
  SAML: '-saml',
  SERVER: '--server',
  SERVER_LOCAL: '--server-local',
  REPO: '-r',
  BASE: '--base',
} as const;

/** Relative path (from dev script dir) for the dashboard entrypoint wrapper. */
export const DASHBOARD_ENTRYPOINT_PATH = './dashboard-src/entrypoint.sh';

/** Auto-generated override compose file name. */
export const OVERRIDE_COMPOSE_FILE = 'dev.override.generated.yml';

/** Base compose file name. */
export const DEV_COMPOSE_FILE = 'dev.yml';

/** Supported actions. */
export const ACTIONS = {
  UP: 'up',
  DOWN: 'down',
  STOP: 'stop',
  START: 'start',
  MANAGER_LOCAL_UP: 'manager-local-up',
} as const;

/** Service names referenced by scripts. */
export const SERVICE_NAMES = {
  WAZUH_MANAGER_LOCAL: 'wazuh.manager.local',
} as const;

/** OSD major markers used to pick paths. */
export const OSD_MAJOR_2X = '2.x' as const;
export const OSD_MAJOR_1X = '1.x' as const;

/** Security config base path per OSD major. */
export const SECURITY_CONFIG_PATHS: Record<string, string> = {
  [OSD_MAJOR_2X]: '/usr/share/opensearch/config/opensearch-security',
  [OSD_MAJOR_1X]:
    '/usr/share/opensearch/plugins/opensearch-security/securityconfig',
};

/** Default values for environment variables used by the script. */
export const DEFAULTS = {
  defaultPassword: 'admin',
  osdPort: '5601',
  imposterVersion: '3.44.1',
} as const;
