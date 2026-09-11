/**
 * CTI Console URL resolution and configuration errors for CTI registration.
 */
import { WAZUH_CTI_CONSOLE_BASE_URL } from '../../../common/constants';

export class CtiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CtiConfigurationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * `wazuh_check_updates.ctiApiUrl` once the plugin has read its configuration.
 * Seeded with the compiled constant so a read before `setup()` resolves behaves
 * like a default installation, where the setting is absent.
 */
let ctiApiUrl: string = WAZUH_CTI_CONSOLE_BASE_URL;

export const setCtiConsoleBaseUrl = (url: string): void => {
  ctiApiUrl = url;
};

export const getCtiConsoleBaseUrl = (): string =>
  ctiApiUrl.trim().replace(/\/$/, '');
