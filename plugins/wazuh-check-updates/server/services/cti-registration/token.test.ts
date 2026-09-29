import axios from 'axios';
import {
  WAZUH_CTI_CONSOLE_BASE_URL,
  ctiConsoleApiPaths,
} from '../../../common/constants';
import { getCtiToken, pollCtiToken } from './token';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import { setCtiConsoleBaseUrl } from './cti-console-url';

jest.mock('axios');
jest.mock('../../plugin-services', () => ({
  getWazuhCheckUpdatesServices: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetWazuhCheckUpdatesServices =
  getWazuhCheckUpdatesServices as jest.Mock;

describe('token', () => {
  const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };

  beforeEach(() => {
    logger.error.mockClear();
    mockedGetWazuhCheckUpdatesServices.mockReturnValue({ logger });
    mockedAxios.post.mockReset();
  });

  afterEach(() => {
    setCtiConsoleBaseUrl(WAZUH_CTI_CONSOLE_BASE_URL);
  });

  test('getCtiToken targets the configured CTI API URL', async () => {
    setCtiConsoleBaseUrl('http://imposter:8080');
    mockedAxios.post.mockResolvedValue({ data: {} });

    await getCtiToken('client-id');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `http://imposter:8080${ctiConsoleApiPaths.environmentsToken}`,
      expect.any(String),
      expect.any(Object),
    );
  });

  test('pollCtiToken targets the configured CTI API URL', async () => {
    setCtiConsoleBaseUrl('http://imposter:8080');
    mockedAxios.post.mockResolvedValue({ data: {} });

    await pollCtiToken('client-id', 'device-code');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `http://imposter:8080${ctiConsoleApiPaths.environmentsToken}`,
      expect.any(String),
      expect.any(Object),
    );
  });

  test('getCtiToken sends Accept-Encoding: gzip, br and preserves Content-Type', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });

    await getCtiToken('client-id');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept-Encoding': 'gzip, br',
        },
      }),
    );
  });

  test('pollCtiToken sends Accept-Encoding: gzip, br and preserves validateStatus', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });

    await pollCtiToken('client-id', 'device-code');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept-Encoding': 'gzip, br',
        },
        validateStatus: expect.any(Function),
      }),
    );

    const { validateStatus } = mockedAxios.post.mock.calls[0][2] as {
      validateStatus: (status: number) => boolean;
    };
    expect(validateStatus(200)).toBe(true);
    expect(validateStatus(400)).toBe(true);
    expect(validateStatus(500)).toBe(false);
  });
});
