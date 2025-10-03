/**
 * Application-wide constants used across services.
 */

/** Required repositories that must always be present. */
export const REQUIRED_REPOSITORIES = ['main', 'wazuh-core', 'wazuh-check-updates'] as const;

/** Accepted aliases for the security plugin repository. */
export const SECURITY_PLUGIN_ALIASES = [
  'wazuh-security-dashboards',
  'wazuh-security-dashboards-plugin',
] as const;

/** Name of the Docker Compose profile that enables dashboard-from-source. */
export const DASHBOARD_SRC_PROFILE = 'dashboard-src';

/** Relative path (from dev script dir) for the dashboard entrypoint wrapper. */
export const DASHBOARD_ENTRYPOINT_PATH = './dashboard-src/entrypoint.sh';

/** Auto-generated override compose file name. */
export const OVERRIDE_COMPOSE_FILE = 'dev.override.generated.yml';

/** Default values for environment variables used by the script. */
export const DEFAULTS = {
  defaultPassword: 'admin',
  osdPort: '5601',
  imposterVersion: '3.44.1',
} as const;

