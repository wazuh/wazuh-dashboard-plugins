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

export const getCtiConsoleBaseUrl = (): string =>
  WAZUH_CTI_CONSOLE_BASE_URL.trim().replace(/\/$/, '');
