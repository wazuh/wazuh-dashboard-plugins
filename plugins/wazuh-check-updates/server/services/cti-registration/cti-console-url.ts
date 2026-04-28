/**
 * Base URL for the Wazuh Console CTI / environment token API.
 * In Docker dev, Imposter serves this on port 8080 (see docker/imposter/cti/README.md).
 */
export const getCtiConsoleBaseUrl = (): string => {
  const raw =
    process.env.WAZUH_CTI_CONSOLE_BASE_URL || 'http://imposter:8080';
  return raw.replace(/\/$/, '');
};
