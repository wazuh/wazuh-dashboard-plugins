import axios from 'axios';
import { getCtiToken, pollCtiToken } from './token';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';

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
