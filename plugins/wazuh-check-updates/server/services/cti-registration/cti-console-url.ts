/**
 * Base URL for the Wazuh Console CTI / environment token API.
 * Resolved from the dashboard server process environment (no hardcoded default).
 * Deployment / local dev: see project documentation for required settings.
 */
export class CtiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CtiConfigurationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const getCtiConsoleBaseUrl = (): string => {
  const raw = process.env.WAZUH_CTI_CONSOLE_BASE_URL?.trim();
  if (!raw) {
    throw new CtiConfigurationError(
      'The CTI Console service is not configured on this server.',
    );
  }
  return raw.replace(/\/$/, '');
};
