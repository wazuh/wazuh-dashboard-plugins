/**
 * Base URL for the Wazuh Console CTI / environment token API.
 * Must be set explicitly (no runtime default). For Imposter in Docker dev, use
 * `http://imposter:8080` — see docker/imposter/cti/README.md.
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
      'WAZUH_CTI_CONSOLE_BASE_URL is not set. For Imposter in Docker dev, set it to http://imposter:8080 (see docker/imposter/cti/README.md).',
    );
  }
  return raw.replace(/\/$/, '');
};
