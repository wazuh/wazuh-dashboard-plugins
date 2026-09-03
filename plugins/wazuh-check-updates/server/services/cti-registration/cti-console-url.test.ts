import { WAZUH_CTI_CONSOLE_BASE_URL } from '../../../common/constants';
import { getCtiConsoleBaseUrl, setCtiConsoleBaseUrl } from './cti-console-url';

describe('getCtiConsoleBaseUrl', () => {
  afterEach(() => {
    setCtiConsoleBaseUrl(WAZUH_CTI_CONSOLE_BASE_URL);
  });

  test('falls back to the compiled constant when the setting is absent', () => {
    expect(getCtiConsoleBaseUrl()).toBe(WAZUH_CTI_CONSOLE_BASE_URL);
  });

  test('returns the configured URL', () => {
    setCtiConsoleBaseUrl('http://imposter:8080');

    expect(getCtiConsoleBaseUrl()).toBe('http://imposter:8080');
  });

  test('strips the trailing slash of the configured URL', () => {
    setCtiConsoleBaseUrl('http://imposter:8080/');

    expect(getCtiConsoleBaseUrl()).toBe('http://imposter:8080');
  });

  test('trims the surrounding whitespace of the configured URL', () => {
    setCtiConsoleBaseUrl('  http://imposter:8080  ');

    expect(getCtiConsoleBaseUrl()).toBe('http://imposter:8080');
  });
});
